import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import type { NewsItem } from "@/lib/types";
import styles from "./NewsCard.module.scss";
import { isDjangoMediaUrl } from "@/lib/media";

export default function NewsCard({ item }: { item: NewsItem }) {
  const href = `/actualites/${item.slug}`;

  return (
    <article className={styles.card}>
      <Link
        href={href}
        className={styles.imageLink}
        aria-label={`Lire l’actualité : ${item.title}`}
      >
        <div className={styles.imageWrap}>
          <Image
            src={item.imageUrl}
            alt={item.imageAlt ?? item.title}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className={styles.image}
            unoptimized={isDjangoMediaUrl(item.imageUrl)}
          />
        </div>
      </Link>

      <div className={styles.body}>
        <time dateTime={item.date} className={styles.date}>
          {formatDate(item.date)}
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
    </article>
  );
}
