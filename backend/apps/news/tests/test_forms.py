from datetime import date

from django.contrib.auth.models import Group
from django.test import TestCase

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR
from apps.core.publication import PublicationStatus
from apps.news.forms import NewsForm
from apps.news.models import News, NewsCategory
from apps.news.permissions import assign_news_permissions

from .helpers import test_image


class NewsFormTests(TestCase):
    def setUp(self):
        assign_news_permissions()
        editor_group = Group.objects.get(name=GROUP_EDITOR)
        self.editor = User.objects.create_user(
            email="editor@example.test",
            password="StrongPassword-123!",
        )
        self.editor.groups.add(editor_group)

    def test_inline_category_creation(self):
        form = NewsForm(
            data={
                "title": "Actualité avec nouvelle catégorie",
                "category": "",
                "new_category_name": "Mission France",
                "organ": "cst_csmo",
                "excerpt": "Résumé",
                "content": "Contenu",
                "publication_date": "",
                "image_alt": "",
                "seo_title": "",
                "seo_description": "",
            },
            files={"featured_image": test_image()},
            user=self.editor,
        )

        self.assertTrue(form.is_valid(), form.errors.as_json())
        news = form.save(commit=False)
        news.author = self.editor
        news.last_editor = self.editor
        news.save()

        self.assertEqual(news.category.name, "Mission France")
        self.assertTrue(NewsCategory.objects.filter(name="Mission France").exists())

    def test_existing_image_is_kept_when_editing_without_new_upload(self):
        news = News.objects.create(
            title="Actualité existante",
            excerpt="Résumé",
            content="Contenu",
            featured_image=test_image(),
            publication_date=date(2026, 9, 10),
            status=PublicationStatus.DRAFT,
            author=self.editor,
            last_editor=self.editor,
        )
        original_image_name = news.featured_image.name

        form = NewsForm(
            data={
                "title": "Actualité existante modifiée",
                "category": "",
                "new_category_name": "",
                "organ": "cst_csmo",
                "excerpt": "Résumé modifié",
                "content": "Contenu modifié",
                "publication_date": "2026-09-10",
                "image_alt": "Texte alternatif",
                "seo_title": "",
                "seo_description": "",
            },
            files={},
            instance=news,
            user=self.editor,
        )

        self.assertTrue(form.is_valid(), form.errors.as_json())
        updated = form.save()
        self.assertEqual(updated.featured_image.name, original_image_name)
        self.assertEqual(updated.publication_date, date(2026, 9, 10))
