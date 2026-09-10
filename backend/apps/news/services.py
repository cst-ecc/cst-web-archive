from __future__ import annotations

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
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

from .models import News


class NewsWorkflowError(ValidationError):
    pass


def visible_news_queryset(user):
    qs = News.objects.select_related(
        "category",
        "author",
        "last_editor",
        "submitted_by",
        "published_by",
    )

    if user.is_superuser or user.has_perm("news.review_news"):
        return qs

    return qs.filter(author=user)


def can_edit_news(user, news: News) -> bool:
    if not user.is_active or not user.has_perm("news.change_news"):
        return False

    if user.is_superuser or user.has_perm("news.review_news"):
        return news.status != PublicationStatus.ARCHIVED

    return news.author_id == user.pk and news.status == PublicationStatus.DRAFT


def can_preview_news(user, news: News) -> bool:
    if not user.is_active or not user.has_perm("news.view_news"):
        return False

    if user.is_superuser or user.has_perm("news.review_news"):
        return True

    return news.author_id == user.pk


def _required_permission(action: WorkflowAction) -> str:
    return {
        WorkflowAction.SUBMIT: "news.submit_news",
        WorkflowAction.WITHDRAW: "news.submit_news",
        WorkflowAction.PUBLISH: "news.publish_news",
        WorkflowAction.REJECT: "news.review_news",
        WorkflowAction.ARCHIVE: "news.archive_news",
        WorkflowAction.RESTORE: "news.archive_news",
    }[action]


def _validate_before_publish(news: News) -> None:
    missing = []

    if not news.title.strip():
        missing.append("titre")
    if not news.excerpt.strip():
        missing.append("résumé")
    if not news.content.strip():
        missing.append("contenu")
    if not news.featured_image:
        missing.append("image de couverture")

    if missing:
        raise NewsWorkflowError(
            "Publication impossible. Champs requis manquants : "
            + ", ".join(missing)
            + "."
        )


@transaction.atomic
def transition_news(
    *,
    news: News,
    action: str | WorkflowAction,
    user,
    request=None,
) -> News:
    try:
        action = WorkflowAction(action)
    except ValueError as exc:
        raise NewsWorkflowError("Action éditoriale inconnue.") from exc

    # Ne pas utiliser select_related() ici : PostgreSQL refuse FOR UPDATE sur
    # le côté nullable d'un OUTER JOIN. Nous verrouillons uniquement la ligne News.
    locked = News.objects.select_for_update().get(pk=news.pk)

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
        raise NewsWorkflowError(
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

        if locked.publication_date is None:
            locked.publication_date = timezone.localdate()
            update_fields.append("publication_date")

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
        description=f"Transition éditoriale : {action.value}.",
        metadata={
            "workflow_action": action.value,
            "status": locked.status,
        },
    )

    return locked
