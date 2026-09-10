/** Constantes globales de la plateforme institutionnelle CST / CSMO. */

export const SITE = {
  name: "Église du Christianisme Céleste",
  fullName: "CST & CSMO",
  processName: "La Grande Marche vers l’Unité",
  institution: "Église du Christianisme Céleste",
  title: "CST & CSMO — La Grande Marche vers l’Unité",
  description:
    "Plateforme institutionnelle consacrée aux travaux du Conseil Supérieur de Transition (CST), à leur mise en œuvre par le Conseil Supérieur de Mise en Œuvre (CSMO) et aux chantiers de modernisation et de digitalisation de l'Église du Christianisme Céleste.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "contact@ecc.bj",
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
 * Navigation principale.
 *
 * Étape 2 : les routes CSMO dédiées ne sont pas encore créées.
 * Les entrées CSMO s'appuient donc volontairement sur les sections de la
 * landing page et les pages transversales déjà existantes afin de ne créer
 * aucun lien mort.
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
    label: "CSMO",
    href: "/#processus",
    children: [
      {
        label: "Présentation & continuité",
        href: "/#processus",
        description: "Du CST à la phase de mise en œuvre",
      },
      {
        label: "Digitalisation",
        href: "/#digitalisation",
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
      { label: "Le CSMO", href: "/#processus" },
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
