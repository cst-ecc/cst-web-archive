import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models
from django.utils import timezone


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="ContactCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True, verbose_name="nom")),
                ("slug", models.SlugField(max_length=140, unique=True, verbose_name="slug")),
                ("is_active", models.BooleanField(default=True, verbose_name="active")),
                ("order", models.PositiveIntegerField(default=0, verbose_name="ordre")),
            ],
            options={"verbose_name":"catégorie de contact","verbose_name_plural":"catégories de contact","ordering":["order","name"]},
        ),
        migrations.CreateModel(
            name="NewsletterCampaign",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=220)), ("subject", models.CharField(max_length=220)),
                ("content", models.TextField(max_length=30000)),
                ("status", models.CharField(choices=[("brouillon","Brouillon"),("programmee","Programmée"),("en_cours","En cours"),("envoyee","Envoyée"),("annulee","Annulée")], db_index=True, default="brouillon", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
                ("sent_at", models.DateTimeField(blank=True, null=True)), ("recipient_count", models.PositiveIntegerField(default=0)), ("success_count", models.PositiveIntegerField(default=0)), ("failure_count", models.PositiveIntegerField(default=0)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="newsletter_campaigns", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering":["-created_at"],"permissions":[("manage_newslettercampaign","Gérer les campagnes newsletter"),("send_newslettercampaign","Envoyer les campagnes newsletter")]},
        ),
        migrations.CreateModel(
            name="NewsletterSubscriber",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(max_length=254, unique=True)), ("name", models.CharField(blank=True, max_length=160)),
                ("status", models.CharField(choices=[("en_attente","En attente"),("actif","Actif"),("desabonne","Désabonné"),("bloque","Bloqué")], db_index=True, default="en_attente", max_length=20)),
                ("source", models.CharField(default="site_public", max_length=80)),
                ("confirmation_token", models.CharField(editable=False, max_length=64, unique=True)), ("unsubscribe_token", models.CharField(editable=False, max_length=64, unique=True)),
                ("subscribed_at", models.DateTimeField(auto_now_add=True)), ("confirmed_at", models.DateTimeField(blank=True, null=True)), ("unsubscribed_at", models.DateTimeField(blank=True, null=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering":["-subscribed_at"],"permissions":[("manage_newslettersubscriber","Gérer les abonnés newsletter")]},
        ),
        migrations.CreateModel(
            name="Conversation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("public_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)), ("visitor_token", models.CharField(db_index=True, editable=False, max_length=64, unique=True)),
                ("visitor_name", models.CharField(blank=True, max_length=160, verbose_name="nom visiteur")), ("visitor_email", models.EmailField(blank=True, max_length=254, verbose_name="e-mail visiteur")),
                ("status", models.CharField(choices=[("en_attente","En attente"),("en_cours","En cours"),("fermee","Fermée"),("archivee","Archivée")], db_index=True, default="en_attente", max_length=20, verbose_name="statut")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)), ("updated_at", models.DateTimeField(auto_now=True)), ("last_activity_at", models.DateTimeField(db_index=True, default=timezone.now)), ("closed_at", models.DateTimeField(blank=True, null=True)),
                ("assigned_to", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assigned_conversations", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering":["-last_activity_at"],"permissions":[("manage_conversation","Administrer les conversations"),("reply_conversation","Répondre aux conversations")]},
        ),
        migrations.CreateModel(
            name="ContactRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("first_name", models.CharField(blank=True, max_length=120, verbose_name="prénoms")), ("last_name", models.CharField(max_length=120, verbose_name="nom")), ("email", models.EmailField(max_length=254, verbose_name="e-mail")),
                ("phone", models.CharField(blank=True, max_length=40, verbose_name="téléphone")), ("subject", models.CharField(max_length=220, verbose_name="objet")), ("message", models.TextField(max_length=5000, verbose_name="message")),
                ("status", models.CharField(choices=[("nouveau","Nouveau"),("lu","Lu"),("en_cours","En cours"),("traite","Traité"),("ferme","Fermé"),("spam","Spam")], db_index=True, default="nouveau", max_length=20, verbose_name="statut")),
                ("consent_acknowledged", models.BooleanField(default=False, verbose_name="information traitement acceptée")), ("internal_note", models.TextField(blank=True, verbose_name="note interne")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="créée le")), ("updated_at", models.DateTimeField(auto_now=True, verbose_name="modifiée le")), ("read_at", models.DateTimeField(blank=True, null=True, verbose_name="lue le")), ("closed_at", models.DateTimeField(blank=True, null=True, verbose_name="fermée le")),
                ("assigned_to", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assigned_contact_requests", to=settings.AUTH_USER_MODEL)),
                ("category", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="requests", to="communication.contactcategory")),
            ],
            options={"ordering":["-created_at"],"permissions":[("manage_contactrequest","Gérer les demandes de contact"),("reply_contactrequest","Répondre aux demandes de contact")]},
        ),
        migrations.CreateModel(
            name="ChatMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sender_type", models.CharField(choices=[("visiteur","Visiteur"),("membre","Membre"),("systeme","Système")], max_length=20)), ("content", models.TextField(max_length=3000)), ("is_read", models.BooleanField(db_index=True, default=False)), ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("conversation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="communication.conversation")), ("sender_user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="chat_messages", to=settings.AUTH_USER_MODEL)),
            ], options={"ordering":["created_at"]},
        ),
    ]
