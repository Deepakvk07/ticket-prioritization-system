"""
ServiceNow Integration Adapter.
Maps ServiceNow Incident API (INCxxxxx) payloads and priority codes (1-Critical to 4-Low).
"""
from typing import Dict, Any
from app.integrations.base_adapter import BaseHelpdeskAdapter


class ServiceNowAdapter(BaseHelpdeskAdapter):
    """Adapter for ServiceNow Incident Management API."""

    @property
    def platform_name(self) -> str:
        return "servicenow"

    def normalize_payload(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        # Support both direct payload and ServiceNow REST API nested 'result' envelope
        data = raw_payload.get("result", raw_payload)

        return {
            "subject": data.get("short_description") or data.get("subject") or "ServiceNow Incident",
            "description": data.get("description") or data.get("comments") or data.get("work_notes") or "",
            "category": data.get("category") or data.get("subcategory") or "Technical Support",
            "customer_name": data.get("caller_id") or data.get("sys_created_by") or "ServiceNow User",
            "customer_email": data.get("u_caller_email") or data.get("contact_email") or "",
            "external_id": data.get("number") or data.get("sys_id") or "INC000000",
            "raw": raw_payload
        }

    def map_priority_to_platform(self, ai_priority: str) -> Dict[str, Any]:
        """
        Map to ServiceNow Priority (1: Critical, 2: High, 3: Moderate, 4: Low).
        Returns ServiceNow field update payload.
        """
        mapping = {
            "Critical": {"priority": "1", "urgency": "1", "impact": "1"},
            "High": {"priority": "2", "urgency": "2", "impact": "1"},
            "Medium": {"priority": "3", "urgency": "2", "impact": "2"},
            "Low": {"priority": "4", "urgency": "3", "impact": "3"}
        }
        return mapping.get(ai_priority, {"priority": "3", "urgency": "2", "impact": "2"})
