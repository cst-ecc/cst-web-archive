import Link from "next/link";

import DocumentReadButton from "@/components/documents/DocumentReadButton";
import Badge from "@/components/ui/Badge";
import { MotionArticle } from "@/components/ui/Motion";
import type { Session } from "@/lib/types";
import { formatDate } from "@/lib/utils";

import styles from "./SessionCard.module.scss";

export default function SessionCard({
  session,
  readableDocumentSlug,
  documentCount = session.documentSlugs.length,
  motionDelay = 0,
}: {
  session: Session;
  readableDocumentSlug?: string;
  documentCount?: number;
  motionDelay?: number;
}) {
  return (
    <MotionArticle className={styles.card} delay={motionDelay}>
      <div className={styles.top}>
        <span className={styles.number}>{session.number > 0 ? `Session n°${session.number}` : "Session"}</span>
        {session.location ? <Badge tone="muted">{session.location}</Badge> : null}
      </div>

      <h3 className={styles.title}>
        <Link href={`/sessions/${session.slug}`} className={styles.titleLink}>
          {session.title}
        </Link>
      </h3>
      <p className={styles.theme}>{session.theme}</p>
      <p className={styles.summary}>{session.summary}</p>

      <div className={styles.footer}>
        <p className={styles.dates}>
          {formatDate(session.startDate)}
          {session.endDate && session.endDate !== session.startDate
            ? ` – ${formatDate(session.endDate)}`
            : ""}
        </p>
        <p className={styles.documentStatus}>
          {documentCount > 0
            ? `${documentCount} document${documentCount > 1 ? "s" : ""} associé${documentCount > 1 ? "s" : ""}`
            : "Aucun document associé"}
        </p>

        <div className={styles.actions}>
          <Link href={`/sessions/${session.slug}`} className={styles.detailAction}>
            Voir le détail
          </Link>
          {readableDocumentSlug ? (
            <DocumentReadButton
              slug={readableDocumentSlug}
              label="Lire le document"
              variant="outline"
              className={styles.readAction}
              returnHref={`/sessions/${session.slug}`}
            />
          ) : null}
        </div>
      </div>
    </MotionArticle>
  );
}
