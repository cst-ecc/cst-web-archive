import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import Container from "@/components/layout/Container";
import DocumentLibrary from "@/components/documents/DocumentLibrary";
import { getCategories, getDocumentYears, getDocuments } from "@/lib/api";
import styles from "../pages.module.scss";

export const metadata: Metadata = {
  title: "Décisions",
  description: "Décisions officielles adoptées par le Conseil Supérieur de Transition.",
};
export const revalidate = 300;

export default async function DecisionsPage() {
  const [{ results }, categories, years] = await Promise.all([
    getDocuments({ categorySlug: "decisions", pageSize: 1000 }),
    getCategories(),
    getDocumentYears(),
  ]);
  return (
    <>
      <PageHeader eyebrow="Bibliothèque" title="Décisions" subtitle="Les décisions officielles adoptées par le Conseil." />
      <Container className={styles.section}>
        <DocumentLibrary documents={results} categories={categories} years={years} lockedCategorySlug="decisions" />
      </Container>
    </>
  );
}
