from __future__ import annotations

import uuid
from pathlib import Path

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from apps.core.models import TimeStampedModel
from apps.core.publication import OrganScope, PublicationStatus


def news_image_upload_to(instance, filename: str) -> str:
    """
    Nom de fichier non prédictible et sans dépendance au nom fourni par le client.
    Le chemin reste organisé par année/mois pour faciliter l'exploitation.
    """
    suffix = Path(filename).suffix.lower()
    if suffix == ".jpeg":
        suffix = ".jpg"
    if suffix not in {".jpg", ".png", ".webp"}:
        suffix = ".jpg"

    token = uuid.uuid4().hex
    dated_folder = timezone.now().strftime("news/%Y/%m")
    return f"{dated_folder}/{token}{suffix}"


class NewsCategory(TimeStampedModel):
    name = models.CharField("nom", max_length=120, unique=True)
    slug = models.SlugField("slug", max_length=140, unique=True)
    description = models.TextField("description", blank=True)
    order = models.PositiveIntegerField("ordre", default=0)
    is_active = models.BooleanField("active", default=True)

    class Meta:
        verbose_name = "catégorie d’actualité"
        verbose_name_plural = "catégories d’actualités"
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return self.name


class News(TimeStampedModel):
    title = models.CharField("titre", max_length=220)
    slug = models.SlugField("slug", max_length=240, unique=True, blank=True)

    category = models.ForeignKey(
        NewsCategory,
        verbose_name="catégorie",
        related_name="news_items",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    organ = models.CharField(
        "organe",
        max_length=20,
        choices=OrganScope.choices,
        default=OrganScope.CST_CSMO,
        db_index=True,
    )

    excerpt = models.TextField("résumé", max_length=700)
    content = models.TextField("contenu")

    featured_image = models.ImageField(
        "image de couverture",
        upload_to=news_image_upload_to,
        blank=True,
    )
    image_alt = models.CharField(
        "texte alternatif de l’image",
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

    publication_date = models.DateField(
        "date de publication",
        null=True,
        blank=True,
        db_index=True,
    )
    submitted_at = models.DateTimeField("soumis le", null=True, blank=True)
    published_at = models.DateTimeField("publié le", null=True, blank=True)
    archived_at = models.DateTimeField("archivé le", null=True, blank=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="auteur",
        related_name="news_created",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    last_editor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="dernière modification par",
        related_name="news_last_edited",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="soumis par",
        related_name="news_submitted",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="publié par",
        related_name="news_published",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    archived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="archivé par",
        related_name="news_archived",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    seo_title = models.CharField("titre SEO", max_length=220, blank=True)
    seo_description = models.CharField(
        "description SEO",
        max_length=320,
        blank=True,
    )

    class Meta:
        verbose_name = "actualité"
        verbose_name_plural = "actualités"
        ordering = ["-publication_date", "-published_at", "-created_at"]
        indexes = [
            models.Index(
                fields=["status", "-publication_date"],
                name="news_status_pubdate_idx",
            ),
            models.Index(
                fields=["status", "featured", "display_order"],
                name="news_status_feature_idx",
            ),
        ]
        permissions = [
            ("submit_news", "Peut soumettre une actualité à validation"),
            ("review_news", "Peut examiner une actualité en attente"),
            ("publish_news", "Peut publier une actualité"),
            ("archive_news", "Peut archiver/restaurer une actualité"),
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:210] or "actualite"
            candidate = base
            if News.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base[:200]}-{uuid.uuid4().hex[:8]}"
            self.slug = candidate

        if not self.image_alt and self.title:
            self.image_alt = self.title

        super().save(*args, **kwargs)
