# TESTS — Frontend CST (Phase 1)

## 1. Commandes

```bash
npm run type-check   # 0 erreur
npm run lint         # 0 erreur bloquante
npm run build        # doit réussir
npm run dev          # http://localhost:3000
```

## 2. Scénarios manuels

Identiques au précédent livrable : accueil, bibliothèque (recherche/filtres/tri/pagination), détail document (fiche + téléchargement), décisions/rapports (catégorie verrouillée), sessions + détail, membres, actualités + détail, galerie (visionneuse + Échap), contact (validation), 404, robots.txt, sitemap.xml.

## 3. Tests SCSS

- **Aucune classe Tailwind résiduelle** :
  ```bash
  grep -rn --include="*.tsx" 'className="[^"]*\b(bg-|text-|p-|m-|flex-|grid-|rounded-|border-|shadow-)' app components && echo "ALERTE" || echo "OK"
  ```
- **Aucun import tailwind/postcss** :
  ```bash
  grep -rn "tailwind\|postcss" app components lib --include="*.tsx" --include="*.ts" --include="*.scss" || echo "OK"
  ```
- **globals.scss (pas .css)** :
  ```bash
  grep -rn "globals.css" app && echo "ALERTE" || echo "OK"
  ```

## 4. Tests couche données

- Isolation : `grep -rn 'from "@/lib/data"' app components || echo "OK"`
- Bascule : `NEXT_PUBLIC_DATA_SOURCE=api` + URL factice → erreur réseau = preuve.

## 5. Tests sécurité

- `grep -rn "dangerouslySetInnerHTML" app components` → vide.
- Passer un élément en `status: "brouillon"` dans `data.ts` → disparaît des listes, détail → 404.
