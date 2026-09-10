from __future__ import annotations

import uuid
from pathlib import Path

from django.conf import settings
from django.db import models
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
        if not self.slug:
            base = slugify(self.title)[:230] or "document"
            candidate = base
            if Document.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base[:220]}-{uuid.uuid4().hex[:8]}"
            self.slug = candidate

        super().save(*args, **kwargs)
