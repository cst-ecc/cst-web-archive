import type { ReactNode } from "react";
import SiteAlertTicker from "@/components/layout/SiteAlertTicker";
import SiteFooter from "@/components/layout/SiteFooter";
import type { BibleVerse } from "@/lib/home-v2";
import PanelHero, {
  type PanelHeroProps,
  type PanelSideImage,
} from "./PanelHero";
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


      <SiteFooter />
    </div>
  );
}
