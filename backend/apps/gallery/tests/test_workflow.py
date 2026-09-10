from django.contrib.auth.models import Group
from django.test import RequestFactory, TestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.core.publication import PublicationStatus
from apps.gallery.image_processing import process_gallery_image
from apps.gallery.models import GalleryAlbum
from apps.gallery.permissions import assign_gallery_permissions
from apps.gallery.services import create_gallery_images, transition_album

from .helpers import test_image


class GalleryWorkflowTests(TestCase):
    def setUp(self):
        assign_gallery_permissions()

        manager_group = Group.objects.get(name=GROUP_MANAGER)
        editor_group = Group.objects.get(name=GROUP_EDITOR)

        self.manager = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        self.manager.groups.add(manager_group)

        self.editor = User.objects.create_user(
            email="editor@example.test",
            password="StrongPassword-123!",
        )
        self.editor.groups.add(editor_group)

        self.request = RequestFactory().post("/backoffice/gallery/")
        self.request.META["REMOTE_ADDR"] = "127.0.0.1"

        self.album = GalleryAlbum.objects.create(
            title="Album de test",
            date=timezone.localdate(),
            description="Description",
            author=self.editor,
            last_editor=self.editor,
        )

    def test_editor_uploads_submits_then_manager_publishes(self):
        processed = [process_gallery_image(test_image("one.jpg"))]
        count = create_gallery_images(
            album=self.album,
            processed_images=processed,
            user=self.editor,
            request=self.request,
        )
        self.assertEqual(count, 1)

        submitted = transition_album(
            album=self.album,
            action="submit",
            user=self.editor,
            request=self.request,
        )
        self.assertEqual(submitted.status, PublicationStatus.PENDING)

        published = transition_album(
            album=submitted,
            action="publish",
            user=self.manager,
            request=self.request,
        )
        self.assertEqual(published.status, PublicationStatus.PUBLISHED)
        self.assertIsNotNone(published.published_at)

    def test_publish_requires_image(self):
        self.album.status = PublicationStatus.PENDING
        self.album.save(update_fields=["status"])

        with self.assertRaises(Exception):
            transition_album(
                album=self.album,
                action="publish",
                user=self.manager,
                request=self.request,
            )
