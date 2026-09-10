from django.db import models


class Organ(models.TextChoices):
    CST = "cst", "CST"
    CSMO = "csmo", "CSMO"
    CST_CSMO = "cst_csmo", "CST & CSMO"
    GENERAL = "general", "Institutionnel"


class PublicationStatus(models.TextChoices):
    DRAFT = "brouillon", "Brouillon"
    PENDING = "en_attente", "En attente de validation"
    PUBLISHED = "publie", "Publié"
    ARCHIVED = "archive", "Archivé"
