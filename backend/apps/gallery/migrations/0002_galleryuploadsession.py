import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("gallery", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="GalleryUploadSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "upload_id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        unique=True,
                        verbose_name="identifiant upload",
                    ),
                ),
                ("original_filename", models.CharField(max_length=255, verbose_name="nom original")),
                ("content_type", models.CharField(blank=True, max_length=80, verbose_name="type MIME")),
                ("total_size", models.BigIntegerField(verbose_name="taille totale")),
                ("chunk_size", models.PositiveIntegerField(verbose_name="taille chunk")),
                ("total_chunks", models.PositiveIntegerField(verbose_name="nombre de chunks")),
                ("received_size", models.BigIntegerField(default=0, verbose_name="taille reçue")),
                ("received_chunk_indexes", models.JSONField(blank=True, default=list, verbose_name="chunks reçus")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("initiated", "Initialisé"),
                            ("uploading", "Upload en cours"),
                            ("queued", "En file d’attente"),
                            ("processing", "Traitement"),
                            ("completed", "Terminé"),
                            ("failed", "Échec"),
                            ("canceled", "Annulé"),
                        ],
                        db_index=True,
                        default="initiated",
                        max_length=20,
                        verbose_name="statut",
                    ),
                ),
                ("error_message", models.TextField(blank=True, verbose_name="message d’erreur")),
                ("completed_at", models.DateTimeField(blank=True, null=True, verbose_name="terminé le")),
                ("expires_at", models.DateTimeField(db_index=True, verbose_name="expire le")),
                (
                    "album",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="upload_sessions",
                        to="gallery.galleryalbum",
                        verbose_name="album",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gallery_upload_sessions",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="créé par",
                    ),
                ),
                (
                    "image",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="upload_sessions",
                        to="gallery.galleryimage",
                        verbose_name="image créée",
                    ),
                ),
            ],
            options={
                "verbose_name": "session d’upload galerie",
                "verbose_name_plural": "sessions d’upload galerie",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="galleryuploadsession",
            index=models.Index(fields=["album", "status"], name="gallery_upload_album_status_idx"),
        ),
        migrations.AddIndex(
            model_name="galleryuploadsession",
            index=models.Index(fields=["created_by", "status"], name="gallery_upload_user_status_idx"),
        ),
    ]
