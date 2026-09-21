import Image from "next/image";

import PdfViewer from "@/components/documents/PdfViewer";
import { shouldBypassNextImageOptimization } from "@/lib/media";
import type { NewsItem } from "@/lib/types";

import styles from "./NewsAttachmentViewer.module.scss";

export default function NewsAttachmentViewer({
  item,
}: {
  item: NewsItem;
}) {
  const attachment = item.attachment;

  if (!attachment) return null;

  if (attachment.type === "image") {
    return (
      <section className={styles.section} aria-labelledby="attachment-title">
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Pièce jointe</p>
          <h2 id="attachment-title">
            {attachment.label ?? "Image associée à l’actualité"}
          </h2>
        </div>

        <div className={styles.imageWrap}>
          <Image
            src={attachment.url}
            alt={attachment.label ?? item.imageAlt ?? item.title}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 90vw, 1248px"
            className={styles.image}
            unoptimized={shouldBypassNextImageOptimization(attachment.url)}
          />
        </div>
      </section>
    );
  }

  const title = attachment.label ?? "Document PDF associé";

  return (
    <section className={styles.section} aria-labelledby="attachment-title">
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Document associé</p>
        <h2 id="attachment-title">{title}</h2>
      </div>

      {attachment.previewUrl ? (
        <div className={styles.previewWrap}>
          <Image
            src={attachment.previewUrl}
            alt={attachment.label ?? item.title}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 90vw, 1248px"
            className={styles.image}
            unoptimized={shouldBypassNextImageOptimization(
              attachment.previewUrl,
            )}
          />
        </div>
      ) : null}

      <PdfViewer src={attachment.url} title={title} compact />
    </section>
  );
}
