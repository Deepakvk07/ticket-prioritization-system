"""
Base Integration Adapter — Abstract Interface for Helpdesk Platforms.
Provides unified payload normalization and priority mapping across ServiceNow, Jira, Zendesk, and Freshdesk.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseHelpdeskAdapter(ABC):
    """Abstract base class for all enterprise helpdesk platform adapters."""

    @property
    @abstractmethod
    def platform_name(self) -> str:
        """Name of the platform (e.g. servicenow, jira, zendesk, freshdesk)."""
        pass

    @abstractmethod
    def normalize_payload(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize raw platform-specific ticket JSON payload into unified TicketFlow AI schema:
        Returns: {
            "subject": str,
            "description": str,
            "category": str,
            "customer_name": str,
            "customer_email": str,
            "external_id": str,
            "raw": dict
        }
        """
        pass

    @abstractmethod
    def map_priority_to_platform(self, ai_priority: str) -> Any:
        """
        Map TicketFlow AI priority ('Critical', 'High', 'Medium', 'Low')
        to the target platform's native priority format/code.
        """
        pass

    def format_response(self, raw_payload: Dict[str, Any], classification_result: Dict[str, Any]) -> Dict[str, Any]:
        """Format classification result back into platform-compliant payload."""
        normalized = self.normalize_payload(raw_payload)
        ai_priority = classification_result.get("priority", "Medium")
        platform_priority = self.map_priority_to_platform(ai_priority)

        return {
            "platform": self.platform_name,
            "external_id": normalized.get("external_id"),
            "ai_classification": {
                "predicted_priority": ai_priority,
                "confidence_score": classification_result.get("confidence_score", 90.0),
                "category": classification_result.get("category", normalized.get("category")),
                "routing_queue": f"{ai_priority.lower()}_escalation_tier"
            },
            "platform_payload_update": {
                "priority_field": platform_priority,
                "triage_notes": f"[TicketFlow AI] Priority classified as {ai_priority} (Confidence: {classification_result.get('confidence_score', 90.0)}%)"
            }
        }
