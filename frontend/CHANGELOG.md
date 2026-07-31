# Changelog — Frontend CST

## [0.1.0] — 2026-07-30

### Ajouté
- Structure **Next.js (App Router) + TypeScript + SCSS (Sass) + CSS Modules + Framer Motion**.
- Charte graphique CST (bleu `#1F85CE`, jaune `#F1E906`, or `#DAA710`, blanc, noir adouci).
- Architecture SCSS : `styles/_variables.scss` (palette, breakpoints, ombres), `styles/_mixins.scss` (respond, container, card, cst-rule, focus-ring, line-clamp, button-base), `globals.scss` (reset, base, accessibilité), un `.module.scss` par composant.
- Couche de données : `types.ts`, `data.ts`, `api.ts` (point de bascule mock → API Django).
- 13 pages + 404 + loading. Bibliothèque documentaire (recherche, filtres, tri, pagination). SEO, Docker, documentation.

### Sécurité
- Exposition restreinte aux contenus publiés. Aucun secret dans le code. Rendu échappé. Image Docker non-root.

### Points techniques
- **Aucune dépendance à TailwindCSS** : tout le style est en SCSS + CSS Modules pour un contrôle total.
- ISR (`revalidate = 300`). Accessibilité (skip-link, focus, `prefers-reduced-motion`).

### Limites connues
- Assets placeholder. Formulaire de contact non connecté. Build des polices nécessite le réseau.
