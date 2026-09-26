from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("audit", "0002_alter_auditlog_action"),
    ]

    operations = [
        migrations.AlterField(
            model_name="auditlog",
            name="action",
            field=models.CharField(
                choices=[
                    ("login_success", "Connexion réussie"),
                    ("login_failed", "Échec de connexion"),
                    ("logout", "Déconnexion"),
                    ("otp_requested", "OTP demandé"),
                    ("otp_success", "OTP validé"),
                    ("otp_failed", "Échec OTP"),
                    ("user_created", "Utilisateur créé"),
                    ("user_updated", "Utilisateur modifié"),
                    ("role_changed", "Rôle modifié"),
                    ("permission_changed", "Permission modifiée"),
                    ("content_created", "Contenu créé"),
                    ("content_updated", "Contenu modifié"),
                    ("content_published", "Contenu publié"),
                    ("content_archived", "Contenu archivé"),
                    ("content_deleted", "Contenu supprimé"),
                    ("media_uploaded", "Média téléversé"),
                    ("media_deleted", "Média supprimé"),
                    ("document_opened", "Document ouvert"),
                    ("document_access_requested", "Accès document demandé"),
                    ("document_access_approved", "Accès document autorisé"),
                    ("document_access_refused", "Accès document refusé"),
                    ("document_access_revoked", "Accès document révoqué"),
                    ("document_access_link_renewed", "Lien d’accès régénéré"),
                    ("document_access_otp_requested", "OTP document demandé"),
                    ("document_access_otp_failed", "Échec OTP document"),
                    ("document_access_verified", "Accès document vérifié"),
                    ("document_secure_opened", "Document confidentiel ouvert"),
                ],
                db_index=True,
                max_length=64,
                verbose_name="action",
            ),
        ),
    ]
