from django.contrib.auth.models import Group
from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.backoffice.session import VERIFIED_USER_ID
from apps.news.models import News, NewsCategory
from apps.news.permissions import assign_news_permissions

from .helpers import test_image


class NewsBackofficeTests(TestCase):
    def setUp(self):
        assign_news_permissions()

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

    def test_editor_can_create_draft(self):
        self._verified_login(self.editor)

        response = self.client.post(
            reverse("backoffice:news_create"),
            {
                "title": "Nouvelle information",
                "organ": "cst_csmo",
                "excerpt": "Un résumé suffisamment clair.",
                "content": "Premier paragraphe.\n\nDeuxième paragraphe.",
                "featured_image": test_image(),
                "image_alt": "Réunion institutionnelle",
                "publication_date": "",
                "seo_title": "",
                "seo_description": "",
            },
        )

        self.assertEqual(response.status_code, 302)
        news = News.objects.get(title="Nouvelle information")
        self.assertEqual(news.author, self.editor)
        self.assertEqual(news.status, "brouillon")

    def test_category_seed_exists(self):
        self.assertTrue(
            NewsCategory.objects.filter(slug="communiques").exists()
        )

    def test_editor_does_not_see_another_editors_news(self):
        foreign_news = News.objects.create(
            title="Autre brouillon",
            excerpt="Résumé",
            content="Contenu",
            author=self.other_editor,
            last_editor=self.other_editor,
        )

        self._verified_login(self.editor)
        response = self.client.get(
            reverse("backoffice:news_edit", kwargs={"pk": foreign_news.pk})
        )
        self.assertEqual(response.status_code, 404)

    def test_manager_sees_all_news(self):
        News.objects.create(
            title="Brouillon éditeur",
            excerpt="Résumé",
            content="Contenu",
            author=self.editor,
            last_editor=self.editor,
        )

        self._verified_login(self.manager)
        response = self.client.get(reverse("backoffice:news_list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Brouillon éditeur")
