/**
 * COUCHE D'ACCÈS AUX DONNÉES — POINT DE BASCULE VERS DJANGO.
 *
 * Toutes les pages/composants passent EXCLUSIVEMENT par ces fonctions.
 * Aujourd'hui elles lisent `lib/data.ts` (phase mock). Demain, il suffira
 * de renseigner NEXT_PUBLIC_API_URL et de remplacer le corps de chaque
 * fonction par un `fetch(...)` vers l'API Django — sans toucher aux pages.
 *
 * Les fonctions sont asynchrones dès maintenant, exactement comme le seront
 * les appels réseau : l'interface est déjà « prête pour l'API ».
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

const USE_API =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "api" &&
  Boolean(process.env.NEXT_PUBLIC_API_URL);

/**
 * Helper générique pour le futur backend. Non utilisé en phase mock.
 * Exemple d'usage prévu : `apiFetch<Paginated<DocumentItem>>("/documents/?...")`.
 */
async function apiFetch<T>(path: string): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL!.replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    // ISR : revalidation régulière côté serveur.
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API ${path} — statut ${res.status}`);
  }
  return (await res.json()) as T;
}

/** N'exposer publiquement que les contenus « publié ». */
const isPublic = <T extends { status: string }>(x: T) => x.status === "publie";

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
  if (USE_API) {
    const p = new URLSearchParams();
    if (query.search) p.set("search", query.search);
    if (query.categorySlug) p.set("category", query.categorySlug);
    if (query.kind) p.set("kind", query.kind);
    if (query.year) p.set("year", String(query.year));
    if (query.ordering) p.set("ordering", query.ordering);
    p.set("page", String(query.page ?? 1));
    p.set("page_size", String(query.pageSize ?? DEFAULT_PAGE_SIZE));
    return apiFetch<Paginated<DocumentItem>>(`/documents/?${p.toString()}`);
  }

  // --- Filtrage/tri/pagination en mémoire (phase mock) ---
  let items = rawDocuments.filter(isPublic);

  if (query.categorySlug) {
    items = items.filter((d) => d.categorySlug === query.categorySlug);
  }
  if (query.kind) {
    items = items.filter((d) => d.kind === query.kind);
  }
  if (query.year) {
    items = items.filter((d) => new Date(d.date).getFullYear() === query.year);
  }
  if (query.search) {
    const q = normalize(query.search);
    items = items.filter(
      (d) =>
        normalize(d.title).includes(q) ||
        normalize(d.summary).includes(q) ||
        normalize(d.reference).includes(q),
    );
  }

  switch (query.ordering) {
    case "ancien":
      items = [...items].sort((a, b) => a.date.localeCompare(b.date));
      break;
    case "titre":
      items = [...items].sort((a, b) => a.title.localeCompare(b.title, "fr"));
      break;
    case "populaire":
      items = [...items].sort((a, b) => b.downloads - a.downloads);
      break;
    case "recent":
    default:
      items = [...items].sort((a, b) => b.date.localeCompare(a.date));
  }

  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const start = (page - 1) * pageSize;
  const results = items.slice(start, start + pageSize);

  return { count: items.length, page, pageSize, results };
}

export async function getDocumentBySlug(
  slug: string,
): Promise<DocumentItem | null> {
  if (USE_API) {
    try {
      return await apiFetch<DocumentItem>(`/documents/${slug}/`);
    } catch {
      return null;
    }
  }
  return rawDocuments.find((d) => d.slug === slug && isPublic(d)) ?? null;
}

export async function getFeaturedDocuments(limit = 4): Promise<DocumentItem[]> {
  if (USE_API) return apiFetch<DocumentItem[]>(`/documents/?featured=1&page_size=${limit}`);
  return rawDocuments
    .filter((d) => isPublic(d) && d.featured)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export async function getRecentDocuments(limit = 6): Promise<DocumentItem[]> {
  const { results } = await getDocuments({ ordering: "recent", pageSize: limit });
  return results;
}

/** Années distinctes présentes (pour les filtres). */
export async function getDocumentYears(): Promise<number[]> {
  const years = new Set(rawDocuments.filter(isPublic).map((d) => new Date(d.date).getFullYear()));
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
  if (USE_API) return apiFetch<NewsItem[]>("/news/");
  return rawNews.filter(isPublic).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  if (USE_API) {
    try {
      return await apiFetch<NewsItem>(`/news/${slug}/`);
    } catch {
      return null;
    }
  }
  return rawNews.find((n) => n.slug === slug && isPublic(n)) ?? null;
}

// ------------------------------------------------------------------
// GALERIE
// ------------------------------------------------------------------
export async function getAlbums(): Promise<GalleryAlbum[]> {
  if (USE_API) return apiFetch<GalleryAlbum[]>("/albums/");
  return rawAlbums.filter(isPublic).sort((a, b) => b.date.localeCompare(a.date));
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
