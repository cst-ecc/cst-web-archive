from django.db import models


class PublicationStatus(models.TextChoices):
    DRAFT = "brouillon", "Brouillon"
    PENDING = "en_attente", "En attente de validation"
    PUBLISHED = "publie", "Publié"
    ARCHIVED = "archive", "Archivé"


class OrganScope(models.TextChoices):
    CST = "cst", "CST"
    CSMO = "csmo", "CSMO"
    CST_CSMO = "cst_csmo", "CST / CSMO"
    GENERAL = "general", "Général"
