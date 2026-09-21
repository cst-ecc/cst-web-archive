from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("documents", "0003_alter_document_file_max_length"),
    ]

    operations = [
        migrations.AddField(
            model_name="document",
            name="open_count",
            field=models.PositiveIntegerField(default=0, verbose_name="ouvertures"),
        ),
    ]
