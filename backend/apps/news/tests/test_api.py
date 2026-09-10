from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.core.publication import PublicationStatus
from apps.news.models import News

from .helpers import test_image


class PublicNewsApiTests(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            email="author@example.test",
            password="StrongPassword-123!",
        )

    def _news(self, *, title, status):
        return News.objects.create(
            title=title,
            excerpt=f"Résumé {title}",
            content=f"Contenu {title}",
            featured_image=test_image(f"{title}.jpg"),
            status=status,
            publication_date=timezone.localdate(),
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

    def test_contract_matches_current_next_news_item_shape(self):
        news = self._news(
            title="Actualité API",
            status=PublicationStatus.PUBLISHED,
        )

        response = self.client.get(
            reverse("news_api:detail", kwargs={"slug": news.slug})
        )
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(
            set(payload.keys()),
            {
                "id",
                "slug",
                "title",
                "date",
                "excerpt",
                "imageUrl",
                "imageAlt",
                "content",
                "featured",
                "status",
                "relatedDocumentSlugs",
            },
        )
        self.assertTrue(payload["imageUrl"].startswith("/media/"))
        self.assertEqual(payload["relatedDocumentSlugs"], [])

    def test_draft_detail_is_not_public(self):
        news = self._news(
            title="Privé",
            status=PublicationStatus.DRAFT,
        )

        response = self.client.get(
            reverse("news_api:detail", kwargs={"slug": news.slug})
        )
        self.assertEqual(response.status_code, 404)
