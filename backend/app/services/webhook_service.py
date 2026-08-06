"""
Outbound Webhook Dispatcher Service.
Sends asynchronous HTTP webhook notifications back to external helpdesks (ServiceNow, Jira, Zendesk, Freshdesk).
"""
import json
import logging
import urllib.request
import urllib.parse
import hmac
import hashlib
from typing import Dict, Any, Optional
from app.core.config import get_settings

logger = logging.getLogger(__name__)


def dispatch_outbound_webhook(target_url: str, payload: Dict[str, Any], secret: Optional[str] = None) -> bool:
    """Send JSON webhook payload to target enterprise webhook endpoint."""
    if not target_url:
        return False

    try:
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            target_url,
            data=data_bytes,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "TicketFlow-AI-Engine/2.0"
            },
            method="POST"
        )

        if secret:
            sig = hmac.new(secret.encode("utf-8"), data_bytes, hashlib.sha256).hexdigest()
            req.add_header("X-TicketFlow-Signature", f"sha256={sig}")

        with urllib.request.urlopen(req, timeout=8) as response:
            logger.info("Outbound webhook sent to %s (Status %s)", target_url, response.status)
            return response.status in [200, 201, 202, 204]
    except Exception as e:
        logger.error("Outbound webhook dispatch failed for %s: %s", target_url, str(e))
        return False
