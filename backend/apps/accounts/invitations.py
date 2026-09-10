from __future__ import annotations

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .models import User


def build_invitation_url(*, request, user: User) -> str:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    relative_url = reverse(
        "backoffice:account_setup",
        kwargs={"uidb64": uid, "token": token},
    )
    return request.build_absolute_uri(relative_url)


def send_backoffice_invitation(*, request, user: User) -> int:
    """
    Envoie une invitation permettant à l'utilisateur de définir son mot de passe.

    Le token Django est lié à l'état du compte et devient invalide après
    définition/modification du mot de passe.
    """
    setup_url = build_invitation_url(request=request, user=user)

    context = {
        "user": user,
        "setup_url": setup_url,
    }

    subject = "Votre accès au back-office CST/CSMO"
    text_body = render_to_string("emails/backoffice_invitation.txt", context)
    html_body = render_to_string("emails/backoffice_invitation.html", context)

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach_alternative(html_body, "text/html")
    return email.send(fail_silently=False)
