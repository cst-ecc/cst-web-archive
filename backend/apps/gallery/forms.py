from django import forms

from apps.core.publication import PublicationStatus

from .image_processing import process_gallery_image
from .models import GalleryAlbum


class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleImageField(forms.FileField):
    widget = MultipleFileInput

    def clean(self, data, initial=None):
        if not data:
            return []

        files = data if isinstance(data, (list, tuple)) else [data]
        return [super(MultipleImageField, self).clean(file, initial) for file in files]


class GalleryAlbumForm(forms.ModelForm):
    date = forms.DateField(
        label="Date de l’album",
        required=True,
        input_formats=["%Y-%m-%d"],
        widget=forms.DateInput(format="%Y-%m-%d", attrs={"type": "date"}),
    )

    class Meta:
        model = GalleryAlbum
        fields = (
            "title",
            "date",
            "description",
            "cover_image",
            "cover_alt",
            "featured",
            "display_order",
        )
        widgets = {
            "description": forms.Textarea(attrs={"rows": 5}),
        }
        help_texts = {
            "cover_image": (
                "Optionnel. Si aucune couverture n’est choisie, la première image "
                "de l’album sera utilisée."
            ),
            "cover_alt": (
                "Décrivez brièvement la couverture pour l’accessibilité."
            ),
            "featured": "Réservé aux responsables autorisés à publier.",
        }

    def __init__(self, *args, user=None, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)
        self.fields["cover_image"].required = False

        if user is not None and not user.has_perm("gallery.publish_galleryalbum"):
            self.fields.pop("featured", None)
            self.fields.pop("display_order", None)

    def clean_cover_image(self):
        image = self.cleaned_data.get("cover_image")
        if image is False:
            return image

        if image and getattr(image, "content_type", None):
            return process_gallery_image(image).file

        return image

    def clean(self):
        cleaned = super().clean()

        if (
            self.instance.pk
            and self.instance.status == PublicationStatus.ARCHIVED
            and not getattr(self.user, "is_superuser", False)
        ):
            raise forms.ValidationError(
                "Un album archivé doit d’abord être restauré en brouillon."
            )

        return cleaned

    def save(self, commit=True):
        album = super().save(commit=False)

        if self.user is not None and not self.user.has_perm("gallery.publish_galleryalbum"):
            if not album.pk:
                album.featured = False
                album.display_order = 0

        if commit:
            album.save()
            self.save_m2m()

        return album


class GalleryImageUploadForm(forms.Form):
    images = MultipleImageField(
        label="Ajouter des images",
        required=False,
        help_text="Vous pouvez sélectionner plusieurs images à la fois. JPG, PNG ou WEBP, 30 Mo maximum par image avant compression.",
    )

    def clean_images(self):
        files = self.cleaned_data.get("images") or []
        processed = []
        errors = []

        for uploaded_file in files:
            try:
                processed.append(process_gallery_image(uploaded_file))
            except Exception as exc:
                errors.append(f"{getattr(uploaded_file, 'name', 'image')} : {exc}")

        if errors:
            raise forms.ValidationError(errors)

        return processed
