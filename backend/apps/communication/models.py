from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class ContactCategory(models.TextChoices):
    GENERAL = "general", "Information générale"
    DOCUMENTS = "documents", "Documents et ressources"
    COMMUNICATION = "communication", "Presse et communication"
    CONTRIBUTION = "contribution", "Contribution ou proposition"
    OTHER = "other", "Autre demande"


class ContactStatus(models.TextChoices):
    NEW = "new", "Nouveau"
    READ = "read", "Lu"
    IN_PROGRESS = "in_progress", "En cours"
    PROCESSED = "processed", "Traité"
    CLOSED = "closed", "Fermé"
    SPAM = "spam", "Spam"


class Contact(TimeStampedModel):
    name = models.CharField("nom", max_length=160)
    first_names = models.CharField("prénoms", max_length=160, blank=True)
    email = models.EmailField("adresse e-mail", max_length=254)
    phone = models.CharField("téléphone", max_length=40, blank=True)
    subject = models.CharField("objet", max_length=220)
    category = models.CharField(
        "catégorie",
        max_length=32,
        choices=ContactCategory.choices,
        default=ContactCategory.GENERAL,
        db_index=True,
    )
    message = models.TextField("message", max_length=5000)
    status = models.CharField(
        "statut",
        max_length=24,
        choices=ContactStatus.choices,
        default=ContactStatus.NEW,
        db_index=True,
    )
    read_at = models.DateTimeField("lu le", null=True, blank=True)
    processed_at = models.DateTimeField("traité le", null=True, blank=True)
    last_managed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="dernière gestion par",
        related_name="contacts_managed",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        verbose_name = "demande de contact"
        verbose_name_plural = "demandes de contact"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"], name="contact_status_created_idx"),
            models.Index(fields=["category", "-created_at"], name="contact_category_created_idx"),
        ]
        permissions = [
            ("manage_contact", "Peut gérer le statut des demandes de contact"),
            ("reply_contact", "Peut répondre aux demandes de contact"),
        ]

    def __str__(self) -> str:
        return f"{self.subject} — {self.name}"

    @property
    def full_name(self) -> str:
        return " ".join(part for part in (self.first_names, self.name) if part).strip()


class ContactReply(TimeStampedModel):
    class DeliveryStatus(models.TextChoices):
        PENDING = "pending", "En attente"
        SENT = "sent", "Envoyé"
        FAILED = "failed", "Échec"

    contact = models.ForeignKey(
        Contact,
        verbose_name="contact",
        related_name="replies",
        on_delete=models.CASCADE,
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="auteur",
        related_name="contact_replies",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    subject = models.CharField("objet", max_length=220)
    message = models.TextField("message", max_length=5000)
    delivery_status = models.CharField(
        "statut d’envoi",
        max_length=16,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
        db_index=True,
    )
    sent_at = models.DateTimeField("envoyé le", null=True, blank=True)
    error_message = models.CharField("erreur d’envoi", max_length=500, blank=True)

    class Meta:
        verbose_name = "réponse à un contact"
        verbose_name_plural = "réponses aux contacts"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Réponse #{self.pk or '—'} — contact #{self.contact_id}"
