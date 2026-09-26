import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("documents", "0004_document_open_count"),
    ]

    operations = [
        migrations.AddField(
            model_name="document",
            name="is_confidential",
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text=(
                    "Si activé, le fichier n’est plus accessible publiquement et "
                    "nécessite une autorisation temporaire."
                ),
                verbose_name="document confidentiel",
            ),
        ),
        migrations.CreateModel(
            name="DocumentAccessRequest",
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
                ("full_name", models.CharField(max_length=180, verbose_name="nom et prénoms")),
                ("email", models.EmailField(db_index=True, max_length=254, verbose_name="adresse e-mail")),
                ("phone", models.CharField(blank=True, max_length=40, verbose_name="téléphone")),
                (
                    "organization",
                    models.CharField(blank=True, max_length=180, verbose_name="organisation / qualité"),
                ),
                ("reason", models.TextField(verbose_name="motif de la demande")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "En attente"),
                            ("approved", "Autorisée"),
                            ("refused", "Refusée"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=20,
                        verbose_name="statut",
                    ),
                ),
                ("reviewed_at", models.DateTimeField(blank=True, null=True, verbose_name="examinée le")),
                ("refusal_reason", models.TextField(blank=True, verbose_name="motif du refus")),
                (
                    "document",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="access_requests",
                        to="documents.document",
                        verbose_name="document",
                    ),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="document_access_requests_reviewed",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="examinée par",
                    ),
                ),
            ],
            options={
                "verbose_name": "demande d’accès à un document",
                "verbose_name_plural": "demandes d’accès aux documents",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="DocumentAccessGrant",
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
                    "public_id",
                    models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name="référence publique"),
                ),
                ("recipient_name", models.CharField(max_length=180, verbose_name="destinataire")),
                ("recipient_email", models.EmailField(db_index=True, max_length=254, verbose_name="e-mail destinataire")),
                ("token_hash", models.CharField(db_index=True, max_length=64, unique=True, verbose_name="hash du lien")),
                ("expires_at", models.DateTimeField(db_index=True, verbose_name="expiration")),
                ("max_opens", models.PositiveIntegerField(default=5, verbose_name="ouvertures maximales")),
                ("open_count", models.PositiveIntegerField(default=0, verbose_name="ouvertures")),
                ("last_opened_at", models.DateTimeField(blank=True, null=True, verbose_name="dernière ouverture")),
                ("last_verified_at", models.DateTimeField(blank=True, null=True, verbose_name="dernière vérification")),
                ("revoked_at", models.DateTimeField(blank=True, null=True, verbose_name="révoquée le")),
                ("link_sent_at", models.DateTimeField(blank=True, null=True, verbose_name="lien envoyé le")),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="document_access_grants_created",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="créée par",
                    ),
                ),
                (
                    "document",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="access_grants",
                        to="documents.document",
                        verbose_name="document",
                    ),
                ),
                (
                    "request",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="grant",
                        to="documents.documentaccessrequest",
                        verbose_name="demande",
                    ),
                ),
                (
                    "revoked_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="document_access_grants_revoked",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="révoquée par",
                    ),
                ),
            ],
            options={
                "verbose_name": "autorisation d’accès à un document",
                "verbose_name_plural": "autorisations d’accès aux documents",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="DocumentAccessOTP",
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
                ("code_hash", models.CharField(max_length=255, verbose_name="hash du code")),
                ("expires_at", models.DateTimeField(db_index=True, verbose_name="expiration")),
                ("attempts", models.PositiveSmallIntegerField(default=0, verbose_name="tentatives")),
                ("max_attempts", models.PositiveSmallIntegerField(default=5, verbose_name="tentatives maximales")),
                ("resend_available_at", models.DateTimeField(verbose_name="renvoi autorisé à partir de")),
                ("used_at", models.DateTimeField(blank=True, null=True, verbose_name="utilisé le")),
                ("invalidated_at", models.DateTimeField(blank=True, null=True, verbose_name="invalidé le")),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True, verbose_name="adresse IP")),
                ("user_agent", models.TextField(blank=True, verbose_name="user-agent")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="créé le")),
                (
                    "grant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="otps",
                        to="documents.documentaccessgrant",
                        verbose_name="autorisation",
                    ),
                ),
            ],
            options={
                "verbose_name": "OTP d’accès à un document",
                "verbose_name_plural": "OTP d’accès aux documents",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="documentaccessrequest",
            index=models.Index(fields=["status", "-created_at"], name="doc_access_req_status_idx"),
        ),
        migrations.AddIndex(
            model_name="documentaccessrequest",
            index=models.Index(fields=["document", "email"], name="doc_access_req_doc_mail_idx"),
        ),
        migrations.AddIndex(
            model_name="documentaccessgrant",
            index=models.Index(fields=["document", "expires_at"], name="doc_access_grant_exp_idx"),
        ),
        migrations.AddConstraint(
            model_name="documentaccessgrant",
            constraint=models.CheckConstraint(
                condition=models.Q(("max_opens__gte", 1)),
                name="doc_access_grant_max_opens_gte_1",
            ),
        ),
        migrations.AddIndex(
            model_name="documentaccessotp",
            index=models.Index(fields=["grant", "-created_at"], name="doc_access_otp_grant_idx"),
        ),
        migrations.AddConstraint(
            model_name="documentaccessotp",
            constraint=models.CheckConstraint(
                condition=models.Q(("max_attempts__gte", 1)),
                name="doc_access_otp_max_attempts_gte_1",
            ),
        ),
    ]
