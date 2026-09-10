import apps.documents.models
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("documents", "0002_seed_document_categories"),
    ]

    operations = [
        migrations.AlterField(
            model_name="document",
            name="file",
            field=models.FileField(
                max_length=500,
                upload_to=apps.documents.models.document_file_upload_to,
                verbose_name="fichier",
            ),
        ),
    ]
