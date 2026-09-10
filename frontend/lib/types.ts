/**
 * Types du domaine CST.
 *
 * Ces interfaces sont pensées comme le futur contrat de l'API Django (DRF).
 * Les composants ne doivent JAMAIS coder des contenus en dur : ils consomment
 * uniquement ces types via la couche d'accès `lib/api.ts`.
 *
 * Convention de nommage : identique à ce qu'exposera un ModelSerializer DRF
 * (id numérique, slug, dates ISO 8601, statut de publication).
 */

export type PublicationStatus = "brouillon" | "publie" | "archive";

export type DocumentKind =
  | "document"
  | "decision"
  | "rapport"
  | "proces_verbal"
  | "compte_rendu"
  | "note"
  | "communique"
  | "annexe"
  | "texte_consolide";

export interface Category {
  id: number;
  slug: string;
  name: string;
  /** Type documentaire principal rattaché à la catégorie. */
  kind: DocumentKind;
  description?: string;
}

export interface DocumentItem {
  id: number;
  slug: string;
  title: string;
  reference: string; // ex. "CST/DEC/2024-014"
  categorySlug: string;
  kind: DocumentKind;
  /** Date de publication du document (ISO 8601, ex. "2024-05-12"). */
  date: string;
  summary: string;
  /** Chemin/URL du fichier. En phase mock : chemin dans /public. */
  fileUrl: string;
  fileType: "pdf" | "docx" | "xlsx" | "image" | "autre";
  /** Taille en octets (formatée à l'affichage). */
  fileSize: number;
  status: PublicationStatus;
  featured: boolean;
  downloads: number;
  /** Sessions liées (slugs). */
  relatedSessionSlugs?: string[];
}

export interface Session {
  id: number;
  slug: string;
  number: number;
  title: string;
  theme: string;
  location: string;
  /** Période au format ISO ; endDate optionnelle. */
  startDate: string;
  endDate?: string;
  summary: string;
  status: PublicationStatus;
  documentSlugs: string[];
  imageUrls: string[];
}

export interface Member {
  id: number;
  slug: string;
  fullName: string;
  role: string; // fonction officielle
  responsibility?: string; // rôle / attributions
  photoUrl: string;
  bio?: string;
  order: number;
  status: PublicationStatus;
}

export interface NewsItem {
  id: number;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  imageUrl: string;
  /** Texte alternatif de l’image, si différent du titre. */
  imageAlt?: string;
  content: string; // texte simple (paragraphes séparés par \n\n)
  /** Permet de choisir explicitement une actualité mise en avant. */
  featured?: boolean;
  status: PublicationStatus;
  relatedDocumentSlugs?: string[];
}

export interface GalleryImage {
  id: number;
  title: string;
  imageUrl: string;
  /** Texte alternatif descriptif de la photographie. */
  alt?: string;
  /** Dimensions utiles au rendu masonry et à Next/Image. */
  width?: number;
  height?: number;
}

export interface GalleryAlbum {
  id: number;
  slug: string;
  title: string;
  date: string;
  description?: string;
  coverUrl: string;
  images: GalleryImage[];
  relatedSessionSlug?: string;
  status: PublicationStatus;
}

export interface UsefulLink {
  id: number;
  label: string;
  url: string;
}

export interface SiteStats {
  documents: number;
  sessions: number;
  members: number;
  albums: number;
}

/** Enveloppe paginée, calquée sur la pagination DRF (`PageNumberPagination`). */
export interface Paginated<T> {
  count: number;
  page: number;
  pageSize: number;
  results: T[];
}

/** Filtres acceptés par la bibliothèque documentaire. */
export interface DocumentQuery {
  search?: string;
  categorySlug?: string;
  kind?: DocumentKind;
  year?: number;
  ordering?: "recent" | "ancien" | "titre" | "populaire";
  page?: number;
  pageSize?: number;
}
