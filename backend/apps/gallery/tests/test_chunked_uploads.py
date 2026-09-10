import json
from math import ceil

from django.contrib.auth.models import Group
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR
from apps.backoffice.session import VERIFIED_USER_ID
from apps.gallery.models import GalleryAlbum, GalleryImage, GalleryUploadSession
from apps.gallery.permissions import assign_gallery_permissions

from .helpers import test_image


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
    GALLERY_CHUNK_SIZE_MB=1,
    GALLERY_MAX_ORIGINAL_IMAGE_MB=10,
    GALLERY_MAX_FILES_PER_SELECTION=20,
    GALLERY_UPLOAD_SESSION_TTL_HOURS=24,
)
class GalleryChunkedUploadTests(TestCase):
    def setUp(self):
        assign_gallery_permissions()
        group = Group.objects.get(name=GROUP_EDITOR)
        self.user = User.objects.create_user(
            email="editor@example.test",
            password="StrongPassword-123!",
        )
        self.user.groups.add(group)

        self.album = GalleryAlbum.objects.create(
            title="Album chunk",
            date=timezone.localdate(),
            author=self.user,
            last_editor=self.user,
        )

        self.client.force_login(self.user)
        session = self.client.session
        session[VERIFIED_USER_ID] = self.user.pk
        session.save()

    def test_chunked_upload_creates_gallery_image(self):
        file_obj = test_image("photo.jpg", size=(80, 60))
        payload = file_obj.read()
        chunk_size = 1024 * 1024
        total_chunks = ceil(len(payload) / chunk_size)

        start_response = self.client.post(
            reverse("backoffice:gallery_upload_start", kwargs={"pk": self.album.pk}),
            data=json.dumps(
                {
                    "filename": "photo.jpg",
                    "contentType": "image/jpeg",
                    "size": len(payload),
                    "chunkSize": chunk_size,
                    "totalChunks": total_chunks,
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(start_response.status_code, 201, start_response.content)
        start_data = start_response.json()
        upload_id = start_data["uploadId"]

        for index in range(total_chunks):
            chunk = payload[index * chunk_size : (index + 1) * chunk_size]
            response = self.client.post(
                reverse(
                    "backoffice:gallery_upload_chunk",
                    kwargs={"upload_id": upload_id},
                ),
                data={
                    "chunkIndex": str(index),
                    "chunk": SimpleUploadedFile(
                        "photo.part",
                        chunk,
                        content_type="application/octet-stream",
                    ),
                },
            )
            self.assertEqual(response.status_code, 200, response.content)

        complete_response = self.client.post(
            reverse(
                "backoffice:gallery_upload_complete",
                kwargs={"upload_id": upload_id},
            )
        )
        self.assertEqual(complete_response.status_code, 200, complete_response.content)

        upload_session = GalleryUploadSession.objects.get(upload_id=upload_id)
        self.assertEqual(upload_session.status, GalleryUploadSession.Status.COMPLETED)
        self.assertEqual(GalleryImage.objects.filter(album=self.album).count(), 1)
