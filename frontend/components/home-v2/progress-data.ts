export type ProcessPyramidStep = {
  id: number;
  title: string;
  shortTitle: string;
};

/**
 * Feuille de route issue de « PYRAMIDE DU CST (REVUE) ».
 * Cette structure reste indépendante du rendu afin de pouvoir être remplacée
 * plus tard par des données provenant d'une API.
 */
export const CST_PYRAMID_STEPS: ProcessPyramidStep[] = [
  {
    id: 1,
    title:
      "26 avril 2025 : mise en place du CST et élection du Comité exécutif le 08 mai 2026",
    shortTitle: "Mise en place du CST",
  },
  {
    id: 2,
    title:
      "Ordre de culte - textes bibliques - cantiques - grades - tenues sacerdotales",
    shortTitle: "Harmonisation des pratiques",
  },
  {
    id: 3,
    title: "Harmonisation des textes après 7 sessions du CST",
    shortTitle: "Harmonisation des textes",
  },
  {
    id: 4,
    title: "Déploiement pour constitution des organes diocésains",
    shortTitle: "Déploiement diocésain",
  },
  {
    id: 5,
    title: "Étape de validation du Sacré Collège et nomination",
    shortTitle: "Validation et nomination",
  },
  {
    id: 6,
    title: "Synode - Conclave",
    shortTitle: "Synode et Conclave",
  },
  {
    id: 7,
    title: "Pasteur",
    shortTitle: "Pasteur",
  },
];

export const CST_CURRENT_PYRAMID_STEP = 4;
