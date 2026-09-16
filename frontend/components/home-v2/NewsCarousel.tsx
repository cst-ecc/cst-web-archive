"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { NewsItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { imageNeedsUnoptimized } from "./homeV2.utils";

import styles from "./NewsCarousel.module.scss";

type NewsCarouselProps = {
  items: NewsItem[];
  intervalMs?: number;
};

export default function NewsCarousel({
  items,
  intervalMs = 7_000,
}: NewsCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || paused) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrent((index) => (index + 1) % items.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [items.length, intervalMs, paused]);

  useEffect(() => {
    if (current >= items.length && items.length > 0) {
      setCurrent(0);
    }
  }, [current, items.length]);

  if (!items.length) {
    return (
      <div className={styles.empty}>
        Aucune actualité publiée pour le moment.
      </div>
    );
  }

  const item = items[current];

  const previous = () => {
    setCurrent((index) =>
      index === 0 ? items.length - 1 : index - 1
    );
  };

  const next = () => {
    setCurrent((index) =>
      (index + 1) % items.length
    );
  };

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link
        href={`/actualites/${item.slug}`}
        className={styles.slide}
      >
        <div className={styles.imageWrap}>
          <Image
            src={item.imageUrl}
            alt={item.imageAlt ?? item.title}
            fill
            sizes="(max-width: 1023px) 100vw, 30vw"
            className={styles.image}
            unoptimized={imageNeedsUnoptimized(item.imageUrl)}
          />

          <div className={styles.imageOverlay} />

          <span className={styles.counter}>
            {String(current + 1).padStart(2, "0")}
            <i />
            {String(items.length).padStart(2, "0")}
          </span>
        </div>

        <div className={styles.body}>
          <time dateTime={item.date}>
            {formatDate(item.date)}
          </time>

          <h3>{item.title}</h3>

          <p>{item.excerpt}</p>

          <strong>
            Lire l’actualité <span aria-hidden>→</span>
          </strong>
        </div>
      </Link>

      {items.length > 1 ? (
        <>
          <div className={styles.navigation}>
            <button
              type="button"
              onClick={previous}
              aria-label="Actualité précédente"
            >
              ←
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Actualité suivante"
            >
              →
            </button>
          </div>

          <div
            className={styles.dots}
            aria-label="Navigation des actualités"
          >
            {items.map((news, index) => (
              <button
                key={news.id}
                type="button"
                className={
                  index === current
                    ? styles.activeDot
                    : undefined
                }
                onClick={() => setCurrent(index)}
                aria-label={`Afficher l’actualité ${index + 1}`}
                aria-current={
                  index === current ? "true" : undefined
                }
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}