"""
Enterprise Integrations Package — Registry for Platform Adapters.
"""
from typing import Dict, Type
from app.integrations.base_adapter import BaseHelpdeskAdapter
from app.integrations.servicenow import ServiceNowAdapter
from app.integrations.jira import JiraAdapter
from app.integrations.zendesk import ZendeskAdapter
from app.integrations.freshdesk import FreshdeskAdapter

# Platform adapter registry
ADAPTER_REGISTRY: Dict[str, Type[BaseHelpdeskAdapter]] = {
    "servicenow": ServiceNowAdapter,
    "jira": JiraAdapter,
    "zendesk": ZendeskAdapter,
    "freshdesk": FreshdeskAdapter,
}


def get_adapter(platform: str) -> BaseHelpdeskAdapter:
    """Factory function to instantiate adapter by platform name."""
    clean_platform = platform.lower().strip()
    adapter_cls = ADAPTER_REGISTRY.get(clean_platform)
    if not adapter_cls:
        raise ValueError(
            f"Unsupported enterprise platform '{platform}'. "
            f"Supported platforms: {list(ADAPTER_REGISTRY.keys())}"
        )
    return adapter_cls()
