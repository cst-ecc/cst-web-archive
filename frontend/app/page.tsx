import Hero from "@/components/home/Hero";
import InfoBar from "@/components/home/InfoBar";
import InstitutionalProcess from "@/components/home/InstitutionalProcess";
import ActionCards from "@/components/home/ActionCards";
import SplitBanner from "@/components/home/SplitBanner";
import CategoriesGrid from "@/components/home/CategoriesGrid";
import StatsBlock from "@/components/home/StatsBlock";
import DigitalisationSection from "@/components/home/DigitalisationSection";
import ProcessTimeline from "@/components/home/ProcessTimeline";
import FAQSection from "@/components/home/FAQSection";

export const revalidate = 300;

/**
 * Landing page unifiée CST / CSMO.
 *
 * La séquence « Une même Église, une même mission » est désormais intégrée
 * directement au Footer afin de former un seul bloc institutionnel de clôture.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <InfoBar />
      <InstitutionalProcess />
      <ActionCards />
      <SplitBanner />
      <CategoriesGrid />
      <StatsBlock />
      <DigitalisationSection />
      <ProcessTimeline />
      <FAQSection />
    </>
  );
}
