from datetime import timedelta

from django.conf import settings
from django.utils import timezone

PENDING_USER_ID = "backoffice_pending_user_id"
PENDING_OTP_ID = "backoffice_pending_otp_id"
PENDING_UNTIL = "backoffice_pending_until"
VERIFIED_USER_ID = "backoffice_2fa_verified_user_id"
VERIFIED_AT = "backoffice_2fa_verified_at"


def start_pending_session(request, *, user_id: int, otp_id: int | None) -> None:
    minutes = settings.OTP_PENDING_SESSION_MINUTES
    until = timezone.now() + timedelta(minutes=minutes)
    request.session.cycle_key()
    request.session[PENDING_USER_ID] = user_id
    request.session[PENDING_OTP_ID] = otp_id
    request.session[PENDING_UNTIL] = until.isoformat()
    request.session.set_expiry(minutes * 60)
    clear_verified_session(request)


def update_pending_otp(request, *, otp_id: int) -> None:
    request.session[PENDING_OTP_ID] = otp_id
    request.session.modified = True


def pending_session_is_valid(request) -> bool:
    user_id = request.session.get(PENDING_USER_ID)
    until_raw = request.session.get(PENDING_UNTIL)
    if not user_id or not until_raw:
        return False
    try:
        until = timezone.datetime.fromisoformat(until_raw)
        if timezone.is_naive(until):
            until = timezone.make_aware(until)
    except (TypeError, ValueError):
        return False
    return timezone.now() < until


def clear_pending_session(request) -> None:
    for key in (PENDING_USER_ID, PENDING_OTP_ID, PENDING_UNTIL):
        request.session.pop(key, None)


def mark_verified_session(request, *, user_id: int) -> None:
    clear_pending_session(request)
    request.session[VERIFIED_USER_ID] = user_id
    request.session[VERIFIED_AT] = timezone.now().isoformat()
    request.session.set_expiry(settings.BACKOFFICE_SESSION_MAX_AGE)
    request.session.modified = True


def clear_verified_session(request) -> None:
    request.session.pop(VERIFIED_USER_ID, None)
    request.session.pop(VERIFIED_AT, None)


def is_verified_for_user(request, user) -> bool:
    if not getattr(user, "is_authenticated", False):
        return False
    return request.session.get(VERIFIED_USER_ID) == user.pk
