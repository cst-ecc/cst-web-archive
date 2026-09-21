from django.db import migrations, models


KNOWN_DOCUMENT_LINKS = {
    # Associations déjà présentes dans le jeu de données actuel du frontend.
    # La migration ne les applique que si l'article et les documents existent
    # réellement dans la base.
    "installation-cst": ("acte-installation-cst",),
    "9e-session": ("pv-9e-session", "rapport-final-cst"),
    "remise-rapport-final": (
        "rapport-final-cst",
        "communique-remise-rapport",
    ),
    "installation-csmo": ("acte-creation-csmo",),
}

KNOWN_SESSION_METADATA = {
    "installation-cst": {
        "number": 0,
        "theme": "Mise en place du Conseil",
        "location": "Cotonou",
        "start": "2025-04-26",
        "end": "2025-04-26",
    },
    "5e-session": {
        "number": 5,
        "theme": "Réunification et orientations institutionnelles",
        "location": "Cotonou",
        "start": "2025-10-28",
        "end": "2025-10-31",
    },
    "6e-session": {
        "number": 6,
        "theme": "Textes fondamentaux et consensus",
        "location": "Cotonou",
        "start": "2025-11-24",
        "end": "2025-11-29",
    },
    "7e-session": {
        "number": 7,
        "theme": "Gouvernance et consolidation des textes",
        "location": "Cotonou",
        "start": "2026-01-08",
        "end": "2026-01-10",
    },
    "8e-session": {
        "number": 8,
        "theme": "Organes et déploiement diocésain",
        "location": "Cotonou",
        "start": "2026-02-24",
        "end": "2026-02-26",
    },
    "9e-session": {
        "number": 9,
        "theme": "Finalisation et rapport final",
        "location": "Cotonou",
        "start": "2026-04-16",
        "end": "2026-04-17",
    },
}


def migrate_known_links(apps, schema_editor):
    """
    Migration progressive uniquement.

    Elle n'invente aucun contenu et ne crée aucun article : elle complète
    seulement les enregistrements qui existent déjà avec les slugs connus du
    jeu de données actuel du projet. Si un article/document n'existe pas dans
    la base, la migration l'ignore silencieusement.
    """
    News = apps.get_model("news", "News")
    NewsCategory = apps.get_model("news", "NewsCategory")
    Document = apps.get_model("documents", "Document")

    for news_slug, document_slugs in KNOWN_DOCUMENT_LINKS.items():
        news = News.objects.filter(slug=news_slug).first()
        if not news:
            continue
        documents = Document.objects.filter(slug__in=document_slugs)
        if documents.exists():
            news.documents.add(*documents)

    session_category = NewsCategory.objects.filter(slug="sessions").first()
    for news_slug, values in KNOWN_SESSION_METADATA.items():
        news = News.objects.filter(slug=news_slug).first()
        if not news:
            continue

        update_fields = []
        if session_category and not news.category_id:
            news.category_id = session_category.pk
            update_fields.append("category")
        if news.session_number is None:
            news.session_number = values["number"]
            update_fields.append("session_number")
        if not news.session_theme:
            news.session_theme = values["theme"]
            update_fields.append("session_theme")
        if not news.session_location:
            news.session_location = values["location"]
            update_fields.append("session_location")
        if news.session_start_date is None:
            news.session_start_date = values["start"]
            update_fields.append("session_start_date")
        if news.session_end_date is None:
            news.session_end_date = values["end"]
            update_fields.append("session_end_date")

        if update_fields:
            news.save(update_fields=update_fields)



def normalize_published_featured(apps, schema_editor):
    News = apps.get_model("news", "News")

    # Alerte Info / Événement à venir ont leurs propres emplacements sur la Home.
    News.objects.exclude(home_slot="").filter(featured=True).update(featured=False)

    published_featured = list(
        News.objects.filter(status="publie", featured=True, home_slot="").order_by(
            "-publication_date",
            "-published_at",
            "-created_at",
        )
    )
    if len(published_featured) <= 1:
        return

    keep = published_featured[0]
    News.objects.filter(
        status="publie",
        featured=True,
    ).exclude(pk=keep.pk).update(featured=False)

def noop_reverse(apps, schema_editor):
    # Les associations ajoutées sont conservées en cas de rollback logique :
    # les supprimer pourrait effacer des associations créées manuellement
    # après la migration. La suppression des colonnes/table M2M est gérée par
    # le rollback de schéma lui-même.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("documents", "0004_document_open_count"),
        ("news", "0003_news_home_special_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="news",
            name="documents",
            field=models.ManyToManyField(
                blank=True,
                help_text=(
                    "Documents officiels liés à cet article : rapport, "
                    "procès-verbal, communiqué, décision, etc."
                ),
                related_name="news_items",
                to="documents.document",
                verbose_name="documents associés",
            ),
        ),
        migrations.AddField(
            model_name="news",
            name="session_number",
            field=models.PositiveIntegerField(
                blank=True,
                null=True,
                verbose_name="numéro de session",
            ),
        ),
        migrations.AddField(
            model_name="news",
            name="session_theme",
            field=models.CharField(
                blank=True,
                max_length=260,
                verbose_name="thème de la session",
            ),
        ),
        migrations.AddField(
            model_name="news",
            name="session_location",
            field=models.CharField(
                blank=True,
                max_length=180,
                verbose_name="lieu de la session",
            ),
        ),
        migrations.AddField(
            model_name="news",
            name="session_start_date",
            field=models.DateField(
                blank=True,
                db_index=True,
                null=True,
                verbose_name="début de la session",
            ),
        ),
        migrations.AddField(
            model_name="news",
            name="session_end_date",
            field=models.DateField(
                blank=True,
                null=True,
                verbose_name="fin de la session",
            ),
        ),
        migrations.RunPython(migrate_known_links, reverse_code=noop_reverse),
        migrations.RunPython(
            normalize_published_featured,
            reverse_code=noop_reverse,
        ),
    ]
