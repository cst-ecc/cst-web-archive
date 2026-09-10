# CST / CSMO — Plateforme institutionnelle web

Plateforme web du Conseil Supérieur de Transition (CST) et du Conseil Supérieur de Mise en Œuvre (CSMO) de l’Église du Christianisme Céleste.

Ce dépôt contient désormais :

- un frontend public Next.js ;
- un backend Django/DRF ;
- un back-office protégé par OTP e-mail ;
- PostgreSQL ;
- Redis ;
- Celery pour les traitements asynchrones ;
- un gateway Nginx interne au projet CST.

L’ancien README purement institutionnel est conservable dans `docs/README_INSTITUTIONNEL.md`. Le présent README sert de guide technique pour le développement, la configuration et le déploiement.

---

## 1. Architecture

```text
Visiteur / Administrateur
        ↓
Reverse proxy externe ecc-shield
        ↓
cst-gateway:8080
        ↓
├── /                  → cst-frontend:3000
├── /api/              → cst-backend:8000
├── /backoffice/       → cst-backend:8000
├── /django-admin/     → cst-backend:8000
├── /media/            → volume média partagé
└── /cst-static/       → volume static partagé
```

Le reverse proxy externe `ecc-shield` ne doit plus pointer directement vers `cst-frontend:3000` pour `cst.ecc.bj`. Il doit pointer vers `cst-gateway:8080`.

Le projet du recensement reste séparé. Ne pas modifier ses containers, volumes, certificats ou vhosts.

---

## 2. Services Docker

### Développement

Fichier :

```bash
docker/docker-compose.dev.yml
```

Services principaux :

```text
cst_frontend_dev
cst_backend_dev
cst_db_dev
cst_gateway_dev
cst_redis
cst_celery_worker_dev
```

### Production

Fichier :

```bash
docker/docker-compose.prod.yml
```

Services principaux :

```text
cst_frontend
cst_backend
cst_db
cst_gateway
cst_redis
cst_celery_worker
```

Aucun port applicatif n’est exposé publiquement par le compose production. Le trafic public passe par `ecc-shield`.

---

## 3. Variables d’environnement

Les variables sont centralisées dans le dossier `docker/`.

Fichiers fournis :

```text
docker/.env.example
docker/.env.dev.example
docker/.env.prod.example
```

Fichiers locaux non versionnés :

```text
docker/.env.dev
docker/.env.prod
```

Copie recommandée :

```bash
cp docker/.env.dev.example docker/.env.dev
cp docker/.env.prod.example docker/.env.prod
```

Ne jamais commiter les fichiers `.env.dev` et `.env.prod` contenant de vraies valeurs.

---

## 4. Configuration frontend

La migration vers Django est progressive :

```dotenv
NEXT_PUBLIC_DATA_SOURCE=mock
NEXT_PUBLIC_NEWS_SOURCE=api
NEXT_PUBLIC_GALLERY_SOURCE=api
NEXT_PUBLIC_DOCUMENTS_SOURCE=api
NEXT_PUBLIC_API_URL=http://cst-backend:8000/api/v1
```

Cela signifie :

```text
Actualités → API Django
Galerie    → API Django
Documents  → API Django
Sessions   → mock
Membres    → mock
Stats      → mock
```

Le passage à `NEXT_PUBLIC_DATA_SOURCE=api` se fera uniquement quand toutes les API publiques seront prêtes.

---

## 5. Configuration backend

Le backend utilise :

```text
Django
Django REST Framework
PostgreSQL
Redis
Celery
Pillow
```

Les applications actives comprennent notamment :

```text
apps.accounts
apps.audit
apps.backoffice
apps.news
apps.gallery
apps.documents
```

Le back-office est accessible à :

```text
/backoffice/
```

L’administration Django temporaire reste accessible à :

```text
/django-admin/
```

---

## 6. Uploads et médias

### Images Actualités

Upload classique, limité par :

```dotenv
MAX_IMAGE_UPLOAD_MB=30
```

### Galerie

La galerie utilise un upload chunké :

```dotenv
GALLERY_CHUNK_SIZE_MB=8
GALLERY_MAX_ORIGINAL_IMAGE_MB=150
GALLERY_MAX_FILES_PER_SELECTION=200
GALLERY_UPLOAD_SESSION_TTL_HOURS=24
```

Chaque image est découpée en petits morceaux. Celery assemble ensuite les morceaux, compresse l’image et crée l’entrée finale dans l’album.

### Documents

Upload classique, limité par :

```dotenv
MAX_DOCUMENT_UPLOAD_MB=100
```

Le gateway interne et le reverse proxy externe doivent autoriser au moins `120M` sur `/backoffice/documents/`.

---

## 7. Lancement en développement

Depuis le dossier `docker/` :

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build
```

Vérifications :

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml ps
docker compose --env-file .env.dev -f docker-compose.dev.yml exec cst_backend_dev python manage.py check
docker compose --env-file .env.dev -f docker-compose.dev.yml exec cst_backend_dev python manage.py migrate
docker compose --env-file .env.dev -f docker-compose.dev.yml exec cst_backend_dev python manage.py test
```

Accès local :

```text
Frontend direct : http://localhost:3000
Gateway complet : http://localhost:8080
Backend direct  : http://localhost:8000/api/v1/health/
Back-office     : http://localhost:8080/backoffice/
```

---

## 8. Déploiement production manuel

Depuis le serveur, dans le dossier du projet :

```bash
cd /home/eccops/apps/cst-website
git fetch origin main
git reset --hard origin/main
cd docker
```

Vérifier la configuration :

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml config > /dev/null
```

Construire les images :

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml build \
  cst_frontend cst_backend cst_gateway
```

Démarrer PostgreSQL et Redis :

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d cst_db cst_redis
```

Vérifier Django et appliquer les migrations :

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm cst_backend \
  python manage.py check

docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm cst_backend \
  python manage.py migrate --noinput
```

Démarrer l’application :

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --remove-orphans \
  cst_backend cst_celery_worker cst_frontend cst_gateway
```

Vérifier :

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=80 cst_backend
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=80 cst_celery_worker
```

---

## 9. Reverse proxy externe ecc-shield

Le vhost `cst.ecc.bj` doit pointer vers :

```nginx
proxy_pass http://cst_gateway;
```

et non plus vers :

```nginx
proxy_pass http://cst_frontend;
```

Le fichier `ops/ecc-shield/PATCH_CST_GATEWAY.md` décrit précisément les modifications à appliquer.

Tests après reload Nginx :

```bash
docker exec ecc-shield nginx -t
docker exec ecc-shield nginx -s reload

docker exec ecc-shield wget -S -O /dev/null http://cst-gateway:8080/gateway-health
docker exec ecc-shield wget -S -O /dev/null http://cst-gateway:8080/api/v1/health/

curl -fsSI https://cst.ecc.bj
curl -fsS https://cst.ecc.bj/api/v1/health/
```

---

## 10. GitHub Actions

Le workflow de déploiement doit redéployer toute la stack :

```text
cst_frontend
cst_backend
cst_gateway
cst_db
cst_redis
cst_celery_worker
```

Le fichier recommandé est :

```text
.github/workflows/deploy-cst.yml
```

Il effectue :

```text
git fetch/reset
docker compose config
build frontend/backend/gateway
start db + redis
python manage.py check
python manage.py migrate
restart services
test gateway interne
test HTTPS public
```

---

## 11. Création du super administrateur

Après le premier déploiement :

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec cst_backend \
  python manage.py createsuperuser
```

Puis ouvrir :

```text
https://cst.ecc.bj/backoffice/
```

---

## 12. Sauvegardes

Avant toute mise en production importante :

```bash
docker exec cst-db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > cst_backup_$(date +%Y%m%d_%H%M%S).sql
```

Sauvegarder aussi les volumes :

```text
cst_website_postgres_data
cst_website_media_data
cst_website_redis_data
cst_website_static_data
```

---

## 13. Rollback simple

Revenir au dernier commit stable :

```bash
cd /home/eccops/apps/cst-website
git log --oneline -5
git reset --hard <COMMIT_STABLE>
cd docker
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build --remove-orphans
```

Si une migration a déjà été appliquée, traiter le rollback de base de données séparément. Ne jamais supprimer les volumes production sans sauvegarde.

---

## 14. Points de vigilance

- Ne pas exécuter `docker compose down -v` en production.
- Ne pas mettre de secrets dans Git.
- Ne pas faire pointer `cst.ecc.bj` directement vers `cst-frontend:3000` après activation du backend.
- Ne pas modifier le vhost ou les volumes du recensement.
- Vérifier que Celery est démarré avant les imports massifs d’images galerie.
- Vérifier les limites Nginx des deux niveaux : `ecc-shield` et `cst-gateway`.

---

## 15. Modules validés à ce stade

```text
Authentification back-office OTP
Gestion utilisateurs
Actualités backend + frontend API
Galerie backend + frontend API
Upload galerie chunké + Celery
Documents backend + frontend API
```

Prochaines étapes possibles après déploiement production :

```text
Sessions dynamiques
Membres dynamiques
FAQ dynamique
Pages institutionnelles dynamiques
Paramètres globaux du site
```
