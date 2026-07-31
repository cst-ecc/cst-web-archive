import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import Container from "@/components/layout/Container";
import NewsCard from "@/components/news/NewsCard";
import { getNews } from "@/lib/api";
import styles from "../pages.module.scss";

export const metadata: Metadata = {
  title: "Actualités",
  description: "Actualités et communications du Conseil Supérieur de Transition.",
};
export const revalidate = 300;

export default async function ActualitesPage() {
  const news = await getNews();
  return (
    <>
      <PageHeader eyebrow="Communication" title="Actualités" subtitle="Les dernières informations sur les travaux du Conseil." />
      <Container className={styles.section}>
        <div className={styles.grid3}>
          {news.map((n) => <NewsCard key={n.id} item={n} />)}
        </div>
      </Container>
    </>
  );
}
