import type { Metadata } from "next";
import HomeV2 from "@/components/home-v2/HomeV2";
import HomeStructuredData from "@/components/seo/HomeStructuredData";
import { SITE } from "@/lib/constants";
import {
  getRecentNews,
  getHomeSpecialNews,
} from "@/lib/api";

export const metadata: Metadata = {
  title: {
    absolute: "CST & CSMo ECC | Conseil Supérieur de Transition et de Mise en Œuvre",
  },
  description:
    "Site officiel du CST et du CSMo (CSM) de l’Église du Christianisme Céleste : actualités, documents officiels et informations sur le processus d’unité.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE.url,
    title: "CST & CSMo ECC | Église du Christianisme Céleste",
    description:
      "Conseil Supérieur de Transition (CST) et Conseil Supérieur de Mise en Œuvre (CSMo/CSM) de l’Église du Christianisme Céleste.",
    images: ["/og-image.png"],
  },
};

export const revalidate = 300;

export default async function HomePage() {
  const [
    newsItems,
    specialNewsItems,
  ] = await Promise.all([
    getRecentNews(6),
    getHomeSpecialNews(),
  ]);

  return (
    <>
      <HomeStructuredData />
      <HomeV2
        newsItems={newsItems}
        specialNewsItems={specialNewsItems}
      />
    </>
  );
}