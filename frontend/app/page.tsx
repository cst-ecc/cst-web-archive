import Hero from "@/components/home/Hero";
import InfoBar from "@/components/home/InfoBar";
import InstitutionalProcess from "@/components/home/InstitutionalProcess";
import ActionCards from "@/components/home/ActionCards";
import SplitBanner from "@/components/home/SplitBanner";
import NewsSection from "@/components/home/NewsSection";
import CategoriesGrid from "@/components/home/CategoriesGrid";
import StatsBlock from "@/components/home/StatsBlock";
import DigitalisationSection from "@/components/home/DigitalisationSection";
import ProcessTimeline from "@/components/home/ProcessTimeline";
import FAQSection from "@/components/home/FAQSection";

export const revalidate = 300;

/**
 * Landing page unifiée CST / CSMO.
 *
 * La séquence « Une même Église, une même mission » est intégrée au Footer.
 * Les actualités sont récupérées via lib/api.ts pour rester compatibles avec
 * le futur backend.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <InfoBar />
      <InstitutionalProcess />
      <ActionCards />
      <SplitBanner />
      <NewsSection />
      <CategoriesGrid />
      <StatsBlock />
      <DigitalisationSection />
      <ProcessTimeline />
      <FAQSection />
    </>
  );
}
