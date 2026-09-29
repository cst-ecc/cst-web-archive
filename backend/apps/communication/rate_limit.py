import hashlib
import hmac

from django.conf import settings
from django.core.cache import cache


def _client_ip(request) -> str:
    # Le gateway Nginx écrase X-Real-IP avec $remote_addr. On le préfère à
    # X-Forwarded-For, qui peut contenir une valeur injectée par le client.
    real_ip = (request.META.get("HTTP_X_REAL_IP") or "").strip()
    if real_ip:
        return real_ip

    # Fallback utile hors gateway (tests / développement local).
    return request.META.get("REMOTE_ADDR") or "unknown"


def _privacy_key(request) -> str:
    digest = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        _client_ip(request).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"contact-submit:{digest}"


def contact_rate_limited(request) -> tuple[bool, int]:
    """Fixed-window limit stored in the shared Django cache (Redis in prod)."""
    limit = settings.CONTACT_RATE_LIMIT_COUNT
    window = settings.CONTACT_RATE_LIMIT_WINDOW_SECONDS
    key = _privacy_key(request)

    try:
        if cache.add(key, 1, timeout=window):
            return False, limit - 1

        try:
            current = cache.incr(key)
        except ValueError:
            cache.set(key, 1, timeout=window)
            current = 1
    except Exception:
        # Une panne du cache ne doit pas rendre le formulaire Contact indisponible.
        return False, limit

    return current > limit, max(0, limit - current)
