import { HOME_FEATURED_VIDEO } from "@/lib/constants";
import { HOME_LEADERSHIP_MESSAGE } from "@/lib/home-v2";

import type { NewsItem } from "@/lib/types";

import AlertTicker from "./AlertTicker";
import SiteFooter from "@/components/layout/SiteFooter";
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
  const alerts = specialNewsItems.filter(
    (item) =>
      item.homeSlot === "alert_info" &&
      item.status === "publie",
  );

  return (
    <div className={styles.overview}>
      <HomeIntroHero
        onNavigate={onNavigate}
      />

      {alerts.length > 0 ? (
        <AlertTicker items={alerts} />
      ) : null}

      <HomeSummary
        newsItems={newsItems}
        specialNewsItems={specialNewsItems}
        onNavigate={onNavigate}
        leadershipMessage={HOME_LEADERSHIP_MESSAGE}
        featuredVideo={HOME_FEATURED_VIDEO}
      />


      <SiteFooter />
    </div>
  );
}