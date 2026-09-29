from pathlib import Path

from django import forms
from django.conf import settings
from django.utils.text import slugify

from apps.core.publication import PublicationStatus

from .models import Document, DocumentCategory
from .validators import validate_document_file


def _unique_category_slug(name: str) -> str:
    base = slugify(name)[:120] or "categorie"
    candidate = base
    counter = 2

    while DocumentCategory.objects.filter(slug=candidate).exists():
        suffix = f"-{counter}"
        candidate = f"{base[: 130 - len(suffix)]}{suffix}"
        counter += 1

    return candidate


class DocumentForm(forms.ModelForm):
    new_category_name = forms.CharField(
        label="Nouvelle catégorie",
        required=False,
        max_length=120,
        help_text="À renseigner seulement si la catégorie souhaitée n’existe pas.",
        widget=forms.TextInput(attrs={"placeholder": "Ex. Textes consolidés"}),
    )

    date = forms.DateField(
        label="Date affichée",
        required=True,
        input_formats=["%Y-%m-%d"],
        widget=forms.DateInput(format="%Y-%m-%d", attrs={"type": "date"}),
    )

    class Meta:
        model = Document
        fields = (
            "title",
            "reference",
            "category",
            "new_category_name",
            "kind",
            "summary",
            "date",
            "file",
            "pages",
            "featured",
            "display_order",
        )
        widgets = {
            "summary": forms.Textarea(attrs={"rows": 5}),
        }
        help_texts = {
            "file": "PDF, Word, Excel, PowerPoint ou OpenDocument.",
            "pages": "Optionnel. Utile pour les PDF ou rapports.",
            "featured": "Réservé aux responsables autorisés à publier.",
        }

    def __init__(self, *args, user=None, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

        self.fields["category"].queryset = DocumentCategory.objects.filter(
            is_active=True
        ).order_by("order", "name")
        self.fields["category"].empty_label = "— Choisir une catégorie existante —"
        self.fields["category"].required = False

        self.fields["file"].required = not bool(self.instance.pk and self.instance.file)
        self.fields["file"].widget.attrs.update(
            {"data-max-file-mb": str(getattr(settings, "MAX_DOCUMENT_UPLOAD_MB", 100))}
        )

        if user is not None and not user.has_perm("documents.publish_document"):
            self.fields.pop("featured", None)
            self.fields.pop("display_order", None)

    def clean_file(self):
        file = self.cleaned_data.get("file")
        if file is False:
            return file

        if file and getattr(file, "content_type", None):
            validate_document_file(file)

        return file

    def clean(self):
        cleaned = super().clean()

        if (
            self.instance.pk
            and self.instance.status == PublicationStatus.ARCHIVED
            and not getattr(self.user, "is_superuser", False)
        ):
            raise forms.ValidationError(
                "Un document archivé doit d’abord être restauré en brouillon."
            )

        return cleaned

    def _category_from_inline_creation(self):
        name = (self.cleaned_data.get("new_category_name") or "").strip()
        if not name:
            return None

        existing = DocumentCategory.objects.filter(name__iexact=name).first()
        if existing:
            if not existing.is_active:
                existing.is_active = True
                existing.save(update_fields=["is_active", "updated_at"])
            return existing

        return DocumentCategory.objects.create(
            name=name,
            slug=_unique_category_slug(name),
            is_active=True,
        )

    def save(self, commit=True):
        document = super().save(commit=False)

        inline_category = self._category_from_inline_creation()
        if inline_category is not None:
            document.category = inline_category

        uploaded_file = self.cleaned_data.get("file")
        if uploaded_file and getattr(uploaded_file, "content_type", None):
            document.original_filename = Path(uploaded_file.name).name[:255]
            document.file_size = uploaded_file.size
            document.mime_type = uploaded_file.content_type[:120]

        if self.user is not None and not self.user.has_perm("documents.publish_document"):
            if not document.pk:
                document.featured = False
                document.display_order = 0

        if commit:
            document.save()
            self.save_m2m()

        return document
