from django.conf import settings
from django.db import models


class AuditAction(models.TextChoices):
    LOGIN_SUCCESS = "login_success", "Connexion réussie"
    LOGIN_FAILED = "login_failed", "Échec de connexion"
    LOGOUT = "logout", "Déconnexion"
    OTP_REQUESTED = "otp_requested", "OTP demandé"
    OTP_SUCCESS = "otp_success", "OTP validé"
    OTP_FAILED = "otp_failed", "Échec OTP"
    USER_CREATED = "user_created", "Utilisateur créé"
    USER_UPDATED = "user_updated", "Utilisateur modifié"
    ROLE_CHANGED = "role_changed", "Rôle modifié"
    PERMISSION_CHANGED = "permission_changed", "Permission modifiée"
    CONTENT_CREATED = "content_created", "Contenu créé"
    CONTENT_UPDATED = "content_updated", "Contenu modifié"
    CONTENT_PUBLISHED = "content_published", "Contenu publié"
    CONTENT_ARCHIVED = "content_archived", "Contenu archivé"
    CONTENT_DELETED = "content_deleted", "Contenu supprimé"
    MEDIA_UPLOADED = "media_uploaded", "Média téléversé"
    MEDIA_DELETED = "media_deleted", "Média supprimé"
    DOCUMENT_OPENED = "document_opened", "Document ouvert"
    DOCUMENT_ACCESS_REQUESTED = "document_access_requested", "Accès document demandé"
    DOCUMENT_ACCESS_APPROVED = "document_access_approved", "Accès document autorisé"
    DOCUMENT_ACCESS_REFUSED = "document_access_refused", "Accès document refusé"
    DOCUMENT_ACCESS_REVOKED = "document_access_revoked", "Accès document révoqué"
    DOCUMENT_ACCESS_LINK_RENEWED = "document_access_link_renewed", "Lien d’accès régénéré"
    DOCUMENT_ACCESS_OTP_REQUESTED = "document_access_otp_requested", "OTP document demandé"
    DOCUMENT_ACCESS_OTP_FAILED = "document_access_otp_failed", "Échec OTP document"
    DOCUMENT_ACCESS_VERIFIED = "document_access_verified", "Accès document vérifié"
    DOCUMENT_SECURE_OPENED = "document_secure_opened", "Document confidentiel ouvert"


class AuditLog(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name="utilisateur",
        related_name="audit_logs",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    action = models.CharField("action", max_length=64, choices=AuditAction.choices, db_index=True)
    target_type = models.CharField("type de cible", max_length=255, blank=True)
    target_id = models.CharField("identifiant de la cible", max_length=128, blank=True)
    description = models.TextField("description", blank=True)
    ip_address = models.GenericIPAddressField("adresse IP", null=True, blank=True)
    user_agent = models.TextField("user-agent", blank=True)
    metadata = models.JSONField("métadonnées", default=dict, blank=True)
    created_at = models.DateTimeField("date", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "entrée du journal d’activité"
        verbose_name_plural = "journal d’activité"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["actor", "-created_at"], name="audit_actor_created_idx"),
            models.Index(fields=["action", "-created_at"], name="audit_action_created_idx"),
        ]

    def __str__(self) -> str:
        actor = self.actor.email if self.actor_id and self.actor else "anonyme"
        return f"{self.get_action_display()} — {actor}"
