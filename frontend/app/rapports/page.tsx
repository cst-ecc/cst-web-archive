import type { Metadata } from "next";

import DocumentLibrary from "@/components/documents/DocumentLibrary";
import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import NewsCard from "@/components/news/NewsCard";
import {
  getCategories,
  getDocumentYears,
  getDocuments,
  getReportNews,
} from "@/lib/api";

import styles from "../pages.module.scss";

export const metadata: Metadata = {
  title: "Rapports",
  description:
    "Articles institutionnels donnant accès aux rapports et documents associés du CST et du CSMO.",
};
export const revalidate = 300;

export default async function RapportsPage() {
  const articles = await getReportNews();

  // Compatibilité de migration : tant qu'aucun article n'est encore relié aux
  // rapports existants, l'ancienne bibliothèque reste visible. Dès qu'une
  // association Article ↔ Rapport existe, l'éditorial devient le point d'entrée.
  const legacyData =
    articles.length === 0
      ? await Promise.all([
          getDocuments({ categorySlug: "rapports", pageSize: 1000 }),
          getCategories(),
          getDocumentYears(),
        ])
      : null;

  return (
    <>
      <PageHeader
        eyebrow="Bibliothèque"
        title="Rapports"
        subtitle="Chaque rapport est présenté dans son contexte éditorial, puis proposé à la lecture depuis l’article associé."
      />
      <Container className={styles.section}>
        {articles.length > 0 ? (
          <div className={styles.grid3}>
            {articles.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        ) : legacyData ? (
          <DocumentLibrary
            documents={legacyData[0].results}
            categories={legacyData[1]}
            years={legacyData[2]}
            lockedCategorySlug="rapports"
          />
        ) : null}
      </Container>
    </>
  );
}
