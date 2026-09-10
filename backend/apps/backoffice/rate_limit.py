from __future__ import annotations

import hashlib
import hmac
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from .models import LoginRateLimit


def _client_ip(request) -> str:
    if request is None:
        return "unknown"
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",", 1)[0].strip() or "unknown"
    return request.META.get("REMOTE_ADDR") or "unknown"


def _digest(scope: str, value: str) -> str:
    secret = settings.SECRET_KEY.encode("utf-8")
    payload = f"backoffice-login-rate:{scope}:{value}".encode("utf-8")
    return hmac.new(secret, payload, hashlib.sha256).hexdigest()


def _keys(*, request, email: str):
    normalized_email = email.strip().lower()
    ip = _client_ip(request)
    return (
        (LoginRateLimit.Scope.IDENTIFIER_IP, _digest(LoginRateLimit.Scope.IDENTIFIER_IP, f"{normalized_email}|{ip}"), settings.BACKOFFICE_LOGIN_MAX_ATTEMPTS),
        (LoginRateLimit.Scope.IP, _digest(LoginRateLimit.Scope.IP, ip), settings.BACKOFFICE_LOGIN_IP_MAX_ATTEMPTS),
    )


def is_login_rate_limited(*, request, email: str) -> bool:
    now = timezone.now()
    for scope, key_hash, _limit in _keys(request=request, email=email):
        state = LoginRateLimit.objects.filter(scope=scope, key_hash=key_hash).only("blocked_until").first()
        if state and state.blocked_until and now < state.blocked_until:
            return True
    return False


def _locked_state(scope: str, key_hash: str) -> LoginRateLimit:
    try:
        return LoginRateLimit.objects.select_for_update().get(scope=scope, key_hash=key_hash)
    except LoginRateLimit.DoesNotExist:
        now = timezone.now()
        try:
            LoginRateLimit.objects.create(scope=scope, key_hash=key_hash, failures=0, window_started_at=now)
        except IntegrityError:
            pass
        return LoginRateLimit.objects.select_for_update().get(scope=scope, key_hash=key_hash)


@transaction.atomic
def record_login_failure(*, request, email: str) -> None:
    now = timezone.now()
    window = timedelta(minutes=settings.BACKOFFICE_LOGIN_WINDOW_MINUTES)
    lockout = timedelta(minutes=settings.BACKOFFICE_LOGIN_LOCKOUT_MINUTES)

    for scope, key_hash, limit in _keys(request=request, email=email):
        state = _locked_state(scope, key_hash)
        if state.blocked_until and now < state.blocked_until:
            continue
        if now - state.window_started_at >= window:
            state.failures = 1
            state.window_started_at = now
            state.blocked_until = None
        else:
            state.failures += 1
        if state.failures >= limit:
            state.blocked_until = now + lockout
        state.save(update_fields=["failures", "window_started_at", "blocked_until", "updated_at"])


@transaction.atomic
def reset_identifier_ip_limit(*, request, email: str) -> None:
    scope, key_hash, _limit = _keys(request=request, email=email)[0]
    LoginRateLimit.objects.filter(scope=scope, key_hash=key_hash).delete()
