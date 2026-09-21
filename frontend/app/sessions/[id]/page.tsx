import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import DocumentCard from "@/components/documents/DocumentCard";
import Container from "@/components/layout/Container";
import SiteAlertTicker from "@/components/layout/SiteAlertTicker";
import BackButton from "@/components/navigation/BackButton";
import Badge from "@/components/ui/Badge";
import { getSessionBySlug, getSessions } from "@/lib/api";
import { formatDate } from "@/lib/utils";

import styles from "../session-detail.module.scss";

export const revalidate = 300;

export async function generateStaticParams() {
  const sessions = await getSessions();
  return sessions.map((session) => ({ id: session.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const session = await getSessionBySlug(params.id);
  if (!session) return { title: "Session introuvable" };

  return {
    title: session.title,
    description: session.summary,
    alternates: {
      canonical: `/sessions/${session.slug}`,
    },
  };
}

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSessionBySlug(params.id);
  if (!session) notFound();

  const docs = session.documents ?? [];
  const paragraphs = (session.content ?? session.summary)
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      <SiteAlertTicker />
      <Container className={styles.wrapper}>
        <div className={styles.backRow}>
          <BackButton fallbackHref="/sessions" label="Retour aux sessions" />
        </div>

        <header className={styles.header}>
          <div className={styles.badges}>
            {session.number > 0 ? (
              <Badge tone="yellow">Session n°{session.number}</Badge>
            ) : (
              <Badge tone="yellow">Session</Badge>
            )}
            {session.location ? (
              <Badge tone="muted">{session.location}</Badge>
            ) : null}
          </div>
          <h1 className={styles.title}>{session.title}</h1>
          {session.theme ? <p className={styles.theme}>{session.theme}</p> : null}
          <p className={styles.dates}>
            {formatDate(session.startDate)}
            {session.endDate && session.endDate !== session.startDate
              ? ` – ${formatDate(session.endDate)}`
              : ""}
          </p>
          <div className={styles.rule} />
          <p className={styles.summary}>{session.summary}</p>
        </header>

        {session.imageUrls.length > 0 ? (
          <div className={styles.images}>
            {session.imageUrls.map((url, index) => (
              <div key={url} className={styles.imageWrap}>
                <Image
                  src={url}
                  alt={`${session.title} — illustration ${index + 1}`}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                  className={styles.image}
                />
              </div>
            ))}
          </div>
        ) : null}

        {paragraphs.length > 0 ? (
          <section className={styles.content} aria-label="Présentation de la session">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </section>
        ) : null}

        <section className={styles.docsSection} aria-labelledby="session-documents">
          <div className={styles.docsHeading}>
            <div>
              <p className={styles.docsEyebrow}>Documentation</p>
              <h2 id="session-documents" className={styles.docsTitle}>
                Documents associés
              </h2>
            </div>
            <span className={styles.docsCount}>
              {docs.length} document{docs.length > 1 ? "s" : ""}
            </span>
          </div>

          {docs.length > 0 ? (
            <div className={styles.docsGrid}>
              {docs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyDocs} role="status">
              Aucun document publié n’est actuellement associé à cette session.
            </div>
          )}
        </section>
      </Container>
    </>
  );
}
