import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DocumentReadButton from "@/components/documents/DocumentReadButton";
import Container from "@/components/layout/Container";
import SiteAlertTicker from "@/components/layout/SiteAlertTicker";
import BackButton from "@/components/navigation/BackButton";
import Badge from "@/components/ui/Badge";
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

  const readablePdf = !doc.isConfidential && doc.fileType === "pdf" && Boolean(doc.fileUrl) && doc.fileUrl !== "#";

  return (
    <>
      <SiteAlertTicker />
      <Container className={styles.wrapper}>
        <div className={styles.backRow}>
          <BackButton fallbackHref="/documents" label="Retour aux documents" />
        </div>

        <div className={styles.layout}>
          <article>
            <div className={styles.badges}>
              <Badge tone="blue">{KIND_LABELS[doc.kind]}</Badge>
              {doc.reference ? <Badge tone="muted">{doc.reference}</Badge> : null}
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
                <dt className={styles.ficheLabel}>Ouvertures</dt>
                <dd className={styles.ficheValue}>{doc.openCount ?? 0}</dd>
              </div>
            </dl>

            {readablePdf ? (
              <DocumentReadButton
                slug={doc.slug}
                label="Lire le document"
                className={styles.readButton}
                returnHref={`/documents/${doc.slug}`}
              />
            ) : doc.isConfidential ? (
              <>
                <div className={styles.confidentialNotice}>
                  <strong>Document à accès contrôlé</strong>
                  <span>Une autorisation nominative est nécessaire pour consulter ce fichier.</span>
                </div>
                <DocumentReadButton
                  slug={doc.slug}
                  label="Demander l’accès"
                  className={styles.readButton}
                  returnHref={`/documents/${doc.slug}`}
                  isConfidential
                />
              </>
            ) : (
              <p className={styles.unavailable}>Lecture intégrée indisponible pour ce fichier.</p>
            )}
          </aside>
        </div>
      </Container>
    </>
  );
}
