from __future__ import annotations

from django.core.files import File
from django.db import transaction
from django.utils import timezone

from celery import shared_task

from apps.audit.models import AuditAction
from apps.audit.services import audit_log

from .chunked_uploads import assemble_chunks, cleanup_session_files
from .image_processing import process_gallery_image
from .models import GalleryImage, GalleryUploadSession


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def process_gallery_upload_session(self, session_pk: int) -> None:
    try:
        session = GalleryUploadSession.objects.select_related(
            "album",
            "created_by",
        ).get(pk=session_pk)
    except GalleryUploadSession.DoesNotExist:
        return

    if session.status == GalleryUploadSession.Status.COMPLETED:
        return

    try:
        session.status = GalleryUploadSession.Status.PROCESSING
        session.error_message = ""
        session.save(update_fields=["status", "error_message", "updated_at"])

        assembled = assemble_chunks(session)

        with assembled.open("rb") as raw:
            source = File(raw, name=session.original_filename)
            processed = process_gallery_image(source)

        with transaction.atomic():
            album = session.album
            current_max_order = (
                album.images.order_by("-order")
                .values_list("order", flat=True)
                .first()
            )
            next_order = (current_max_order or 0) + 1

            image = GalleryImage.objects.create(
                album=album,
                image=processed.file,
                width=processed.width,
                height=processed.height,
                file_size=processed.file_size,
                mime_type=processed.mime_type,
                original_filename=processed.original_filename,
                uploaded_by=session.created_by,
                order=next_order,
            )

            album.last_editor = session.created_by
            album.save(update_fields=["last_editor", "updated_at"])

            session.status = GalleryUploadSession.Status.COMPLETED
            session.image = image
            session.completed_at = timezone.now()
            session.save(
                update_fields=[
                    "status",
                    "image",
                    "completed_at",
                    "updated_at",
                ]
            )

        cleanup_session_files(session)

        audit_log(
            action=AuditAction.MEDIA_UPLOADED,
            actor=session.created_by,
            target=session.album,
            description="Image galerie téléversée en chunks puis compressée.",
            metadata={
                "upload_id": str(session.upload_id),
                "original_filename": session.original_filename,
                "image_id": image.pk,
                "final_size": image.file_size,
            },
        )

    except Exception as exc:
        session.status = GalleryUploadSession.Status.FAILED
        session.error_message = str(exc)[:2000]
        session.save(update_fields=["status", "error_message", "updated_at"])
        raise
