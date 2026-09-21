import type { NewsItem } from "@/lib/types";

import type { HomeNavigate } from "./homeV2.types";

import LeadershipMessageCard, {
  type LeadershipMessage,
} from "./LeadershipMessageCard";

import LatestNewsCard from "./LatestNewsCard";

import FeaturedVideoCard, {
  type FeaturedVideo,
} from "./FeaturedVideoCard";

import HomeSpecialNews from "./HomeSpecialNews";

import styles from "./HomeSummary.module.scss";

type HomeSummaryProps = {
  newsItems: NewsItem[];
  specialNewsItems: NewsItem[];
  onNavigate: HomeNavigate;
  leadershipMessage: LeadershipMessage;
  featuredVideo: FeaturedVideo;
};

export default function HomeSummary({
  newsItems,
  specialNewsItems,
  onNavigate,
  leadershipMessage,
  featuredVideo,
}: HomeSummaryProps) {
  const eventItems = specialNewsItems.filter(
    (item) => item.homeSlot === "upcoming_event",
  );

  const publicNews = [...newsItems]
    .filter(
      (item) =>
        item.status === "publie" &&
        !item.homeSlot,
    );

  const latestNews =
    publicNews.find((item) => item.featured) ??
    publicNews.sort((a, b) => b.date.localeCompare(a.date))[0] ??
    null;

  const hasEvent = eventItems.length > 0;

  return (
    <section
      className={styles.section}
      aria-label="Actualités et informations du processus"
    >
      <div
        className={styles.inner}
        data-has-event={hasEvent ? "true" : "false"}
      >
        {/* =====================================================
            DERNIÈRE ACTUALITÉ + VIDÉO
        ====================================================== */}
        <div className={styles.newsColumn}>
          <div className={styles.heading}>
            <h2>À la une</h2>
          </div>

          <div className={styles.newsContent}>
            <LatestNewsCard
              item={latestNews}
            />

            <FeaturedVideoCard
              video={featuredVideo}
            />
          </div>
        </div>

        {/* =====================================================
            MOT DU GÉNÉRAL
        ====================================================== */}
        <div className={styles.messageColumn}>
          <div className={styles.heading}>
            <h2>Mot de bienvenue</h2>
          </div>

          <div className={styles.messageContent}>
            <LeadershipMessageCard
              message={leadershipMessage}
            />
          </div>
        </div>

        {/* =====================================================
            ÉVÉNEMENT À VENIR
            L'Alerte Info est désormais affichée dans le bandeau.
        ====================================================== */}
        {hasEvent ? (
          <div className={styles.specialNewsColumn}>
            <HomeSpecialNews
              items={eventItems}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
