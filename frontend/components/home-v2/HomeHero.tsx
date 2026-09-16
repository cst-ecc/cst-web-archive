import { HOME_FEATURED_VIDEO } from "@/lib/constants";
import {
  BIBLE_VERSES,
  HOME_LEADERSHIP_MESSAGE,
} from "@/lib/home-v2";

import type { NewsItem } from "@/lib/types";

import BibleVerseCarousel from "./BibleVerseCarousel";
import HomeCompactFooter from "./HomeCompactFooter";
import HomeIntroHero from "./HomeIntroHero";
import HomeSummary from "./HomeSummary";

import type { HomeNavigate } from "./homeV2.types";

import styles from "./HomeHero.module.scss";

type HomeHeroProps = {
  newsItems: NewsItem[];
  specialNewsItems: NewsItem[];
  onNavigate: HomeNavigate;
};

export default function HomeHero({
  newsItems,
  specialNewsItems,
  onNavigate,
}: HomeHeroProps) {
  return (
    <div className={styles.overview}>
      <HomeIntroHero
        onNavigate={onNavigate}
      />

      <HomeSummary
        newsItems={newsItems}
        specialNewsItems={specialNewsItems}
        onNavigate={onNavigate}
        leadershipMessage={HOME_LEADERSHIP_MESSAGE}
        featuredVideo={HOME_FEATURED_VIDEO}
      />

      <BibleVerseCarousel
        verses={BIBLE_VERSES}
        intervalMs={180_000}
        variant="strip"
      />

      <HomeCompactFooter />
    </div>
  );
}