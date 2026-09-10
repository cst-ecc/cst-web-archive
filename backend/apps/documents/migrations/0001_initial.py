import apps.documents.models
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
            name="DocumentCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=120, unique=True, verbose_name="nom")),
                ("slug", models.SlugField(max_length=140, unique=True, verbose_name="slug")),
                ("order", models.PositiveIntegerField(default=0, verbose_name="ordre")),
                ("is_active", models.BooleanField(default=True, verbose_name="actif")),
            ],
            options={
                "verbose_name": "catégorie document",
                "verbose_name_plural": "catégories document",
                "ordering": ["order", "name"],
            },
        ),
        migrations.CreateModel(
            name="Document",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=240, verbose_name="titre")),
                ("slug", models.SlugField(blank=True, max_length=260, unique=True, verbose_name="slug")),
                ("summary", models.TextField(verbose_name="résumé")),
                ("reference", models.CharField(blank=True, max_length=180, verbose_name="référence")),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("decision", "Décision"),
                            ("rapport", "Rapport"),
                            ("proces_verbal", "Procès-verbal"),
                            ("communique", "Communiqué"),
                            ("texte_consolide", "Texte consolidé"),
                            ("vulgarisation", "Vulgarisation"),
                            ("autre", "Autre"),
                        ],
                        db_index=True,
                        default="autre",
                        max_length=40,
                        verbose_name="type de document",
                    ),
                ),
                ("date", models.DateField(db_index=True, verbose_name="date du document")),
                ("file", models.FileField(upload_to=apps.documents.models.document_file_upload_to, verbose_name="fichier")),
                ("original_filename", models.CharField(blank=True, max_length=255, verbose_name="nom original")),
                ("file_size", models.BigIntegerField(default=0, verbose_name="taille fichier")),
                ("mime_type", models.CharField(blank=True, max_length=120, verbose_name="type MIME")),
                ("pages", models.PositiveIntegerField(blank=True, null=True, verbose_name="nombre de pages")),
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
                ("downloads", models.PositiveIntegerField(default=0, verbose_name="téléchargements")),
                ("submitted_at", models.DateTimeField(blank=True, null=True, verbose_name="soumis le")),
                ("published_at", models.DateTimeField(blank=True, null=True, verbose_name="publié le")),
                ("archived_at", models.DateTimeField(blank=True, null=True, verbose_name="archivé le")),
                (
                    "archived_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="documents_archived", to=settings.AUTH_USER_MODEL, verbose_name="archivé par"),
                ),
                (
                    "author",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="documents_created", to=settings.AUTH_USER_MODEL, verbose_name="auteur"),
                ),
                (
                    "category",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="documents", to="documents.documentcategory", verbose_name="catégorie"),
                ),
                (
                    "last_editor",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="documents_last_edited", to=settings.AUTH_USER_MODEL, verbose_name="dernière modification par"),
                ),
                (
                    "published_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="documents_published", to=settings.AUTH_USER_MODEL, verbose_name="publié par"),
                ),
                (
                    "submitted_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="documents_submitted", to=settings.AUTH_USER_MODEL, verbose_name="soumis par"),
                ),
            ],
            options={
                "verbose_name": "document",
                "verbose_name_plural": "documents",
                "ordering": ["-date", "display_order", "-created_at"],
                "permissions": [
                    ("submit_document", "Peut soumettre un document à validation"),
                    ("review_document", "Peut examiner un document en attente"),
                    ("publish_document", "Peut publier un document"),
                    ("archive_document", "Peut archiver/restaurer un document"),
                ],
            },
        ),
        migrations.AddIndex(
            model_name="document",
            index=models.Index(fields=["status", "-date"], name="doc_status_date_idx"),
        ),
        migrations.AddIndex(
            model_name="document",
            index=models.Index(fields=["status", "featured", "display_order"], name="doc_feature_idx"),
        ),
        migrations.AddIndex(
            model_name="document",
            index=models.Index(fields=["kind", "status"], name="doc_kind_status_idx"),
        ),
    ]
