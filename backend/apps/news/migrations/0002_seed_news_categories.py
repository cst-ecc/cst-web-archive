from django.db import migrations


CATEGORIES = (
    ("communiques", "Communiqués", 10),
    ("missions", "Missions", 20),
    ("sessions", "Sessions", 30),
    ("rapports", "Rapports", 40),
    ("institutionnel", "Institutionnel", 50),
    ("csmo", "CSMO", 60),
)


def seed_categories(apps, schema_editor):
    NewsCategory = apps.get_model("news", "NewsCategory")
    for slug, name, order in CATEGORIES:
        NewsCategory.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "order": order,
                "is_active": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("news", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            seed_categories,
            reverse_code=migrations.RunPython.noop,
        )
    ]
