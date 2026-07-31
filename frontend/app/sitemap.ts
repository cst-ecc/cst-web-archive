import type { MetadataRoute } from "next";
import { SITE, NAV_LINKS } from "@/lib/constants";
import { getDocuments, getSessions, getNews } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;

  // Pages statiques (aplaties depuis la nav)
  const staticPages = [
    "/",
    ...NAV_LINKS.flatMap((g) => g.children?.map((c) => c.href) ?? []),
  ];

  const entries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1.0 : 0.7,
  }));

  // Documents
  const { results: docs } = await getDocuments({ pageSize: 1000 });
  docs.forEach((d) => {
    entries.push({
      url: `${base}/documents/${d.slug}`,
      lastModified: new Date(d.date),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  // Sessions
  const sessions = await getSessions();
  sessions.forEach((s) => {
    entries.push({
      url: `${base}/sessions/${s.id}`,
      lastModified: new Date(s.startDate),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  // Actualités
  const news = await getNews();
  news.forEach((n) => {
    entries.push({
      url: `${base}/actualites/${n.slug}`,
      lastModified: new Date(n.date),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  return entries;
}
