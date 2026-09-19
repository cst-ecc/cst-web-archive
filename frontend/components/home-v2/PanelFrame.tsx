import type { ReactNode } from "react";
import type { BibleVerse } from "@/lib/home-v2";
import PanelHero, {
  type PanelHeroProps,
  type PanelSideImage,
} from "./PanelHero";
import BibleVerseCarousel from "./BibleVerseCarousel";
import SiteAlertTicker from "@/components/layout/SiteAlertTicker";
import styles from "./PanelFrame.module.scss";

type PanelFrameProps = {
  hero: Omit<PanelHeroProps, "quote" | "sideImage">;
  verse?: BibleVerse;
  sideImage?: PanelSideImage;
  children: ReactNode;
};

export default function PanelFrame({
  hero,
  verse,
  sideImage,
  children,
}: PanelFrameProps) {
  return (
    <div className={styles.frame}>
      <PanelHero
        {...hero}
        quote={verse}
        sideImage={sideImage}
      />

      <SiteAlertTicker />

      <div className={styles.body}>
        {children}
      </div>

      <BibleVerseCarousel
        intervalMs={180_000}
        variant="strip"
      />

    </div>
  );
}