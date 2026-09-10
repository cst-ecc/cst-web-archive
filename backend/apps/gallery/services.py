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

from .models import GalleryAlbum, GalleryImage


class GalleryWorkflowError(ValidationError):
    pass


def visible_albums_queryset(user):
    qs = GalleryAlbum.objects.prefetch_related("images").select_related(
        "author",
        "last_editor",
        "published_by",
    )

    if user.is_superuser or user.has_perm("gallery.review_galleryalbum"):
        return qs

    return qs.filter(author=user)


def can_edit_album(user, album: GalleryAlbum) -> bool:
    if not user.is_active or not user.has_perm("gallery.change_galleryalbum"):
        return False

    if user.is_superuser or user.has_perm("gallery.review_galleryalbum"):
        return album.status != PublicationStatus.ARCHIVED

    return album.author_id == user.pk and album.status == PublicationStatus.DRAFT


def can_preview_album(user, album: GalleryAlbum) -> bool:
    if not user.is_active or not user.has_perm("gallery.view_galleryalbum"):
        return False

    if user.is_superuser or user.has_perm("gallery.review_galleryalbum"):
        return True

    return album.author_id == user.pk


def can_delete_gallery_image(user, image: GalleryImage) -> bool:
    album = image.album

    if not user.is_active:
        return False

    if user.is_superuser:
        return True

    if user.has_perm("gallery.delete_galleryimage") and user.has_perm("gallery.review_galleryalbum"):
        return album.status != PublicationStatus.ARCHIVED

    # Souplesse utile : un Éditeur peut corriger ses erreurs tant que son
    # album est encore en brouillon, sans obtenir un droit global de suppression.
    return (
        album.author_id == user.pk
        and album.status == PublicationStatus.DRAFT
        and user.has_perm("gallery.change_galleryalbum")
    )


def _required_permission(action: WorkflowAction) -> str:
    return {
        WorkflowAction.SUBMIT: "gallery.submit_galleryalbum",
        WorkflowAction.WITHDRAW: "gallery.submit_galleryalbum",
        WorkflowAction.PUBLISH: "gallery.publish_galleryalbum",
        WorkflowAction.REJECT: "gallery.review_galleryalbum",
        WorkflowAction.ARCHIVE: "gallery.archive_galleryalbum",
        WorkflowAction.RESTORE: "gallery.archive_galleryalbum",
    }[action]


def _validate_before_publish(album: GalleryAlbum) -> None:
    missing = []

    if not album.title.strip():
        missing.append("titre")
    if not album.date:
        missing.append("date")
    if not album.images.exists() and not album.cover_image:
        missing.append("au moins une image")

    if missing:
        raise GalleryWorkflowError(
            "Publication impossible. Champs requis manquants : "
            + ", ".join(missing)
            + "."
        )


@transaction.atomic
def create_gallery_images(
    *,
    album: GalleryAlbum,
    processed_images,
    user,
    request=None,
) -> int:
    if not can_edit_album(user, album):
        raise PermissionDenied

    if not user.has_perm("gallery.add_galleryimage"):
        raise PermissionDenied

    created = 0
    current_max_order = (
        album.images.order_by("-order").values_list("order", flat=True).first()
    )
    next_order = (current_max_order or 0) + 1

    for processed in processed_images:
        GalleryImage.objects.create(
            album=album,
            image=processed.file,
            width=processed.width,
            height=processed.height,
            file_size=processed.file_size,
            mime_type=processed.mime_type,
            original_filename=processed.original_filename,
            uploaded_by=user,
            order=next_order,
        )
        next_order += 1
        created += 1

    if created:
        album.last_editor = user
        album.save(update_fields=["last_editor", "updated_at"])

        audit_log(
            action=AuditAction.MEDIA_UPLOADED,
            actor=user,
            request=request,
            target=album,
            description="Images ajoutées à un album galerie.",
            metadata={"count": created},
        )

    return created


@transaction.atomic
def delete_gallery_image(*, image: GalleryImage, user, request=None) -> None:
    image = GalleryImage.objects.select_related("album").select_for_update().get(pk=image.pk)

    if not can_delete_gallery_image(user, image):
        raise PermissionDenied

    album = image.album
    image.delete()

    audit_log(
        action=AuditAction.MEDIA_DELETED,
        actor=user,
        request=request,
        target=album,
        description="Image supprimée d’un album galerie.",
        metadata={"image_id": image.pk},
    )


@transaction.atomic
def transition_album(
    *,
    album: GalleryAlbum,
    action: str | WorkflowAction,
    user,
    request=None,
) -> GalleryAlbum:
    try:
        action = WorkflowAction(action)
    except ValueError as exc:
        raise GalleryWorkflowError("Action éditoriale inconnue.") from exc

    locked = GalleryAlbum.objects.select_for_update().get(pk=album.pk)

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
        raise GalleryWorkflowError(
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
        description=f"Transition album galerie : {action.value}.",
        metadata={
            "workflow_action": action.value,
            "status": locked.status,
        },
    )

    return locked
