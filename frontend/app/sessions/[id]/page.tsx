import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import Badge from "@/components/ui/Badge";
import DocumentCard from "@/components/documents/DocumentCard";
import { getSessions, getDocumentBySlug } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import styles from "../session-detail.module.scss";

export const revalidate = 300;

export async function generateStaticParams() {
  const sessions = await getSessions();
  return sessions.map((s) => ({ id: String(s.id) }));
}

async function findById(id: string) {
  const sessions = await getSessions();
  return sessions.find((s) => String(s.id) === id) ?? null;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const s = await findById(params.id);
  if (!s) return { title: "Session introuvable" };
  return { title: s.title, description: s.summary };
}

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const session = await findById(params.id);
  if (!session) notFound();

  const docs = (
    await Promise.all(session.documentSlugs.map((slug) => getDocumentBySlug(slug)))
  ).filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <Container className={styles.wrapper}>
      <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
        <Link href="/sessions">Sessions</Link>
        <span className={styles.breadcrumbSep} aria-hidden>/</span>
        <span className={styles.breadcrumbCurrent}>Session n°{session.number}</span>
      </nav>

      <div className={styles.badges}>
        <Badge tone="yellow">Session n°{session.number}</Badge>
        <Badge tone="muted">{session.location}</Badge>
      </div>
      <h1 className={styles.title}>{session.title}</h1>
      <p className={styles.theme}>{session.theme}</p>
      <p className={styles.dates}>
        {formatDate(session.startDate)}{session.endDate ? ` – ${formatDate(session.endDate)}` : ""}
      </p>
      <div className={styles.rule} />
      <p className={styles.summary}>{session.summary}</p>

      {session.imageUrls.length > 0 && (
        <div className={styles.images}>
          {session.imageUrls.map((url) => (
            <div key={url} className={styles.imageWrap}>
              <Image src={url} alt="" fill sizes="(max-width:768px) 100vw, 33vw" className={styles.image} />
            </div>
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <section className={styles.docsSection}>
          <h2 className={styles.docsTitle}>Documents associés</h2>
          <div className={styles.docsGrid}>
            {docs.map((d) => <DocumentCard key={d.id} doc={d} />)}
          </div>
        </section>
      )}
    </Container>
  );
}
