"""
Production Token Management Endpoints — Real-time user token verification, redemption, and token status.
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.core.config import get_settings
from supabase import create_client

settings = get_settings()
router = APIRouter(prefix="/api/tokens", tags=["tokens"])

def get_supabase():
    try:
        return create_client(settings.supabase_url, settings.supabase_service_key or settings.supabase_key)
    except Exception:
        return None

# ── Pydantic Models ─────────────────────────────────────────────────────────────

class TokenItem(BaseModel):
    id: str
    token_code: str
    customer_email: str
    customer_name: Optional[str] = None
    token_type: str
    tier: str  # ENTERPRISE | PRO | STARTER
    credits_allocated: int
    credits_remaining: int
    status: str  # ACTIVE | EXPIRED | REVOKED | EXHAUSTED
    expires_at: str
    created_at: str

class RedeemTokenRequest(BaseModel):
    customer_email: str
    token_code: str

class GenerateTokenRequest(BaseModel):
    customer_email: str
    customer_name: Optional[str] = None
    token_type: str = "Priority AI Triage Credits"
    tier: str = "PRO"
    credits: int = 250
    valid_days: int = 30


# ── Production Endpoints ──────────────────────────────────────────────────────

@router.get("/user/{email}")
async def get_user_tokens(email: str):
    """Retrieve active support tokens and quota details for a specific user email."""
    client = get_supabase()
    user_toks = []
    
    if client:
        try:
            res = client.table("user_tokens").select("*").eq("customer_email", email.strip().lower()).execute()
            if res.data:
                user_toks = res.data
        except Exception as e:
            user_toks = []

    total_credits = sum(t.get("credits_remaining", 0) for t in user_toks if t.get("status") == "ACTIVE")
    active_tokens_count = sum(1 for t in user_toks if t.get("status") == "ACTIVE")

    # Determine user active tier
    tiers = [t.get("tier") for t in user_toks if t.get("status") == "ACTIVE"]
    user_tier = "ENTERPRISE" if "ENTERPRISE" in tiers else ("PRO" if "PRO" in tiers else "STARTER")

    return {
        "customer_email": email,
        "tier": user_tier,
        "total_active_credits": total_credits,
        "active_tokens_count": active_tokens_count,
        "tokens": user_toks
    }


@router.post("/redeem")
async def redeem_token(req: RedeemTokenRequest):
    """Validate and redeem a token code for the user."""
    code = req.token_code.strip().upper()
    email = req.customer_email.strip().lower()

    if not code:
        raise HTTPException(status_code=400, detail="Token code is required.")

    client = get_supabase()
    if not client:
        raise HTTPException(status_code=503, detail="Database service currently unavailable.")

    try:
        # Check token in database
        res = client.table("user_tokens").select("*").eq("token_code", code).execute()
        if not res.data:
            raise HTTPException(status_code=444, detail=f"Token code '{code}' not found or invalid.")

        token = res.data[0]

        # Validation checks
        if token.get("status") == "EXPIRED":
            raise HTTPException(status_code=400, detail="This token code has expired.")
        if token.get("status") == "REVOKED":
            raise HTTPException(status_code=400, detail="This token code has been revoked by administration.")
        if token.get("status") == "EXHAUSTED":
            raise HTTPException(status_code=400, detail="This token code has 0 remaining credits.")
        
        assigned = token.get("customer_email")
        if assigned and assigned.lower() != email and assigned != "":
            raise HTTPException(status_code=400, detail="This token code is assigned to a different user account.")

        # Update assignment to current user
        update_res = client.table("user_tokens").update({
            "customer_email": email,
            "status": "ACTIVE"
        }).eq("token_code", code).execute()

        updated_tok = update_res.data[0] if update_res.data else token

        return {
            "success": True,
            "message": f"Token '{code}' successfully redeemed! Added {updated_tok['credits_allocated']} credits.",
            "token": updated_tok
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token redemption error: {str(e)}")


@router.post("/generate")
async def generate_token(req: GenerateTokenRequest):
    """Generate a new support token for a customer."""
    code = f"TK-{req.tier}-{abs(hash(req.customer_email + str(datetime.now()))) % 89999 + 10000}"
    new_tok = {
        "token_code": code,
        "customer_email": req.customer_email.strip().lower(),
        "customer_name": req.customer_name or req.customer_email.split("@")[0].title(),
        "token_type": req.token_type,
        "tier": req.tier,
        "credits_allocated": req.credits,
        "credits_remaining": req.credits,
        "status": "ACTIVE",
        "expires_at": (datetime.now() + timedelta(days=req.valid_days)).isoformat(),
        "created_at": datetime.now().isoformat(),
    }

    client = get_supabase()
    if client:
        res = client.table("user_tokens").insert(new_tok).execute()
        if res.data:
            return {"success": True, "token": res.data[0]}

    return {"success": True, "token": new_tok}


@router.get("/all")
async def get_all_tokens():
    """Retrieve all tokens across the system."""
    client = get_supabase()
    if client:
        try:
            res = client.table("user_tokens").select("*").order("created_at", desc=True).execute()
            return {"total": len(res.data or []), "tokens": res.data or []}
        except Exception:
            pass
    return {"total": 0, "tokens": []}
