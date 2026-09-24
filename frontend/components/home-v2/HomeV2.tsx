"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { HOME_PANELS, type HomePanelId } from "@/lib/home-v2";
import type { NewsItem } from "@/lib/types";
import ChurchInMotionPanel from "./ChurchInMotionPanel";
import FAQPanel from "./FAQPanel";
import HomeHero from "./HomeHero";
import InstitutionPanel from "./InstitutionPanel";
import NewsPanel from "./NewsPanel";
import PanelNavigation from "./PanelNavigation";
import ProgressPanel from "./ProgressPanel";
import ResourcesPanel from "./ResourcesPanel";
import UnderstandPanel from "./UnderstandPanel";
import { panelIndexFromHash } from "./homeV2.utils";
import styles from "./HomeV2.module.scss";

type HomeV2Props = {
  newsItems: NewsItem[];
  specialNewsItems: NewsItem[];
};

export default function HomeV2({
  newsItems,
  specialNewsItems,
}: HomeV2Props) {

  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [desktopMode, setDesktopMode] = useState(false);

  const uniqueNews = useMemo(() => {
    const seen = new Set<string>();
    return newsItems.filter((item) => {
      const key = item.slug || String(item.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [newsItems]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktopMode(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const syncFromLocation = () => {
      const currentHash = window.location.hash;
      const next = panelIndexFromHash(currentHash);
      const panelId = HOME_PANELS[next]?.id ?? "accueil";
      const canonicalHash = `#${panelId}`;

      // Une arrivée directe sur `/` reste sans fragment pour conserver l'URL
      // d'accueil propre. En revanche, un fragment explicite (notamment
      // `#accueil`) est conservé afin que la navigation entre panneaux reste
      // pilotée par le hash sans rechargement de page.
      if (currentHash && currentHash !== canonicalHash) {
        window.history.replaceState(null, "", canonicalHash);
      }

      setActiveIndex((current) => {
        if (current !== next) setDirection(next > current ? 1 : -1);
        return next;
      });
    };

    syncFromLocation();
    window.addEventListener("hashchange", syncFromLocation);
    window.addEventListener("popstate", syncFromLocation);
    window.addEventListener("homepanelchange", syncFromLocation);

    return () => {
      window.removeEventListener("hashchange", syncFromLocation);
      window.removeEventListener("popstate", syncFromLocation);
      window.removeEventListener("homepanelchange", syncFromLocation);
    };
  }, []);

  const navigate = (index: number) => {
    if (index < 0 || index >= HOME_PANELS.length) return;

    const nextPanel = HOME_PANELS[index];
    if (!nextPanel) return;

    if (index !== activeIndex) {
      setDirection(index > activeIndex ? 1 : -1);
      setActiveIndex(index);
    }

    const nextHash = `#${nextPanel.id}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
    window.dispatchEvent(new Event("homepanelchange"));

    // Chaque panneau est désormais une page verticale complète.
    // Lors d'un changement de panneau, on revient systématiquement en haut
    // afin que le Hero soit immédiatement visible, y compris sur desktop.
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const navigateToPanel = (panelId: HomePanelId) => {
    const index = HOME_PANELS.findIndex((panel) => panel.id === panelId);
    if (index >= 0) navigate(index);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (window.innerWidth < 1024) return;

      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a, [contenteditable='true']")) return;

      if (event.key === "ArrowRight") {
        const next = Math.min(activeIndex + 1, HOME_PANELS.length - 1);
        if (next !== activeIndex) {
          event.preventDefault();
          navigate(next);
        }
      }

      if (event.key === "ArrowLeft") {
        const previous = Math.max(activeIndex - 1, 0);
        if (previous !== activeIndex) {
          event.preventDefault();
          navigate(previous);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const activePanel = HOME_PANELS[activeIndex] ?? HOME_PANELS[0];

  const panelContent = (() => {
    switch (activePanel.id) {
      case "accueil":
        return (
          <HomeHero
            newsItems={newsItems}
            specialNewsItems={specialNewsItems}
            onNavigate={navigateToPanel}
          />
        );
      case "comprendre":
        return <UnderstandPanel onNavigate={navigateToPanel} />;
      case "avancement":
        return <ProgressPanel />;
      case "cst":
        return <InstitutionPanel type="cst" newsItems={uniqueNews} />;
      case "csmo":
        return <InstitutionPanel type="csmo" newsItems={uniqueNews} />;
      case "eglise-en-marche":
        return <ChurchInMotionPanel newsItems={uniqueNews} />;
      case "ressources":
        return <ResourcesPanel onNavigate={navigateToPanel} />;
      case "actualites":
        return <NewsPanel newsItems={uniqueNews} />;
      case "faq":
        return <FAQPanel />;
      default:
        return null;
    }
  })();

  const animation = reducedMotion || !desktopMode
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
      initial: { x: direction > 0 ? "12%" : "-12%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: direction > 0 ? "-10%" : "10%", opacity: 0 },
    };

  return (
    <div className={styles.shell} data-active-panel={activePanel.id}>
      <div className={styles.deck}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.section
            key={activePanel.id}
            id={activePanel.id}
            className={styles.panel}
            aria-label={activePanel.label}
            initial={animation.initial}
            animate={animation.animate}
            exit={animation.exit}
            transition={{ duration: reducedMotion ? 0 : 0.42, ease: "easeOut" }}
          >
            {panelContent}
          </motion.section>
        </AnimatePresence>

        {activePanel.id !== "accueil" ? (
          <PanelNavigation activeIndex={activeIndex} onNavigate={navigate} />
        ) : null}
      </div>
    </div>
  );
}
