from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from apps.accounts.models import User

from .models import Contact


def _contact_managers() -> list[str]:
    recipients = set(settings.CONTACT_NOTIFICATION_EMAILS)
    users = User.objects.filter(is_active=True).exclude(email="").prefetch_related(
        "groups__permissions", "user_permissions"
    )
    for user in users:
        if user.is_superuser or user.has_perm("communication.manage_contact"):
            recipients.add(user.email)
    return sorted(recipients)


@shared_task(ignore_result=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_new_contact_notification(contact_id: int) -> None:
    contact = Contact.objects.filter(pk=contact_id).first()
    if not contact:
        return
    recipients = _contact_managers()
    if not recipients:
        return

    send_mail(
        subject=f"[CST/CSMo] Nouveau contact — {contact.subject}",
        message=render_to_string(
            "emails/contact_notification.txt",
            {"contact": contact},
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipients,
        fail_silently=False,
    )


@shared_task(ignore_result=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_contact_acknowledgement(contact_id: int) -> None:
    contact = Contact.objects.filter(pk=contact_id).first()
    if not contact:
        return

    send_mail(
        subject="Accusé de réception — CST / CSMo ECC",
        message=render_to_string(
            "emails/contact_ack.txt",
            {"contact": contact},
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[contact.email],
        fail_silently=False,
    )
