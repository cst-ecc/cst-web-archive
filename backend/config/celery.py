import os

from celery import Celery

# En production, le worker reçoit DJANGO_SETTINGS_MODULE depuis docker/.env.prod.
# Le fallback production évite qu'un worker lancé sans env parte en mode dev.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

app = Celery("cst_backend")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
