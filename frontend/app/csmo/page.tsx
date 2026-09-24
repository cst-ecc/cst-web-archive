import type { Metadata } from "next";
import InstitutionPanel from "@/components/home-v2/InstitutionPanel";
import { getRecentNews } from "@/lib/api";

export const metadata: Metadata = {
  title: "CSMo — Conseil Supérieur de Mise en Œuvre",
  description:
    "Présentation du Conseil Supérieur de Mise en Œuvre (CSMo/CSM) de l’Église du Christianisme Céleste, de ses priorités, de sa méthode et de ses chantiers.",
  alternates: {
    canonical: "/csmo",
  },
};

export const revalidate = 300;

export default async function CsmoPage() {
  const newsItems = await getRecentNews(6);

  return <InstitutionPanel type="csmo" newsItems={newsItems} />;
}
