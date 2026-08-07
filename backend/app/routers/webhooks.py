"""
Webhooks Receiver Router — Inbound Webhook Handlers for ServiceNow, Jira, Zendesk, and Freshdesk.
Automatically normalizes incoming ticket webhooks, triggers AI triage, and responds with priority payload updates.
"""
from fastapi import APIRouter, Request, Header, HTTPException
from typing import Dict, Any, Optional
from app.integrations import get_adapter
from app.services.ml_service import predict_priority


router = APIRouter(prefix="/api/v1/webhooks", tags=["Enterprise Webhooks"])


# ── ServiceNow Inbound Webhook ──────────────────────────────────────────────────

@router.post("/servicenow", response_model=Dict[str, Any])
async def handle_servicenow_webhook(
    request: Request,
    x_servicenow_signature: Optional[str] = Header(None)
):
    """
    Inbound Webhook receiver for ServiceNow Incidents (INCxxxxx).
    Classifies priority and returns ServiceNow update JSON payload.
    """
    try:
        payload = await request.json()

        adapter = get_adapter("servicenow")
        normalized = adapter.normalize_payload(payload)
        
        ml_res = predict_priority(
            normalized["subject"],
            normalized["description"],
            normalized["category"]
        )

        return adapter.format_response(payload, ml_res)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ServiceNow webhook processing failed: {str(e)}")


# ── Jira Service Management Inbound Webhook ─────────────────────────────────────

@router.post("/jira", response_model=Dict[str, Any])
async def handle_jira_webhook(
    request: Request,
    x_atlassian_webhook_identifier: Optional[str] = Header(None)
):
    """
    Inbound Webhook receiver for Jira Service Management (jira:issue_created / issue_updated).
    """
    try:
        payload = await request.json()

        adapter = get_adapter("jira")
        normalized = adapter.normalize_payload(payload)

        ml_res = predict_priority(
            normalized["subject"],
            normalized["description"],
            normalized["category"]
        )

        return adapter.format_response(payload, ml_res)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Jira webhook processing failed: {str(e)}")


# ── Zendesk Support Inbound Webhook ─────────────────────────────────────────────

@router.post("/zendesk", response_model=Dict[str, Any])
async def handle_zendesk_webhook(request: Request):
    """
    Inbound Webhook receiver for Zendesk Support Triggers & Targets.
    """
    try:
        payload = await request.json()

        adapter = get_adapter("zendesk")
        normalized = adapter.normalize_payload(payload)

        ml_res = predict_priority(
            normalized["subject"],
            normalized["description"],
            normalized["category"]
        )

        return adapter.format_response(payload, ml_res)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Zendesk webhook processing failed: {str(e)}")


# ── Freshdesk Inbound Webhook ───────────────────────────────────────────────────

@router.post("/freshdesk", response_model=Dict[str, Any])
async def handle_freshdesk_webhook(request: Request):
    """
    Inbound Webhook receiver for Freshdesk Tickets.
    """
    try:
        payload = await request.json()

        adapter = get_adapter("freshdesk")
        normalized = adapter.normalize_payload(payload)

        ml_res = predict_priority(
            normalized["subject"],
            normalized["description"],
            normalized["category"]
        )

        return adapter.format_response(payload, ml_res)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Freshdesk webhook processing failed: {str(e)}")
