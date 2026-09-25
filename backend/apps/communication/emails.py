from django.conf import settings
from django.core.mail import send_mail
from django.urls import reverse


def send_contact_acknowledgement(contact):
    send_mail(
        "Votre message a bien été reçu",
        "Bonjour,\n\nVotre message a bien été reçu par l’équipe CST/CSMo.\n\nCordialement,\nCST / CSMo",
        settings.DEFAULT_FROM_EMAIL,
        [contact.email],
        fail_silently=False,
    )


def send_newsletter_confirmation(subscriber):
    base = settings.PUBLIC_SITE_URL.rstrip("/")
    url = f"{base}{reverse('communication:newsletter-confirm', kwargs={'token': subscriber.confirmation_token})}"
    send_mail(
        "Confirmez votre abonnement aux informations CST/CSMo",
        f"Bonjour,\n\nConfirmez votre abonnement en ouvrant ce lien :\n{url}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.",
        settings.DEFAULT_FROM_EMAIL,
        [subscriber.email],
        fail_silently=False,
    )
