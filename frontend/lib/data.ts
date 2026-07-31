/**
 * Données du CST — Phase 1 (contenu réel issu du document institutionnel).
 *
 * Ces données sont consommées uniquement via lib/api.ts.
 * Lors du branchement Django, ce fichier devient inactif.
 */
import type {
  Category,
  DocumentItem,
  Session,
  Member,
  NewsItem,
  GalleryAlbum,
  UsefulLink,
} from "./types";

/** Exemple de fichier téléchargeable (placeholder). */
export const SAMPLE_FILE = "/documents/exemple.pdf";

// ---------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------
export const CATEGORIES: Category[] = [
  { id: 1, slug: "decisions", name: "Décisions" },
  { id: 2, slug: "rapports", name: "Rapports" },
  { id: 3, slug: "pv", name: "Procès-verbaux" },
  { id: 4, slug: "communiques", name: "Communiqués" },
  { id: 5, slug: "textes", name: "Textes consolidés" },
  { id: 6, slug: "vulgarisation", name: "Documents de vulgarisation" },
];

// ---------------------------------------------------------------
// Documents (contenu réel — références fictives)
// ---------------------------------------------------------------
export const DOCUMENTS: DocumentItem[] = [
  {
    id: 1, slug: "constitution-consolidee", reference: "CST/TXT/2026-001",
    title: "Constitution consolidée de l'Église du Christianisme Céleste",
    summary: "Version consolidée de la Constitution issue des travaux de relecture et d'harmonisation menés par le CST et ses commissions.",
    kind: "texte", categorySlug: "textes", date: "2026-04-30",
    fileUrl: SAMPLE_FILE, fileType: "pdf", fileSize: 2456000, downloads: 342,
    featured: true, status: "publie",
  },
  {
    id: 2, slug: "reglement-interieur-consolide", reference: "CST/TXT/2026-002",
    title: "Règlement intérieur consolidé",
    summary: "Règlement intérieur de l'Église, élaboré et consolidé par les commissions du CST pour encadrer le fonctionnement des organes.",
    kind: "texte", categorySlug: "textes", date: "2026-04-30",
    fileUrl: SAMPLE_FILE, fileType: "pdf", fileSize: 1890000, downloads: 278,
    featured: true, status: "publie",
  },
  {
    id: 3, slug: "rapport-final-cst", reference: "CST/RAP/2026-001",
    title: "Rapport final du Conseil Supérieur de Transition",
    summary: "Synthèse des travaux des sessions, conclusions des commissions, propositions de textes, décisions et recommandations. Remis le 30 avril 2026 au Sofitel Cotonou.",
    kind: "rapport", categorySlug: "rapports", date: "2026-04-30",
    fileUrl: SAMPLE_FILE, fileType: "pdf", fileSize: 5200000, downloads: 456,
    featured: true, status: "publie",
  },
  {
    id: 4, slug: "acte-installation-cst", reference: "CST/DEC/2025-001",
    title: "Acte d'installation du CST",
    summary: "Acte officiel portant installation du Conseil Supérieur de Transition, signé à Cotonou le 26 avril 2025 sous la facilitation du Président de la République du Bénin.",
    kind: "decision", categorySlug: "decisions", date: "2025-04-26",
    fileUrl: SAMPLE_FILE, fileType: "pdf", fileSize: 890000, downloads: 312,
    featured: true, status: "publie",
  },
  {
    id: 5, slug: "acte-creation-csmo", reference: "CST/DEC/2026-003",
    title: "Acte portant mise en place du CSMO",
    summary: "Décision instituant le Conseil Supérieur de Mise en Œuvre (CSMO) pour assurer l'application des textes et recommandations du CST. Entré en vigueur le 23 mai 2026.",
    kind: "decision", categorySlug: "decisions", date: "2026-05-23",
    fileUrl: SAMPLE_FILE, fileType: "pdf", fileSize: 678000, downloads: 201,
    featured: false, status: "publie",
  },
  {
    id: 6, slug: "harmonisation-grades", reference: "CST/TXT/2026-003",
    title: "Tableau d'harmonisation des grades",
    summary: "Harmonisation des grades entre les espaces francophone et anglophone : leaders, visionnaires, Allagba et Mamans.",
    kind: "texte", categorySlug: "textes", date: "2026-03-27",
    fileUrl: SAMPLE_FILE, fileType: "pdf", fileSize: 456000, downloads: 167,
    featured: false, status: "publie",
  },
  {
    id: 7, slug: "organigramme-mondial", reference: "CST/TXT/2026-004",
    title: "Organigramme mondial de la gouvernance",
    summary: "Structure des organes mondiaux : Pasteur, Synode, Conseil Pastoral, Conseil d'Administration, Comité Exécutif, Bureau Exécutif, Conclave et départements.",
    kind: "texte", categorySlug: "textes", date: "2026-04-17",
    fileUrl: SAMPLE_FILE, fileType: "pdf", fileSize: 1100000, downloads: 234,
    featured: false, status: "publie",
  },
  {
    id: 8, slug: "pv-9e-session", reference: "CST/PV/2026-009",
    title: "Procès-verbal de la 9e session",
    summary: "Finalisation des travaux, consolidation des conclusions et préparation du rapport final. Tenue les 16 et 17 avril 2026.",
    kind: "pv", categorySlug: "pv", date: "2026-04-17",
    fileUrl: SAMPLE_FILE, fileType: "pdf", fileSize: 780000, downloads: 98,
    featured: false, status: "publie",
  },
  {
    id: 9, slug: "communique-remise-rapport", reference: "CST/COM/2026-001",
    title: "Communiqué — Remise du rapport final",
    summary: "Communiqué officiel annonçant la remise du rapport final du CST le 30 avril 2026 au Sofitel Cotonou, salle Les Collines.",
    kind: "communique", categorySlug: "communiques", date: "2026-04-30",
    fileUrl: SAMPLE_FILE, fileType: "pdf", fileSize: 345000, downloads: 156,
    featured: false, status: "publie",
  },
];

// ---------------------------------------------------------------
// Sessions (contenu réel)
// ---------------------------------------------------------------
export const SESSIONS: Session[] = [
  {
    id: 1, slug: "installation-cst", number: 0,
    title: "Installation officielle du CST", theme: "Mise en place du Conseil",
    summary: "Installation officielle du Conseil Supérieur de Transition à Cotonou, sous la facilitation du Président de la République du Bénin.",
    startDate: "2025-04-26", endDate: "2025-04-26",
    location: "Cotonou", imageUrls: ["/images/session-1.svg"],
    documentSlugs: ["acte-installation-cst"], status: "publie",
  },
  {
    id: 2, slug: "5e-session", number: 5,
    title: "5e session du CST", theme: "Réunification et orientations institutionnelles",
    summary: "Poursuite des travaux de réunification, examen des textes et préparation des orientations institutionnelles.",
    startDate: "2025-10-28", endDate: "2025-10-31",
    location: "Cotonou", imageUrls: ["/images/session-2.svg"],
    documentSlugs: [], status: "publie",
  },
  {
    id: 3, slug: "6e-session", number: 6,
    title: "6e session du CST", theme: "Textes fondamentaux et consensus",
    summary: "Approfondissement des textes fondamentaux, concertations et recherche de consensus entre les différentes composantes.",
    startDate: "2025-11-24", endDate: "2025-11-29",
    location: "Cotonou", imageUrls: ["/images/session-3.svg"],
    documentSlugs: [], status: "publie",
  },
  {
    id: 4, slug: "7e-session", number: 7,
    title: "7e session du CST", theme: "Gouvernance et consolidation des textes",
    summary: "Examen des propositions de gouvernance et poursuite de la consolidation des textes de l'Église.",
    startDate: "2026-01-08", endDate: "2026-01-10",
    location: "Cotonou", imageUrls: [],
    documentSlugs: [], status: "publie",
  },
  {
    id: 5, slug: "8e-session", number: 8,
    title: "8e session du CST", theme: "Organes et déploiement diocésain",
    summary: "Examen des modalités de constitution des organes et du programme de déploiement des groupes CST dans les diocèses.",
    startDate: "2026-02-24", endDate: "2026-02-26",
    location: "Cotonou", imageUrls: [],
    documentSlugs: [], status: "publie",
  },
  {
    id: 6, slug: "9e-session", number: 9,
    title: "9e session du CST", theme: "Finalisation et rapport final",
    summary: "Finalisation des travaux, consolidation des conclusions et préparation du rapport final du CST.",
    startDate: "2026-04-16", endDate: "2026-04-17",
    location: "Cotonou", imageUrls: [],
    documentSlugs: ["pv-9e-session", "rapport-final-cst"], status: "publie",
  },
];

// ---------------------------------------------------------------
// Membres identifiés
// ---------------------------------------------------------------
export const MEMBERS: Member[] = [
  {
    id: 1, slug: "coordonnateur-general", fullName: "Général d'Armée Aérienne Bertin BADA",
    role: "Coordonnateur Général", responsibility: "Coordination générale du CST puis du CSMO",
    photoUrl: "/images/membre.svg", bio: "", order: 1, status: "publie",
  },
  {
    id: 2, slug: "2e-coordonnateur-adjoint", fullName: "Jean Sènou KOKOYÈ",
    role: "2e Coordonnateur Adjoint", responsibility: "Préparation des documents des sessions",
    photoUrl: "/images/membre.svg", bio: "", order: 2, status: "publie",
  },
  {
    id: 3, slug: "secretaire-administratif", fullName: "Léonard ASSOGBA",
    role: "Secrétaire Administratif", responsibility: "Appui organisationnel, administratif et logistique du CST",
    photoUrl: "/images/membre.svg", bio: "", order: 3, status: "publie",
  },
];

// ---------------------------------------------------------------
// Actualités
// ---------------------------------------------------------------
export const NEWS: NewsItem[] = [
  {
    id: 1, slug: "remise-rapport-final",
    title: "Remise du rapport final du CST",
    excerpt: "Le rapport final du Conseil Supérieur de Transition a été officiellement remis le 30 avril 2026 au Sofitel Cotonou.",
    content: "Le rapport final du Conseil Supérieur de Transition a été officiellement remis le 30 avril 2026 à 12 h 30, au Sofitel Cotonou, dans la salle Les Collines.\n\nCe rapport a synthétisé les travaux des sessions, les conclusions des commissions, les résultats du dialogue, les propositions de textes, les principales décisions, les recommandations, les mesures nécessaires à la mise en œuvre et les perspectives institutionnelles de l'Église.\n\nLa remise du rapport final a marqué la clôture de la phase principale de transition conduite par le CST et l'ouverture de la phase de mise en œuvre.",
    imageUrl: "/images/actu-1.svg", date: "2026-04-30",
    relatedDocumentSlugs: ["rapport-final-cst", "communique-remise-rapport"],
    status: "publie",
  },
  {
    id: 2, slug: "installation-csmo",
    title: "Installation officielle du CSMO",
    excerpt: "Le Conseil Supérieur de Mise en Œuvre a tenu sa première session du 2 au 5 juin 2026 à Cotonou.",
    content: "Le Conseil Supérieur de Mise en Œuvre a tenu sa première session du 2 au 5 juin 2026 à Cotonou. La cérémonie d'installation de ses membres s'est déroulée le 4 juin 2026, au Sofitel Cotonou, dans la salle Le Dôme.\n\nCette nouvelle phase doit permettre la vulgarisation des textes, l'installation des organes, le déploiement dans les diocèses, la mise en œuvre de la cartographie ecclésiale, la préparation du Synode et du conclave, la modernisation administrative, la digitalisation et le suivi des décisions issues du CST.",
    imageUrl: "/images/actu-2.svg", date: "2026-06-04",
    relatedDocumentSlugs: ["acte-creation-csmo"],
    status: "publie",
  },
  {
    id: 3, slug: "mission-cote-divoire",
    title: "Séances d'information en Côte d'Ivoire",
    excerpt: "Du 24 au 27 mars 2026, des séances d'information ont été menées en Côte d'Ivoire pour présenter l'avancement des travaux.",
    content: "Du 24 au 27 mars 2026, des séances d'information ont été menées en Côte d'Ivoire. Cette activité s'inscrivait dans la volonté d'informer les responsables et fidèles, de présenter l'évolution des travaux, de favoriser l'appropriation du processus et de renforcer la dimension internationale de la réunification.",
    imageUrl: "/images/actu-3.svg", date: "2026-03-27",
    relatedDocumentSlugs: [],
    status: "publie",
  },
];

// ---------------------------------------------------------------
// Albums & Liens utiles
// ---------------------------------------------------------------
export const ALBUMS: GalleryAlbum[] = [
  {
    id: 1, title: "Installation du CST — 26 avril 2025", description: "Cérémonie d'installation officielle à Cotonou.", date: "2025-04-26",
    images: [
      { id: 1, title: "Cérémonie d'installation", imageUrl: "/images/session-1.svg" },
    ],
    status: "publie",
  },
];

export const USEFUL_LINKS: UsefulLink[] = [
  { id: 1, label: "Église du Christianisme Céleste", url: "https://www.ecc-international.org" },
];
