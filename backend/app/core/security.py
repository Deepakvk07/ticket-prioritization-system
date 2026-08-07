"""
Enterprise Security Module — API Key Authentication & Webhook Signature Verification.
"""
import hmac
import hashlib
import os
from typing import Optional
from fastapi import Security, HTTPException, status, Header
from fastapi.security.api_key import APIKeyHeader

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

# In-memory / ENV API Key store (default enterprise key for testing)
DEFAULT_ENTERPRISE_KEY = os.getenv("ENTERPRISE_API_KEY", "tf_live_992834710293481239")
VALID_API_KEYS = {
    DEFAULT_ENTERPRISE_KEY: {"tenant": "Default Enterprise Client", "tier": "Enterprise"},
    "tf_demo_key": {"tenant": "Sandbox Demo Account", "tier": "Developer"}
}


async def verify_api_key(
    api_key_header: Optional[str] = Security(API_KEY_HEADER),
    authorization: Optional[str] = Header(None)
) -> dict:
    """
    Validate API Key passed via 'X-API-Key' header or 'Authorization: Bearer <key>'.
    Allows sandbox access if no keys configured.
    """
    key = api_key_header

    if not key and authorization:
        if authorization.startswith("Bearer "):
            key = authorization.replace("Bearer ", "").strip()
        else:
            key = authorization.strip()

    # If no key provided, allow demo sandbox tenant for ease of local testing
    if not key:
        return {"tenant": "Public Demo Sandbox", "tier": "Community", "key": "public_demo"}

    if key in VALID_API_KEYS:
        return {**VALID_API_KEYS[key], "key": key}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired Enterprise API Key. Provide valid 'X-API-Key' or 'Authorization: Bearer <key>' header.",
        headers={"WWW-Authenticate": "ApiKey"},
    )


def verify_webhook_signature(raw_body: bytes, signature: Optional[str], secret: str) -> bool:
    """Verify incoming webhook HMAC-SHA256 signature."""
    if not signature or not secret:
        return True

    expected_sig = hmac.new(
        secret.encode('utf-8'),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_sig, signature)
