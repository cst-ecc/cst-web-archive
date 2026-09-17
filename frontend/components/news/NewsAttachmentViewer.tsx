import Image from "next/image";

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
            sizes="(max-width: 768px) 100vw, 768px"
            className={styles.image}
            unoptimized={shouldBypassNextImageOptimization(attachment.url)}
          />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="attachment-title">
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Document associé</p>
        <h2 id="attachment-title">
          {attachment.label ?? "Consulter le document PDF"}
        </h2>
      </div>

      {attachment.previewUrl ? (
        <div className={styles.previewWrap}>
          <Image
            src={attachment.previewUrl}
            alt={attachment.label ?? item.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className={styles.image}
            unoptimized={shouldBypassNextImageOptimization(
              attachment.previewUrl,
            )}
          />
        </div>
      ) : null}

      <div className={styles.actions}>
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.primaryAction}
        >
          Ouvrir le PDF
          <span aria-hidden="true">↗</span>
        </a>

        <a href={attachment.url} download className={styles.secondaryAction}>
          Télécharger
        </a>
      </div>

      <object
        data={attachment.url}
        type="application/pdf"
        className={styles.pdfObject}
        aria-label={attachment.label ?? "Document PDF associé"}
      >
        <p>
          Votre navigateur ne peut pas afficher ce PDF directement. Utilisez le
          bouton « Ouvrir le PDF » ci-dessus.
        </p>
      </object>
    </section>
  );
}
