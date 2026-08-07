"""
Enterprise REST API Router — Plug-and-Play AI Service Endpoints for External Helpdesks.
Supports ServiceNow, Jira Service Management, Zendesk, Freshdesk, and Custom REST APIs.
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import uuid

from app.core.security import verify_api_key
from app.integrations import get_adapter
from app.services.ml_service import predict_priority
from app.services.webhook_service import dispatch_outbound_webhook


router = APIRouter(prefix="/api/v1/enterprise", tags=["Enterprise AI Service"])


# ── Schemas ─────────────────────────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    platform: str = Field(..., description="Target helpdesk platform (servicenow, jira, zendesk, freshdesk, custom)")
    payload: Dict[str, Any] = Field(..., description="Raw or normalized ticket JSON payload from platform")
    webhook_url: Optional[str] = Field(None, description="Optional outbound webhook URL to receive async result")


class BatchClassifyRequest(BaseModel):
    platform: str = Field(..., description="Target helpdesk platform")
    tickets: List[Dict[str, Any]] = Field(..., description="List of raw or normalized ticket JSON payloads")


class APIKeyGenerateRequest(BaseModel):
    tenant_name: str = Field(..., description="Organization or Enterprise Client Name")
    tier: Optional[str] = Field("Enterprise", description="Subscription Tier")


# ── Classification Endpoint ─────────────────────────────────────────────────────

@router.post("/classify", response_model=Dict[str, Any])
async def classify_enterprise_ticket(
    req: ClassifyRequest,
    background_tasks: BackgroundTasks,
    client: dict = Depends(verify_api_key)
):
    """
    Real-Time AI Ticket Classification & Triage Endpoint for ServiceNow, Jira, Zendesk, Freshdesk.
    Normalizes incoming ticket JSON, runs ML priority model, and returns platform-specific priority updates.
    """
    platform_name = req.platform.lower().strip()

    try:
        if platform_name == "custom":
            # Direct custom payload handling
            data = req.payload
            subject = data.get("subject") or data.get("title") or "Custom Ticket"
            desc = data.get("description") or data.get("text") or ""
            category = data.get("category") or "Technical Support"
            ext_id = str(data.get("id") or data.get("ticket_id") or "CUST-1")
            
            ml_res = predict_priority(subject, desc, category)
            res_payload = {
                "platform": "custom",
                "external_id": ext_id,
                "ai_classification": {
                    "predicted_priority": ml_res["priority"],
                    "confidence_score": ml_res["confidence_score"],
                    "category": category,
                    "routing_queue": f"{ml_res['priority'].lower()}_escalation_tier"
                },
                "platform_payload_update": {
                    "priority": ml_res["priority"],
                    "confidence_score": ml_res["confidence_score"]
                }
            }
        else:
            adapter = get_adapter(platform_name)
            normalized = adapter.normalize_payload(req.payload)
            ml_res = predict_priority(
                normalized["subject"],
                normalized["description"],
                normalized["category"]
            )
            res_payload = adapter.format_response(req.payload, ml_res)

        # Dispatch async outbound webhook if requested
        if req.webhook_url:
            background_tasks.add_task(
                dispatch_outbound_webhook,
                target_url=req.webhook_url,
                payload=res_payload
            )

        res_payload["client_tenant"] = client.get("tenant")
        return res_payload

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Classification failed: {str(e)}")


# ── Batch Classification Endpoint ───────────────────────────────────────────────

@router.post("/batch-classify", response_model=Dict[str, Any])
async def batch_classify_tickets(
    req: BatchClassifyRequest,
    client: dict = Depends(verify_api_key)
):
    """
    Batch classification endpoint for periodic enterprise synchronization.
    """
    platform_name = req.platform.lower().strip()
    results = []

    for idx, raw_ticket in enumerate(req.tickets):
        try:
            if platform_name == "custom":
                subj = raw_ticket.get("subject") or "Ticket"
                desc = raw_ticket.get("description") or ""
                cat = raw_ticket.get("category") or "Technical Support"
                ml_res = predict_priority(subj, desc, cat)
                results.append({
                    "index": idx,
                    "external_id": str(raw_ticket.get("id") or idx),
                    "priority": ml_res["priority"],
                    "confidence_score": ml_res["confidence_score"]
                })
            else:
                adapter = get_adapter(platform_name)
                norm = adapter.normalize_payload(raw_ticket)
                ml_res = predict_priority(norm["subject"], norm["description"], norm["category"])
                results.append(adapter.format_response(raw_ticket, ml_res))
        except Exception as err:
            results.append({
                "index": idx,
                "error": str(err)
            })

    return {
        "platform": platform_name,
        "total_processed": len(req.tickets),
        "client_tenant": client.get("tenant"),
        "results": results
    }


# ── API Key Generation Endpoint ─────────────────────────────────────────────────

@router.post("/keys/generate", response_model=Dict[str, Any])
async def generate_enterprise_api_key(
    req: APIKeyGenerateRequest,
    admin_client: dict = Depends(verify_api_key)
):
    """
    Generate a secure Enterprise API Key for helpdesk platform integrations.
    """
    new_key = f"tf_ent_{uuid.uuid4().hex[:24]}"
    from app.core.security import VALID_API_KEYS
    VALID_API_KEYS[new_key] = {
        "tenant": req.tenant_name,
        "tier": req.tier or "Enterprise"
    }

    return {
        "message": f"Enterprise API Key generated successfully for {req.tenant_name}",
        "api_key": new_key,
        "tenant_name": req.tenant_name,
        "tier": req.tier,
        "header_usage": f"X-API-Key: {new_key}"
    }


# ── Supported Integrations Metadata Endpoint ────────────────────────────────────

@router.get("/integrations/supported", response_model=Dict[str, Any])
async def get_supported_integrations():
    """
    Returns list of supported enterprise platforms and integration capabilities.
    """
    return {
        "supported_platforms": [
            {
                "id": "servicenow",
                "name": "ServiceNow Incident Management",
                "auth_types": ["OAuth2", "API Key", "Basic Auth"],
                "priority_mapping": {"Critical": "1 - Critical", "High": "2 - High", "Medium": "3 - Moderate", "Low": "4 - Low"},
                "webhook_supported": True
            },
            {
                "id": "jira",
                "name": "Jira Service Management",
                "auth_types": ["OAuth2", "API Token", "Bearer"],
                "priority_mapping": {"Critical": "Highest", "High": "High", "Medium": "Medium", "Low": "Low"},
                "webhook_supported": True
            },
            {
                "id": "zendesk",
                "name": "Zendesk Support",
                "auth_types": ["API Token", "OAuth2"],
                "priority_mapping": {"Critical": "urgent", "High": "high", "Medium": "normal", "Low": "low"},
                "webhook_supported": True
            },
            {
                "id": "freshdesk",
                "name": "Freshdesk",
                "auth_types": ["API Key"],
                "priority_mapping": {"Critical": 4, "High": 3, "Medium": 2, "Low": 1},
                "webhook_supported": True
            }
        ]
    }
