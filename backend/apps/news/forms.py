from pathlib import Path

from django import forms
from django.conf import settings
from django.db.models import Q
from django.utils.text import slugify

from apps.core.publication import PublicationStatus
from apps.documents.models import Document

from .image_processing import compress_news_cover_image
from .models import News, NewsCategory, NewsHomeSlot
from .validators import validate_news_attachment


def _unique_category_slug(name: str) -> str:
    base = slugify(name)[:110] or "categorie"
    candidate = base
    counter = 2

    while NewsCategory.objects.filter(slug=candidate).exists():
        suffix = f"-{counter}"
        candidate = f"{base[: 120 - len(suffix)]}{suffix}"
        counter += 1

    return candidate


class NewsForm(forms.ModelForm):
    new_category_name = forms.CharField(
        label="Nouvelle catégorie",
        required=False,
        max_length=120,
        help_text=(
            "Renseignez ce champ uniquement si la catégorie souhaitée "
            "n’existe pas encore."
        ),
        widget=forms.TextInput(
            attrs={
                "placeholder": "Ex. Conférences, Communauté, Mission France…",
                "autocomplete": "off",
            }
        ),
    )

    publication_date = forms.DateField(
        label="Date affichée",
        required=False,
        input_formats=["%Y-%m-%d"],
        widget=forms.DateInput(
            format="%Y-%m-%d",
            attrs={"type": "date"},
        ),
    )

    home_slot = forms.ChoiceField(
        label="Affichage spécial sur l’accueil",
        required=False,
        choices=[
            ("", "— Actualité standard —"),
            *NewsHomeSlot.choices,
        ],
        help_text=(
            "Permet d’afficher cette actualité dans la zone "
            "Événement à venir ou Alerte Info de l’accueil."
        ),
    )

    event_date = forms.DateField(
        label="Date de l’événement",
        required=False,
        input_formats=["%Y-%m-%d"],
        widget=forms.DateInput(
            format="%Y-%m-%d",
            attrs={"type": "date"},
        ),
        help_text=(
            "Champ facultatif, y compris pour « Événement à venir ». "
            "Si aucune date précise n’est connue, laissez ce champ vide."
        ),
    )

    documents = forms.ModelMultipleChoiceField(
        label="Documents associés",
        required=False,
        queryset=Document.objects.none(),
        widget=forms.SelectMultiple(attrs={"size": 8}),
        help_text=(
            "Sélectionnez les documents officiels liés à l’article. "
            "Ils seront proposés à la lecture depuis la page publique de l’article."
        ),
    )

    session_start_date = forms.DateField(
        label="Début de la session",
        required=False,
        input_formats=["%Y-%m-%d"],
        widget=forms.DateInput(format="%Y-%m-%d", attrs={"type": "date"}),
    )
    session_end_date = forms.DateField(
        label="Fin de la session",
        required=False,
        input_formats=["%Y-%m-%d"],
        widget=forms.DateInput(format="%Y-%m-%d", attrs={"type": "date"}),
    )

    class Meta:
        model = News
        fields = (
            "title",
            "category",
            "new_category_name",
            "organ",
            "excerpt",
            "content",
            "home_slot",
            "event_date",
            "attachment",
            "attachment_label",
            "documents",
            "session_number",
            "session_theme",
            "session_location",
            "session_start_date",
            "session_end_date",
            "featured_image",
            "image_alt",
            "publication_date",
            "featured",
            "display_order",
            "seo_title",
            "seo_description",
        )
        widgets = {
            "excerpt": forms.Textarea(attrs={"rows": 4}),
            "content": forms.Textarea(attrs={"rows": 14}),
            "seo_description": forms.Textarea(attrs={"rows": 3}),
        }
        help_texts = {
            "content": "Texte simple : séparez les paragraphes par une ligne vide.",
            "image_alt": (
                "Décrivez brièvement l’image pour l’accessibilité. "
                "À défaut, le titre de l’actualité sera utilisé."
            ),
            "featured": (
                "Mettre cet article à la une. Lorsqu’un article publié devient "
                "À la une, l’ancien article publié perd automatiquement ce statut."
            ),
        }

    def __init__(self, *args, user=None, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

        self.fields["category"].queryset = NewsCategory.objects.filter(
            is_active=True
        ).order_by("order", "name")
        self.fields["category"].empty_label = "— Choisir une catégorie existante —"
        self.fields["category"].required = False

        document_filter = Q(status__in=[
            PublicationStatus.DRAFT,
            PublicationStatus.PENDING,
            PublicationStatus.PUBLISHED,
        ])
        if self.instance.pk:
            document_filter |= Q(news_items=self.instance)

        self.fields["documents"].queryset = (
            Document.objects.filter(document_filter)
            .select_related("category")
            .distinct()
            .order_by("-date", "title")
        )

        # Le navigateur interdit le préremplissage réel d'un input type=file.
        # L'image existante est conservée si aucun nouveau fichier n'est choisi,
        # et le template affiche un aperçu clair de l'image actuelle.
        self.fields["featured_image"].required = False
        self.fields["attachment"].required = False
        # La date reste volontairement facultative, même pour un événement à venir.
        self.fields["event_date"].required = False
        self.fields["attachment"].widget.attrs.update(
            {
                "accept": ".pdf,.jpg,.jpeg,.png,.webp",
                "data-max-file-mb": str(
                    getattr(settings, "MAX_NEWS_ATTACHMENT_MB", 30)
                ),
            }
        )

        if "featured" in self.fields:
            self.fields["featured"].label = "Mettre cet article à la une"

        if user is not None and not user.has_perm("news.publish_news"):
            self.fields.pop("featured", None)
            self.fields.pop("display_order", None)

    def clean_featured_image(self):
        image = self.cleaned_data.get("featured_image")

        # False signifie "effacer le fichier" avec ClearableFileInput.
        if image is False:
            return image

        # Si c'est l'image déjà existante, on ne la re-compresse pas.
        if image and getattr(image, "content_type", None):
            return compress_news_cover_image(image)

        return image

    def clean_attachment(self):
        attachment = self.cleaned_data.get("attachment")

        # False signifie « supprimer le fichier » avec ClearableFileInput.
        if attachment is False:
            return attachment

        # Un fichier déjà stocké n'a pas de content_type : on le conserve tel quel.
        if not attachment or not getattr(attachment, "content_type", None):
            return attachment

        validate_news_attachment(attachment)

        suffix = Path(attachment.name).suffix.lower()
        if suffix in {".jpg", ".jpeg", ".png", ".webp"}:
            # Réutilise la chaîne de validation/compression robuste déjà en place.
            return compress_news_cover_image(attachment)

        return attachment

    def _category_from_inline_creation(self):
        name = (self.cleaned_data.get("new_category_name") or "").strip()
        if not name:
            return None

        existing = NewsCategory.objects.filter(name__iexact=name).first()
        if not existing and slugify(name) in {"session", "sessions"}:
            existing = NewsCategory.objects.filter(slug="sessions").first()

        if existing:
            if not existing.is_active:
                existing.is_active = True
                existing.save(update_fields=["is_active", "updated_at"])
            return existing

        return NewsCategory.objects.create(
            name=name,
            slug=_unique_category_slug(name),
            is_active=True,
        )

    def clean(self):
        cleaned = super().clean()

        if (
            self.instance.pk
            and self.instance.status == PublicationStatus.ARCHIVED
            and not getattr(self.user, "is_superuser", False)
        ):
            raise forms.ValidationError(
                "Une actualité archivée doit d’abord être restaurée en brouillon."
            )

        category = cleaned.get("category")
        new_category_name = (cleaned.get("new_category_name") or "").strip()
        is_session = (
            getattr(category, "slug", "") == "sessions"
            or slugify(new_category_name) in {"session", "sessions"}
        )

        if is_session:
            if not cleaned.get("session_start_date"):
                self.add_error(
                    "session_start_date",
                    "La date de début est requise pour un article de catégorie Session.",
                )
            if not (cleaned.get("session_location") or "").strip():
                self.add_error(
                    "session_location",
                    "Le lieu est requis pour un article de catégorie Session.",
                )

            start = cleaned.get("session_start_date")
            end = cleaned.get("session_end_date")
            if start and end and end < start:
                self.add_error(
                    "session_end_date",
                    "La date de fin ne peut pas être antérieure à la date de début.",
                )

        return cleaned

    def save(self, commit=True):
        news = super().save(commit=False)

        inline_category = self._category_from_inline_creation()
        if inline_category is not None:
            news.category = inline_category

        if news.home_slot != NewsHomeSlot.UPCOMING_EVENT:
            news.event_date = None

        # Les métadonnées de session n'ont de sens que pour un article
        # classé dans la catégorie Session. Si l'article change de catégorie,
        # on nettoie ces champs pour éviter de conserver des données fantômes.
        if getattr(news.category, "slug", "") != "sessions":
            news.session_number = None
            news.session_theme = ""
            news.session_location = ""
            news.session_start_date = None
            news.session_end_date = None

        if not news.attachment:
            news.attachment_label = ""

        if self.user is not None and not self.user.has_perm("news.publish_news"):
            if not news.pk:
                news.featured = False
                news.display_order = 0

        if commit:
            news.save()
            self.save_m2m()

        return news
