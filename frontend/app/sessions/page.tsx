import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import Container from "@/components/layout/Container";
import SessionCard from "@/components/sessions/SessionCard";
import { getSessions } from "@/lib/api";
import styles from "../pages.module.scss";

export const metadata: Metadata = {
  title: "Sessions",
  description: "Sessions ordinaires et extraordinaires du Conseil Supérieur de Transition.",
};
export const revalidate = 300;

export default async function SessionsPage() {
  const sessions = await getSessions();
  return (
    <>
      <PageHeader eyebrow="Travaux" title="Sessions du Conseil" subtitle="Retrouvez les sessions du CST, leurs thèmes et les documents associés." />
      <Container className={styles.section}>
        <div className={styles.grid3}>
          {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
        </div>
      </Container>
    </>
  );
}
