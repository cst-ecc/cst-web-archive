from django.contrib.auth.models import Group
from django.test import TestCase

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.gallery.permissions import assign_gallery_permissions


class GalleryRolePermissionTests(TestCase):
    def setUp(self):
        assign_gallery_permissions()
        self.manager_group = Group.objects.get(name=GROUP_MANAGER)
        self.editor_group = Group.objects.get(name=GROUP_EDITOR)

    def test_editor_can_create_and_submit_album_but_not_publish(self):
        editor = User.objects.create_user(
            email="editor@example.test",
            password="StrongPassword-123!",
        )
        editor.groups.add(self.editor_group)

        self.assertTrue(editor.has_perm("gallery.add_galleryalbum"))
        self.assertTrue(editor.has_perm("gallery.submit_galleryalbum"))
        self.assertFalse(editor.has_perm("gallery.publish_galleryalbum"))
        self.assertFalse(editor.has_perm("gallery.archive_galleryalbum"))

    def test_manager_can_publish_and_archive_album(self):
        manager = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        manager.groups.add(self.manager_group)

        self.assertTrue(manager.has_perm("gallery.review_galleryalbum"))
        self.assertTrue(manager.has_perm("gallery.publish_galleryalbum"))
        self.assertTrue(manager.has_perm("gallery.archive_galleryalbum"))
        self.assertTrue(manager.has_perm("gallery.delete_galleryimage"))
