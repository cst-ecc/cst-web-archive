from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


def validate_news_image(uploaded_file) -> None:
    if not uploaded_file:
        return

    suffix = Path(uploaded_file.name).suffix.lower()
    if suffix not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            "Format d’image non autorisé. Utilisez JPG, PNG ou WEBP."
        )

    max_bytes = settings.MAX_IMAGE_UPLOAD_MB * 1024 * 1024
    if uploaded_file.size > max_bytes:
        raise ValidationError(
            f"L’image dépasse la taille maximale de "
            f"{settings.MAX_IMAGE_UPLOAD_MB} Mo."
        )

    content_type = getattr(uploaded_file, "content_type", None)
    if content_type and content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValidationError(
            "Le type de fichier transmis ne correspond pas à une image autorisée."
        )
