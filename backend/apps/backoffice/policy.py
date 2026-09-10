"""Politique fonctionnelle du back-office CST/CSMO.

Cette couche décrit les capacités par défaut des rôles. Elle ne remplace pas
les permissions natives Django. Les permissions objet/modèle seront créées
avec les vrais modèles de contenu (Actualités, Galerie, Documents, FAQ), puis
attribuées aux Groups Django par migrations idempotentes.

Le but ici est d'avoir une matrice stable et testable avant de brancher les
premiers modules éditoriaux.
"""

from __future__ import annotations

from enum import StrEnum

from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER


class BackofficeRole(StrEnum):
    SUPERADMIN = "Super administrateur"
    MANAGER = GROUP_MANAGER
    EDITOR = GROUP_EDITOR


class Capability(StrEnum):
    USER_MANAGE = "user.manage"
    PERMISSION_MANAGE = "permission.manage"
    AUDIT_VIEW = "audit.view"

    CONTENT_CREATE = "content.create"
    CONTENT_EDIT_OWN = "content.edit_own"
    CONTENT_EDIT_ANY = "content.edit_any"
    CONTENT_SUBMIT = "content.submit"
    CONTENT_REVIEW = "content.review"
    CONTENT_PUBLISH = "content.publish"
    CONTENT_ARCHIVE = "content.archive"

    MEDIA_UPLOAD = "media.upload"
    MEDIA_DELETE = "media.delete"


ROLE_CAPABILITIES: dict[BackofficeRole, frozenset[Capability]] = {
    BackofficeRole.EDITOR: frozenset(
        {
            Capability.CONTENT_CREATE,
            Capability.CONTENT_EDIT_OWN,
            Capability.CONTENT_SUBMIT,
            Capability.MEDIA_UPLOAD,
        }
    ),
    BackofficeRole.MANAGER: frozenset(
        {
            Capability.CONTENT_CREATE,
            Capability.CONTENT_EDIT_OWN,
            Capability.CONTENT_EDIT_ANY,
            Capability.CONTENT_SUBMIT,
            Capability.CONTENT_REVIEW,
            Capability.CONTENT_PUBLISH,
            Capability.CONTENT_ARCHIVE,
            Capability.MEDIA_UPLOAD,
            Capability.MEDIA_DELETE,
        }
    ),
    BackofficeRole.SUPERADMIN: frozenset(Capability),
}


CAPABILITY_LABELS = {
    Capability.USER_MANAGE: "Gérer les utilisateurs",
    Capability.PERMISSION_MANAGE: "Gérer les rôles et permissions",
    Capability.AUDIT_VIEW: "Consulter le journal d’activité",
    Capability.CONTENT_CREATE: "Créer du contenu",
    Capability.CONTENT_EDIT_OWN: "Modifier ses propres brouillons",
    Capability.CONTENT_EDIT_ANY: "Modifier les contenus des autres",
    Capability.CONTENT_SUBMIT: "Soumettre à validation",
    Capability.CONTENT_REVIEW: "Examiner les contenus en attente",
    Capability.CONTENT_PUBLISH: "Publier",
    Capability.CONTENT_ARCHIVE: "Archiver",
    Capability.MEDIA_UPLOAD: "Téléverser des médias",
    Capability.MEDIA_DELETE: "Supprimer des médias",
}


def role_for_user(user) -> BackofficeRole | None:
    """Retourne le rôle fonctionnel principal du back-office."""
    if not getattr(user, "is_authenticated", False) or not user.is_active:
        return None

    if user.is_superuser:
        return BackofficeRole.SUPERADMIN

    if user.groups.filter(name=GROUP_MANAGER).exists():
        return BackofficeRole.MANAGER

    if user.groups.filter(name=GROUP_EDITOR).exists():
        return BackofficeRole.EDITOR

    return None


def default_capabilities_for_role(
    role: BackofficeRole | None,
) -> frozenset[Capability]:
    if role is None:
        return frozenset()
    return ROLE_CAPABILITIES.get(role, frozenset())


def default_capabilities_for_user(user) -> frozenset[Capability]:
    """
    Retourne les capacités par défaut du rôle.

    IMPORTANT : pour les vrais objets de contenu, le contrôle final devra
    aussi utiliser les permissions Django du modèle concerné.
    """
    return default_capabilities_for_role(role_for_user(user))


def default_can(user, capability: Capability) -> bool:
    """Helper de politique par défaut, utile avant la création des modèles."""
    return capability in default_capabilities_for_user(user)


def policy_matrix_rows():
    """Structure prête à afficher dans le back-office."""
    roles = (
        BackofficeRole.SUPERADMIN,
        BackofficeRole.MANAGER,
        BackofficeRole.EDITOR,
    )

    rows = []
    for capability, label in CAPABILITY_LABELS.items():
        rows.append(
            {
                "capability": capability,
                "label": label,
                "roles": {
                    role: capability in ROLE_CAPABILITIES[role]
                    for role in roles
                },
            }
        )
    return roles, rows
