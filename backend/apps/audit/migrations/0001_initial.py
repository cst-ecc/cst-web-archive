from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(choices=[
                    ("login_success", "Connexion réussie"), ("login_failed", "Échec de connexion"),
                    ("logout", "Déconnexion"), ("otp_requested", "OTP demandé"),
                    ("otp_success", "OTP validé"), ("otp_failed", "Échec OTP"),
                    ("user_created", "Utilisateur créé"), ("user_updated", "Utilisateur modifié"),
                    ("role_changed", "Rôle modifié"), ("permission_changed", "Permission modifiée"),
                    ("content_created", "Contenu créé"), ("content_updated", "Contenu modifié"),
                    ("content_published", "Contenu publié"), ("content_archived", "Contenu archivé"),
                    ("content_deleted", "Contenu supprimé"), ("media_uploaded", "Média téléversé"),
                    ("media_deleted", "Média supprimé")], db_index=True, max_length=64, verbose_name="action")),
                ("target_type", models.CharField(blank=True, max_length=255, verbose_name="type de cible")),
                ("target_id", models.CharField(blank=True, max_length=128, verbose_name="identifiant de la cible")),
                ("description", models.TextField(blank=True, verbose_name="description")),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True, verbose_name="adresse IP")),
                ("user_agent", models.TextField(blank=True, verbose_name="user-agent")),
                ("metadata", models.JSONField(blank=True, default=dict, verbose_name="métadonnées")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="date")),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="audit_logs", to=settings.AUTH_USER_MODEL, verbose_name="utilisateur")),
            ],
            options={"verbose_name": "entrée du journal d’activité", "verbose_name_plural": "journal d’activité", "ordering": ["-created_at"]},
        ),
        migrations.AddIndex(model_name="auditlog", index=models.Index(fields=["actor", "-created_at"], name="audit_actor_created_idx")),
        migrations.AddIndex(model_name="auditlog", index=models.Index(fields=["action", "-created_at"], name="audit_action_created_idx")),
    ]
