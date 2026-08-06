"""
Jira Service Management Integration Adapter.
Maps Jira Issue API (Jira Issue JSON / Webhooks) and priority names ('Highest', 'High', 'Medium', 'Low').
"""
from typing import Dict, Any
from app.integrations.base_adapter import BaseHelpdeskAdapter


class JiraAdapter(BaseHelpdeskAdapter):
    """Adapter for Jira Service Management API and Webhooks."""

    @property
    def platform_name(self) -> str:
        return "jira"

    def normalize_payload(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        # Handle Jira webhook issue envelope or direct REST API issue dict
        issue = raw_payload.get("issue", raw_payload)
        fields = issue.get("fields", {})

        # Extract text from description (string or Jira Atlassian Document Format ADF dict)
        raw_desc = fields.get("description") or ""
        if isinstance(raw_desc, dict):
            # Extract plain text from ADF structure if needed
            desc_text = str(raw_desc.get("content", raw_desc))
        else:
            desc_text = str(raw_desc)

        reporter = fields.get("reporter", {})
        components = fields.get("components", [])
        category_name = components[0].get("name") if components else fields.get("issuetype", {}).get("name", "Technical Support")

        return {
            "subject": fields.get("summary") or raw_payload.get("summary") or "Jira Issue",
            "description": desc_text,
            "category": category_name,
            "customer_name": reporter.get("displayName") or reporter.get("name") or "Jira User",
            "customer_email": reporter.get("emailAddress") or "",
            "external_id": issue.get("key") or issue.get("id") or "JIRA-1",
            "raw": raw_payload
        }

    def map_priority_to_platform(self, ai_priority: str) -> Dict[str, Any]:
        """
        Map to Jira Priority field structure.
        """
        mapping = {
            "Critical": "Highest",
            "High": "High",
            "Medium": "Medium",
            "Low": "Low"
        }
        name = mapping.get(ai_priority, "Medium")
        return {"priority": {"name": name}}
