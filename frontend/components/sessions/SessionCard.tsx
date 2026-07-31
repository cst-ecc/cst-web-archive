import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { Session } from "@/lib/types";
import styles from "./SessionCard.module.scss";

export default function SessionCard({ session }: { session: Session }) {
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span className={styles.number}>Session n°{session.number}</span>
        <Badge tone="muted">{session.location}</Badge>
      </div>
      <h3 className={styles.title}>
        <Link href={`/sessions/${session.id}`} className={styles.titleLink}>
          {session.title}
        </Link>
      </h3>
      <p className={styles.theme}>{session.theme}</p>
      <p className={styles.summary}>{session.summary}</p>
      <p className={styles.dates}>
        {formatDate(session.startDate)}
        {session.endDate ? ` – ${formatDate(session.endDate)}` : ""}
      </p>
    </article>
  );
}
