import Container from "@/components/layout/Container";
import SectionTitle from "@/components/layout/SectionTitle";
import SessionCard from "@/components/sessions/SessionCard";
import type { Session } from "@/lib/types";
import styles from "./RecentSessions.module.scss";

export default function RecentSessions({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) return null;
  return (
    <section className={styles.section}>
      <Container>
        <SectionTitle
          eyebrow="Travaux"
          title="Dernières sessions"
          action={{ href: "/sessions", label: "Toutes les sessions" }}
        />
        <div className={styles.grid}>
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      </Container>
    </section>
  );
}
