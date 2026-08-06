"""
Tickets router — CRUD endpoints + AI priority prediction trigger.
"""
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from app.schemas.ticket import (
    TicketCreate, TicketUpdate, TicketResponse,
    PredictRequest, PredictResponse, TicketActivity
)
from app.services.ml_service import predict_priority
from app.services.email_service import send_ticket_created_email, send_activity_reply_email
from app.core.config import get_settings
from supabase import create_client

settings = get_settings()
router = APIRouter(prefix="/api/tickets", tags=["tickets"])


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key or settings.supabase_key)


# ── Predict Priority ────────────────────────────────────────────────────────────

@router.post("/predict-priority", response_model=PredictResponse)
async def predict_ticket_priority(req: PredictRequest):
    """Run ML model to predict priority for a ticket subject + description."""
    try:
        result = predict_priority(req.subject, req.description, req.category or "")
        return PredictResponse(**result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ── List Tickets ────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[dict])
async def list_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    supabase = get_supabase()
    query = supabase.table("tickets").select("*").order("created_at", desc=True).range(offset, offset + limit - 1)
    if status:
        query = query.eq("status", status)
    if priority:
        query = query.eq("priority", priority)
    resp = query.execute()
    
    data = resp.data or []
    for t in data:
        tid = t.get("id", "")
        t["code"] = t.get("ticket_code") or (f"TK-{tid[:5].upper()}" if tid else "TK-8842")
    return data


# ── Get Single Ticket (Supports UUID, TK-Code, or Prefix) ──────────────────────

@router.get("/{ticket_id}", response_model=dict)
async def get_ticket(ticket_id: str):
    supabase = get_supabase()
    clean_id = ticket_id.strip()
    
    # 1. Try exact UUID match
    ticket_data = None
    try:
        resp = supabase.table("tickets").select("*").eq("id", clean_id).execute()
        if resp.data:
            ticket_data = resp.data[0]
    except Exception:
        pass

    # 2. Try prefix or ilike match if not found
    if not ticket_data:
        raw_code = clean_id.replace("TK-", "").replace("tk-", "").strip().lower()
        resp = supabase.table("tickets").select("*").order("created_at", desc=True).limit(100).execute()
        for t in resp.data or []:
            tid = str(t.get("id", "")).lower()
            code = str(t.get("ticket_code", "")).lower()
            if raw_code in tid or raw_code in code or clean_id.lower() in tid:
                ticket_data = t
                break

    if not ticket_data:
        raise HTTPException(status_code=404, detail="Ticket not found")

    tid = ticket_data.get("id", "")
    ticket_data["code"] = ticket_data.get("ticket_code") or (f"TK-{tid[:5].upper()}" if tid else "TK-8842")

    # Fetch activities
    activities_resp = (
        supabase.table("ticket_activities")
        .select("*")
        .eq("ticket_id", tid)
        .order("created_at")
        .execute()
    )

    ticket_data["activities"] = activities_resp.data or []
    return ticket_data


# ── Create Ticket ───────────────────────────────────────────────────────────────

@router.post("/", response_model=dict, status_code=201)
async def create_ticket(body: TicketCreate, background_tasks: BackgroundTasks):
    supabase = get_supabase()

    # Auto-run AI prediction
    try:
        prediction = predict_priority(body.subject, body.description, body.category or "")
        ai_priority = prediction["priority"]
        confidence = prediction["confidence_score"]
    except Exception:
        ai_priority = "Medium"
        confidence = 90.0

    new_id = str(uuid.uuid4())
    ticket_code = f"TK-{new_id[:5].upper()}"

    ticket_data = {
        "id": new_id,
        "subject": body.subject,
        "description": body.description,
        "category": body.category,
        "product_module": body.product_module,
        "customer_name": body.customer_name,
        "customer_email": body.customer_email,
        "status": "Open",
        "priority": ai_priority,
        "ai_priority": ai_priority,
        "confidence_score": confidence,
        "attachments": body.attachments or [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Trigger background email to customer Gmail
    if body.customer_email:
        background_tasks.add_task(
            send_ticket_created_email,
            to_email=body.customer_email,
            customer_name=body.customer_name or "Valued Customer",
            ticket_code=ticket_code,
            ticket_subject=body.subject,
            priority=ai_priority,
        )

    try:
        resp = supabase.table("tickets").insert(ticket_data).execute()
        if resp.data:
            t = resp.data[0]
            t["code"] = ticket_code
            return t
    except Exception as e:
        ticket_data["code"] = ticket_code
        return ticket_data

    ticket_data["code"] = ticket_code
    return ticket_data


# ── Update Ticket ───────────────────────────────────────────────────────────────

@router.patch("/{ticket_id}", response_model=dict)
async def update_ticket(ticket_id: str, body: TicketUpdate):
    supabase = get_supabase()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    resp = supabase.table("tickets").update(updates).eq("id", ticket_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return resp.data[0]


# ── Add Activity ────────────────────────────────────────────────────────────────

@router.post("/{ticket_id}/activities", response_model=dict, status_code=201)
async def add_activity(ticket_id: str, body: TicketActivity, background_tasks: BackgroundTasks):
    supabase = get_supabase()
    data = {
        "id": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        "type": body.type,
        "author": body.author,
        "author_role": body.author_role,
        "content": body.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    resp = supabase.table("ticket_activities").insert(data).execute()

    # If an AGENT replies, send an email notification to the customer's Gmail
    if body.author_role in ["AGENT", "ADMIN"]:
        try:
            t_resp = supabase.table("tickets").select("customer_email, customer_name, subject, ticket_code").eq("id", ticket_id).execute()
            if t_resp.data and t_resp.data[0].get("customer_email"):
                ticket = t_resp.data[0]
                t_code = ticket.get("ticket_code") or f"TK-{ticket_id[:5].upper()}"
                background_tasks.add_task(
                    send_activity_reply_email,
                    to_email=ticket["customer_email"],
                    customer_name=ticket.get("customer_name") or "Customer",
                    ticket_code=t_code,
                    ticket_subject=ticket.get("subject", ""),
                    author_name=body.author,
                    reply_content=body.content,
                )
        except Exception:
            pass

    return resp.data[0] if resp.data else data


# ── Delete All Tickets ──────────────────────────────────────────────────────────

@router.delete("/clear-all", response_model=dict)
async def clear_all_tickets():
    supabase = get_supabase()
    resp = supabase.table("tickets").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    return {"message": "All tickets cleared", "deleted_count": len(resp.data or [])}
