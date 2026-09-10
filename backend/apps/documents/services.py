from __future__ import annotations

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.audit.models import AuditAction
from apps.audit.services import audit_log
from apps.backoffice.workflow import (
    PublicationStatus as WorkflowPublicationStatus,
    WorkflowAction,
    can_transition,
    target_status,
)
from apps.core.publication import PublicationStatus

from .models import Document


class DocumentWorkflowError(ValidationError):
    pass


def visible_documents_queryset(user):
    qs = Document.objects.select_related(
        "category",
        "author",
        "last_editor",
        "published_by",
    )

    if user.is_superuser or user.has_perm("documents.review_document"):
        return qs

    return qs.filter(author=user)


def can_edit_document(user, document: Document) -> bool:
    if not user.is_active or not user.has_perm("documents.change_document"):
        return False

    if user.is_superuser or user.has_perm("documents.review_document"):
        return document.status != PublicationStatus.ARCHIVED

    return document.author_id == user.pk and document.status == PublicationStatus.DRAFT


def can_preview_document(user, document: Document) -> bool:
    if not user.is_active or not user.has_perm("documents.view_document"):
        return False

    if user.is_superuser or user.has_perm("documents.review_document"):
        return True

    return document.author_id == user.pk


def _required_permission(action: WorkflowAction) -> str:
    return {
        WorkflowAction.SUBMIT: "documents.submit_document",
        WorkflowAction.WITHDRAW: "documents.submit_document",
        WorkflowAction.PUBLISH: "documents.publish_document",
        WorkflowAction.REJECT: "documents.review_document",
        WorkflowAction.ARCHIVE: "documents.archive_document",
        WorkflowAction.RESTORE: "documents.archive_document",
    }[action]


def _validate_before_publish(document: Document) -> None:
    missing = []

    if not document.title.strip():
        missing.append("titre")
    if not document.summary.strip():
        missing.append("résumé")
    if not document.date:
        missing.append("date")
    if not document.file:
        missing.append("fichier")

    if missing:
        raise DocumentWorkflowError(
            "Publication impossible. Champs requis manquants : "
            + ", ".join(missing)
            + "."
        )


@transaction.atomic
def transition_document(
    *,
    document: Document,
    action: str | WorkflowAction,
    user,
    request=None,
) -> Document:
    try:
        action = WorkflowAction(action)
    except ValueError as exc:
        raise DocumentWorkflowError("Action éditoriale inconnue.") from exc

    locked = Document.objects.select_for_update().get(pk=document.pk)

    permission = _required_permission(action)
    if not user.has_perm(permission):
        raise PermissionDenied

    if not can_transition(
        user=user,
        source=WorkflowPublicationStatus(locked.status),
        action=action,
        owner_id=locked.author_id,
    ):
        raise PermissionDenied

    new_status = target_status(
        source=WorkflowPublicationStatus(locked.status),
        action=action,
    )
    if new_status is None:
        raise DocumentWorkflowError(
            "Cette transition n’est pas autorisée depuis le statut actuel."
        )

    now = timezone.now()
    update_fields = ["status", "last_editor", "updated_at"]

    if action == WorkflowAction.SUBMIT:
        locked.submitted_at = now
        locked.submitted_by = user
        update_fields += ["submitted_at", "submitted_by"]

    elif action == WorkflowAction.PUBLISH:
        _validate_before_publish(locked)

        if locked.published_at is None:
            locked.published_at = now
            update_fields.append("published_at")

        locked.published_by = user
        update_fields.append("published_by")

    elif action == WorkflowAction.ARCHIVE:
        locked.archived_at = now
        locked.archived_by = user
        update_fields += ["archived_at", "archived_by"]

    elif action == WorkflowAction.RESTORE:
        locked.archived_at = None
        locked.archived_by = None
        locked.featured = False
        update_fields += ["archived_at", "archived_by", "featured"]

    locked.status = new_status.value
    locked.last_editor = user
    locked.save(update_fields=list(dict.fromkeys(update_fields)))

    if action == WorkflowAction.PUBLISH:
        audit_action = AuditAction.CONTENT_PUBLISHED
    elif action == WorkflowAction.ARCHIVE:
        audit_action = AuditAction.CONTENT_ARCHIVED
    else:
        audit_action = AuditAction.CONTENT_UPDATED

    audit_log(
        action=audit_action,
        actor=user,
        request=request,
        target=locked,
        description=f"Transition document : {action.value}.",
        metadata={
            "workflow_action": action.value,
            "status": locked.status,
        },
    )

    return locked


@transaction.atomic
def increment_downloads(document: Document) -> None:
    Document.objects.filter(pk=document.pk).update(downloads=F("downloads") + 1)
