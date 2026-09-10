from __future__ import annotations

import json
import math
from datetime import timedelta

from django.conf import settings
from django.contrib import messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Count, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from apps.audit.models import AuditAction
from apps.audit.services import audit_log
from apps.backoffice.access import backoffice_2fa_required
from apps.backoffice.workflow import ACTION_LABELS, available_actions
from apps.core.publication import PublicationStatus

from .chunked_uploads import write_chunk
from .forms import GalleryAlbumForm
from .models import GalleryAlbum, GalleryImage, GalleryUploadSession
from .services import (
    can_edit_album,
    can_preview_album,
    delete_gallery_image,
    transition_album,
    visible_albums_queryset,
)
from .tasks import process_gallery_upload_session
from .validators import validate_upload_metadata


def _json_payload(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise ValidationError("Requête JSON invalide.")


def _json_error(message: str, status: int = 400):
    return JsonResponse({"ok": False, "error": message}, status=status)


def _session_payload(request, session: GalleryUploadSession):
    return {
        "ok": True,
        "uploadId": str(session.upload_id),
        "status": session.status,
        "progress": session.progress_percent,
        "receivedChunks": session.received_chunks_count,
        "totalChunks": session.total_chunks,
        "error": session.error_message,
        "chunkUrl": reverse(
            "backoffice:gallery_upload_chunk",
            kwargs={"upload_id": session.upload_id},
        ),
        "completeUrl": reverse(
            "backoffice:gallery_upload_complete",
            kwargs={"upload_id": session.upload_id},
        ),
        "statusUrl": reverse(
            "backoffice:gallery_upload_status",
            kwargs={"upload_id": session.upload_id},
        ),
        "image": {
            "id": session.image_id,
            "url": session.image.image.url if session.image_id and session.image.image else "",
        }
        if session.image_id
        else None,
    }


def _owned_upload_session_or_404(request, upload_id):
    return get_object_or_404(
        GalleryUploadSession.objects.select_related("album", "image"),
        upload_id=upload_id,
        created_by=request.user,
    )


@never_cache
@backoffice_2fa_required
def album_list_view(request):
    if not request.user.has_perm("gallery.view_galleryalbum"):
        raise PermissionDenied

    qs = (
        visible_albums_queryset(request.user)
        .annotate(image_count=Count("images"))
        .order_by("-date", "display_order", "-created_at")
    )

    query = (request.GET.get("q") or "").strip()
    status = (request.GET.get("status") or "").strip()

    if query:
        qs = qs.filter(Q(title__icontains=query) | Q(description__icontains=query))

    if status:
        qs = qs.filter(status=status)

    page_obj = Paginator(qs, 20).get_page(request.GET.get("page"))

    return render(
        request,
        "backoffice/gallery/list.html",
        {
            "page_obj": page_obj,
            "query": query,
            "status_filter": status,
            "status_choices": PublicationStatus.choices,
        },
    )


@never_cache
@require_http_methods(["GET", "POST"])
@backoffice_2fa_required
def album_create_view(request):
    if not request.user.has_perm("gallery.add_galleryalbum"):
        raise PermissionDenied

    if request.method == "POST":
        form = GalleryAlbumForm(request.POST, request.FILES, user=request.user)

        if form.is_valid():
            album = form.save(commit=False)
            album.author = request.user
            album.last_editor = request.user
            album.save()

            audit_log(
                action=AuditAction.CONTENT_CREATED,
                actor=request.user,
                request=request,
                target=album,
                description="Album galerie créé.",
                metadata={"status": album.status},
            )

            messages.success(request, "L’album a été créé en brouillon.")
            return redirect("backoffice:gallery_edit", pk=album.pk)
    else:
        form = GalleryAlbumForm(user=request.user)

    return render(
        request,
        "backoffice/gallery/form.html",
        {
            "form": form,
            "page_title": "Nouvel album",
            "submit_label": "Créer le brouillon",
        },
    )


@never_cache
@require_http_methods(["GET", "POST"])
@backoffice_2fa_required
def album_edit_view(request, pk):
    album = get_object_or_404(visible_albums_queryset(request.user), pk=pk)

    if not can_edit_album(request.user, album):
        raise PermissionDenied

    if request.method == "POST":
        form = GalleryAlbumForm(
            request.POST,
            request.FILES,
            instance=album,
            user=request.user,
        )

        if form.is_valid():
            updated = form.save(commit=False)
            updated.last_editor = request.user
            updated.save()

            audit_log(
                action=AuditAction.CONTENT_UPDATED,
                actor=request.user,
                request=request,
                target=updated,
                description="Album galerie modifié.",
                metadata={"status": updated.status},
            )

            messages.success(request, "L’album a été enregistré.")
            return redirect("backoffice:gallery_edit", pk=updated.pk)
    else:
        form = GalleryAlbumForm(instance=album, user=request.user)

    actions = available_actions(
        user=request.user,
        source=album.status,
        owner_id=album.author_id,
    )

    return render(
        request,
        "backoffice/gallery/form.html",
        {
            "form": form,
            "album": album,
            "page_title": "Modifier l’album",
            "submit_label": "Enregistrer",
            "workflow_actions": actions,
            "action_labels": ACTION_LABELS,
            "gallery_chunk_size_bytes": settings.GALLERY_CHUNK_SIZE_MB * 1024 * 1024,
            "gallery_chunk_size_mb": settings.GALLERY_CHUNK_SIZE_MB,
            "gallery_max_file_mb": settings.GALLERY_MAX_ORIGINAL_IMAGE_MB,
            "gallery_max_files": settings.GALLERY_MAX_FILES_PER_SELECTION,
        },
    )


@never_cache
@require_POST
@backoffice_2fa_required
def album_upload_start_view(request, pk):
    album = get_object_or_404(visible_albums_queryset(request.user), pk=pk)

    if not can_edit_album(request.user, album):
        raise PermissionDenied

    try:
        payload = _json_payload(request)
        filename = str(payload.get("filename") or "").strip()
        content_type = str(payload.get("contentType") or "").strip()
        total_size = int(payload.get("size") or 0)
        requested_chunk_size = int(payload.get("chunkSize") or 0)
        total_chunks = int(payload.get("totalChunks") or 0)

        validate_upload_metadata(
            filename=filename,
            content_type=content_type,
            total_size=total_size,
            total_chunks=total_chunks,
            chunk_size=requested_chunk_size,
        )
    except (TypeError, ValueError, ValidationError) as exc:
        message = " ".join(exc.messages) if hasattr(exc, "messages") else str(exc)
        return _json_error(message, status=400)

    active_count = GalleryUploadSession.objects.filter(
        album=album,
        created_by=request.user,
        status__in=[
            GalleryUploadSession.Status.INITIATED,
            GalleryUploadSession.Status.UPLOADING,
            GalleryUploadSession.Status.QUEUED,
            GalleryUploadSession.Status.PROCESSING,
        ],
    ).count()

    if active_count >= settings.GALLERY_MAX_FILES_PER_SELECTION:
        return _json_error(
            f"Limite atteinte : {settings.GALLERY_MAX_FILES_PER_SELECTION} uploads actifs.",
            status=400,
        )

    expires_at = timezone.now() + timedelta(
        hours=settings.GALLERY_UPLOAD_SESSION_TTL_HOURS
    )
    session = GalleryUploadSession.objects.create(
        album=album,
        created_by=request.user,
        original_filename=filename[:255],
        content_type=content_type[:80],
        total_size=total_size,
        chunk_size=requested_chunk_size,
        total_chunks=total_chunks,
        expires_at=expires_at,
    )

    return JsonResponse(_session_payload(request, session), status=201)


@never_cache
@require_POST
@backoffice_2fa_required
def album_upload_chunk_view(request, upload_id):
    session = _owned_upload_session_or_404(request, upload_id)

    if not can_edit_album(request.user, session.album):
        raise PermissionDenied

    if session.status in [
        GalleryUploadSession.Status.COMPLETED,
        GalleryUploadSession.Status.FAILED,
        GalleryUploadSession.Status.CANCELED,
    ]:
        return _json_error("Cette session d’upload n’accepte plus de morceaux.", 409)

    if timezone.now() > session.expires_at:
        session.mark_failed("Session d’upload expirée.")
        return _json_error("Session d’upload expirée.", 410)

    chunk = request.FILES.get("chunk")
    if not chunk:
        return _json_error("Aucun morceau reçu.", 400)

    try:
        chunk_index = int(request.POST.get("chunkIndex"))
    except (TypeError, ValueError):
        return _json_error("Index de morceau invalide.", 400)

    try:
        with transaction.atomic():
            locked = GalleryUploadSession.objects.select_for_update().get(pk=session.pk)
            bytes_written = write_chunk(
                locked,
                index=chunk_index,
                uploaded_file=chunk,
            )

            received = set(locked.received_chunk_indexes or [])
            if chunk_index not in received:
                received.add(chunk_index)
                locked.received_chunk_indexes = sorted(received)
                locked.received_size += bytes_written

            locked.status = GalleryUploadSession.Status.UPLOADING
            locked.save(
                update_fields=[
                    "received_chunk_indexes",
                    "received_size",
                    "status",
                    "updated_at",
                ]
            )
    except ValidationError as exc:
        return _json_error(" ".join(exc.messages), 400)

    return JsonResponse(_session_payload(request, locked))


@never_cache
@require_POST
@backoffice_2fa_required
def album_upload_complete_view(request, upload_id):
    session = _owned_upload_session_or_404(request, upload_id)

    if not can_edit_album(request.user, session.album):
        raise PermissionDenied

    if not session.is_complete:
        return _json_error("Upload incomplet.", 400)

    if timezone.now() > session.expires_at:
        session.mark_failed("Session d’upload expirée.")
        return _json_error("Session d’upload expirée.", 410)

    session.status = GalleryUploadSession.Status.QUEUED
    session.error_message = ""
    session.save(update_fields=["status", "error_message", "updated_at"])

    try:
        result = process_gallery_upload_session.delay(session.pk)
    except Exception as exc:
        session.mark_failed("Impossible de placer l’image en file de traitement.")
        return _json_error(str(exc), 503)

    # En test avec CELERY_TASK_ALWAYS_EAGER=True, la tâche est terminée à ce stade.
    session.refresh_from_db()

    response = _session_payload(request, session)
    response["taskId"] = str(getattr(result, "id", ""))
    return JsonResponse(response)


@never_cache
@require_GET
@backoffice_2fa_required
def album_upload_status_view(request, upload_id):
    session = _owned_upload_session_or_404(request, upload_id)

    if not can_preview_album(request.user, session.album):
        raise PermissionDenied

    return JsonResponse(_session_payload(request, session))


@never_cache
@backoffice_2fa_required
def album_preview_view(request, pk):
    album = get_object_or_404(visible_albums_queryset(request.user), pk=pk)

    if not can_preview_album(request.user, album):
        raise PermissionDenied

    return render(
        request,
        "backoffice/gallery/preview.html",
        {
            "album": album,
            "can_edit": can_edit_album(request.user, album),
        },
    )


@never_cache
@require_POST
@backoffice_2fa_required
def album_transition_view(request, pk, action):
    album = get_object_or_404(visible_albums_queryset(request.user), pk=pk)

    try:
        updated = transition_album(
            album=album,
            action=action,
            user=request.user,
            request=request,
        )
    except PermissionDenied:
        raise
    except ValidationError as exc:
        messages.error(request, " ".join(exc.messages))
        return redirect("backoffice:gallery_edit", pk=album.pk)

    messages.success(request, "Le statut de l’album a été mis à jour.")

    if updated.status == PublicationStatus.ARCHIVED:
        return redirect("backoffice:gallery_list")

    return redirect("backoffice:gallery_preview", pk=updated.pk)


@never_cache
@require_POST
@backoffice_2fa_required
def gallery_image_delete_view(request, pk):
    image = get_object_or_404(GalleryImage.objects.select_related("album"), pk=pk)
    album_pk = image.album_id

    try:
        delete_gallery_image(
            image=image,
            user=request.user,
            request=request,
        )
    except PermissionDenied:
        raise

    messages.success(request, "L’image a été supprimée.")
    return redirect("backoffice:gallery_edit", pk=album_pk)
