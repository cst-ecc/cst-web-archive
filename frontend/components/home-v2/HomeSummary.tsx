import type { NewsItem } from "@/lib/types";

import type { HomeNavigate } from "./homeV2.types";

import LeadershipMessageCard, {
  type LeadershipMessage,
} from "./LeadershipMessageCard";

import NewsCarousel from "./NewsCarousel";

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
  return (
    <section
      className={styles.section}
      aria-label="Actualités et informations du processus"
    >
      <div className={styles.inner}>
        {/* =====================================================
            ACTUALITÉS + VIDÉO
        ====================================================== */}
        <div className={styles.newsColumn}>
          <div className={styles.heading}>
            <h2>À la une</h2>

            <button
              type="button"
              onClick={() =>
                onNavigate("actualites")
              }
            >
              Toutes les actualités →
            </button>
          </div>

          <div className={styles.newsContent}>
            <NewsCarousel
              items={newsItems}
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
            ALERTE INFO + ÉVÉNEMENT
        ====================================================== */}
        <div className={styles.specialNewsColumn}>
          <HomeSpecialNews
            items={specialNewsItems}
          />
        </div>
      </div>
    </section>
  );
}