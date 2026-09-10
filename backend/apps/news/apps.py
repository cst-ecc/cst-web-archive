from django.apps import AppConfig


class NewsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.news"
    verbose_name = "Actualités"

    def ready(self):
        # Attribution idempotente des permissions aux groupes après migrate.
        from . import permissions  # noqa: F401
