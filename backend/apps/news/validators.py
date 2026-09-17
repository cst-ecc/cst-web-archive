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


ALLOWED_NEWS_ATTACHMENT_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

ALLOWED_NEWS_ATTACHMENT_MIME_TYPES = {
    ".pdf": {"application/pdf", "application/octet-stream"},
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
    ".webp": {"image/webp"},
}


def validate_news_attachment(uploaded_file) -> None:
    """Valide une pièce jointe d'actualité (PDF ou image)."""
    if not uploaded_file:
        return

    suffix = Path(uploaded_file.name).suffix.lower()
    if suffix not in ALLOWED_NEWS_ATTACHMENT_EXTENSIONS:
        raise ValidationError(
            "Format non autorisé. Utilisez PDF, JPG, PNG ou WEBP."
        )

    max_mb = getattr(settings, "MAX_NEWS_ATTACHMENT_MB", 30)
    max_bytes = max_mb * 1024 * 1024
    if uploaded_file.size > max_bytes:
        raise ValidationError(
            f"La pièce jointe dépasse la taille maximale de {max_mb} Mo."
        )

    content_type = getattr(uploaded_file, "content_type", "")
    allowed_mimes = ALLOWED_NEWS_ATTACHMENT_MIME_TYPES[suffix]
    if content_type and content_type not in allowed_mimes:
        raise ValidationError(
            "Le type MIME de la pièce jointe n'est pas autorisé."
        )

    if suffix == ".pdf":
        try:
            uploaded_file.seek(0)
            header = uploaded_file.read(5)
            uploaded_file.seek(0)
        except (AttributeError, OSError) as exc:
            raise ValidationError(
                "Impossible de vérifier le fichier PDF."
            ) from exc

        if header != b"%PDF-":
            raise ValidationError(
                "Le fichier transmis ne semble pas être un PDF valide."
            )
