"""Workflow éditorial commun aux futurs modules de contenu."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from .policy import Capability, default_can


class PublicationStatus(StrEnum):
    DRAFT = "brouillon"
    PENDING = "en_attente"
    PUBLISHED = "publie"
    ARCHIVED = "archive"


STATUS_LABELS = {
    PublicationStatus.DRAFT: "Brouillon",
    PublicationStatus.PENDING: "En attente de validation",
    PublicationStatus.PUBLISHED: "Publié",
    PublicationStatus.ARCHIVED: "Archivé",
}


class WorkflowAction(StrEnum):
    SUBMIT = "submit"
    WITHDRAW = "withdraw"
    PUBLISH = "publish"
    REJECT = "reject"
    ARCHIVE = "archive"
    RESTORE = "restore"


ACTION_LABELS = {
    WorkflowAction.SUBMIT: "Soumettre à validation",
    WorkflowAction.WITHDRAW: "Retirer de la validation",
    WorkflowAction.PUBLISH: "Publier",
    WorkflowAction.REJECT: "Renvoyer en brouillon",
    WorkflowAction.ARCHIVE: "Archiver",
    WorkflowAction.RESTORE: "Restaurer en brouillon",
}


@dataclass(frozen=True)
class WorkflowTransition:
    action: WorkflowAction
    source: PublicationStatus
    target: PublicationStatus
    required_capability: Capability
    owner_only: bool = False


TRANSITIONS = (
    # Un Manager ou Super administrateur peut publier directement un brouillon.
    # Cela évite un bouton "Soumettre à validation" inutile pour les profils
    # qui ont déjà le droit de publier.
    WorkflowTransition(
        WorkflowAction.PUBLISH,
        PublicationStatus.DRAFT,
        PublicationStatus.PUBLISHED,
        Capability.CONTENT_PUBLISH,
    ),
    WorkflowTransition(
        WorkflowAction.SUBMIT,
        PublicationStatus.DRAFT,
        PublicationStatus.PENDING,
        Capability.CONTENT_SUBMIT,
        owner_only=True,
    ),
    WorkflowTransition(
        WorkflowAction.WITHDRAW,
        PublicationStatus.PENDING,
        PublicationStatus.DRAFT,
        Capability.CONTENT_EDIT_OWN,
        owner_only=True,
    ),
    WorkflowTransition(
        WorkflowAction.PUBLISH,
        PublicationStatus.PENDING,
        PublicationStatus.PUBLISHED,
        Capability.CONTENT_PUBLISH,
    ),
    WorkflowTransition(
        WorkflowAction.REJECT,
        PublicationStatus.PENDING,
        PublicationStatus.DRAFT,
        Capability.CONTENT_REVIEW,
    ),
    WorkflowTransition(
        WorkflowAction.ARCHIVE,
        PublicationStatus.PUBLISHED,
        PublicationStatus.ARCHIVED,
        Capability.CONTENT_ARCHIVE,
    ),
    WorkflowTransition(
        WorkflowAction.RESTORE,
        PublicationStatus.ARCHIVED,
        PublicationStatus.DRAFT,
        Capability.CONTENT_ARCHIVE,
    ),
)


def get_transition(
    source: str | PublicationStatus,
    action: str | WorkflowAction,
) -> WorkflowTransition | None:
    try:
        source_status = PublicationStatus(source)
        workflow_action = WorkflowAction(action)
    except ValueError:
        return None

    for transition in TRANSITIONS:
        if (
            transition.source == source_status
            and transition.action == workflow_action
        ):
            return transition
    return None


def can_transition(
    *,
    user,
    source: str | PublicationStatus,
    action: str | WorkflowAction,
    owner_id: int | None = None,
) -> bool:
    transition = get_transition(source, action)
    if transition is None:
        return False

    if not default_can(user, transition.required_capability):
        return False

    if transition.owner_only:
        if getattr(user, "is_superuser", False):
            return True

        if default_can(user, Capability.CONTENT_EDIT_ANY):
            return True

        return owner_id is not None and owner_id == user.pk

    return True


def target_status(
    *,
    source: str | PublicationStatus,
    action: str | WorkflowAction,
) -> PublicationStatus | None:
    transition = get_transition(source, action)
    return transition.target if transition else None


def available_actions(
    *,
    user,
    source: str | PublicationStatus,
    owner_id: int | None = None,
):
    source_status = PublicationStatus(source)

    actions = [
        transition.action
        for transition in TRANSITIONS
        if transition.source == source_status
        and can_transition(
            user=user,
            source=source_status,
            action=transition.action,
            owner_id=owner_id,
        )
    ]

    # Pour un Manager/Superadmin, un brouillon doit proposer "Publier" et non
    # "Soumettre à validation". L'Éditeur conserve "Soumettre".
    if (
        source_status == PublicationStatus.DRAFT
        and WorkflowAction.PUBLISH in actions
    ):
        return [WorkflowAction.PUBLISH]

    return actions
