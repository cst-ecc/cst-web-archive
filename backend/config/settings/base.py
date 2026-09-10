from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parents[2]

env = environ.Env(
    DJANGO_DEBUG=(bool)
)

# Les variables d'environnement sont injectées exclusivement par Docker Compose.
# Aucun fichier .env n'est lu depuis backend/ ni depuis frontend/.
# La source de configuration est centralisée dans docker/.env.dev ou
# docker/.env.prod selon l'environnement.

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG")
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "django_filters",
    "apps.core.apps.CoreConfig",
    "apps.accounts.apps.AccountsConfig",
    "apps.audit.apps.AuditConfig",
    "apps.backoffice.apps.BackofficeConfig",
    "apps.news.apps.NewsConfig",
    "apps.gallery.apps.GalleryConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB"),
        "USER": env("POSTGRES_USER"),
        "PASSWORD": env("POSTGRES_PASSWORD"),
        "HOST": env("POSTGRES_HOST"),
        "PORT": env("POSTGRES_PORT"),
        "CONN_MAX_AGE": env.int("POSTGRES_CONN_MAX_AGE"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTH_USER_MODEL = "accounts.User"

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Porto-Novo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/cst-static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    # Sécurité par défaut : les futures routes d'administration devront être
    # authentifiées. Les endpoints publics déclareront explicitement AllowAny.
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}

# E-mail : console par défaut pour le développement. La production surcharge
# cette valeur avec le backend SMTP du domaine ecc.bj.
EMAIL_BACKEND = env("EMAIL_BACKEND")
EMAIL_HOST = env("EMAIL_HOST")
EMAIL_PORT = env.int("EMAIL_PORT")
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS")
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL")

# Préparé pour l'étape OTP ; le mécanisme n'est pas encore implémenté.
OTP_EXPIRY_MINUTES = env.int("OTP_EXPIRY_MINUTES")
OTP_MAX_ATTEMPTS = env.int("OTP_MAX_ATTEMPTS")
OTP_RESEND_COOLDOWN_SECONDS = env.int("OTP_RESEND_COOLDOWN_SECONDS")
OTP_PENDING_SESSION_MINUTES = env.int("OTP_PENDING_SESSION_MINUTES")
# Limites métier utilisées plus tard par les validateurs d'upload.
BACKOFFICE_SESSION_MAX_AGE = env.int("BACKOFFICE_SESSION_MAX_AGE")
BACKOFFICE_LOGIN_MAX_ATTEMPTS = env.int("BACKOFFICE_LOGIN_MAX_ATTEMPTS")
BACKOFFICE_LOGIN_IP_MAX_ATTEMPTS = env.int("BACKOFFICE_LOGIN_IP_MAX_ATTEMPTS")
BACKOFFICE_LOGIN_WINDOW_MINUTES = env.int("BACKOFFICE_LOGIN_WINDOW_MINUTES")
BACKOFFICE_LOGIN_LOCKOUT_MINUTES = env.int("BACKOFFICE_LOGIN_LOCKOUT_MINUTES")

# Limites métier utilisées plus tard par les validateurs d'upload.
MAX_IMAGE_UPLOAD_MB = env.int("MAX_IMAGE_UPLOAD_MB")
MAX_DOCUMENT_UPLOAD_MB = env.int("MAX_DOCUMENT_UPLOAD_MB")

# Celery configuration
CELERY_BROKER_URL = env(
    "CELERY_BROKER_URL"
)
CELERY_RESULT_BACKEND = env(
    "CELERY_RESULT_BACKEND"
)
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = env.int("CELERY_TASK_TIME_LIMIT")
CELERY_TASK_SOFT_TIME_LIMIT = env.int("CELERY_TASK_SOFT_TIME_LIMIT")
CELERY_WORKER_PREFETCH_MULTIPLIER = env.int(
    "CELERY_WORKER_PREFETCH_MULTIPLIER"
)
CELERY_TASK_ACKS_LATE = True

# Limites métier utilisées plus tard par les validateurs d'upload.
GALLERY_CHUNK_SIZE_MB = env.int("GALLERY_CHUNK_SIZE_MB")
GALLERY_MAX_ORIGINAL_IMAGE_MB = env.int(
    "GALLERY_MAX_ORIGINAL_IMAGE_MB"
)
GALLERY_MAX_FILES_PER_SELECTION = env.int(
    "GALLERY_MAX_FILES_PER_SELECTION"
)
GALLERY_UPLOAD_SESSION_TTL_HOURS = env.int(
    "GALLERY_UPLOAD_SESSION_TTL_HOURS"
)
