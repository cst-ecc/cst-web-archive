from django.contrib.auth.models import Group
from django.test import RequestFactory, TestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.core.publication import PublicationStatus
from apps.news.models import News, NewsCategory
from apps.news.permissions import assign_news_permissions
from apps.news.services import NewsWorkflowError, transition_news

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

    def test_publishing_new_featured_article_unfeatures_previous_published_one(self):
        previous = News.objects.create(
            title="Ancienne mise à la une",
            excerpt="Résumé",
            content="Contenu",
            featured_image=test_image("ancienne-une.jpg"),
            publication_date=timezone.localdate(),
            status=PublicationStatus.PUBLISHED,
            featured=True,
            author=self.editor,
            last_editor=self.editor,
        )

        self.news.featured = True
        self.news.status = PublicationStatus.PENDING
        self.news.save(update_fields=["featured", "status", "updated_at"])

        published = transition_news(
            news=self.news,
            action="publish",
            user=self.manager,
            request=self.request,
        )

        previous.refresh_from_db()
        published.refresh_from_db()
        self.assertTrue(published.featured)
        self.assertFalse(previous.featured)

    def test_draft_featured_does_not_replace_current_published_featured(self):
        current = News.objects.create(
            title="Mise à la une publiée",
            excerpt="Résumé",
            content="Contenu",
            featured_image=test_image("une-publiee.jpg"),
            publication_date=timezone.localdate(),
            status=PublicationStatus.PUBLISHED,
            featured=True,
            author=self.editor,
            last_editor=self.editor,
        )
        draft = News.objects.create(
            title="Mise à la une préparée",
            excerpt="Résumé",
            content="Contenu",
            featured_image=test_image("une-brouillon.jpg"),
            status=PublicationStatus.DRAFT,
            featured=True,
            author=self.editor,
            last_editor=self.editor,
        )

        current.refresh_from_db()
        draft.refresh_from_db()
        self.assertTrue(current.featured)
        self.assertTrue(draft.featured)

    def test_session_cannot_be_published_without_session_metadata(self):
        session_category = NewsCategory.objects.get(slug="sessions")
        self.news.category = session_category
        self.news.status = PublicationStatus.PENDING
        self.news.save(update_fields=["category", "status", "updated_at"])

        with self.assertRaises(NewsWorkflowError):
            transition_news(
                news=self.news,
                action="publish",
                user=self.manager,
                request=self.request,
            )

