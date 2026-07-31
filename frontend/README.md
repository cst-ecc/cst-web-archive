# CST — Frontend (Phase 1)

Site institutionnel et **bibliothèque documentaire** du **Conseil Supérieur de Transition (CST)** de l'Église du Christianisme Céleste.

Frontend **Next.js (App Router) + TypeScript + SCSS (Sass) + CSS Modules + Framer Motion**, alimenté en phase 1 par des **données fictives** (`lib/data.ts`), et déjà **prêt pour l'API Django** grâce à une couche d'accès unique (`lib/api.ts`).

> **Choix technique** : SCSS (variables, mixins, CSS Modules par composant) — pas de TailwindCSS — pour un contrôle total du style.

---

## 1. Résumé

Première version fonctionnelle du frontend du CST : pages institutionnelles, bibliothèque documentaire (recherche / filtres / tri / pagination), sessions, membres, actualités, galerie, contact, plus SEO, Docker et documentation complète.

> Tous les fichiers de ce ZIP sont nouveaux (aucun backend existant modifié).

## 2. Objectif

- Un site sobre et institutionnel, inspiré de l'esprit documentaire du SGG Bénin, avec une identité propre au CST (bleu / jaune / blanc).
- Une architecture qui **sépare les données de l'affichage** afin que le passage de `data.ts` vers une **API Django** ne nécessite **aucune réécriture des pages**.
- Une préparation explicite à l'administration future des contenus (publication brouillon/publié, mise en avant, catégories).

## 3. Fichiers ajoutés

**Configuration & racine**
- `package.json`, `next.config.mjs`, `tsconfig.json`, `next-env.d.ts`
- `.eslintrc.json`, `.gitignore`, `.dockerignore`, `.env.example`
- `Dockerfile`, `docker-compose.yml`, `docker-compose.dev.yml`

**Styles (`styles/`)**
- `styles/_variables.scss` — palette CST, breakpoints, rayons, ombres
- `styles/_mixins.scss` — respond(), container, card, cst-rule, focus-ring, line-clamp, button-base

**Couche données (`lib/`)**
- `lib/types.ts`, `lib/data.ts`, `lib/api.ts`, `lib/constants.ts`, `lib/utils.ts`

**App Router (`app/`)**
- `app/globals.scss`, `app/layout.tsx`, `app/layout.module.scss`
- `app/pages.module.scss` (styles partagés entre pages)
- `app/loading.tsx`, `app/not-found.tsx` + modules
- `app/robots.ts`, `app/sitemap.ts`
- Pages : accueil, présentation, membres, sessions (+ détail), documents (+ détail), décisions, rapports, actualités (+ détail), galerie, contact — chaque détail a son propre module SCSS

**Composants (`components/`) — chaque composant a un `*.module.scss` jumeau**
- `layout/` : Navbar, Footer, Container, SectionTitle, PageHeader
- `ui/` : Button, Badge, Loader, Pagination, SearchField, Motion, Stat
- `documents/` : DocumentCard, DocumentFilters, DocumentLibrary
- `sessions/` : SessionCard
- `members/` : MemberCard
- `news/` : NewsCard
- `gallery/` : Gallery
- `contact/` : ContactForm
- `home/` : Hero, HomeSearch, FeaturedDocuments, RecentDocuments, RecentSessions, StatsBlock

**Assets (`public/`)**
- `logo/logo.svg`, `favicon.svg`, `og-image.svg` (placeholders)
- `images/*.svg`, `documents/exemple.pdf`

## 4. Fichiers modifiés

Aucun — sous-projet nouvellement créé.

## 5. Dépendances

Déclarées dans `package.json` :

- **Runtime** : `next@14.2.5`, `react`, `react-dom`, `framer-motion`
- **Dev** : `typescript`, `@types/*`, `sass`, `eslint`, `eslint-config-next`

> **TailwindCSS, PostCSS, autoprefixer** ne sont **pas** installés. Le style est géré intégralement par SCSS + CSS Modules.

## 6. Variables d'environnement

Voir `.env.example` → copier en `.env.local` (dev) ou `.env` (Docker) :

| Variable | Rôle | Valeur phase 1 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL publique (SEO) | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | URL future de l'API Django | *(vide)* |
| `NEXT_PUBLIC_DATA_SOURCE` | `mock` ou `api` | `mock` |

## 7. Migrations Django

Aucune (phase frontend uniquement).

## 8. Installation

```bash
cd cst-frontend
cp .env.example .env.local
npm install
```

## 9. Tests

```bash
npm run type-check   # TypeScript
npm run lint         # ESLint
npm run build        # Build prod (vérifie types + lint)
```

## 10. Lancement

```bash
# Dev
npm run dev          # http://localhost:3000

# Production locale
npm run build && npm run start

# Docker production
cp .env.example .env
docker compose up --build

# Docker dev (hot reload)
docker compose -f docker-compose.dev.yml up
```

## 11. Vérifications manuelles

- Accueil : héro, statistiques, documents à la une/récents, dernières sessions
- Bibliothèque (`/documents`) : recherche, filtres catégorie/année, tri, pagination
- Détail document : fiche + téléchargement
- `/decisions`, `/rapports` : catégorie verrouillée
- Sessions détail : documents associés
- Actualités détail : contenu + documents liés
- Galerie : visionneuse (ouverture/fermeture, `Échap`)
- Navigation mobile (menu burger) et focus clavier
- `/robots.txt`, `/sitemap.xml`

## 12. Risques

- **Assets placeholder** à remplacer par les visuels officiels
- **Polices Google** (`next/font`) : le build a besoin du réseau pour télécharger Sora/Inter
- **Formulaire de contact** : validation client seulement (envoi activé au branchement API)
- **Filtrage côté client** : adapté au petit volume ; basculer API si le corpus grossit

---

## Procédure d'intégration

1. Sauvegarder le dépôt ou travailler sur un clone
2. `git checkout -b feature/frontend-cst-phase-1`
3. Décompresser le ZIP à la racine du monorepo
4. `cd cst-frontend && cp .env.example .env.local && npm install`
5. `npm run type-check && npm run lint && npm run build`
6. `npm run dev` — tester les pages
7. Revue de code puis merge

---

## Tests à effectuer

**Statiques** : `type-check`, `lint`, `build` — 0 erreur.

**Isolation data.ts** :
```bash
grep -rn 'from "@/lib/data"' app components || echo "OK"
```

**Bascule API** : `NEXT_PUBLIC_DATA_SOURCE=api` + URL factice → erreur réseau (preuve de bascule).

**Manuels** : parcours de toutes les pages, slug inexistant → 404, recherche vide → message.

Détails dans **TESTS.md**.

---

## Sécurité

- Aucun secret dans le code ; variables `NEXT_PUBLIC_` non sensibles
- Seuls les contenus `status = "publie"` exposés
- Pas de `dangerouslySetInnerHTML`, rendu échappé par React
- Liens externes : `rel="noopener noreferrer"`
- Docker production : utilisateur non-root
- Formulaire et uploads à sécuriser côté backend

---

## Rollback

Le frontend est isolé, sans base de données ni migration.

```bash
git checkout main
git branch -D feature/frontend-cst-phase-1
# ou : supprimer le dossier cst-frontend/
```

---

## Backend Django — comment brancher

`lib/api.ts` est le **point unique de bascule** :

1. Créer les endpoints DRF alignés sur `lib/types.ts`
2. Renseigner `.env` : `NEXT_PUBLIC_API_URL=https://api.cst.example/api`, `NEXT_PUBLIC_DATA_SOURCE=api`
3. Aucune page ni composant à modifier

---

## Architecture SCSS

```
styles/
  _variables.scss    — couleurs, breakpoints, ombres, rayons, polices
  _mixins.scss       — respond(), container, card, cst-rule, focus-ring…

app/
  globals.scss       — reset, base, accessibilité
  pages.module.scss  — styles partagés entre pages (grilles, prose…)
  layout.module.scss — body, main

components/
  layout/Navbar.module.scss
  layout/Footer.module.scss
  …chaque composant a son .module.scss jumeau
```

Convention : chaque composant importe `../../styles/variables` et `../../styles/mixins` dans son module SCSS. Les classes sont consommées via `import styles from "./Composant.module.scss"` et appliquées avec `className={styles.classe}` ou `cn(styles.a, condition && styles.b)`.
