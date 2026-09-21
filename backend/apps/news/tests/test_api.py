from datetime import date

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.core.publication import PublicationStatus
from apps.documents.models import Document, DocumentKind
from apps.documents.tests.helpers import test_pdf
from apps.news.models import News, NewsCategory, NewsHomeSlot

from .helpers import test_image


class PublicNewsApiTests(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            email="author@example.test",
            password="StrongPassword-123!",
        )

    def _news(self, *, title, status, category=None, **kwargs):
        return News.objects.create(
            title=title,
            excerpt=f"Résumé {title}",
            content=f"Contenu {title}",
            featured_image=test_image(f"{title}.jpg"),
            status=status,
            publication_date=timezone.localdate(),
            author=self.author,
            last_editor=self.author,
            category=category,
            **kwargs,
        )

    def _document(self, *, title, status, kind=DocumentKind.REPORT):
        return Document.objects.create(
            title=title,
            summary=f"Résumé {title}",
            kind=kind,
            date=date(2026, 4, 17),
            file=test_pdf(f"{title}.pdf"),
            status=status,
            author=self.author,
            last_editor=self.author,
        )

    def test_list_exposes_only_published_news_as_plain_array(self):
        published = self._news(
            title="Publié",
            status=PublicationStatus.PUBLISHED,
        )
        self._news(
            title="Brouillon",
            status=PublicationStatus.DRAFT,
        )
        self._news(
            title="En attente",
            status=PublicationStatus.PENDING,
        )

        response = self.client.get(reverse("news_api:list"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIsInstance(payload, list)
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["slug"], published.slug)
        self.assertEqual(payload[0]["status"], "publie")

    def test_contract_exposes_category_documents_and_session_metadata(self):
        session_category = NewsCategory.objects.get(slug="sessions")
        news = self._news(
            title="9e Session du CST",
            status=PublicationStatus.PUBLISHED,
            category=session_category,
            session_number=9,
            session_theme="Finalisation et rapport final",
            session_location="Cotonou",
            session_start_date=date(2026, 4, 16),
            session_end_date=date(2026, 4, 17),
        )
        report = self._document(
            title="Rapport 9e session",
            status=PublicationStatus.PUBLISHED,
        )
        draft = self._document(
            title="PV brouillon",
            status=PublicationStatus.DRAFT,
            kind=DocumentKind.MINUTES,
        )
        news.documents.add(report, draft)

        response = self.client.get(
            reverse("news_api:detail", kwargs={"slug": news.slug})
        )
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(payload["category"]["slug"], "sessions")
        self.assertEqual(payload["sessionNumber"], 9)
        self.assertEqual(payload["sessionLocation"], "Cotonou")
        self.assertEqual(payload["sessionStartDate"], "2026-04-16")
        self.assertEqual(payload["sessionEndDate"], "2026-04-17")
        self.assertEqual(payload["relatedDocumentSlugs"], [report.slug])
        self.assertEqual([item["slug"] for item in payload["documents"]], [report.slug])
        self.assertTrue(payload["imageUrl"].startswith("/media/"))

    def test_category_filter_returns_session_articles_only(self):
        sessions = NewsCategory.objects.get(slug="sessions")
        communiques = NewsCategory.objects.get(slug="communiques")
        session = self._news(
            title="8e Session",
            status=PublicationStatus.PUBLISHED,
            category=sessions,
        )
        self._news(
            title="Communiqué",
            status=PublicationStatus.PUBLISHED,
            category=communiques,
        )

        response = self.client.get(
            reverse("news_api:list"),
            {"category": "sessions"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["slug"] for item in response.json()], [session.slug])

    def test_document_kind_filter_returns_articles_linked_to_published_reports(self):
        report_article = self._news(
            title="Article avec rapport",
            status=PublicationStatus.PUBLISHED,
        )
        other_article = self._news(
            title="Article sans rapport",
            status=PublicationStatus.PUBLISHED,
        )
        report = self._document(
            title="Rapport public",
            status=PublicationStatus.PUBLISHED,
            kind=DocumentKind.REPORT,
        )
        minutes = self._document(
            title="PV public",
            status=PublicationStatus.PUBLISHED,
            kind=DocumentKind.MINUTES,
        )
        report_article.documents.add(report)
        other_article.documents.add(minutes)

        response = self.client.get(
            reverse("news_api:list"),
            {"document_kind": DocumentKind.REPORT},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["slug"] for item in response.json()],
            [report_article.slug],
        )

    def test_featured_filter_never_exposes_draft(self):
        published = self._news(
            title="À la une publique",
            status=PublicationStatus.PUBLISHED,
            featured=True,
        )
        self._news(
            title="À la une brouillon",
            status=PublicationStatus.DRAFT,
            featured=True,
        )

        response = self.client.get(reverse("news_api:list"), {"featured": "1"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["slug"] for item in response.json()], [published.slug])


    def test_home_special_returns_upcoming_event_with_cover_without_attachment(self):
        event = self._news(
            title="Rencontre à venir",
            status=PublicationStatus.PUBLISHED,
            home_slot=NewsHomeSlot.UPCOMING_EVENT,
            event_date=timezone.localdate(),
        )

        response = self.client.get(reverse("news_api:home-special"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual([item["slug"] for item in payload], [event.slug])
        self.assertEqual(payload[0]["homeSlot"], NewsHomeSlot.UPCOMING_EVENT)

    def test_home_special_returns_latest_undated_upcoming_event_when_no_dated_event_exists(self):
        event = self._news(
            title="Événement sans date précise",
            status=PublicationStatus.PUBLISHED,
            home_slot=NewsHomeSlot.UPCOMING_EVENT,
            event_date=None,
        )

        response = self.client.get(reverse("news_api:home-special"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual([item["slug"] for item in payload], [event.slug])
        self.assertNotIn("eventDate", payload[0])

    def test_draft_detail_is_not_public(self):
        news = self._news(
            title="Privé",
            status=PublicationStatus.DRAFT,
        )

        response = self.client.get(
            reverse("news_api:detail", kwargs={"slug": news.slug})
        )
        self.assertEqual(response.status_code, 404)
