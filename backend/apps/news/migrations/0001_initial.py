import apps.news.models
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
            name="NewsCategory",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True),
                ),
                (
                    "name",
                    models.CharField(
                        max_length=120,
                        unique=True,
                        verbose_name="nom",
                    ),
                ),
                (
                    "slug",
                    models.SlugField(
                        max_length=140,
                        unique=True,
                        verbose_name="slug",
                    ),
                ),
                (
                    "description",
                    models.TextField(
                        blank=True,
                        verbose_name="description",
                    ),
                ),
                (
                    "order",
                    models.PositiveIntegerField(
                        default=0,
                        verbose_name="ordre",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        verbose_name="active",
                    ),
                ),
            ],
            options={
                "verbose_name": "catégorie d’actualité",
                "verbose_name_plural": "catégories d’actualités",
                "ordering": ["order", "name"],
            },
        ),
        migrations.CreateModel(
            name="News",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "title",
                    models.CharField(max_length=220, verbose_name="titre"),
                ),
                (
                    "slug",
                    models.SlugField(
                        blank=True,
                        max_length=240,
                        unique=True,
                        verbose_name="slug",
                    ),
                ),
                (
                    "organ",
                    models.CharField(
                        choices=[
                            ("cst", "CST"),
                            ("csmo", "CSMO"),
                            ("cst_csmo", "CST / CSMO"),
                            ("general", "Général"),
                        ],
                        db_index=True,
                        default="cst_csmo",
                        max_length=20,
                        verbose_name="organe",
                    ),
                ),
                (
                    "excerpt",
                    models.TextField(
                        max_length=700,
                        verbose_name="résumé",
                    ),
                ),
                (
                    "content",
                    models.TextField(verbose_name="contenu"),
                ),
                (
                    "featured_image",
                    models.ImageField(
                        blank=True,
                        upload_to=apps.news.models.news_image_upload_to,
                        verbose_name="image de couverture",
                    ),
                ),
                (
                    "image_alt",
                    models.CharField(
                        blank=True,
                        max_length=220,
                        verbose_name="texte alternatif de l’image",
                    ),
                ),
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
                (
                    "featured",
                    models.BooleanField(
                        db_index=True,
                        default=False,
                        verbose_name="mise en avant",
                    ),
                ),
                (
                    "display_order",
                    models.PositiveIntegerField(
                        default=0,
                        verbose_name="ordre d’affichage",
                    ),
                ),
                (
                    "publication_date",
                    models.DateField(
                        blank=True,
                        db_index=True,
                        null=True,
                        verbose_name="date de publication",
                    ),
                ),
                (
                    "submitted_at",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                        verbose_name="soumis le",
                    ),
                ),
                (
                    "published_at",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                        verbose_name="publié le",
                    ),
                ),
                (
                    "archived_at",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                        verbose_name="archivé le",
                    ),
                ),
                (
                    "seo_title",
                    models.CharField(
                        blank=True,
                        max_length=220,
                        verbose_name="titre SEO",
                    ),
                ),
                (
                    "seo_description",
                    models.CharField(
                        blank=True,
                        max_length=320,
                        verbose_name="description SEO",
                    ),
                ),
                (
                    "archived_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="news_archived",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="archivé par",
                    ),
                ),
                (
                    "author",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="news_created",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="auteur",
                    ),
                ),
                (
                    "category",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="news_items",
                        to="news.newscategory",
                        verbose_name="catégorie",
                    ),
                ),
                (
                    "last_editor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="news_last_edited",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="dernière modification par",
                    ),
                ),
                (
                    "published_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="news_published",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="publié par",
                    ),
                ),
                (
                    "submitted_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="news_submitted",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="soumis par",
                    ),
                ),
            ],
            options={
                "verbose_name": "actualité",
                "verbose_name_plural": "actualités",
                "ordering": [
                    "-publication_date",
                    "-published_at",
                    "-created_at",
                ],
                "permissions": [
                    (
                        "submit_news",
                        "Peut soumettre une actualité à validation",
                    ),
                    (
                        "review_news",
                        "Peut examiner une actualité en attente",
                    ),
                    ("publish_news", "Peut publier une actualité"),
                    (
                        "archive_news",
                        "Peut archiver/restaurer une actualité",
                    ),
                ],
            },
        ),
        migrations.AddIndex(
            model_name="news",
            index=models.Index(
                fields=["status", "-publication_date"],
                name="news_status_pubdate_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="news",
            index=models.Index(
                fields=["status", "featured", "display_order"],
                name="news_status_feature_idx",
            ),
        ),
    ]
