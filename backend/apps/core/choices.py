from django.db import models


class Organ(models.TextChoices):
    CST = "cst", "CST"
    CSMO = "csmo", "CSMo"
    CST_CSMO = "cst_csmo", "CST & CSMo"
    GENERAL = "general", "Institutionnel"


class PublicationStatus(models.TextChoices):
    DRAFT = "brouillon", "Brouillon"
    PENDING = "en_attente", "En attente de validation"
    PUBLISHED = "publie", "Publié"
    ARCHIVED = "archive", "Archivé"
