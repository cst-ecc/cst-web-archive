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
  | "texte_consolide"
  | "vulgarisation"
  | "autre";

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
  fileUrl: string | null;
  /** Ancienne URL de téléchargement conservée pour compatibilité API ; non utilisée dans l’interface publique. */
  downloadUrl?: string | null;
  fileType: "pdf" | "docx" | "xlsx" | "image" | "autre";
  /** Taille en octets (formatée à l'affichage). */
  fileSize: number;
  /** Libellé de taille déjà formaté côté API, si disponible. */
  sizeLabel?: string;
  /** Nombre de pages, si renseigné côté back-office. */
  pages?: number;
  status: PublicationStatus;
  featured: boolean;
  downloads: number;
  /** Nombre d’ouvertures demandées via l’action de lecture intégrée. */
  openCount?: number;
  /** Document soumis à une autorisation préalable. */
  isConfidential?: boolean;
  /** Indique si la lecture publique directe est possible. */
  canRead?: boolean;
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
  /** Contenu éditorial de l’article Session lorsqu’il est disponible. */
  content?: string;
  status: PublicationStatus;
  documentSlugs: string[];
  /** Documents associés déjà préchargés depuis l’article, si disponibles. */
  documents?: DocumentItem[];
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

export interface NewsCategoryRef {
  slug: string;
  name: string;
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
  /** Catégorie éditoriale de l’article (Session, Rapport, Communiqué, etc.). */
  category?: NewsCategoryRef;
  /** Documents officiels associés, préchargés par l’API lorsqu’ils sont publiés. */
  documents?: DocumentItem[];
  /** Slugs conservés pour compatibilité avec l’ancienne couche de données. */
  relatedDocumentSlugs?: string[];

  /** Métadonnées facultatives d’un article de catégorie Session. */
  sessionNumber?: number;
  sessionTheme?: string;
  sessionLocation?: string;
  sessionStartDate?: string;
  sessionEndDate?: string;

  /**
 * Emplacement éditorial spécifique sur l'accueil.
 * L'absence de valeur correspond à une actualité classique.
 */
  homeSlot?: NewsHomeSlot;

  /**
   * PDF, communiqué ou flyer associé à l'article.
   */
  attachment?: NewsAttachment;

  /**
   * Date de l'événement si différente de la date de publication.
   */
  eventDate?: string;
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

export interface NewsQuery {
  categorySlug?: string;
  documentKind?: DocumentKind;
  featured?: boolean;
}

export type NewsHomeSlot =
  | "alert_info"
  | "upcoming_event";

export type NewsAttachmentType =
  | "pdf"
  | "image";

export interface NewsAttachment {
  type: NewsAttachmentType;

  /**
   * URL réelle du PDF ou de l'image.
   * Ex. /media/news/communique.pdf
   */
  url: string;

  /**
   * Image de prévisualisation facultative.
   * Très utile pour afficher la couverture d'un PDF.
   */
  previewUrl?: string;

  /**
   * Ex. "Communiqué officiel — PDF"
   */
  label?: string;
}