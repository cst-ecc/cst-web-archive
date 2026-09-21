import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PdfViewer from "@/components/documents/PdfViewer";
import Container from "@/components/layout/Container";
import SiteAlertTicker from "@/components/layout/SiteAlertTicker";
import BackButton from "@/components/navigation/BackButton";
import { getDocumentBySlug } from "@/lib/api";

import styles from "./reader.module.scss";

export const revalidate = 300;

function safeReturnHref(value: string | string[] | undefined, fallback: string) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const doc = await getDocumentBySlug(params.slug);

  if (!doc) return { title: "Document introuvable" };

  return {
    title: `Lecture — ${doc.title}`,
    description: `Lecture intégrée du document « ${doc.title} »`,
  };
}

export default async function DocumentReaderPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { from?: string | string[] };
}) {
  const doc = await getDocumentBySlug(params.slug);
  if (!doc) notFound();

  const fallbackHref = safeReturnHref(
    searchParams?.from,
    `/documents/${doc.slug}`,
  );

  const canDisplayPdf =
    doc.fileType === "pdf" && Boolean(doc.fileUrl) && doc.fileUrl !== "#";

  return (
    <>
      <SiteAlertTicker />
      <Container className={styles.wrapper}>
        <div className={styles.topbar}>
          <BackButton fallbackHref={fallbackHref} />
          <span className={styles.kicker}>Lecteur de document</span>
        </div>

        <header className={styles.header}>
          <p className={styles.reference}>{doc.reference || "Document officiel"}</p>
          <h1 className={styles.title}>{doc.title}</h1>
          <p className={styles.notice}>
            Le document est affiché dans la plateforme. Aucun téléchargement n’est
            proposé depuis cette interface.
          </p>
        </header>

        <div className={styles.viewerWrap}>
          {canDisplayPdf ? (
            <PdfViewer src={doc.fileUrl} title={doc.title} />
          ) : (
            <div className={styles.unavailable} role="status">
              <strong>Lecture intégrée indisponible</strong>
              <span>
                Ce document n’est pas un PDF lisible dans le navigateur ou son fichier
                n’est pas disponible.
              </span>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
