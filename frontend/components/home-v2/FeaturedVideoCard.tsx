import { MotionSection } from "@/components/ui/Motion";
import styles from "./FeaturedVideoCard.module.scss";

export type FeaturedVideo = {
  youtubeId: string;
  title: string;
  description?: string;
};

export default function FeaturedVideoCard({
  video,
}: {
  video: FeaturedVideo;
}) {
  return (
    <MotionSection
      className={styles.card}
      ariaLabelledby="home-featured-video"
      delay={0.05}
      hover
    >
      <div className={styles.player}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
          title={video.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <div className={styles.content}>
        <span className={styles.eyebrow}>
          <i aria-hidden>▶</i>
          En vidéo
        </span>

        <h3 id="home-featured-video">
          {video.title}
        </h3>

        {video.description ? (
          <p>{video.description}</p>
        ) : null}
      </div>
    </MotionSection>
  );
}