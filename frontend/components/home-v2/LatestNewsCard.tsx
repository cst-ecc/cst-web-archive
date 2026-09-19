import Image from "next/image";
import Link from "next/link";

import type { NewsItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { imageNeedsUnoptimized } from "./homeV2.utils";

import styles from "./LatestNewsCard.module.scss";

type LatestNewsCardProps = {
  item: NewsItem | null;
};

export default function LatestNewsCard({
  item,
}: LatestNewsCardProps) {
  if (!item) {
    return (
      <div className={styles.empty}>
        Aucune actualité publiée pour le moment.
      </div>
    );
  }

  return (
    <article className={styles.card}>
      <Link
        href={`/actualites/${item.slug}`}
        className={styles.link}
      >
        <div className={styles.imageWrap}>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.imageAlt ?? item.title}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 28vw"
              className={styles.image}
              unoptimized={imageNeedsUnoptimized(item.imageUrl)}
            />
          ) : (
            <div className={styles.imageFallback} aria-hidden="true">
              <span>Actualité</span>
            </div>
          )}

          <div className={styles.imageOverlay} />
        </div>

        <div className={styles.body}>
          <time dateTime={item.date}>
            {formatDate(item.date)}
          </time>

          <h3>{item.title}</h3>

          {/* <p>{item.excerpt}</p> */}

          <strong>
            Lire la suite <span aria-hidden="true">→</span>
          </strong>
        </div>
      </Link>
    </article>
  );
}
