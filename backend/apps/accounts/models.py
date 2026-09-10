from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractUser):
    username = None
    email = models.EmailField("adresse e-mail", unique=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        verbose_name = "utilisateur"
        verbose_name_plural = "utilisateurs"
        ordering = ["email"]

    def __str__(self) -> str:
        return self.email


class OTPPurpose(models.TextChoices):
    LOGIN = "login", "Connexion au back-office"


class LoginOTP(models.Model):
    """
    OTP temporaire utilisé comme second facteur d'authentification.

    Le code en clair n'est jamais stocké. Seul un hash adaptatif Django
    (PBKDF2 par défaut) est conservé dans ``code_hash``.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="utilisateur",
        related_name="login_otps",
        on_delete=models.CASCADE,
    )
    purpose = models.CharField(
        "usage",
        max_length=32,
        choices=OTPPurpose.choices,
        default=OTPPurpose.LOGIN,
        db_index=True,
    )
    code_hash = models.CharField("hash du code", max_length=255)
    expires_at = models.DateTimeField("expiration", db_index=True)
    attempts = models.PositiveSmallIntegerField("tentatives", default=0)
    max_attempts = models.PositiveSmallIntegerField("tentatives maximales", default=5)
    resend_available_at = models.DateTimeField("renvoi autorisé à partir de")
    used_at = models.DateTimeField("utilisé le", null=True, blank=True)
    invalidated_at = models.DateTimeField("invalidé le", null=True, blank=True)
    ip_address = models.GenericIPAddressField("adresse IP", null=True, blank=True)
    user_agent = models.TextField("user-agent", blank=True)
    created_at = models.DateTimeField("créé le", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "OTP de connexion"
        verbose_name_plural = "OTP de connexion"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["user", "purpose", "-created_at"],
                name="otp_user_purpose_created_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(max_attempts__gte=1),
                name="otp_max_attempts_gte_1",
            ),
        ]

    def __str__(self) -> str:
        return f"OTP {self.get_purpose_display()} — {self.user.email}"

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_used(self) -> bool:
        return self.used_at is not None

    @property
    def is_invalidated(self) -> bool:
        return self.invalidated_at is not None

    @property
    def is_locked(self) -> bool:
        return self.attempts >= self.max_attempts

    @property
    def is_active(self) -> bool:
        return not (
            self.is_expired
            or self.is_used
            or self.is_invalidated
            or self.is_locked
        )

    def matches(self, raw_code: str) -> bool:
        """Compare le code fourni au hash sans exposer le code stocké."""
        return check_password(raw_code, self.code_hash)
