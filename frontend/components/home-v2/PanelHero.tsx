import Image from "next/image";
import type { BibleVerse } from "@/lib/home-v2";
import { imageNeedsUnoptimized } from "./homeV2.utils";
import styles from "./PanelHero.module.scss";

export type PanelSideImage = {
  src: string;
  alt: string;
};

export type PanelHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  quote?: BibleVerse;
  sideImage?: PanelSideImage;
};

export default function PanelHero({
  eyebrow,
  title,
  subtitle,
  image,
  imageAlt,
  quote,
  sideImage,
}: PanelHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.image} aria-hidden="true">
        <Image
          src={image}
          alt=""
          fill
          sizes="100vw"
          className={styles.cover}
          unoptimized={imageNeedsUnoptimized(image)}
        />
      </div>

      <div className={styles.overlay} aria-hidden="true" />

      <div
        className={`${styles.inner} ${
          sideImage ? styles.innerWithImage : ""
        }`}
      >
        {sideImage ? (
          <div className={styles.sideImage}>
            <Image
              src={sideImage.src}
              alt={sideImage.alt}
              fill
              sizes="(max-width: 639px) 6rem, (max-width: 1023px) 8rem, 12rem"
              className={styles.sideImageContent}
              unoptimized={imageNeedsUnoptimized(sideImage.src)}
            />
          </div>
        ) : null}

        <div className={styles.content}>
          <p className={styles.eyebrow}>{eyebrow}</p>

          <h2>{title}</h2>

          <p className={styles.subtitle}>
            {subtitle}
          </p>

          {quote ? (
            <p className={styles.quote}>
              <span>« {quote.text} »</span>
              <small>{quote.reference}</small>
            </p>
          ) : null}
        </div>
      </div>

      <span className={styles.alt} aria-hidden="true">
        {imageAlt}
      </span>
    </header>
  );
}