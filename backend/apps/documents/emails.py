from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from .models import DocumentAccessGrant


def send_document_access_granted_email(*, grant: DocumentAccessGrant, access_url: str) -> int:
    context = {
        "grant": grant,
        "document": grant.document,
        "access_url": access_url,
    }
    subject = f"Accès autorisé — {grant.document.title}"
    text_body = render_to_string("emails/document_access_granted.txt", context)
    html_body = render_to_string("emails/document_access_granted.html", context)
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[grant.recipient_email],
    )
    email.attach_alternative(html_body, "text/html")
    return email.send(fail_silently=False)


def send_document_access_otp_email(*, grant: DocumentAccessGrant, code: str) -> int:
    context = {
        "grant": grant,
        "document": grant.document,
        "code": code,
        "expiry_minutes": settings.OTP_EXPIRY_MINUTES,
    }
    subject = f"Code de vérification — {grant.document.title}"
    text_body = render_to_string("emails/document_access_otp.txt", context)
    html_body = render_to_string("emails/document_access_otp.html", context)
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[grant.recipient_email],
    )
    email.attach_alternative(html_body, "text/html")
    return email.send(fail_silently=False)
