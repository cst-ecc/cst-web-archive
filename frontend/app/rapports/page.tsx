import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import Container from "@/components/layout/Container";
import DocumentLibrary from "@/components/documents/DocumentLibrary";
import { getCategories, getDocumentYears, getDocuments } from "@/lib/api";
import styles from "../pages.module.scss";

export const metadata: Metadata = {
  title: "Rapports",
  description: "Rapports d'activité, d'étape et thématiques du Conseil Supérieur de Transition.",
};
export const revalidate = 300;

export default async function RapportsPage() {
  const [{ results }, categories, years] = await Promise.all([
    getDocuments({ categorySlug: "rapports", pageSize: 1000 }),
    getCategories(),
    getDocumentYears(),
  ]);
  return (
    <>
      <PageHeader eyebrow="Bibliothèque" title="Rapports" subtitle="Rapports d'activité, d'étape et thématiques." />
      <Container className={styles.section}>
        <DocumentLibrary documents={results} categories={categories} years={years} lockedCategorySlug="rapports" />
      </Container>
    </>
  );
}
