import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { KIND_LABELS } from "@/lib/constants";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { DocumentItem } from "@/lib/types";
import styles from "./DocumentCard.module.scss";

const FILE_LABEL: Record<DocumentItem["fileType"], string> = {
  pdf: "PDF",
  docx: "DOCX",
  xlsx: "XLSX",
  image: "IMG",
  autre: "FICHIER",
};

export default function DocumentCard({ doc }: { doc: DocumentItem }) {
  return (
    <article className={styles.card}>
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
      </div>
    </article>
  );
}
