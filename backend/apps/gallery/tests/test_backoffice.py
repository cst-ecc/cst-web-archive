from django.contrib.auth.models import Group
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.backoffice.session import VERIFIED_USER_ID
from apps.gallery.models import GalleryAlbum
from apps.gallery.permissions import assign_gallery_permissions


class GalleryBackofficeTests(TestCase):
    def setUp(self):
        assign_gallery_permissions()

        editor_group = Group.objects.get(name=GROUP_EDITOR)
        manager_group = Group.objects.get(name=GROUP_MANAGER)

        self.editor = User.objects.create_user(
            email="editor@example.test",
            password="StrongPassword-123!",
        )
        self.editor.groups.add(editor_group)

        self.other_editor = User.objects.create_user(
            email="other@example.test",
            password="StrongPassword-123!",
        )
        self.other_editor.groups.add(editor_group)

        self.manager = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        self.manager.groups.add(manager_group)

    def _verified_login(self, user):
        self.client.force_login(user)
        session = self.client.session
        session[VERIFIED_USER_ID] = user.pk
        session.save()

    def test_editor_can_create_album(self):
        self._verified_login(self.editor)

        response = self.client.post(
            reverse("backoffice:gallery_create"),
            {
                "title": "Album Paris",
                "date": "2026-09-10",
                "description": "Rencontre institutionnelle",
                "cover_alt": "",
            },
        )

        self.assertEqual(response.status_code, 302)
        album = GalleryAlbum.objects.get(title="Album Paris")
        self.assertEqual(album.author, self.editor)
        self.assertEqual(album.status, "brouillon")

    def test_editor_does_not_see_another_editors_album(self):
        album = GalleryAlbum.objects.create(
            title="Album autre",
            date=timezone.localdate(),
            author=self.other_editor,
            last_editor=self.other_editor,
        )

        self._verified_login(self.editor)
        response = self.client.get(
            reverse("backoffice:gallery_edit", kwargs={"pk": album.pk})
        )
        self.assertEqual(response.status_code, 404)

    def test_manager_sees_all_albums(self):
        GalleryAlbum.objects.create(
            title="Album éditeur",
            date=timezone.localdate(),
            author=self.editor,
            last_editor=self.editor,
        )

        self._verified_login(self.manager)
        response = self.client.get(reverse("backoffice:gallery_list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Album éditeur")
