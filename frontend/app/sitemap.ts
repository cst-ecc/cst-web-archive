import type { MetadataRoute } from "next";
import { SITE, NAV_LINKS } from "@/lib/constants";
import { getDocuments, getSessions, getNews } from "@/lib/api";

/**
 * Régénération périodique du sitemap afin que les nouveaux contenus
 * publiés puissent être pris en compte sans attendre un redéploiement complet.
 */
export const revalidate = 3600;

function internalPath(href: string, external?: boolean): string | null {
  if (external || !href.startsWith("/")) return null;

  const path = href.split("#")[0] || "/";
  return path;
}

function safeDate(
  value: string | Date | null | undefined
): Date | undefined {
  if (!value) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");

  const navPaths = NAV_LINKS.flatMap((item) => [
    {
      href: item.href,
      external: item.external,
    },
    ...(item.children ?? []).map((child) => ({
      href: child.href,
      external: child.external,
    })),
  ])
    .map((item) => internalPath(item.href, item.external))
    .filter((path): path is string => Boolean(path));

  const staticPages = [...new Set(["/", ...navPaths])];

  /**
   * Pour les pages statiques, on évite volontairement `new Date()`
   * comme lastModified afin de ne pas indiquer à Google une fausse
   * modification à chaque génération du sitemap.
   */
  const entries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1.0 : 0.8,
  }));

  try {
    const { results: docs } = await getDocuments({ pageSize: 1000 });

    docs.forEach((document) => {
      const lastModified = safeDate(document.date);

      entries.push({
        url: `${base}/documents/${document.slug}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });
  } catch (error) {
    console.error(
      "[sitemap] Impossible de charger les documents",
      error
    );
  }

  try {
    const sessions = await getSessions();

    sessions.forEach((session) => {
      const lastModified = safeDate(session.startDate);

      entries.push({
        url: `${base}/sessions/${session.slug}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });
  } catch (error) {
    console.error(
      "[sitemap] Impossible de charger les sessions",
      error
    );
  }

  try {
    const news = await getNews();

    news.forEach((item) => {
      const lastModified = safeDate(item.date);

      entries.push({
        url: `${base}/actualites/${item.slug}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    });
  } catch (error) {
    console.error(
      "[sitemap] Impossible de charger les actualités",
      error
    );
  }

  return entries;
}
