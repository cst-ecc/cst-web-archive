from django.db import migrations, models

import apps.news.models


class Migration(migrations.Migration):

    dependencies = [
        ("news", "0002_seed_news_categories"),
    ]

    operations = [
        migrations.AddField(
            model_name="news",
            name="home_slot",
            field=models.CharField(
                blank=True,
                choices=[
                    ("alert_info", "Alerte Info"),
                    ("upcoming_event", "Événement à venir"),
                ],
                db_index=True,
                default="",
                help_text=(
                    "Laissez vide pour une actualité classique. "
                    "Choisissez Alerte Info ou Événement à venir pour "
                    "l’affichage spécial sur l’accueil."
                ),
                max_length=30,
                verbose_name="emplacement spécial sur l’accueil",
            ),
        ),
        migrations.AddField(
            model_name="news",
            name="event_date",
            field=models.DateField(
                blank=True,
                db_index=True,
                help_text="À renseigner uniquement pour un événement à venir.",
                null=True,
                verbose_name="date de l’événement",
            ),
        ),
        migrations.AddField(
            model_name="news",
            name="attachment",
            field=models.FileField(
                blank=True,
                help_text="PDF, JPG, PNG ou WEBP.",
                max_length=500,
                upload_to=apps.news.models.news_attachment_upload_to,
                verbose_name="pièce jointe",
            ),
        ),
        migrations.AddField(
            model_name="news",
            name="attachment_label",
            field=models.CharField(
                blank=True,
                help_text="Ex. Communiqué officiel, Flyer de l’événement…",
                max_length=220,
                verbose_name="libellé de la pièce jointe",
            ),
        ),
        migrations.AddIndex(
            model_name="news",
            index=models.Index(
                fields=["status", "home_slot", "event_date"],
                name="news_home_slot_idx",
            ),
        ),
    ]
