from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Contact",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=160, verbose_name="nom")),
                ("first_names", models.CharField(blank=True, max_length=160, verbose_name="prénoms")),
                ("email", models.EmailField(max_length=254, verbose_name="adresse e-mail")),
                ("phone", models.CharField(blank=True, max_length=40, verbose_name="téléphone")),
                ("subject", models.CharField(max_length=220, verbose_name="objet")),
                ("category", models.CharField(choices=[("general", "Information générale"), ("documents", "Documents et ressources"), ("communication", "Presse et communication"), ("contribution", "Contribution ou proposition"), ("other", "Autre demande")], db_index=True, default="general", max_length=32, verbose_name="catégorie")),
                ("message", models.TextField(max_length=5000, verbose_name="message")),
                ("status", models.CharField(choices=[("new", "Nouveau"), ("read", "Lu"), ("in_progress", "En cours"), ("processed", "Traité"), ("closed", "Fermé"), ("spam", "Spam")], db_index=True, default="new", max_length=24, verbose_name="statut")),
                ("read_at", models.DateTimeField(blank=True, null=True, verbose_name="lu le")),
                ("processed_at", models.DateTimeField(blank=True, null=True, verbose_name="traité le")),
                ("last_managed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="contacts_managed", to=settings.AUTH_USER_MODEL, verbose_name="dernière gestion par")),
            ],
            options={
                "verbose_name": "demande de contact",
                "verbose_name_plural": "demandes de contact",
                "ordering": ["-created_at"],
                "permissions": [("manage_contact", "Peut gérer le statut des demandes de contact"), ("reply_contact", "Peut répondre aux demandes de contact")],
            },
        ),
        migrations.CreateModel(
            name="ContactReply",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("subject", models.CharField(max_length=220, verbose_name="objet")),
                ("message", models.TextField(max_length=5000, verbose_name="message")),
                ("delivery_status", models.CharField(choices=[("pending", "En attente"), ("sent", "Envoyé"), ("failed", "Échec")], db_index=True, default="pending", max_length=16, verbose_name="statut d’envoi")),
                ("sent_at", models.DateTimeField(blank=True, null=True, verbose_name="envoyé le")),
                ("error_message", models.CharField(blank=True, max_length=500, verbose_name="erreur d’envoi")),
                ("author", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="contact_replies", to=settings.AUTH_USER_MODEL, verbose_name="auteur")),
                ("contact", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="replies", to="communication.contact", verbose_name="contact")),
            ],
            options={
                "verbose_name": "réponse à un contact",
                "verbose_name_plural": "réponses aux contacts",
                "ordering": ["created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="contact",
            index=models.Index(fields=["status", "-created_at"], name="contact_status_created_idx"),
        ),
        migrations.AddIndex(
            model_name="contact",
            index=models.Index(fields=["category", "-created_at"], name="contact_category_created_idx"),
        ),
    ]
