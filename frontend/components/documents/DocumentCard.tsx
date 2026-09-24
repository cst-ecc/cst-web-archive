import Link from "next/link";

import DocumentReadButton from "@/components/documents/DocumentReadButton";
import Badge from "@/components/ui/Badge";
import { MotionArticle } from "@/components/ui/Motion";
import { KIND_LABELS } from "@/lib/constants";
import type { DocumentItem } from "@/lib/types";
import { formatDate, formatFileSize } from "@/lib/utils";

import styles from "./DocumentCard.module.scss";

const FILE_LABEL: Record<DocumentItem["fileType"], string> = {
  pdf: "PDF",
  docx: "DOCX",
  xlsx: "XLSX",
  image: "IMG",
  autre: "FICHIER",
};

export default function DocumentCard({ doc, motionDelay = 0 }: { doc: DocumentItem; motionDelay?: number }) {
  const readablePdf = doc.fileType === "pdf" && Boolean(doc.fileUrl) && doc.fileUrl !== "#";

  return (
    <MotionArticle className={styles.card} delay={motionDelay}>
      <div className={styles.rule} />
      <div className={styles.body}>
        <div className={styles.top}>
          <Badge tone="blue">{KIND_LABELS[doc.kind]}</Badge>
          <span className={styles.reference}>{doc.reference}</span>
        </div>

        <h3 className={styles.title}>
          <Link href={`/documents/${doc.slug}`} className={styles.titleLink}>
            {doc.title}
          </Link>
        </h3>

        <p className={styles.summary}>{doc.summary}</p>

        <div className={styles.meta}>
          <time dateTime={doc.date}>{formatDate(doc.date)}</time>
          <span aria-hidden>•</span>
          <span className={styles.metaStrong}>{FILE_LABEL[doc.fileType]}</span>
          <span aria-hidden>•</span>
          <span>{formatFileSize(doc.fileSize)}</span>
        </div>

        <div className={styles.actions}>
          <Link href={`/documents/${doc.slug}`} className={styles.detailLink}>
            Voir la fiche
          </Link>
          {readablePdf ? (
            <DocumentReadButton
              slug={doc.slug}
              label="Lire"
              variant="outline"
              className={styles.readButton}
            />
          ) : null}
        </div>
      </div>
    </MotionArticle>
  );
}
