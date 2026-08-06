"""
Freshdesk Integration Adapter.
Maps Freshdesk Ticket API & Webhook payloads and numeric priority codes (1-Low to 4-Urgent).
"""
from typing import Dict, Any
from app.integrations.base_adapter import BaseHelpdeskAdapter


class FreshdeskAdapter(BaseHelpdeskAdapter):
    """Adapter for Freshdesk Ticket API."""

    @property
    def platform_name(self) -> str:
        return "freshdesk"

    def normalize_payload(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        data = raw_payload.get("freshdesk_webhook", raw_payload)

        return {
            "subject": data.get("subject") or "Freshdesk Ticket",
            "description": data.get("description_text") or data.get("description") or "",
            "category": data.get("type") or "Technical Support",
            "customer_name": data.get("name") or "Freshdesk User",
            "customer_email": data.get("email") or "",
            "external_id": str(data.get("id") or "FD-101"),
            "raw": raw_payload
        }

    def map_priority_to_platform(self, ai_priority: str) -> Dict[str, Any]:
        """
        Map to Freshdesk numeric priority codes (4: Urgent, 3: High, 2: Medium, 1: Low).
        """
        mapping = {
            "Critical": 4,
            "High": 3,
            "Medium": 2,
            "Low": 1
        }
        return {"priority": mapping.get(ai_priority, 2)}
