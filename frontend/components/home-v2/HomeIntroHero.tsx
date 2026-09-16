import Image from "next/image";
import type { HomeNavigate } from "./homeV2.types";
import styles from "./HomeIntroHero.module.scss";

export default function HomeIntroHero({
  onNavigate,
}: {
  onNavigate: HomeNavigate;
}) {
  return (
    <section className={styles.hero} aria-labelledby="home-v2-title">
      <div className={styles.background} aria-hidden="true">
        <Image
          src="/images/home/hero-unite.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.backgroundImage}
        />
      </div>

      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <p className={styles.eyebrow}>
          La Grande Marche vers l’Unité
        </p>

        <h1 id="home-v2-title" className={styles.title}>
          <span>Une même foi</span>
          <span>Une même Église</span>
          <strong>Une marche vers l’unité</strong>
        </h1>

        <div className={styles.bottomRow}>
          <p className={styles.lead}>
            Ensemble, avançons dans la fidélité à notre héritage.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => onNavigate("comprendre")}
            >
              Découvrir la démarche <span aria-hidden>→</span>
            </button>

            <button
              type="button"
              className={styles.secondary}
              onClick={() => onNavigate("avancement")}
            >
              Où en sommes-nous ?
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
