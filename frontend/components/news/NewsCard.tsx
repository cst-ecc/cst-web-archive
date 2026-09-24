import Link from "next/link";

import { formatDate } from "@/lib/utils";
import type { NewsItem } from "@/lib/types";

import NewsMedia from "./NewsMedia";
import { MotionArticle } from "@/components/ui/Motion";

import styles from "./NewsCard.module.scss";

export default function NewsCard({ item, motionDelay = 0 }: { item: NewsItem; motionDelay?: number }) {
  const href = `/actualites/${item.slug}`;
  const displayDate = item.eventDate ?? item.date;

  return (
    <MotionArticle className={styles.card} delay={motionDelay}>
      <Link
        href={href}
        className={styles.imageLink}
        aria-label={`Lire l’actualité : ${item.title}`}
      >
        <div className={styles.imageWrap}>
          <NewsMedia
            item={item}
            sizes="(max-width:768px) 100vw, 33vw"
          />
        </div>
      </Link>

      <div className={styles.body}>
        <time dateTime={displayDate} className={styles.date}>
          {formatDate(displayDate)}
        </time>

        <h3 className={styles.title}>
          <Link href={href} className={styles.titleLink}>
            {item.title}
          </Link>
        </h3>

        <p className={styles.excerpt}>{item.excerpt}</p>

        <Link href={href} className={styles.readMore}>
          Lire la suite <span aria-hidden>→</span>
        </Link>
      </div>
    </MotionArticle>
  );
}
