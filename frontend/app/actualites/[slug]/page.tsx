import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import DocumentCard from "@/components/documents/DocumentCard";
import { getNews, getNewsBySlug, getDocumentBySlug } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import styles from "../actu-detail.module.scss";

export const revalidate = 300;

export async function generateStaticParams() {
  const news = await getNews();
  return news.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const n = await getNewsBySlug(params.slug);
  if (!n) return { title: "Actualité introuvable" };
  return {
    title: n.title,
    description: n.excerpt,
    openGraph: { images: [{ url: n.imageUrl }] },
  };
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const item = await getNewsBySlug(params.slug);
  if (!item) notFound();

  const docs = (
    await Promise.all((item.relatedDocumentSlugs ?? []).map((s) => getDocumentBySlug(s)))
  ).filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <Container className={styles.wrapper}>
      <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
        <Link href="/actualites">Actualités</Link>
      </nav>

      <article className={styles.article}>
        <time dateTime={item.date} className={styles.date}>{formatDate(item.date)}</time>
        <h1 className={styles.title}>{item.title}</h1>
        <div className={styles.rule} />
        <div className={styles.imageWrap}>
          <Image src={item.imageUrl} alt="" fill sizes="(max-width:768px) 100vw, 768px" className={styles.image} priority />
        </div>
        <div className={styles.body}>
          {item.content.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>

      {docs.length > 0 && (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedTitle}>Documents liés</h2>
          <div className={styles.relatedGrid}>
            {docs.map((d) => <DocumentCard key={d.id} doc={d} />)}
          </div>
        </section>
      )}
    </Container>
  );
}
