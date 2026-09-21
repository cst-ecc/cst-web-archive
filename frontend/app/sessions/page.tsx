import type { Metadata } from "next";

import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import SessionCard from "@/components/sessions/SessionCard";
import { getSessions } from "@/lib/api";

import styles from "./sessions.module.scss";

export const metadata: Metadata = {
  title: "Sessions",
  description: "Sessions ordinaires et extraordinaires du Conseil Supérieur de Transition.",
};
export const revalidate = 300;

export default async function SessionsPage() {
  const sessions = await getSessions();

  return (
    <>
      <PageHeader
        eyebrow="Travaux"
        title="Sessions du Conseil"
        subtitle="Retrouvez les sessions publiées comme articles, leurs informations principales et les documents associés."
      />
      <Container className={styles.section}>
        {sessions.length > 0 ? (
          <div className={styles.grid}>
            {sessions.map((session) => {
              const documents = session.documents ?? [];
              const readableDocument = documents.find(
                (doc) =>
                  doc.fileType === "pdf" &&
                  Boolean(doc.fileUrl) &&
                  doc.fileUrl !== "#",
              );

              return (
                <SessionCard
                  key={session.slug}
                  session={session}
                  readableDocumentSlug={readableDocument?.slug}
                  documentCount={documents.length}
                />
              );
            })}
          </div>
        ) : (
          <div className={styles.empty} role="status">
            Aucune session publiée pour le moment.
          </div>
        )}
      </Container>
    </>
  );
}
