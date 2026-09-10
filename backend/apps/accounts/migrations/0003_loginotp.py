from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_seed_backoffice_groups"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="LoginOTP",
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
                (
                    "purpose",
                    models.CharField(
                        choices=[("login", "Connexion au back-office")],
                        db_index=True,
                        default="login",
                        max_length=32,
                        verbose_name="usage",
                    ),
                ),
                (
                    "code_hash",
                    models.CharField(
                        max_length=255,
                        verbose_name="hash du code",
                    ),
                ),
                (
                    "expires_at",
                    models.DateTimeField(
                        db_index=True,
                        verbose_name="expiration",
                    ),
                ),
                (
                    "attempts",
                    models.PositiveSmallIntegerField(
                        default=0,
                        verbose_name="tentatives",
                    ),
                ),
                (
                    "max_attempts",
                    models.PositiveSmallIntegerField(
                        default=5,
                        verbose_name="tentatives maximales",
                    ),
                ),
                (
                    "resend_available_at",
                    models.DateTimeField(
                        verbose_name="renvoi autorisé à partir de",
                    ),
                ),
                (
                    "used_at",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                        verbose_name="utilisé le",
                    ),
                ),
                (
                    "invalidated_at",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                        verbose_name="invalidé le",
                    ),
                ),
                (
                    "ip_address",
                    models.GenericIPAddressField(
                        blank=True,
                        null=True,
                        verbose_name="adresse IP",
                    ),
                ),
                (
                    "user_agent",
                    models.TextField(
                        blank=True,
                        verbose_name="user-agent",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                        db_index=True,
                        verbose_name="créé le",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="login_otps",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="utilisateur",
                    ),
                ),
            ],
            options={
                "verbose_name": "OTP de connexion",
                "verbose_name_plural": "OTP de connexion",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="loginotp",
            index=models.Index(
                fields=["user", "purpose", "-created_at"],
                name="otp_user_purpose_created_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="loginotp",
            constraint=models.CheckConstraint(
                condition=models.Q(("max_attempts__gte", 1)),
                name="otp_max_attempts_gte_1",
            ),
        ),
    ]
