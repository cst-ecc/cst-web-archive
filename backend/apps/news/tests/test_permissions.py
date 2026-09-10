from django.contrib.auth.models import Group
from django.test import TestCase

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.news.permissions import assign_news_permissions


class NewsRolePermissionTests(TestCase):
    def setUp(self):
        assign_news_permissions()
        self.manager_group = Group.objects.get(name=GROUP_MANAGER)
        self.editor_group = Group.objects.get(name=GROUP_EDITOR)

    def test_editor_cannot_publish(self):
        editor = User.objects.create_user(
            email="editor@example.test",
            password="StrongPassword-123!",
        )
        editor.groups.add(self.editor_group)

        self.assertTrue(editor.has_perm("news.add_news"))
        self.assertTrue(editor.has_perm("news.submit_news"))
        self.assertFalse(editor.has_perm("news.publish_news"))
        self.assertFalse(editor.has_perm("news.archive_news"))

    def test_manager_can_publish_and_archive(self):
        manager = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        manager.groups.add(self.manager_group)

        self.assertTrue(manager.has_perm("news.review_news"))
        self.assertTrue(manager.has_perm("news.publish_news"))
        self.assertTrue(manager.has_perm("news.archive_news"))
