from datetime import date

from django.contrib.auth.models import Group
from django.test import TestCase

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR
from apps.core.publication import PublicationStatus
from apps.documents.models import Document, DocumentKind
from apps.documents.tests.helpers import test_pdf
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

    def test_article_can_associate_multiple_existing_documents(self):
        first = Document.objects.create(
            title="Rapport associé",
            summary="Rapport",
            kind=DocumentKind.REPORT,
            date=date(2026, 4, 17),
            file=test_pdf("rapport.pdf"),
            status=PublicationStatus.PUBLISHED,
            author=self.editor,
            last_editor=self.editor,
        )
        second = Document.objects.create(
            title="PV associé",
            summary="Procès-verbal",
            kind=DocumentKind.MINUTES,
            date=date(2026, 4, 17),
            file=test_pdf("pv.pdf"),
            status=PublicationStatus.PUBLISHED,
            author=self.editor,
            last_editor=self.editor,
        )

        form = NewsForm(
            data={
                "title": "Article avec documents",
                "category": "",
                "new_category_name": "",
                "organ": "cst_csmo",
                "excerpt": "Résumé",
                "content": "Contenu",
                "documents": [str(first.pk), str(second.pk)],
                "publication_date": "2026-04-17",
                "image_alt": "",
                "seo_title": "",
                "seo_description": "",
            },
            files={"featured_image": test_image("article.jpg")},
            user=self.editor,
        )

        self.assertTrue(form.is_valid(), form.errors.as_json())
        news = form.save(commit=False)
        news.author = self.editor
        news.last_editor = self.editor
        news.save()
        form.save_m2m()

        self.assertCountEqual(
            news.documents.values_list("pk", flat=True),
            [first.pk, second.pk],
        )

    def test_session_category_requires_start_date_and_location(self):
        session_category = NewsCategory.objects.get(slug="sessions")
        form = NewsForm(
            data={
                "title": "Session incomplète",
                "category": str(session_category.pk),
                "new_category_name": "",
                "organ": "cst_csmo",
                "excerpt": "Résumé",
                "content": "Contenu",
                "publication_date": "2026-04-17",
                "image_alt": "",
                "seo_title": "",
                "seo_description": "",
            },
            files={"featured_image": test_image("session.jpg")},
            user=self.editor,
        )

        self.assertFalse(form.is_valid())
        self.assertIn("session_start_date", form.errors)
        self.assertIn("session_location", form.errors)

    def test_session_end_date_cannot_precede_start_date(self):
        session_category = NewsCategory.objects.get(slug="sessions")
        form = NewsForm(
            data={
                "title": "Session dates invalides",
                "category": str(session_category.pk),
                "new_category_name": "",
                "organ": "cst_csmo",
                "excerpt": "Résumé",
                "content": "Contenu",
                "session_location": "Cotonou",
                "session_start_date": "2026-04-17",
                "session_end_date": "2026-04-16",
                "publication_date": "2026-04-17",
                "image_alt": "",
                "seo_title": "",
                "seo_description": "",
            },
            files={"featured_image": test_image("session-dates.jpg")},
            user=self.editor,
        )

        self.assertFalse(form.is_valid())
        self.assertIn("session_end_date", form.errors)

    def test_changing_session_to_another_category_clears_session_metadata(self):
        session_category = NewsCategory.objects.get(slug="sessions")
        communiques = NewsCategory.objects.get(slug="communiques")
        news = News.objects.create(
            title="Ancienne session",
            category=session_category,
            excerpt="Résumé",
            content="Contenu",
            featured_image=test_image("ancienne-session.jpg"),
            publication_date=date(2026, 4, 17),
            session_number=9,
            session_theme="Thème",
            session_location="Cotonou",
            session_start_date=date(2026, 4, 16),
            session_end_date=date(2026, 4, 17),
            author=self.editor,
            last_editor=self.editor,
        )

        form = NewsForm(
            data={
                "title": news.title,
                "category": str(communiques.pk),
                "new_category_name": "",
                "organ": "cst_csmo",
                "excerpt": news.excerpt,
                "content": news.content,
                "publication_date": "2026-04-17",
                "image_alt": news.image_alt,
                "seo_title": "",
                "seo_description": "",
            },
            files={},
            instance=news,
            user=self.editor,
        )

        self.assertTrue(form.is_valid(), form.errors.as_json())
        updated = form.save()
        self.assertIsNone(updated.session_number)
        self.assertEqual(updated.session_theme, "")
        self.assertEqual(updated.session_location, "")
        self.assertIsNone(updated.session_start_date)
        self.assertIsNone(updated.session_end_date)

