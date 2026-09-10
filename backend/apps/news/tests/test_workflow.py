from django.contrib.auth.models import Group
from django.test import RequestFactory, TestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.core.publication import PublicationStatus
from apps.news.models import News
from apps.news.permissions import assign_news_permissions
from apps.news.services import transition_news

from .helpers import test_image


class NewsWorkflowTests(TestCase):
    def setUp(self):
        assign_news_permissions()

        manager_group = Group.objects.get(name=GROUP_MANAGER)
        editor_group = Group.objects.get(name=GROUP_EDITOR)

        self.superadmin = User.objects.create_superuser(
            email="root@example.test",
            password="StrongPassword-123!",
        )

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

        self.request = RequestFactory().post("/backoffice/news/")
        self.request.META["REMOTE_ADDR"] = "127.0.0.1"

        self.news = News.objects.create(
            title="Actualité de test",
            excerpt="Résumé de test",
            content="Premier paragraphe.\n\nDeuxième paragraphe.",
            featured_image=test_image(),
            author=self.editor,
            last_editor=self.editor,
        )

    def test_editor_submits_then_manager_publishes(self):
        submitted = transition_news(
            news=self.news,
            action="submit",
            user=self.editor,
            request=self.request,
        )
        self.assertEqual(submitted.status, PublicationStatus.PENDING)

        published = transition_news(
            news=submitted,
            action="publish",
            user=self.manager,
            request=self.request,
        )
        self.assertEqual(published.status, PublicationStatus.PUBLISHED)
        self.assertEqual(published.publication_date, timezone.localdate())
        self.assertIsNotNone(published.published_at)

    def test_superadmin_can_publish_draft_directly(self):
        published = transition_news(
            news=self.news,
            action="publish",
            user=self.superadmin,
            request=self.request,
        )

        self.assertEqual(published.status, PublicationStatus.PUBLISHED)

    def test_archive_and_restore_return_to_draft(self):
        self.news.status = PublicationStatus.PENDING
        self.news.save(update_fields=["status"])

        published = transition_news(
            news=self.news,
            action="publish",
            user=self.manager,
            request=self.request,
        )
        archived = transition_news(
            news=published,
            action="archive",
            user=self.manager,
            request=self.request,
        )
        self.assertEqual(archived.status, PublicationStatus.ARCHIVED)

        restored = transition_news(
            news=archived,
            action="restore",
            user=self.manager,
            request=self.request,
        )
        self.assertEqual(restored.status, PublicationStatus.DRAFT)
        self.assertFalse(restored.featured)
