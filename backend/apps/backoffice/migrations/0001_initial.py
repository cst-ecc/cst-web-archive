from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="LoginRateLimit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("scope", models.CharField(choices=[("identifier_ip", "Identifiant + IP"), ("ip", "Adresse IP")], max_length=32, verbose_name="portée")),
                ("key_hash", models.CharField(max_length=64, verbose_name="empreinte")),
                ("failures", models.PositiveIntegerField(default=0, verbose_name="échecs")),
                ("window_started_at", models.DateTimeField(verbose_name="début de fenêtre")),
                ("blocked_until", models.DateTimeField(blank=True, db_index=True, null=True, verbose_name="bloqué jusqu'au")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="mis à jour le")),
            ],
            options={"verbose_name": "limitation de connexion", "verbose_name_plural": "limitations de connexion"},
        ),
        migrations.AddConstraint(model_name="loginratelimit", constraint=models.UniqueConstraint(fields=("scope", "key_hash"), name="unique_backoffice_login_rate_key")),
        migrations.AddIndex(model_name="loginratelimit", index=models.Index(fields=["scope", "key_hash"], name="bo_rate_scope_key_idx")),
    ]
