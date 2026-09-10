from .base import *

DEBUG = True

# En développement Docker, le frontend Next.js appelle souvent Django par
# le nom de service interne : http://cst-backend:8000.
# Sans ces hôtes, Django répond 400 DisallowedHost.
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")

SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
