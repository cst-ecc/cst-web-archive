from django.core.cache import cache
from rest_framework.exceptions import Throttled


def enforce_rate_limit(*, key: str, limit: int, window: int) -> None:
    value = cache.get(key, 0)
    if value >= limit:
        raise Throttled(wait=window)
    if value == 0:
        cache.set(key, 1, timeout=window)
    else:
        try:
            cache.incr(key)
        except ValueError:
            cache.set(key, 1, timeout=window)


def client_ip(request) -> str:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return (forwarded.split(",", 1)[0].strip() if forwarded else request.META.get("REMOTE_ADDR", "")) or "unknown"
