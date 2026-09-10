from django import forms
from django.utils.text import slugify

from apps.core.publication import PublicationStatus

from .image_processing import compress_news_cover_image
from .models import News, NewsCategory


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

    class Meta:
        model = News
        fields = (
            "title",
            "category",
            "new_category_name",
            "organ",
            "excerpt",
            "content",
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
            "featured": "Réservé aux responsables autorisés à publier.",
        }

    def __init__(self, *args, user=None, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

        self.fields["category"].queryset = NewsCategory.objects.filter(
            is_active=True
        ).order_by("order", "name")
        self.fields["category"].empty_label = "— Choisir une catégorie existante —"
        self.fields["category"].required = False

        # Le navigateur interdit le préremplissage réel d'un input type=file.
        # L'image existante est conservée si aucun nouveau fichier n'est choisi,
        # et le template affiche un aperçu clair de l'image actuelle.
        self.fields["featured_image"].required = False

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

    def _category_from_inline_creation(self):
        name = (self.cleaned_data.get("new_category_name") or "").strip()
        if not name:
            return None

        existing = NewsCategory.objects.filter(name__iexact=name).first()
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

        return cleaned

    def save(self, commit=True):
        news = super().save(commit=False)

        inline_category = self._category_from_inline_creation()
        if inline_category is not None:
            news.category = inline_category

        if self.user is not None and not self.user.has_perm("news.publish_news"):
            if not news.pk:
                news.featured = False
                news.display_order = 0

        if commit:
            news.save()
            self.save_m2m()

        return news
