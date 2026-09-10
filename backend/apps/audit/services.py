from __future__ import annotations
from typing import Any
from django.http import HttpRequest
from .models import AuditLog


def _client_ip(request: HttpRequest | None) -> str | None:
    if request is None:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",", 1)[0].strip() or None
    return request.META.get("REMOTE_ADDR") or None


def _user_agent(request: HttpRequest | None) -> str:
    if request is None:
        return ""
    return (request.META.get("HTTP_USER_AGENT") or "")[:2000]


def audit_log(*, action: str, actor=None, request: HttpRequest | None = None,
              target=None, description: str = "", metadata: dict[str, Any] | None = None) -> AuditLog:
    target_type = ""
    target_id = ""
    if target is not None:
        target_type = f"{target._meta.app_label}.{target._meta.model_name}"
        target_id = str(target.pk) if target.pk is not None else ""

    return AuditLog.objects.create(
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        action=action,
        target_type=target_type,
        target_id=target_id,
        description=description,
        ip_address=_client_ip(request),
        user_agent=_user_agent(request),
        metadata=metadata or {},
    )
