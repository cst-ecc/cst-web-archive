"use client";

import { MotionSection } from "@/components/ui/Motion";
import { useCookieConsent } from "@/components/cookies/CookieConsentProvider";
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
  const { ready, externalAllowed, allowExternal, openSettings } = useCookieConsent();

  return (
    <MotionSection
      className={styles.card}
      ariaLabelledby="home-featured-video"
      delay={0.05}
      hover
    >
      <div className={styles.player}>
        {ready && externalAllowed ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
            title={video.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className={styles.externalGate}>
            <span aria-hidden>▶</span>
            <strong>Vidéo externe masquée</strong>
            <p>Le lecteur YouTube est chargé uniquement après votre accord.</p>
            <div>
              <button type="button" onClick={allowExternal} disabled={!ready}>Autoriser et afficher</button>
              <button type="button" onClick={openSettings}>Gérer mes choix</button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <span className={styles.eyebrow}>
          <i aria-hidden>▶</i>
          En vidéo
        </span>

        <h3 id="home-featured-video">{video.title}</h3>

        {video.description ? <p>{video.description}</p> : null}
      </div>
    </MotionSection>
  );
}
