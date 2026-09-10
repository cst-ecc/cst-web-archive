from django.db import models


class LoginRateLimit(models.Model):
    """État PostgreSQL de limitation des tentatives de connexion."""

    class Scope(models.TextChoices):
        IDENTIFIER_IP = "identifier_ip", "Identifiant + IP"
        IP = "ip", "Adresse IP"

    scope = models.CharField("portée", max_length=32, choices=Scope.choices)
    key_hash = models.CharField("empreinte", max_length=64)
    failures = models.PositiveIntegerField("échecs", default=0)
    window_started_at = models.DateTimeField("début de fenêtre")
    blocked_until = models.DateTimeField("bloqué jusqu'au", null=True, blank=True, db_index=True)
    updated_at = models.DateTimeField("mis à jour le", auto_now=True)

    class Meta:
        verbose_name = "limitation de connexion"
        verbose_name_plural = "limitations de connexion"
        constraints = [
            models.UniqueConstraint(fields=["scope", "key_hash"], name="unique_backoffice_login_rate_key"),
        ]
        indexes = [
            models.Index(fields=["scope", "key_hash"], name="bo_rate_scope_key_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.get_scope_display()} — {self.failures}"
