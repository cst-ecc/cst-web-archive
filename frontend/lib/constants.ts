/** Constantes globales du site CST. */

export const SITE = {
  name: "Église du Christianisme Céleste",
  fullName: "Conseil Supérieur de Transition",
  institution: "Église du Christianisme Céleste",
  title: "CST — Conseil Supérieur de Transition",
  description:
    "Site officiel du Conseil Supérieur de Transition de l'Église du Christianisme Céleste. Réunification, réforme institutionnelle et modernisation de la gouvernance.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "contact@ecc.bj",
  locale: "fr_FR",
  motto: "Une même foi — Une même vision — Une même Église.",
};

/** Structure de navigation avec dropdowns (style institutionnel). */
export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
};

export const NAV_LINKS: NavItem[] = [
  {
    label: "CST",
    href: "/presentation",
    children: [
      { label: "Présentation", href: "/presentation", description: "Mission, vision et objectifs" },
      { label: "Composition", href: "/membres", description: "Les membres du Conseil" },
      { label: "Sessions", href: "/sessions", description: "Sessions de travail" },
    ],
  },
  {
    label: "CSMo",
    href: "/presentation",
    children: [
      { label: "Présentation", href: "/presentation", description: "Mission, vision et objectifs" },
      { label: "Composition", href: "/membres", description: "Les membres du Conseil" },
      { label: "Sessions", href: "/sessions", description: "Sessions de travail" },
    ],
  },
  {
    label: "Travaux",
    href: "/documents",
    children: [
      { label: "Documents", href: "/documents", description: "Bibliothèque documentaire" },
      { label: "Décisions", href: "/decisions", description: "Décisions officielles" },
      { label: "Rapports", href: "/rapports", description: "Rapports d'activité" },
    ],
  },
  {
    label: "Communication",
    href: "/actualites",
    children: [
      { label: "Actualités", href: "/actualites", description: "Informations récentes" },
      { label: "Galerie", href: "/galerie", description: "Photos et médias" },
      { label: "Contact", href: "/contact", description: "Nous joindre" },
    ],
  },
];

/** Labels des types de documents. */
export const KIND_LABELS: Record<string, string> = {
  decision: "Décision",
  rapport: "Rapport",
  pv: "Procès-verbal",
  communique: "Communiqué",
  texte: "Texte consolidé",
  autre: "Document",
};

/** Taille de page par défaut pour la pagination. */
export const DEFAULT_PAGE_SIZE = 6;
