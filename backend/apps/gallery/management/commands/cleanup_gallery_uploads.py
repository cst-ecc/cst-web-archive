from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.gallery.chunked_uploads import cleanup_session_files
from apps.gallery.models import GalleryUploadSession


class Command(BaseCommand):
    help = "Nettoie les sessions d'upload galerie expirées et leurs fichiers temporaires."

    def handle(self, *args, **options):
        expired = GalleryUploadSession.objects.filter(
            expires_at__lt=timezone.now(),
            status__in=[
                GalleryUploadSession.Status.INITIATED,
                GalleryUploadSession.Status.UPLOADING,
                GalleryUploadSession.Status.QUEUED,
                GalleryUploadSession.Status.PROCESSING,
                GalleryUploadSession.Status.FAILED,
                GalleryUploadSession.Status.CANCELED,
            ],
        )

        count = 0
        for session in expired.iterator():
            cleanup_session_files(session)
            session.delete()
            count += 1

        self.stdout.write(self.style.SUCCESS(f"{count} session(s) nettoyée(s)."))
