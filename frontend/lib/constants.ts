/** Constantes globales de la plateforme institutionnelle CST / CSMO. */

export const SITE = {
  name: "Église du Christianisme Céleste",
  fullName: "CST & CSMo",
  processName: "La Grande Marche vers l’Unité",
  institution: "Église du Christianisme Céleste",
  title: "CST & CSMo — La Grande Marche vers l’Unité",
  description:
    "Plateforme institutionnelle consacrée aux travaux du Conseil Supérieur de Transition (CST), à leur mise en œuvre par le Conseil Supérieur de Mise en Œuvre (CSMo) et aux chantiers de modernisation et de digitalisation de l'Église du Christianisme Céleste.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "contact@ecc.bj",
  phone: "+229 0148 899 999 | +229 01 498 999 999",
  locale: "fr_FR",
  motto: "Une même foi — Une même vision — Une même Église.",
  digitalisationUrl: "https://recensement-paroisses.ecc.bj",
};

export type NavLink = {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
  accent?: boolean;
};

export type NavItem = NavLink & {
  children?: NavLink[];
};

/**
 * Navigation V2 de la page d'accueil.
 *
 * Les entrées principales pointent vers les panneaux internes de la landing
 * page. Les trois entrées du dropdown Actualités réutilisent exclusivement des
 * routes déjà présentes dans le projet. Les communiqués s'appuient sur la
 * recherche documentaire existante, ce qui évite d'introduire une nouvelle
 * route tant qu'une page dédiée n'existe pas.
 */
export const HOME_NAV_LINKS: NavItem[] = [
  { label: "Accueil", href: "/#accueil" },
  { label: "Comprendre", href: "/#comprendre" },
  { label: "Où en sommes-nous ?", href: "/#avancement" },
  { label: "Le CST", href: "/#cst" },
  { label: "Le CSMo", href: "/#csmo" },
  { label: "L’Église en marche", href: "/#eglise-en-marche" },
  { label: "Ressources", href: "/#ressources" },
  {
    label: "Actualités",
    href: "/#actualites",
    children: [
      {
        label: "Galerie",
        href: "/galerie",
        description: "Photos, rencontres et temps forts",
      },
      {
        label: "Communiqués",
        href: "/documents?q=communiqu%C3%A9",
        description: "Retrouver les communiqués dans la bibliothèque",
      },
      {
        label: "Contact",
        href: "/contact",
        description: "Contacter l'équipe institutionnelle",
      },
    ],
  },
  { label: "FAQ", href: "/#faq" },
];

/**
 * Navigation historique des pages internes.
 *
 * Elle reste volontairement inchangée dans la V2 afin que la refonte de la
 * page d'accueil n'altère pas les routes ni l'expérience des pages existantes.
 */
export const NAV_LINKS: NavItem[] = [
  {
    label: "Accueil",
    href: "/",
  },
  {
    label: "CST",
    href: "/presentation",
    children: [
      {
        label: "Présentation",
        href: "/presentation",
        description: "Mission, vision et rôle de la phase de transition",
      },
      {
        label: "Membres",
        href: "/membres",
        description: "Composition du Conseil Supérieur de Transition",
      },
      {
        label: "Sessions",
        href: "/sessions",
        description: "Les sessions de travail du Conseil",
      },
      {
        label: "Décisions",
        href: "/decisions",
        description: "Décisions et actes officiels du CST",
      },
      {
        label: "Rapports",
        href: "/rapports",
        description: "Rapports d'étape, thématiques et rapport final",
      },
      {
        label: "Documents",
        href: "/documents",
        description: "Bibliothèque documentaire complète",
      },
    ],
  },
  {
    label: "CSMo",
    href: "/#csmo",
    children: [
      {
        label: "Présentation & continuité",
        href: "/#csmo",
        description: "Du CST à la phase de mise en œuvre",
      },
      {
        label: "Digitalisation",
        href: "/#eglise-en-marche",
        description: "Un chantier structurant de modernisation de l'ECC",
      },
      {
        label: "Questions fréquentes",
        href: "/#faq",
        description: "Comprendre le rôle du CSMO et la réunification",
      },
    ],
  },
  {
    label: "FAQ",
    href: "/#faq",
  },
  {
    label: "Communication",
    href: "/actualites",
    children: [
      {
        label: "Actualités",
        href: "/actualites",
        description: "Informations et communications récentes",
      },
      {
        label: "Galerie",
        href: "/galerie",
        description: "Photos, rencontres et temps forts",
      },
      {
        label: "Contact",
        href: "/contact",
        description: "Contacter l'équipe institutionnelle",
      },
    ],
  },
  {
    label: "DIGECC",
    href: SITE.digitalisationUrl,
    description: "Plateforme de digitalisation de l'ECC",
    external: true,
    accent: true,
  },
];

export const HOME_FEATURED_VIDEO = {
  youtubeId: "DdwASh5wWkY",
  title: "Remise du rapport final du CST au Facilitateur.",
  description: "Revivez la cérémonie officielle de remise du rapport final du Conseil Supérieur de Transition (CST) de l’Église du Christianisme Céleste à Son Excellence Monsieur Patrice TALON, alors Président de la République du Bénin, le 30 avril 2026 à Cotonou.",
};

export type FooterGroup = {
  title: string;
  links: NavLink[];
};

/** Liens volontairement plus synthétiques que la navigation principale. */
export const FOOTER_GROUPS: FooterGroup[] = [
  {
    title: "Le processus",
    links: [
      { label: "Le CST", href: "/presentation" },
      { label: "Le CSMo", href: "/#csmo" },
      { label: "Questions fréquentes", href: "/#faq" },
      {
        label: "Digitalisation de l'ECC",
        href: SITE.digitalisationUrl,
        external: true,
      },
    ],
  },
  {
    title: "Explorer",
    links: [
      { label: "Documents", href: "/documents" },
      { label: "Actualités", href: "/actualites" },
      { label: "Galerie", href: "/galerie" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/** Labels des types de documents. */
export const KIND_LABELS: Record<string, string> = {
  document: "Document",
  decision: "Décision",
  rapport: "Rapport",
  proces_verbal: "Procès-verbal",
  compte_rendu: "Compte rendu",
  note: "Note",
  communique: "Communiqué",
  annexe: "Annexe",
  texte_consolide: "Texte consolidé",
  vulgarisation: "Vulgarisation",
  autre: "Document",

  // Compatibilité avec les anciens libellés/slugs utilisés au début du projet.
  pv: "Procès-verbal",
  texte: "Texte consolidé",
};

/** Taille de page par défaut pour la pagination. */
export const DEFAULT_PAGE_SIZE = 6;

/** Seuil à partir duquel le navbar passe de l'état hero à l'état solide. */
export const NAVBAR_SCROLL_THRESHOLD = 50;
