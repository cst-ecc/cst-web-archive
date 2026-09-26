import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import DocumentAccessRequestForm from "@/components/documents/DocumentAccessRequestForm";
import Container from "@/components/layout/Container";
import SiteAlertTicker from "@/components/layout/SiteAlertTicker";
import BackButton from "@/components/navigation/BackButton";
import { getDocumentBySlug } from "@/lib/api";

import styles from "./request-access.module.scss";

export const metadata: Metadata = {
  title: "Demande d’accès à un document",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function DocumentAccessRequestPage({
  params,
}: {
  params: { slug: string };
}) {
  const doc = await getDocumentBySlug(params.slug);
  if (!doc) notFound();
  if (!doc.isConfidential) redirect(`/documents/${doc.slug}`);

  return (
    <>
      <SiteAlertTicker />
      <Container className={styles.wrapper}>
        <BackButton fallbackHref={`/documents/${doc.slug}`} label="Retour au document" />

        <header className={styles.header}>
          <span className={styles.lock}>Accès contrôlé</span>
          <h1>Demander l’accès</h1>
          <p className={styles.documentTitle}>{doc.title}</p>
          <p className={styles.intro}>
            Ce document est confidentiel. Votre demande sera examinée avant toute
            consultation. Une autorisation accordée sera nominative, temporaire et
            vérifiée par e-mail.
          </p>
        </header>

        <DocumentAccessRequestForm slug={doc.slug} />
      </Container>
    </>
  );
}
