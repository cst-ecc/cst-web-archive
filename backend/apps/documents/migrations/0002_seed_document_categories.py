from django.db import migrations


DEFAULT_CATEGORIES = [
    ("decisions", "Décisions", 10),
    ("rapports", "Rapports", 20),
    ("pv", "Procès-verbaux", 30),
    ("communiques", "Communiqués", 40),
    ("textes", "Textes consolidés", 50),
    ("vulgarisation", "Vulgarisation", 60),
]


def seed_categories(apps, schema_editor):
    DocumentCategory = apps.get_model("documents", "DocumentCategory")

    for slug, name, order in DEFAULT_CATEGORIES:
        DocumentCategory.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "order": order,
                "is_active": True,
            },
        )


def unseed_categories(apps, schema_editor):
    DocumentCategory = apps.get_model("documents", "DocumentCategory")
    DocumentCategory.objects.filter(
        slug__in=[slug for slug, _name, _order in DEFAULT_CATEGORIES]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("documents", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_categories, unseed_categories),
    ]
