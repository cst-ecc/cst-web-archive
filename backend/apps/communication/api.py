import logging

from django.db import transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .rate_limit import contact_rate_limited
from .serializers import ContactCreateSerializer
from .tasks import send_contact_acknowledgement, send_new_contact_notification

logger = logging.getLogger(__name__)


@require_GET
@ensure_csrf_cookie
def contact_csrf(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_POST
@csrf_protect
def contact_create(request):
    limited, _remaining = contact_rate_limited(request)
    if limited:
        return JsonResponse(
            {"detail": "Trop de demandes ont été envoyées. Veuillez réessayer plus tard."},
            status=429,
        )

    try:
        import json
        payload = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, ValueError, TypeError):
        return JsonResponse({"detail": "Requête invalide."}, status=400)

    # Honeypot : réponse volontairement neutre, sans créer d'enregistrement.
    if str(payload.get("website") or "").strip():
        return JsonResponse(
            {"message": "Votre message a bien été reçu."},
            status=201,
        )

    serializer = ContactCreateSerializer(data=payload)
    if not serializer.is_valid():
        return JsonResponse({"errors": serializer.errors}, status=400)

    with transaction.atomic():
        contact = serializer.save()

        def notify_after_commit():
            for task in (send_new_contact_notification, send_contact_acknowledgement):
                try:
                    task.delay(contact.pk)
                except Exception:
                    # Le message reste enregistré même si le broker est indisponible.
                    logger.exception("Planification d'un e-mail de contact impossible.")

        transaction.on_commit(notify_after_commit)

    return JsonResponse(
        {"message": "Votre message a bien été reçu.", "id": contact.pk},
        status=201,
    )
