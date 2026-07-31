import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import type { NewsItem } from "@/lib/types";
import styles from "./NewsCard.module.scss";

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <Image src={item.imageUrl} alt="" fill sizes="(max-width:768px) 100vw, 33vw" className={styles.image} />
      </div>
      <div className={styles.body}>
        <time dateTime={item.date} className={styles.date}>{formatDate(item.date)}</time>
        <h3 className={styles.title}>
          <Link href={`/actualites/${item.slug}`} className={styles.titleLink}>
            {item.title}
          </Link>
        </h3>
        <p className={styles.excerpt}>{item.excerpt}</p>
      </div>
    </article>
  );
}
