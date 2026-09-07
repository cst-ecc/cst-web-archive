import type { MetadataRoute } from "next";
import { SITE, NAV_LINKS } from "@/lib/constants";
import { getDocuments, getSessions, getNews } from "@/lib/api";

function internalPath(href: string, external?: boolean): string | null {
  if (external || !href.startsWith("/")) return null;
  const path = href.split("#")[0] || "/";
  return path;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");

  const navPaths = NAV_LINKS.flatMap((item) => [
    { href: item.href, external: item.external },
    ...(item.children ?? []).map((child) => ({
      href: child.href,
      external: child.external,
    })),
  ])
    .map((item) => internalPath(item.href, item.external))
    .filter((path): path is string => Boolean(path));

  const staticPages = [...new Set(["/", ...navPaths])];

  const entries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1.0 : 0.7,
  }));

  const { results: docs } = await getDocuments({ pageSize: 1000 });
  docs.forEach((document) => {
    entries.push({
      url: `${base}/documents/${document.slug}`,
      lastModified: new Date(document.date),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  const sessions = await getSessions();
  sessions.forEach((session) => {
    entries.push({
      url: `${base}/sessions/${session.id}`,
      lastModified: new Date(session.startDate),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  const news = await getNews();
  news.forEach((item) => {
    entries.push({
      url: `${base}/actualites/${item.slug}`,
      lastModified: new Date(item.date),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  return entries;
}
