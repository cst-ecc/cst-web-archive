import Hero from "@/components/home/Hero";
import InfoBar from "@/components/home/InfoBar";
import ActionCards from "@/components/home/ActionCards";
import SplitBanner from "@/components/home/SplitBanner";
import CategoriesGrid from "@/components/home/CategoriesGrid";
import StatsBlock from "@/components/home/StatsBlock";
import QuoteBlock from "@/components/home/QuoteBlock";

export const revalidate = 300;

/**
 * Page d'accueil — Disposition inspirée du template Attainment,
 * identité visuelle CST (bleu, jaune, blanc).
 *
 * Sections :
 * 1. Hero         — Grande photo plein écran, texte centré, dots
 * 2. InfoBar      — 3 faits clés (remonte sur le hero)
 * 3. ActionCards  — 3 cartes image + texte (axes du CST)
 * 4. SplitBanner  — Photo fond + carte blanche chevauchante
 * 5. Categories   — Image gauche + grille 2×3 des thèmes
 * 6. StatsBlock   — Fond photo sombre, grands chiffres jaunes
 * 7. QuoteBlock   — Avatar + citation + dots
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <InfoBar />
      <ActionCards />
      <SplitBanner />
      <CategoriesGrid />
      <StatsBlock />
      <QuoteBlock />
    </>
  );
}
