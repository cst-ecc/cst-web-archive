from django.db import migrations
from django.utils import timezone


def disable_legacy_confidential_access(apps, schema_editor):
    Document = apps.get_model("documents", "Document")
    DocumentAccessRequest = apps.get_model("documents", "DocumentAccessRequest")
    DocumentAccessGrant = apps.get_model("documents", "DocumentAccessGrant")
    DocumentAccessOTP = apps.get_model("documents", "DocumentAccessOTP")

    now = timezone.now()

    Document.objects.filter(is_confidential=True).update(is_confidential=False)
    DocumentAccessGrant.objects.filter(revoked_at__isnull=True).update(
        revoked_at=now,
        updated_at=now,
    )
    DocumentAccessOTP.objects.filter(
        used_at__isnull=True,
        invalidated_at__isnull=True,
    ).update(invalidated_at=now)
    DocumentAccessRequest.objects.filter(status="pending").update(
        status="refused",
        reviewed_at=now,
        refusal_reason=(
            "Demande clôturée automatiquement : l’accès public aux documents a été rétabli."
        ),
        updated_at=now,
    )


class Migration(migrations.Migration):
    dependencies = [
        ("documents", "0005_confidential_document_access"),
    ]

    operations = [
        migrations.RunPython(
            disable_legacy_confidential_access,
            migrations.RunPython.noop,
        ),
    ]
