import Image from "next/image";

import { shouldBypassNextImageOptimization } from "@/lib/media";
import type { NewsItem } from "@/lib/types";

import styles from "./NewsMedia.module.scss";

type NewsMediaProps = {
  item: NewsItem;
  priority?: boolean;
  sizes?: string;
};

export default function NewsMedia({
  item,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: NewsMediaProps) {
  const attachment = item.attachment;

  const imageUrl =
    item.imageUrl ||
    attachment?.previewUrl ||
    (attachment?.type === "image" ? attachment.url : "");

  if (imageUrl) {
    return (
      <div className={styles.media}>
        <Image
          src={imageUrl}
          alt={item.imageAlt ?? attachment?.label ?? item.title}
          fill
          priority={priority}
          sizes={sizes}
          className={styles.image}
          unoptimized={shouldBypassNextImageOptimization(imageUrl)}
        />

        {attachment?.type === "pdf" ? (
          <span className={styles.type}>PDF</span>
        ) : null}
      </div>
    );
  }

  if (attachment?.type === "pdf") {
    return (
      <div className={`${styles.media} ${styles.pdf}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 2h8l4 4v16H6z" />
          <path d="M14 2v5h5" />
        </svg>
        <strong>PDF</strong>
        <span>{attachment.label ?? "Document associé"}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.media} ${styles.placeholder}`} aria-hidden="true">
      <span>CST · CSMO</span>
    </div>
  );
}
