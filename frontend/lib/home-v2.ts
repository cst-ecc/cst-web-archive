export type HomePanelId =
  | "accueil"
  | "comprendre"
  | "avancement"
  | "cst"
  | "csmo"
  | "eglise-en-marche"
  | "ressources"
  | "actualites"
  | "faq";

export type BibleVerse = {
  text: string;
  reference: string;
};

export type HomeTopicCard = {
  icon: string;
  title: string;
  text: string;
};

export type HomeLinkItem = {
  label: string;
  description?: string;
  href: string;
  external?: boolean;
};

export type HomeResourceGroup = {
  title: string;
  intro: string;
  items: HomeLinkItem[];
};

export const HOME_PANELS: Array<{ id: HomePanelId; label: string }> = [
  { id: "accueil", label: "Accueil" },
  { id: "comprendre", label: "Comprendre" },
  { id: "avancement", label: "Où en sommes-nous ?" },
  { id: "cst", label: "Le CST" },
  { id: "csmo", label: "Le CSMO" },
  { id: "eglise-en-marche", label: "L’Église en marche" },
  { id: "ressources", label: "Ressources" },
  { id: "actualites", label: "Actualités" },
  { id: "faq", label: "FAQ" },
];

export const HOME_HASH_ALIASES: Record<string, HomePanelId> = {
  processus: "csmo",
  digitalisation: "eglise-en-marche",
  resources: "ressources",
};

export const HOME_LEADERSHIP_MESSAGE = {
  image: "/images/home/coordonnateur.jpeg",
  imageAlt: "Général Bertin BADA",
  title: "Coordonnateur Général",
  role: "Conseil Supérieur de Mise en œuvre (CSMo)",
  excerpt:
    "Chers frères et sœurs, membres du CSMo, recevez mes salutations fraternelles en Jésus-Christ notre Seigneur. À mesure que le processus avance, notre responsabilité collective grandit : notre communication doit éclairer, rassurer, rapprocher et préserver les conditions du dialogue et de l’unité.",
  href: "/mot-du-coordonnateur",
  paragraphs: [
    "Chers frères et sœurs, membres du CSMo,",
    "Recevez mes salutations fraternelles en Jésus-Christ notre Seigneur.",
    "Je voudrais d’abord remercier chacun de vous pour son implication, sa disponibilité et tout ce qui est déjà accompli, souvent avec beaucoup de discrétion et de sacrifice, au service de cette œuvre d’unification de notre Église.",
    "À mesure que le processus avance, gagne en visibilité et entre dans des étapes de plus en plus importantes, notre responsabilité collective grandit également, notamment dans la manière dont nous communiquons autour de cette œuvre.",
    "La Parole nous exhorte à nous appliquer « à conserver l’unité de l’Esprit par le lien de la paix » (Éphésiens 4:3), et nous rappelle que « la réponse douce calme la fureur » (Proverbes 15:1).",
    "Notre communication doit donc rester, elle aussi, au service de cette unité : éclairer, rassurer, rapprocher, préserver la confiance et maintenir les portes du dialogue ouvertes.",
    "Dans nos publications, commentaires, interviews ou interventions publiques, gardons autant que possible un langage rassembleur, respectueux de toutes les sensibilités et cohérent avec l’esprit de la mission qui nous est confiée.",
    "Veillons également à présenter le processus dans sa dimension collective et ecclésiale, avec ses organes, ses responsabilités et les différentes contributions qui le font avancer.",
    "Il ne s’agit pas d’uniformiser les expressions de chacun, mais simplement de garder à l’esprit que notre appartenance au CSMO nous confère une responsabilité particulière dans la manière dont cette démarche est comprise et perçue.",
    "Plus le processus avancera, plus notre capacité à parler avec mesure, cohérence et fraternité contribuera elle-même à créer les conditions de l’unité que nous recherchons.",
    "Puissions-nous donc continuer à être, par nos actes comme par nos paroles, des artisans de paix, de dialogue et d’unité.",
    "Que le Dieu d'Oschoffa vous bénisse tous au nom de Jésus Christ!!! Amen",
  ],
  dateLine: "Fait à Cotonou, le 15 septembre 2026",
  signatureRole: "Le Coordonnateur Général du CSMo",
  signatureName: "Bertin BADA",
};

/**
 * Source temporaire des versets du carousel.
 * Cette constante pourra être remplacée plus tard par une réponse API sans
 * modifier le composant BibleVerseCarousel.
 */
export const BIBLE_VERSES: BibleVerse[] = [
  {
    text: "Qu’ils soient tous un, afin que le monde croie…",
    reference: "Jean 17, 21",
  },
  {
    text: "Efforcez-vous de conserver l’unité de l’esprit par le lien de la paix.",
    reference: "Éphésiens 4, 3",
  },
  {
    text: "Soyez parfaitement unis dans un même esprit et dans un même sentiment.",
    reference: "1 Corinthiens 1, 10",
  },
  {
    text: "Supportez-vous les uns les autres avec amour, vous efforçant de conserver l’unité de l’Esprit.",
    reference: "Éphésiens 4, 2-3",
  },
];

export const UNDERSTAND_TOPICS: HomeTopicCard[] = [
  {
    icon: "unity",
    title: "Pourquoi l’unité ?",
    text: "Comprendre les divisions, les enjeux du rapprochement et l’espérance portée par une Église réunifiée.",
  },
  {
    icon: "path",
    title: "La démarche",
    text: "Suivre le chemin parcouru depuis la reprise du dialogue jusqu’au CST puis à la phase de mise en œuvre.",
  },
  {
    icon: "people",
    title: "Qui fait quoi ?",
    text: "Distinguer le rôle de la facilitation, du CST, du CSMO et des institutions appelées à prendre le relais.",
  },
  {
    icon: "question",
    title: "Les questions clés",
    text: "Retrouver les réponses essentielles sur la foi, la gouvernance, les textes, les finances et la participation des fidèles.",
  },
];

export const UNDERSTAND_STEPS = [
  {
    number: "01",
    title: "Renouer le dialogue",
    text: "Créer les conditions d’une rencontre durable entre les différentes composantes de l’Église et restaurer progressivement la confiance.",
  },
  {
    number: "02",
    title: "Consolider un cadre commun",
    text: "Relire les textes, harmoniser les pratiques nécessaires et préparer une gouvernance commune, lisible et durable.",
  },
  {
    number: "03",
    title: "Passer à la mise en œuvre",
    text: "Transformer les orientations retenues en actions, favoriser leur appropriation et préparer les institutions définitives.",
  },
];

export const PROCESS_PROGRESS = [
  {
    status: "Réalisé",
    tone: "done",
    items: [
      "Installation du CST et conduite de la phase de transition",
      "Travaux d’harmonisation et de consolidation des textes",
      "Remise du rapport final du CST le 30 avril 2026",
      "Mise en place du Conseil Supérieur de Mise en Œuvre",
    ],
  },
  {
    status: "En cours",
    tone: "current",
    items: [
      "Appropriation et vulgarisation du cadre commun",
      "Rapprochement des différentes composantes de l’Église",
      "Modernisation administrative, recensement et cartographie",
      "Préparation progressive des organes de l’Église réunifiée",
    ],
  },
  {
    status: "À venir",
    tone: "next",
    items: [
      "Installation progressive des institutions définitives",
      "Convocation des étapes ecclésiales prévues par les textes",
      "Passage complet de la transition à la gouvernance durable",
      "Poursuite d’une dynamique mondiale d’unité et de mission",
    ],
  },
] as const;

export const CST_SUMMARY: HomeTopicCard[] = [
  {
    icon: "target",
    title: "Mission",
    text: "Conduire la phase de dialogue, d’harmonisation et de préparation du cadre commun de la réunification.",
  },
  {
    icon: "people",
    title: "Composition",
    text: "Quinze membres issus des différentes composantes et sensibilités de l’Église.",
  },
  {
    icon: "gear",
    title: "Fonctionnement",
    text: "Des sessions de travail, des commissions et une méthode de consolidation progressive des conclusions.",
  },
  {
    icon: "document",
    title: "Aboutissement",
    text: "Un rapport final remis le 30 avril 2026 et un cadre transmis à la phase de mise en œuvre.",
  },
];

export const CST_MILESTONES = [
  { label: "Installation", value: "26 avril 2025" },
  { label: "Travaux", value: "Sessions, commissions et textes communs" },
  { label: "Rapport final", value: "30 avril 2026" },
  { label: "Transmission", value: "Passage à la mise en œuvre" },
];

export const CSMO_SUMMARY: HomeTopicCard[] = [
  {
    icon: "target",
    title: "Mission",
    text: "Assurer la mise en œuvre des orientations et recommandations issues de la phase de transition.",
  },
  {
    icon: "people",
    title: "Continuité",
    text: "Rassembler les sensibilités de l’Église autour d’une phase opérationnelle et progressive.",
  },
  {
    icon: "gear",
    title: "Chantiers",
    text: "Gouvernance, appropriation des textes, structuration territoriale, communication et digitalisation.",
  },
  {
    icon: "chart",
    title: "Cap",
    text: "Préparer l’installation des institutions définitives de l’Église réunifiée.",
  },
];

export const CSMO_WORKSTREAMS = [
  "Gouvernance et préparation des institutions",
  "Textes et cadre commun",
  "Organisation ecclésiale et déploiement",
  "Digitalisation, recensement et cartographie",
  "Communication et appropriation",
];

export const CSMO_APPROACH = [
  { title: "Écoute", text: "Prendre en compte les différentes sensibilités." },
  { title: "Dialogue", text: "Construire des solutions comprises et durables." },
  { title: "Action", text: "Mettre en œuvre avec méthode et responsabilité." },
  { title: "Suivi", text: "Mesurer l’avancement et rendre compte." },
];

export const CST_FACTS = [
  { label: "Installation", value: "26 avril 2025" },
  { label: "Mission", value: "Transition & consolidation" },
  { label: "Aboutissement", value: "Rapport final — 30 avril 2026" },
];

export const CSMO_FACTS = [
  { label: "Phase", value: "Mise en œuvre" },
  { label: "Première session", value: "2–5 juin 2026" },
  { label: "Cap", value: "Institutions définitives" },
];

export const CHURCH_IN_MOTION = [
  {
    eyebrow: "Dans nos communautés",
    title: "Faire vivre le rapprochement",
    text: "Les rencontres, restitutions et échanges locaux permettent aux fidèles de mieux comprendre le processus et de s’y reconnaître.",
  },
  {
    eyebrow: "Visages de l’unité",
    title: "Mettre les personnes au centre",
    text: "Jeunes, femmes, responsables, familles et diaspora donnent un visage concret à cette marche commune.",
  },
  {
    eyebrow: "Dans le monde",
    title: "Relier les communautés",
    text: "La dynamique dépasse les frontières et cherche à rapprocher les différentes implantations de l’Église autour d’un même cadre.",
  },
];

export const RESOURCE_GROUPS: HomeResourceGroup[] = [
  {
    title: "Documents officiels",
    intro: "Retrouver les textes et publications de référence.",
    items: [
      { label: "Décisions", description: "Actes et décisions publiés", href: "/decisions" },
      { label: "Rapports", description: "Rapports d’étape et rapport final", href: "/rapports" },
      { label: "Communiqués", description: "Communications officielles", href: "/documents?q=communiqu%C3%A9" },
      // { label: "Bibliothèque", description: "Tous les documents disponibles", href: "/documents" },
    ],
  },
  {
    title: "Comprendre le processus",
    intro: "Explorer les étapes, les acteurs et les contenus associés.",
    items: [
      { label: "Présentation du CST", description: "Mission et rôle de la transition", href: "/presentation" },
      { label: "Sessions", description: "Dates, thèmes et travaux", href: "/sessions" },
      { label: "Membres", description: "Composition du Conseil", href: "/membres" },
      { label: "Galerie", description: "Rencontres et temps forts", href: "/galerie" },
    ],
  },
  {
    title: "Outils et accès",
    intro: "Des liens pratiques pour suivre et utiliser les services du site.",
    items: [
      { label: "DIGECC", description: "Plateforme de digitalisation de l’ECC", href: "https://recensement-paroisses.ecc.bj", external: true },
      { label: "Actualités", description: "Informations et mises à jour récentes", href: "/actualites" },
      { label: "Contact", description: "Écrire à l’équipe institutionnelle", href: "/contact" },
    ],
  },
];
