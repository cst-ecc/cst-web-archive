import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getDocumentBySlug, getDocuments } from "@/lib/api";
import { KIND_LABELS } from "@/lib/constants";
import { formatDate, formatFileSize } from "@/lib/utils";
import styles from "../doc-detail.module.scss";

export const revalidate = 300;

export async function generateStaticParams() {
  const { results } = await getDocuments({ pageSize: 1000 });
  return results.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const doc = await getDocumentBySlug(params.slug);
  if (!doc) return { title: "Document introuvable" };
  return { title: doc.title, description: doc.summary };
}

export default async function DocumentDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const doc = await getDocumentBySlug(params.slug);
  if (!doc) notFound();

  return (
    <Container className={styles.wrapper}>
      <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
        <Link href="/documents">Bibliothèque</Link>
        <span className={styles.breadcrumbSep} aria-hidden>/</span>
        <span className={styles.breadcrumbCurrent}>{doc.reference}</span>
      </nav>

      <div className={styles.layout}>
        <article>
          <div className={styles.badges}>
            <Badge tone="blue">{KIND_LABELS[doc.kind]}</Badge>
            <Badge tone="muted">{doc.reference}</Badge>
          </div>
          <h1 className={styles.title}>{doc.title}</h1>
          <div className={styles.rule} />
          <p className={styles.summary}>{doc.summary}</p>
        </article>

        <aside className={styles.sidebar}>
          <h2 className={styles.ficheTitle}>Fiche du document</h2>
          <dl className={styles.ficheList}>
            <div className={styles.ficheRow}>
              <dt className={styles.ficheLabel}>Date</dt>
              <dd className={styles.ficheValue}>{formatDate(doc.date)}</dd>
            </div>
            <div className={styles.ficheRow}>
              <dt className={styles.ficheLabel}>Catégorie</dt>
              <dd className={styles.ficheValue}>{KIND_LABELS[doc.kind]}</dd>
            </div>
            <div className={styles.ficheRow}>
              <dt className={styles.ficheLabel}>Format</dt>
              <dd className={styles.ficheValueUpper}>{doc.fileType}</dd>
            </div>
            <div className={styles.ficheRow}>
              <dt className={styles.ficheLabel}>Taille</dt>
              <dd className={styles.ficheValue}>{formatFileSize(doc.fileSize)}</dd>
            </div>
            <div className={styles.ficheRow}>
              <dt className={styles.ficheLabel}>Téléchargements</dt>
              <dd className={styles.ficheValue}>{doc.downloads}</dd>
            </div>
          </dl>
          <Button
            href={doc.downloadUrl ?? doc.fileUrl}
            variant="solid"
            className={styles.downloadButton}
            download
          >
            Télécharger le document
          </Button>
        </aside>
      </div>
    </Container>
  );
}
