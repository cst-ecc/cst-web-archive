from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.core.publication import PublicationStatus
from apps.gallery.image_processing import process_gallery_image
from apps.gallery.models import GalleryAlbum, GalleryImage

from .helpers import test_image


class PublicGalleryApiTests(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            email="author@example.test",
            password="StrongPassword-123!",
        )

    def _album(self, *, title, status):
        album = GalleryAlbum.objects.create(
            title=title,
            date=timezone.localdate(),
            description=f"Description {title}",
            status=status,
            author=self.author,
            last_editor=self.author,
        )
        processed = process_gallery_image(test_image(f"{title}.jpg"))
        GalleryImage.objects.create(
            album=album,
            image=processed.file,
            width=processed.width,
            height=processed.height,
            file_size=processed.file_size,
            mime_type=processed.mime_type,
            original_filename=processed.original_filename,
            uploaded_by=self.author,
        )
        return album

    def test_list_exposes_only_published_albums(self):
        published = self._album(title="Publié", status=PublicationStatus.PUBLISHED)
        self._album(title="Brouillon", status=PublicationStatus.DRAFT)

        response = self.client.get(reverse("gallery_api:list"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIsInstance(payload, list)
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["slug"], published.slug)
        self.assertEqual(payload[0]["status"], "publie")
        self.assertEqual(len(payload[0]["images"]), 1)

    def test_detail_shape_matches_frontend_gallery_album(self):
        album = self._album(title="Album API", status=PublicationStatus.PUBLISHED)

        response = self.client.get(
            reverse("gallery_api:detail", kwargs={"slug": album.slug})
        )
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(
            set(payload.keys()),
            {
                "id",
                "slug",
                "title",
                "date",
                "description",
                "coverUrl",
                "images",
                "relatedSessionSlug",
                "status",
            },
        )
        self.assertTrue(payload["coverUrl"].startswith("/media/"))
        self.assertTrue(payload["images"][0]["imageUrl"].startswith("/media/"))

    def test_draft_detail_is_not_public(self):
        album = self._album(title="Privé", status=PublicationStatus.DRAFT)

        response = self.client.get(
            reverse("gallery_api:detail", kwargs={"slug": album.slug})
        )
        self.assertEqual(response.status_code, 404)
