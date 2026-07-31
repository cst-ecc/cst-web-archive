import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import Container from "@/components/layout/Container";
import DocumentLibrary from "@/components/documents/DocumentLibrary";
import { getCategories, getDocumentYears, getDocuments } from "@/lib/api";
import styles from "../pages.module.scss";

export const metadata: Metadata = {
  title: "Bibliothèque documentaire",
  description:
    "Consultez et téléchargez les décisions, rapports, procès-verbaux et communiqués du Conseil Supérieur de Transition.",
};

export const revalidate = 300;

export default async function DocumentsPage() {
  const [{ results }, categories, years] = await Promise.all([
    getDocuments({ pageSize: 1000 }),
    getCategories(),
    getDocumentYears(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Archive officielle"
        title="Bibliothèque documentaire"
        subtitle="Recherchez, filtrez et consultez l'ensemble des documents publiés par le CST."
      />
      <Container className={styles.section}>
        <DocumentLibrary documents={results} categories={categories} years={years} />
      </Container>
    </>
  );
}
