from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from .models import User


def send_login_otp_email(*, user: User, code: str) -> int:
    """Envoie l'OTP en texte brut + HTML sans le persister ni le journaliser."""
    context = {
        "code": code,
        "expiry_minutes": settings.OTP_EXPIRY_MINUTES,
        "recipient_email": user.email,
    }

    subject = "Votre code de connexion — CST/CSMO"
    text_body = render_to_string("emails/login_otp.txt", context)
    html_body = render_to_string("emails/login_otp.html", context)

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach_alternative(html_body, "text/html")
    return email.send(fail_silently=False)
