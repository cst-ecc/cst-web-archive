from django.contrib.auth.models import Group
from django.test import TestCase

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.documents.permissions import assign_document_permissions


class DocumentRolePermissionTests(TestCase):
    def setUp(self):
        assign_document_permissions()
        self.manager_group = Group.objects.get(name=GROUP_MANAGER)
        self.editor_group = Group.objects.get(name=GROUP_EDITOR)

    def test_editor_can_create_and_submit_document_but_not_publish(self):
        editor = User.objects.create_user(
            email="editor@example.test",
            password="StrongPassword-123!",
        )
        editor.groups.add(self.editor_group)

        self.assertTrue(editor.has_perm("documents.add_document"))
        self.assertTrue(editor.has_perm("documents.submit_document"))
        self.assertFalse(editor.has_perm("documents.publish_document"))
        self.assertFalse(editor.has_perm("documents.archive_document"))

    def test_manager_can_publish_and_archive_document(self):
        manager = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        manager.groups.add(self.manager_group)

        self.assertTrue(manager.has_perm("documents.review_document"))
        self.assertTrue(manager.has_perm("documents.publish_document"))
        self.assertTrue(manager.has_perm("documents.archive_document"))
