from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("documents", "0006_disable_confidential_document_access"),
    ]

    operations = [
        migrations.DeleteModel(
            name="DocumentAccessOTP",
        ),
        migrations.DeleteModel(
            name="DocumentAccessGrant",
        ),
        migrations.DeleteModel(
            name="DocumentAccessRequest",
        ),
        migrations.RemoveField(
            model_name="document",
            name="is_confidential",
        ),
    ]
