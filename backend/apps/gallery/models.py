from __future__ import annotations

import uuid
from pathlib import Path

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from apps.core.models import TimeStampedModel
from apps.core.publication import PublicationStatus


def _normalized_suffix(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".jpeg":
        return ".jpg"
    if suffix not in {".jpg", ".png", ".webp"}:
        return ".jpg"
    return suffix


def album_cover_upload_to(instance, filename: str) -> str:
    folder = timezone.now().strftime("gallery/covers/%Y/%m")
    return f"{folder}/{uuid.uuid4().hex}{_normalized_suffix(filename)}"


def gallery_image_upload_to(instance, filename: str) -> str:
    folder = timezone.now().strftime("gallery/images/%Y/%m")
    return f"{folder}/{uuid.uuid4().hex}{_normalized_suffix(filename)}"


class GalleryAlbum(TimeStampedModel):
    title = models.CharField("titre", max_length=220)
    slug = models.SlugField("slug", max_length=240, unique=True, blank=True)
    date = models.DateField("date", db_index=True)
    description = models.TextField("description", blank=True)

    cover_image = models.ImageField(
        "image de couverture",
        upload_to=album_cover_upload_to,
        blank=True,
    )
    cover_alt = models.CharField(
        "texte alternatif couverture",
        max_length=220,
        blank=True,
    )

    status = models.CharField(
        "statut",
        max_length=20,
        choices=PublicationStatus.choices,
        default=PublicationStatus.DRAFT,
        db_index=True,
    )
    featured = models.BooleanField("mise en avant", default=False, db_index=True)
    display_order = models.PositiveIntegerField("ordre d’affichage", default=0)

    submitted_at = models.DateTimeField("soumis le", null=True, blank=True)
    published_at = models.DateTimeField("publié le", null=True, blank=True)
    archived_at = models.DateTimeField("archivé le", null=True, blank=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="auteur",
        related_name="gallery_albums_created",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    last_editor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="dernière modification par",
        related_name="gallery_albums_last_edited",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="soumis par",
        related_name="gallery_albums_submitted",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="publié par",
        related_name="gallery_albums_published",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    archived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="archivé par",
        related_name="gallery_albums_archived",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        verbose_name = "album galerie"
        verbose_name_plural = "albums galerie"
        ordering = ["-date", "display_order", "-created_at"]
        indexes = [
            models.Index(
                fields=["status", "-date"],
                name="gallery_album_status_date_idx",
            ),
            models.Index(
                fields=["status", "featured", "display_order"],
                name="gallery_album_feature_idx",
            ),
        ]
        permissions = [
            ("submit_galleryalbum", "Peut soumettre un album à validation"),
            ("review_galleryalbum", "Peut examiner un album en attente"),
            ("publish_galleryalbum", "Peut publier un album"),
            ("archive_galleryalbum", "Peut archiver/restaurer un album"),
        ]

    def __str__(self) -> str:
        return self.title

    @property
    def cover_url(self) -> str:
        if self.cover_image:
            return self.cover_image.url

        first_image = self.images.order_by("order", "created_at").first()
        if first_image and first_image.image:
            return first_image.image.url

        return ""

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:210] or "album"
            candidate = base
            if GalleryAlbum.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base[:200]}-{uuid.uuid4().hex[:8]}"
            self.slug = candidate

        if not self.cover_alt and self.title:
            self.cover_alt = self.title

        super().save(*args, **kwargs)


class GalleryImage(TimeStampedModel):
    album = models.ForeignKey(
        GalleryAlbum,
        verbose_name="album",
        related_name="images",
        on_delete=models.CASCADE,
    )
    title = models.CharField("titre", max_length=180, blank=True)
    image = models.ImageField("image", upload_to=gallery_image_upload_to)
    alt = models.CharField("texte alternatif", max_length=220, blank=True)
    order = models.PositiveIntegerField("ordre", default=0)

    width = models.PositiveIntegerField("largeur", default=0)
    height = models.PositiveIntegerField("hauteur", default=0)
    file_size = models.PositiveIntegerField("taille fichier", default=0)
    mime_type = models.CharField("type MIME", max_length=80, blank=True)
    original_filename = models.CharField("nom original", max_length=255, blank=True)

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="téléversé par",
        related_name="gallery_images_uploaded",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        verbose_name = "image galerie"
        verbose_name_plural = "images galerie"
        ordering = ["order", "created_at"]
        indexes = [
            models.Index(fields=["album", "order"], name="gallery_image_order_idx"),
        ]

    def __str__(self) -> str:
        return self.title or self.alt or f"Image #{self.pk}"

    def save(self, *args, **kwargs):
        if not self.alt:
            self.alt = self.title or self.album.title
        super().save(*args, **kwargs)


class GalleryUploadSession(TimeStampedModel):
    class Status(models.TextChoices):
        INITIATED = "initiated", "Initialisé"
        UPLOADING = "uploading", "Upload en cours"
        QUEUED = "queued", "En file d’attente"
        PROCESSING = "processing", "Traitement"
        COMPLETED = "completed", "Terminé"
        FAILED = "failed", "Échec"
        CANCELED = "canceled", "Annulé"

    upload_id = models.UUIDField(
        "identifiant upload",
        default=uuid.uuid4,
        unique=True,
        db_index=True,
        editable=False,
    )
    album = models.ForeignKey(
        GalleryAlbum,
        verbose_name="album",
        related_name="upload_sessions",
        on_delete=models.CASCADE,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="créé par",
        related_name="gallery_upload_sessions",
        on_delete=models.CASCADE,
    )

    original_filename = models.CharField("nom original", max_length=255)
    content_type = models.CharField("type MIME", max_length=80, blank=True)
    total_size = models.BigIntegerField("taille totale")
    chunk_size = models.PositiveIntegerField("taille chunk")
    total_chunks = models.PositiveIntegerField("nombre de chunks")
    received_size = models.BigIntegerField("taille reçue", default=0)
    received_chunk_indexes = models.JSONField(
        "chunks reçus",
        default=list,
        blank=True,
    )

    status = models.CharField(
        "statut",
        max_length=20,
        choices=Status.choices,
        default=Status.INITIATED,
        db_index=True,
    )
    image = models.ForeignKey(
        GalleryImage,
        verbose_name="image créée",
        related_name="upload_sessions",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    error_message = models.TextField("message d’erreur", blank=True)
    completed_at = models.DateTimeField("terminé le", null=True, blank=True)
    expires_at = models.DateTimeField("expire le", db_index=True)

    class Meta:
        verbose_name = "session d’upload galerie"
        verbose_name_plural = "sessions d’upload galerie"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["album", "status"], name="gallery_upload_album_status_idx"),
            models.Index(fields=["created_by", "status"], name="gallery_upload_user_status_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.original_filename} — {self.get_status_display()}"

    @property
    def received_chunks_count(self) -> int:
        return len(set(self.received_chunk_indexes or []))

    @property
    def progress_percent(self) -> int:
        if self.total_chunks <= 0:
            return 0
        return min(100, round((self.received_chunks_count / self.total_chunks) * 100))

    @property
    def is_complete(self) -> bool:
        return self.received_chunks_count >= self.total_chunks

    def mark_failed(self, message: str) -> None:
        self.status = self.Status.FAILED
        self.error_message = message[:2000]
        self.save(update_fields=["status", "error_message", "updated_at"])
