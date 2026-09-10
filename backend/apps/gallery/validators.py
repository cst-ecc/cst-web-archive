from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


def validate_gallery_image(uploaded_file) -> None:
    if not uploaded_file:
        return

    suffix = Path(uploaded_file.name).suffix.lower()
    if suffix not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            "Format d’image non autorisé. Utilisez JPG, PNG ou WEBP."
        )

    max_mb = getattr(settings, "GALLERY_MAX_ORIGINAL_IMAGE_MB", 150)
    max_bytes = max_mb * 1024 * 1024
    if uploaded_file.size > max_bytes:
        raise ValidationError(
            f"L’image dépasse la taille maximale de {max_mb} Mo."
        )

    content_type = getattr(uploaded_file, "content_type", None)
    if content_type and content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValidationError(
            "Le type de fichier transmis ne correspond pas à une image autorisée."
        )


def validate_upload_metadata(
    *,
    filename: str,
    content_type: str,
    total_size: int,
    total_chunks: int,
    chunk_size: int,
) -> None:
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            "Format d’image non autorisé. Utilisez JPG, PNG ou WEBP."
        )

    if content_type and content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValidationError(
            "Le type de fichier transmis ne correspond pas à une image autorisée."
        )

    max_file_mb = getattr(settings, "GALLERY_MAX_ORIGINAL_IMAGE_MB", 150)
    if total_size <= 0:
        raise ValidationError("La taille du fichier est invalide.")

    if total_size > max_file_mb * 1024 * 1024:
        raise ValidationError(
            f"L’image dépasse la taille maximale de {max_file_mb} Mo."
        )

    max_chunk_mb = getattr(settings, "GALLERY_CHUNK_SIZE_MB", 8)
    if chunk_size <= 0 or chunk_size > max_chunk_mb * 1024 * 1024:
        raise ValidationError(
            f"La taille d’un morceau ne doit pas dépasser {max_chunk_mb} Mo."
        )

    if total_chunks <= 0:
        raise ValidationError("Le nombre de morceaux est invalide.")
