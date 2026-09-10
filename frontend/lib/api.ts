/**
 * COUCHE D'ACCÈS AUX DONNÉES — POINT DE BASCULE VERS DJANGO.
 *
 * Migration progressive :
 * - NEXT_PUBLIC_DATA_SOURCE=mock conserve le fonctionnement historique ;
 * - NEXT_PUBLIC_NEWS_SOURCE=api branche uniquement les Actualités ;
 * - NEXT_PUBLIC_GALLERY_SOURCE=api branche uniquement la Galerie ;
 * - NEXT_PUBLIC_DOCUMENTS_SOURCE=api branche uniquement les Documents ;
 * - NEXT_PUBLIC_DATA_SOURCE=api servira plus tard pour basculer tous les modules.
 */
import {
  ALBUMS as rawAlbums,
  CATEGORIES as rawCategories,
  DOCUMENTS as rawDocuments,
  MEMBERS as rawMembers,
  NEWS as rawNews,
  SESSIONS as rawSessions,
  USEFUL_LINKS as rawLinks,
} from "./data";
import { DEFAULT_PAGE_SIZE } from "./constants";
import { normalize } from "./utils";
import type {
  Category,
  DocumentItem,
  DocumentQuery,
  GalleryAlbum,
  Member,
  NewsItem,
  Paginated,
  Session,
  SiteStats,
  UsefulLink,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const USE_API =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "api" && Boolean(API_BASE);

const USE_NEWS_API =
  Boolean(API_BASE) &&
  (process.env.NEXT_PUBLIC_NEWS_SOURCE === "api" || USE_API);

const USE_GALLERY_API =
  Boolean(API_BASE) &&
  (process.env.NEXT_PUBLIC_GALLERY_SOURCE === "api" || USE_API);

const USE_DOCUMENTS_API =
  Boolean(API_BASE) &&
  (process.env.NEXT_PUBLIC_DOCUMENTS_SOURCE === "api" || USE_API);

class ApiFetchError extends Error {
  status: number;
  path: string;
  detail: string;

  constructor(path: string, status: number, detail = "") {
    super(`API ${path} — statut ${status}${detail ? ` — ${detail}` : ""}`);
    this.name = "ApiFetchError";
    this.status = status;
    this.path = path;
    this.detail = detail;
  }
}

/**
 * Helper générique backend Django/DRF.
 */
async function apiFetch<T>(path: string): Promise<T> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL n'est pas défini.");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const detail = body.replace(/\s+/g, " ").trim().slice(0, 220);
    throw new ApiFetchError(path, res.status, detail);
  }

  return (await res.json()) as T;
}

async function safeApiFetch<T>(
  path: string,
  moduleName: string,
): Promise<T | null> {
  try {
    return await apiFetch<T>(path);
  } catch (error) {
    console.warn(`[CST] API ${moduleName} indisponible, fallback mock :`, error);
    return null;
  }
}

/** N'exposer publiquement que les contenus « publié ». */
const isPublic = <T extends { status: string }>(x: T) => x.status === "publie";

function normalizePublicNews(items: NewsItem[]): NewsItem[] {
  return items
    .filter(isPublic)
    .filter((item) => Boolean(item.slug && item.title && item.date))
    .map((item) => ({
      ...item,
      imageAlt: item.imageAlt ?? item.title,
      featured: Boolean(item.featured),
      relatedDocumentSlugs: item.relatedDocumentSlugs ?? [],
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function normalizePublicAlbums(items: GalleryAlbum[]): GalleryAlbum[] {
  return items
    .filter(isPublic)
    .filter((album) => Boolean(album.slug && album.title && album.date))
    .map((album) => ({
      ...album,
      description: album.description ?? "",
      relatedSessionSlug: album.relatedSessionSlug ?? undefined,
      images: (album.images ?? []).map((image) => ({
        ...image,
        alt: image.alt ?? image.title,
      })),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function normalizePublicDocuments(items: DocumentItem[]): DocumentItem[] {
  return items
    .filter(isPublic)
    .filter((document) => Boolean(document.slug && document.title && document.date))
    .map((document) => ({
      ...document,
      summary: document.summary ?? "",
      reference: document.reference ?? "",
      downloads: Number(document.downloads ?? 0),
      pages: document.pages ?? undefined,
      sizeLabel: document.sizeLabel ?? "",
      featured: Boolean(document.featured),
    }));
}

function sortDocuments(
  items: DocumentItem[],
  ordering: DocumentQuery["ordering"] = "recent",
): DocumentItem[] {
  switch (ordering) {
    case "ancien":
      return [...items].sort((a, b) => a.date.localeCompare(b.date));
    case "titre":
      return [...items].sort((a, b) => a.title.localeCompare(b.title, "fr"));
    case "populaire":
      return [...items].sort((a, b) => b.downloads - a.downloads);
    case "recent":
    default:
      return [...items].sort((a, b) => b.date.localeCompare(a.date));
  }
}

function filterMockDocuments(
  items: DocumentItem[],
  query: DocumentQuery,
): DocumentItem[] {
  let filtered = items.filter(isPublic);

  if (query.categorySlug) {
    filtered = filtered.filter((d) => d.categorySlug === query.categorySlug);
  }
  if (query.kind) {
    filtered = filtered.filter((d) => d.kind === query.kind);
  }
  if (query.year) {
    filtered = filtered.filter((d) => new Date(d.date).getFullYear() === query.year);
  }
  if (query.search) {
    const q = normalize(query.search);
    filtered = filtered.filter(
      (d) =>
        normalize(d.title).includes(q) ||
        normalize(d.summary).includes(q) ||
        normalize(d.reference).includes(q),
    );
  }

  return filtered;
}

function paginateDocuments(
  items: DocumentItem[],
  query: DocumentQuery = {},
): Paginated<DocumentItem> {
  const ordered = sortDocuments(items, query.ordering);
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const start = (page - 1) * pageSize;

  return {
    count: ordered.length,
    page,
    pageSize,
    results: ordered.slice(start, start + pageSize),
  };
}

const mockNews = () => normalizePublicNews(rawNews);
const mockAlbums = () => normalizePublicAlbums(rawAlbums);
const mockDocuments = (query: DocumentQuery = {}) =>
  paginateDocuments(filterMockDocuments(rawDocuments, query), query);

// ------------------------------------------------------------------
// CATÉGORIES
// ------------------------------------------------------------------
export async function getCategories(): Promise<Category[]> {
  if (USE_API) return apiFetch<Category[]>("/categories/");
  return rawCategories;
}

// ------------------------------------------------------------------
// DOCUMENTS
// ------------------------------------------------------------------
export async function getDocuments(
  query: DocumentQuery = {},
): Promise<Paginated<DocumentItem>> {
  if (USE_DOCUMENTS_API) {
    const p = new URLSearchParams();

    if (query.search) p.set("search", query.search);
    if (query.categorySlug) p.set("category", query.categorySlug);
    if (query.kind) p.set("kind", query.kind);
    if (query.year) p.set("year", String(query.year));
    if (query.ordering) p.set("ordering", query.ordering);

    const suffix = p.toString() ? `?${p.toString()}` : "";
    const items = await safeApiFetch<DocumentItem[]>(
      `/documents/${suffix}`,
      "Documents",
    );

    if (items) {
      return paginateDocuments(normalizePublicDocuments(items), query);
    }
  }

  return mockDocuments(query);
}

export async function getDocumentBySlug(
  slug: string,
): Promise<DocumentItem | null> {
  if (USE_DOCUMENTS_API) {
    try {
      const item = await apiFetch<DocumentItem>(`/documents/${slug}/`);
      return isPublic(item) ? normalizePublicDocuments([item])[0] ?? null : null;
    } catch (error) {
      if (error instanceof ApiFetchError && error.status === 404) {
        return null;
      }

      console.warn("[CST] Détail Documents indisponible, fallback mock :", error);
      return rawDocuments.find((d) => d.slug === slug && isPublic(d)) ?? null;
    }
  }

  return rawDocuments.find((d) => d.slug === slug && isPublic(d)) ?? null;
}

export async function getFeaturedDocuments(limit = 4): Promise<DocumentItem[]> {
  if (USE_DOCUMENTS_API) {
    const items = await safeApiFetch<DocumentItem[]>(
      "/documents/?featured=1",
      "Documents",
    );

    if (items) {
      return sortDocuments(normalizePublicDocuments(items), "recent").slice(0, limit);
    }
  }

  return normalizePublicDocuments(rawDocuments)
    .filter((d) => d.featured)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export async function getRecentDocuments(limit = 6): Promise<DocumentItem[]> {
  const { results } = await getDocuments({ ordering: "recent", pageSize: limit });
  return results;
}

/** Années distinctes présentes (pour les filtres). */
export async function getDocumentYears(): Promise<number[]> {
  let source = normalizePublicDocuments(rawDocuments);

  if (USE_DOCUMENTS_API) {
    const items = await safeApiFetch<DocumentItem[]>("/documents/", "Documents");
    if (items) {
      source = normalizePublicDocuments(items);
    }
  }

  const years = new Set(source.map((d) => new Date(d.date).getFullYear()));
  return [...years].sort((a, b) => b - a);
}

// ------------------------------------------------------------------
// SESSIONS
// ------------------------------------------------------------------
export async function getSessions(): Promise<Session[]> {
  if (USE_API) return apiFetch<Session[]>("/sessions/");
  return rawSessions.filter(isPublic).sort((a, b) => b.number - a.number);
}

export async function getSessionBySlug(slug: string): Promise<Session | null> {
  if (USE_API) {
    try {
      return await apiFetch<Session>(`/sessions/${slug}/`);
    } catch {
      return null;
    }
  }
  return rawSessions.find((s) => s.slug === slug && isPublic(s)) ?? null;
}

export async function getRecentSessions(limit = 3): Promise<Session[]> {
  return (await getSessions()).slice(0, limit);
}

// ------------------------------------------------------------------
// MEMBRES
// ------------------------------------------------------------------
export async function getMembers(): Promise<Member[]> {
  if (USE_API) return apiFetch<Member[]>("/members/");
  return rawMembers.filter(isPublic).sort((a, b) => a.order - b.order);
}

// ------------------------------------------------------------------
// ACTUALITÉS
// ------------------------------------------------------------------
export async function getNews(): Promise<NewsItem[]> {
  if (USE_NEWS_API) {
    const items = await safeApiFetch<NewsItem[]>("/news/", "Actualités");
    if (items) return normalizePublicNews(items);
  }

  return mockNews();
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  if (USE_NEWS_API) {
    try {
      const item = await apiFetch<NewsItem>(`/news/${slug}/`);
      return isPublic(item)
        ? {
            ...item,
            imageAlt: item.imageAlt ?? item.title,
            featured: Boolean(item.featured),
            relatedDocumentSlugs: item.relatedDocumentSlugs ?? [],
          }
        : null;
    } catch (error) {
      if (error instanceof ApiFetchError && error.status === 404) {
        return null;
      }

      console.warn(
        "[CST] Détail Actualités indisponible, fallback mock :",
        error,
      );
      return rawNews.find((n) => n.slug === slug && isPublic(n)) ?? null;
    }
  }

  return rawNews.find((n) => n.slug === slug && isPublic(n)) ?? null;
}

/** Actualités explicitement marquées comme mises en avant. */
export async function getFeaturedNews(limit = 1): Promise<NewsItem[]> {
  if (USE_NEWS_API) {
    const items = await safeApiFetch<NewsItem[]>("/news/?featured=1", "Actualités");
    if (items) return normalizePublicNews(items).slice(0, limit);
  }

  return mockNews()
    .filter((item) => item.featured)
    .slice(0, limit);
}

/** Actualités les plus récentes, utiles pour la landing page. */
export async function getRecentNews(limit = 3): Promise<NewsItem[]> {
  return (await getNews()).slice(0, limit);
}

// ------------------------------------------------------------------
// GALERIE
// ------------------------------------------------------------------
export async function getAlbums(): Promise<GalleryAlbum[]> {
  if (USE_GALLERY_API) {
    const items = await safeApiFetch<GalleryAlbum[]>("/albums/", "Galerie");
    if (items) return normalizePublicAlbums(items);
  }

  return mockAlbums();
}

export async function getAlbumBySlug(
  slug: string,
): Promise<GalleryAlbum | null> {
  if (USE_GALLERY_API) {
    try {
      const album = await apiFetch<GalleryAlbum>(`/albums/${slug}/`);
      return isPublic(album) ? normalizePublicAlbums([album])[0] ?? null : null;
    } catch (error) {
      if (error instanceof ApiFetchError && error.status === 404) {
        return null;
      }

      console.warn("[CST] Détail Galerie indisponible, fallback mock :", error);
      return rawAlbums.find((album) => album.slug === slug && isPublic(album)) ?? null;
    }
  }

  return rawAlbums.find((album) => album.slug === slug && isPublic(album)) ?? null;
}

// ------------------------------------------------------------------
// DIVERS
// ------------------------------------------------------------------
export async function getUsefulLinks(): Promise<UsefulLink[]> {
  return rawLinks;
}

export async function getStats(): Promise<SiteStats> {
  if (USE_API) return apiFetch<SiteStats>("/stats/");
  return {
    documents: rawDocuments.filter(isPublic).length,
    sessions: rawSessions.filter(isPublic).length,
    members: rawMembers.filter(isPublic).length,
    albums: rawAlbums.filter(isPublic).length,
  };
}
