"""
Zendesk Integration Adapter.
Maps Zendesk Ticket API & Target Webhook payloads and priorities ('urgent', 'high', 'normal', 'low').
"""
from typing import Dict, Any
from app.integrations.base_adapter import BaseHelpdeskAdapter


class ZendeskAdapter(BaseHelpdeskAdapter):
    """Adapter for Zendesk Support API and Webhooks."""

    @property
    def platform_name(self) -> str:
        return "zendesk"

    def normalize_payload(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        ticket = raw_payload.get("ticket", raw_payload)
        comment = ticket.get("comment", {})
        requester = ticket.get("requester", {})

        desc = comment.get("body") if isinstance(comment, dict) else ticket.get("description", "")

        return {
            "subject": ticket.get("subject") or "Zendesk Ticket",
            "description": desc or "",
            "category": ticket.get("type") or "problem",
            "customer_name": requester.get("name") if isinstance(requester, dict) else "Zendesk User",
            "customer_email": requester.get("email") if isinstance(requester, dict) else "",
            "external_id": str(ticket.get("id") or "ZD-1001"),
            "raw": raw_payload
        }

    def map_priority_to_platform(self, ai_priority: str) -> Dict[str, Any]:
        """
        Map to Zendesk priority strings ('urgent', 'high', 'normal', 'low').
        """
        mapping = {
            "Critical": "urgent",
            "High": "high",
            "Medium": "normal",
            "Low": "low"
        }
        return {"ticket": {"priority": mapping.get(ai_priority, "normal")}}
