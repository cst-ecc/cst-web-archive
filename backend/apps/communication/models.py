import secrets
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class ContactStatus(models.TextChoices):
    NEW = "nouveau", "Nouveau"
    READ = "lu", "Lu"
    IN_PROGRESS = "en_cours", "En cours"
    RESOLVED = "traite", "Traité"
    CLOSED = "ferme", "Fermé"
    SPAM = "spam", "Spam"


class ContactCategory(models.Model):
    name = models.CharField("nom", max_length=120, unique=True)
    slug = models.SlugField("slug", max_length=140, unique=True)
    is_active = models.BooleanField("active", default=True)
    order = models.PositiveIntegerField("ordre", default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "catégorie de contact"
        verbose_name_plural = "catégories de contact"

    def __str__(self):
        return self.name


class ContactRequest(models.Model):
    first_name = models.CharField("prénoms", max_length=120, blank=True)
    last_name = models.CharField("nom", max_length=120)
    email = models.EmailField("e-mail")
    phone = models.CharField("téléphone", max_length=40, blank=True)
    subject = models.CharField("objet", max_length=220)
    category = models.ForeignKey(ContactCategory, null=True, blank=True, on_delete=models.SET_NULL, related_name="requests")
    message = models.TextField("message", max_length=5000)
    status = models.CharField("statut", max_length=20, choices=ContactStatus.choices, default=ContactStatus.NEW, db_index=True)
    consent_acknowledged = models.BooleanField("information traitement acceptée", default=False)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_contact_requests")
    internal_note = models.TextField("note interne", blank=True)
    created_at = models.DateTimeField("créée le", auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField("modifiée le", auto_now=True)
    read_at = models.DateTimeField("lue le", null=True, blank=True)
    closed_at = models.DateTimeField("fermée le", null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        permissions = [
            ("manage_contactrequest", "Gérer les demandes de contact"),
            ("reply_contactrequest", "Répondre aux demandes de contact"),
        ]

    def __str__(self):
        return f"{self.subject} — {self.email}"


class ConversationStatus(models.TextChoices):
    WAITING = "en_attente", "En attente"
    ACTIVE = "en_cours", "En cours"
    CLOSED = "fermee", "Fermée"
    ARCHIVED = "archivee", "Archivée"


class Conversation(models.Model):
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    visitor_token = models.CharField(max_length=64, unique=True, editable=False, db_index=True)
    visitor_name = models.CharField("nom visiteur", max_length=160, blank=True)
    visitor_email = models.EmailField("e-mail visiteur", blank=True)
    status = models.CharField("statut", max_length=20, choices=ConversationStatus.choices, default=ConversationStatus.WAITING, db_index=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_conversations")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity_at = models.DateTimeField(default=timezone.now, db_index=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-last_activity_at"]
        permissions = [
            ("manage_conversation", "Administrer les conversations"),
            ("reply_conversation", "Répondre aux conversations"),
        ]

    def save(self, *args, **kwargs):
        if not self.visitor_token:
            self.visitor_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Conversation {self.public_id}"


class ChatSender(models.TextChoices):
    VISITOR = "visiteur", "Visiteur"
    MEMBER = "membre", "Membre"
    SYSTEM = "systeme", "Système"


class ChatMessage(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender_type = models.CharField(max_length=20, choices=ChatSender.choices)
    sender_user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="chat_messages")
    content = models.TextField(max_length=3000)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["created_at"]


class SubscriberStatus(models.TextChoices):
    PENDING = "en_attente", "En attente"
    ACTIVE = "actif", "Actif"
    UNSUBSCRIBED = "desabonne", "Désabonné"
    BLOCKED = "bloque", "Bloqué"


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=160, blank=True)
    status = models.CharField(max_length=20, choices=SubscriberStatus.choices, default=SubscriberStatus.PENDING, db_index=True)
    source = models.CharField(max_length=80, default="site_public")
    confirmation_token = models.CharField(max_length=64, unique=True, editable=False)
    unsubscribe_token = models.CharField(max_length=64, unique=True, editable=False)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-subscribed_at"]
        permissions = [("manage_newslettersubscriber", "Gérer les abonnés newsletter")]

    def save(self, *args, **kwargs):
        if not self.confirmation_token:
            self.confirmation_token = secrets.token_urlsafe(32)
        if not self.unsubscribe_token:
            self.unsubscribe_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)


class CampaignStatus(models.TextChoices):
    DRAFT = "brouillon", "Brouillon"
    SCHEDULED = "programmee", "Programmée"
    SENDING = "en_cours", "En cours"
    SENT = "envoyee", "Envoyée"
    CANCELLED = "annulee", "Annulée"


class NewsletterCampaign(models.Model):
    title = models.CharField(max_length=220)
    subject = models.CharField(max_length=220)
    content = models.TextField(max_length=30000)
    status = models.CharField(max_length=20, choices=CampaignStatus.choices, default=CampaignStatus.DRAFT, db_index=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="newsletter_campaigns")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    recipient_count = models.PositiveIntegerField(default=0)
    success_count = models.PositiveIntegerField(default=0)
    failure_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        permissions = [
            ("manage_newslettercampaign", "Gérer les campagnes newsletter"),
            ("send_newslettercampaign", "Envoyer les campagnes newsletter"),
        ]
