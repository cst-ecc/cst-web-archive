import apps.gallery.models
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="GalleryAlbum",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=220, verbose_name="titre")),
                ("slug", models.SlugField(blank=True, max_length=240, unique=True, verbose_name="slug")),
                ("date", models.DateField(db_index=True, verbose_name="date")),
                ("description", models.TextField(blank=True, verbose_name="description")),
                ("cover_image", models.ImageField(blank=True, upload_to=apps.gallery.models.album_cover_upload_to, verbose_name="image de couverture")),
                ("cover_alt", models.CharField(blank=True, max_length=220, verbose_name="texte alternatif couverture")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("brouillon", "Brouillon"),
                            ("en_attente", "En attente de validation"),
                            ("publie", "Publié"),
                            ("archive", "Archivé"),
                        ],
                        db_index=True,
                        default="brouillon",
                        max_length=20,
                        verbose_name="statut",
                    ),
                ),
                ("featured", models.BooleanField(db_index=True, default=False, verbose_name="mise en avant")),
                ("display_order", models.PositiveIntegerField(default=0, verbose_name="ordre d’affichage")),
                ("submitted_at", models.DateTimeField(blank=True, null=True, verbose_name="soumis le")),
                ("published_at", models.DateTimeField(blank=True, null=True, verbose_name="publié le")),
                ("archived_at", models.DateTimeField(blank=True, null=True, verbose_name="archivé le")),
                (
                    "archived_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="gallery_albums_archived", to=settings.AUTH_USER_MODEL, verbose_name="archivé par"),
                ),
                (
                    "author",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="gallery_albums_created", to=settings.AUTH_USER_MODEL, verbose_name="auteur"),
                ),
                (
                    "last_editor",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="gallery_albums_last_edited", to=settings.AUTH_USER_MODEL, verbose_name="dernière modification par"),
                ),
                (
                    "published_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="gallery_albums_published", to=settings.AUTH_USER_MODEL, verbose_name="publié par"),
                ),
                (
                    "submitted_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="gallery_albums_submitted", to=settings.AUTH_USER_MODEL, verbose_name="soumis par"),
                ),
            ],
            options={
                "verbose_name": "album galerie",
                "verbose_name_plural": "albums galerie",
                "ordering": ["-date", "display_order", "-created_at"],
                "permissions": [
                    ("submit_galleryalbum", "Peut soumettre un album à validation"),
                    ("review_galleryalbum", "Peut examiner un album en attente"),
                    ("publish_galleryalbum", "Peut publier un album"),
                    ("archive_galleryalbum", "Peut archiver/restaurer un album"),
                ],
            },
        ),
        migrations.CreateModel(
            name="GalleryImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(blank=True, max_length=180, verbose_name="titre")),
                ("image", models.ImageField(upload_to=apps.gallery.models.gallery_image_upload_to, verbose_name="image")),
                ("alt", models.CharField(blank=True, max_length=220, verbose_name="texte alternatif")),
                ("order", models.PositiveIntegerField(default=0, verbose_name="ordre")),
                ("width", models.PositiveIntegerField(default=0, verbose_name="largeur")),
                ("height", models.PositiveIntegerField(default=0, verbose_name="hauteur")),
                ("file_size", models.PositiveIntegerField(default=0, verbose_name="taille fichier")),
                ("mime_type", models.CharField(blank=True, max_length=80, verbose_name="type MIME")),
                ("original_filename", models.CharField(blank=True, max_length=255, verbose_name="nom original")),
                ("album", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="images", to="gallery.galleryalbum", verbose_name="album")),
                (
                    "uploaded_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="gallery_images_uploaded", to=settings.AUTH_USER_MODEL, verbose_name="téléversé par"),
                ),
            ],
            options={
                "verbose_name": "image galerie",
                "verbose_name_plural": "images galerie",
                "ordering": ["order", "created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="galleryalbum",
            index=models.Index(fields=["status", "-date"], name="gallery_album_status_date_idx"),
        ),
        migrations.AddIndex(
            model_name="galleryalbum",
            index=models.Index(fields=["status", "featured", "display_order"], name="gallery_album_feature_idx"),
        ),
        migrations.AddIndex(
            model_name="galleryimage",
            index=models.Index(fields=["album", "order"], name="gallery_image_order_idx"),
        ),
    ]
