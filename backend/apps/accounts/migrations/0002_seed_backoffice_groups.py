from django.db import migrations

GROUPS = ("Manager", "Éditeur")


def create_backoffice_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    for name in GROUPS:
        Group.objects.get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.RunPython(create_backoffice_groups, reverse_code=migrations.RunPython.noop),
    ]
