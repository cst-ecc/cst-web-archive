import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from .emails import send_contact_acknowledgement, send_newsletter_confirmation
from .models import CampaignStatus, NewsletterCampaign, NewsletterSubscriber, SubscriberStatus

logger = logging.getLogger(__name__)


@shared_task(autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_contact_acknowledgement_task(contact_id):
    from .models import ContactRequest
    contact = ContactRequest.objects.get(pk=contact_id)
    send_contact_acknowledgement(contact)


@shared_task(autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_newsletter_confirmation_task(subscriber_id):
    subscriber = NewsletterSubscriber.objects.get(pk=subscriber_id)
    send_newsletter_confirmation(subscriber)


@shared_task
def send_newsletter_campaign_task(campaign_id):
    campaign = NewsletterCampaign.objects.get(pk=campaign_id)
    if campaign.status not in {CampaignStatus.DRAFT, CampaignStatus.SCHEDULED, CampaignStatus.SENDING}:
        return
    subscribers = list(NewsletterSubscriber.objects.filter(status=SubscriberStatus.ACTIVE).only("email", "unsubscribe_token"))
    campaign.status = CampaignStatus.SENDING
    campaign.recipient_count = len(subscribers)
    campaign.success_count = 0
    campaign.failure_count = 0
    campaign.save(update_fields=["status", "recipient_count", "success_count", "failure_count", "updated_at"])
    success = failure = 0
    base = settings.PUBLIC_SITE_URL.rstrip("/")
    for subscriber in subscribers:
        unsubscribe_url = f"{base}/api/v1/communication/newsletter/unsubscribe/{subscriber.unsubscribe_token}/"
        body = f"{campaign.content}\n\n---\nSe désabonner : {unsubscribe_url}"
        try:
            send_mail(campaign.subject, body, settings.DEFAULT_FROM_EMAIL, [subscriber.email], fail_silently=False)
            success += 1
        except Exception:
            failure += 1
            logger.exception("Échec d’envoi newsletter vers un destinataire.")
    with transaction.atomic():
        campaign = NewsletterCampaign.objects.select_for_update().get(pk=campaign_id)
        campaign.success_count = success
        campaign.failure_count = failure
        campaign.status = CampaignStatus.SENT
        campaign.sent_at = timezone.now()
        campaign.save(update_fields=["success_count", "failure_count", "status", "sent_at", "updated_at"])
