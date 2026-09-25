from django.db import migrations

CATEGORIES = [
    ("Information générale", "information-generale", 10),
    ("CST", "cst", 20),
    ("CSMo", "csmo", 30),
    ("Documents", "documents", 40),
    ("Médias / Presse", "medias-presse", 50),
    ("Problème technique", "probleme-technique", 60),
    ("Autre", "autre", 70),
]

def seed(apps, schema_editor):
    Model = apps.get_model("communication", "ContactCategory")
    for name, slug, order in CATEGORIES:
        Model.objects.update_or_create(slug=slug, defaults={"name":name,"order":order,"is_active":True})

def reverse(apps, schema_editor):
    Model = apps.get_model("communication", "ContactCategory")
    Model.objects.filter(slug__in=[x[1] for x in CATEGORIES]).delete()

class Migration(migrations.Migration):
    dependencies=[("communication","0001_initial")]
    operations=[migrations.RunPython(seed, reverse)]
