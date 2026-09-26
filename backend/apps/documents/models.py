from __future__ import annotations

import uuid
from pathlib import Path

from django.conf import settings
from django.db import models, transaction
from django.utils import timezone
from django.utils.text import slugify

from apps.core.models import TimeStampedModel
from apps.core.publication import PublicationStatus


def document_file_upload_to(instance, filename: str) -> str:
    suffix = Path(filename).suffix.lower() or ".pdf"
    folder = timezone.now().strftime("documents/%Y/%m")
    # Le nom final stocké est volontairement court et sécurisé.
    # Le nom original long est conservé dans original_filename.
    return f"{folder}/{uuid.uuid4().hex}{suffix}"


class DocumentKind(models.TextChoices):
    DECISION = "decision", "Décision"
    REPORT = "rapport", "Rapport"
    MINUTES = "proces_verbal", "Procès-verbal"
    COMMUNIQUE = "communique", "Communiqué"
    CONSOLIDATED_TEXT = "texte_consolide", "Texte consolidé"
    POPULARIZATION = "vulgarisation", "Vulgarisation"
    OTHER = "autre", "Autre"


class DocumentAccessRequestStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    APPROVED = "approved", "Autorisée"
    REFUSED = "refused", "Refusée"


class DocumentCategory(TimeStampedModel):
    name = models.CharField("nom", max_length=120, unique=True)
    slug = models.SlugField("slug", max_length=140, unique=True)
    order = models.PositiveIntegerField("ordre", default=0)
    is_active = models.BooleanField("actif", default=True)

    class Meta:
        verbose_name = "catégorie document"
        verbose_name_plural = "catégories document"
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return self.name


class Document(TimeStampedModel):
    title = models.CharField("titre", max_length=240)
    slug = models.SlugField("slug", max_length=260, unique=True, blank=True)
    summary = models.TextField("résumé")
    reference = models.CharField("référence", max_length=180, blank=True)

    category = models.ForeignKey(
        DocumentCategory,
        verbose_name="catégorie",
        related_name="documents",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    kind = models.CharField(
        "type de document",
        max_length=40,
        choices=DocumentKind.choices,
        default=DocumentKind.OTHER,
        db_index=True,
    )

    date = models.DateField("date du document", db_index=True)

    # max_length augmenté pour éviter l'erreur Django :
    # "Assurez-vous que ce nom de fichier comporte au plus 100 caractères".
    # Même si le fichier final est renommé en UUID, Django valide d'abord
    # le nom original côté formulaire.
    file = models.FileField(
        "fichier",
        upload_to=document_file_upload_to,
        max_length=500,
    )
    original_filename = models.CharField("nom original", max_length=255, blank=True)
    file_size = models.BigIntegerField("taille fichier", default=0)
    mime_type = models.CharField("type MIME", max_length=120, blank=True)
    pages = models.PositiveIntegerField("nombre de pages", null=True, blank=True)

    status = models.CharField(
        "statut",
        max_length=20,
        choices=PublicationStatus.choices,
        default=PublicationStatus.DRAFT,
        db_index=True,
    )
    featured = models.BooleanField("mise en avant", default=False, db_index=True)
    display_order = models.PositiveIntegerField("ordre d’affichage", default=0)
    downloads = models.PositiveIntegerField("téléchargements", default=0)
    open_count = models.PositiveIntegerField("ouvertures", default=0)
    is_confidential = models.BooleanField(
        "document confidentiel",
        default=False,
        db_index=True,
        help_text=(
            "Si activé, le fichier n’est plus accessible publiquement et nécessite "
            "une autorisation temporaire."
        ),
    )

    submitted_at = models.DateTimeField("soumis le", null=True, blank=True)
    published_at = models.DateTimeField("publié le", null=True, blank=True)
    archived_at = models.DateTimeField("archivé le", null=True, blank=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="auteur",
        related_name="documents_created",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    last_editor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="dernière modification par",
        related_name="documents_last_edited",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="soumis par",
        related_name="documents_submitted",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="publié par",
        related_name="documents_published",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    archived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="archivé par",
        related_name="documents_archived",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        verbose_name = "document"
        verbose_name_plural = "documents"
        ordering = ["-date", "display_order", "-created_at"]
        indexes = [
            models.Index(fields=["status", "-date"], name="doc_status_date_idx"),
            models.Index(fields=["status", "featured", "display_order"], name="doc_feature_idx"),
            models.Index(fields=["kind", "status"], name="doc_kind_status_idx"),
        ]
        permissions = [
            ("submit_document", "Peut soumettre un document à validation"),
            ("review_document", "Peut examiner un document en attente"),
            ("publish_document", "Peut publier un document"),
            ("archive_document", "Peut archiver/restaurer un document"),
        ]

    def __str__(self) -> str:
        return self.title

    @property
    def category_slug(self) -> str:
        return self.category.slug if self.category_id else ""

    @property
    def file_url(self) -> str:
        return self.file.url if self.file else ""

    @property
    def size_label(self) -> str:
        size = self.file_size or 0
        if size <= 0:
            return ""
        if size < 1024 * 1024:
            return f"{round(size / 1024)} Ko"
        return f"{round(size / 1024 / 1024, 1)} Mo"

    def save(self, *args, **kwargs):
        previous_is_confidential = None
        update_fields = kwargs.get("update_fields")
        confidentiality_may_change = (
            update_fields is None or "is_confidential" in update_fields
        )
        if self.pk and confidentiality_may_change:
            previous_is_confidential = (
                Document.objects.filter(pk=self.pk)
                .values_list("is_confidential", flat=True)
                .first()
            )

        if not self.slug:
            base = slugify(self.title)[:230] or "document"
            candidate = base
            if Document.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base[:220]}-{uuid.uuid4().hex[:8]}"
            self.slug = candidate

        # Dès qu'un document redevient public, la mise à jour du document et
        # l'invalidation de ses anciennes autorisations sont atomiques. Ainsi,
        # aucune autorisation confidentielle ne peut redevenir valide si le
        # document est marqué confidentiel à nouveau plus tard.
        if previous_is_confidential is True and not self.is_confidential:
            with transaction.atomic():
                super().save(*args, **kwargs)
                now = timezone.now()
                self.access_grants.filter(revoked_at__isnull=True).update(
                    revoked_at=now,
                    updated_at=now,
                )
                DocumentAccessOTP.objects.filter(
                    grant__document=self,
                    used_at__isnull=True,
                    invalidated_at__isnull=True,
                ).update(invalidated_at=now)
                self.access_requests.filter(
                    status=DocumentAccessRequestStatus.PENDING
                ).update(
                    status=DocumentAccessRequestStatus.REFUSED,
                    reviewed_at=now,
                    refusal_reason=(
                        "Demande clôturée automatiquement : le document a été rendu public."
                    ),
                    updated_at=now,
                )
            return

        super().save(*args, **kwargs)

class DocumentAccessRequest(TimeStampedModel):
    document = models.ForeignKey(
        Document,
        verbose_name="document",
        related_name="access_requests",
        on_delete=models.CASCADE,
    )
    full_name = models.CharField("nom et prénoms", max_length=180)
    email = models.EmailField("adresse e-mail", db_index=True)
    phone = models.CharField("téléphone", max_length=40, blank=True)
    organization = models.CharField("organisation / qualité", max_length=180, blank=True)
    reason = models.TextField("motif de la demande")
    status = models.CharField(
        "statut",
        max_length=20,
        choices=DocumentAccessRequestStatus.choices,
        default=DocumentAccessRequestStatus.PENDING,
        db_index=True,
    )
    reviewed_at = models.DateTimeField("examinée le", null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="examinée par",
        related_name="document_access_requests_reviewed",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    refusal_reason = models.TextField("motif du refus", blank=True)

    class Meta:
        verbose_name = "demande d’accès à un document"
        verbose_name_plural = "demandes d’accès aux documents"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["status", "-created_at"],
                name="doc_access_req_status_idx",
            ),
            models.Index(
                fields=["document", "email"],
                name="doc_access_req_doc_mail_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} — {self.document.title}"


class DocumentAccessGrant(TimeStampedModel):
    public_id = models.UUIDField("référence publique", default=uuid.uuid4, unique=True, editable=False)
    request = models.OneToOneField(
        DocumentAccessRequest,
        verbose_name="demande",
        related_name="grant",
        on_delete=models.CASCADE,
    )
    document = models.ForeignKey(
        Document,
        verbose_name="document",
        related_name="access_grants",
        on_delete=models.CASCADE,
    )
    recipient_name = models.CharField("destinataire", max_length=180)
    recipient_email = models.EmailField("e-mail destinataire", db_index=True)
    token_hash = models.CharField("hash du lien", max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField("expiration", db_index=True)
    max_opens = models.PositiveIntegerField("ouvertures maximales", default=5)
    open_count = models.PositiveIntegerField("ouvertures", default=0)
    last_opened_at = models.DateTimeField("dernière ouverture", null=True, blank=True)
    last_verified_at = models.DateTimeField("dernière vérification", null=True, blank=True)
    revoked_at = models.DateTimeField("révoquée le", null=True, blank=True)
    revoked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="révoquée par",
        related_name="document_access_grants_revoked",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="créée par",
        related_name="document_access_grants_created",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    link_sent_at = models.DateTimeField("lien envoyé le", null=True, blank=True)

    class Meta:
        verbose_name = "autorisation d’accès à un document"
        verbose_name_plural = "autorisations d’accès aux documents"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["document", "expires_at"],
                name="doc_access_grant_exp_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(max_opens__gte=1),
                name="doc_access_grant_max_opens_gte_1",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.recipient_name} — {self.document.title}"

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_revoked(self) -> bool:
        return self.revoked_at is not None

    @property
    def has_remaining_opens(self) -> bool:
        return self.open_count < self.max_opens

    @property
    def is_active(self) -> bool:
        return (
            self.document.is_confidential
            and not self.is_expired
            and not self.is_revoked
            and self.has_remaining_opens
        )

    @property
    def remaining_opens(self) -> int:
        return max(0, self.max_opens - self.open_count)

    @property
    def reference(self) -> str:
        return self.public_id.hex[:12].upper()


class DocumentAccessOTP(models.Model):
    grant = models.ForeignKey(
        DocumentAccessGrant,
        verbose_name="autorisation",
        related_name="otps",
        on_delete=models.CASCADE,
    )
    code_hash = models.CharField("hash du code", max_length=255)
    expires_at = models.DateTimeField("expiration", db_index=True)
    attempts = models.PositiveSmallIntegerField("tentatives", default=0)
    max_attempts = models.PositiveSmallIntegerField("tentatives maximales", default=5)
    resend_available_at = models.DateTimeField("renvoi autorisé à partir de")
    used_at = models.DateTimeField("utilisé le", null=True, blank=True)
    invalidated_at = models.DateTimeField("invalidé le", null=True, blank=True)
    ip_address = models.GenericIPAddressField("adresse IP", null=True, blank=True)
    user_agent = models.TextField("user-agent", blank=True)
    created_at = models.DateTimeField("créé le", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "OTP d’accès à un document"
        verbose_name_plural = "OTP d’accès aux documents"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["grant", "-created_at"],
                name="doc_access_otp_grant_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(max_attempts__gte=1),
                name="doc_access_otp_max_attempts_gte_1",
            ),
        ]

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_active(self) -> bool:
        return (
            not self.is_expired
            and self.used_at is None
            and self.invalidated_at is None
            and self.attempts < self.max_attempts
        )

