import Link from "next/link";
import type { CSSProperties } from "react";

import type { NewsItem } from "@/lib/types";

import styles from "./AlertTicker.module.scss";

type AlertTickerProps = {
  item: NewsItem;
};

function normalizeTickerText(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export default function AlertTicker({ item }: AlertTickerProps) {
  const summary = normalizeTickerText(item.excerpt);

  if (!summary) {
    return null;
  }

  // Le résumé défile systématiquement, même lorsqu'il est court.
  // La durée reste proportionnelle à la longueur afin de conserver
  // une vitesse de lecture régulière et confortable.
  const durationSeconds = Math.min(
    90,
    Math.max(22, Math.round(summary.length * 0.17)),
  );

  const tickerStyle = {
    "--ticker-duration": `${durationSeconds}s`,
  } as CSSProperties;

  return (
    <aside className={styles.shell} aria-label="Dernière INFO">
      <div className={styles.inner}>
        <div className={styles.ticker}>
          <span className={styles.label}>
            <span className={styles.dot} aria-hidden="true" />
            <span>Dernière INFO</span>
          </span>

          <span className={styles.viewport} aria-label={summary}>
            <span className={styles.track}>
              <span className={styles.loop} style={tickerStyle}>
                <span className={styles.message}>{summary}</span>
                <span
                  className={`${styles.message} ${styles.messageDuplicate}`}
                  aria-hidden="true"
                >
                  {summary}
                </span>
              </span>
            </span>
          </span>

          <Link
            href={`/actualites/${item.slug}`}
            className={styles.readMore}
            aria-label={`Lire la suite : ${item.title}`}
          >
            <span>Lire la suite</span>
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={styles.arrow}
            >
              <path d="M4 10h11M11 6l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </aside>
  );
}
