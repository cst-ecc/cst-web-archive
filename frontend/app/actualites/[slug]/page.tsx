import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import DocumentCard from "@/components/documents/DocumentCard";
import { getNews, getNewsBySlug, getDocumentBySlug } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import styles from "../actu-detail.module.scss";
import { isDjangoMediaUrl } from "@/lib/media";

export const revalidate = 300;

export async function generateStaticParams() {
  const news = await getNews();
  return news.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const item = await getNewsBySlug(params.slug);
  if (!item) return { title: "Actualité introuvable" };

  return {
    title: item.title,
    description: item.excerpt,
    openGraph: {
      images: [
        {
          url: item.imageUrl,
          alt: item.imageAlt ?? item.title,
        },
      ],
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = await getNewsBySlug(params.slug);
  if (!item) notFound();

  const docs = (
    await Promise.all(
      (item.relatedDocumentSlugs ?? []).map((slug) =>
        getDocumentBySlug(slug),
      ),
    )
  ).filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));

  return (
    <Container className={styles.wrapper}>
      <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
        <Link href="/actualites">← Actualités</Link>
      </nav>

      <article className={styles.article}>
        <time dateTime={item.date} className={styles.date}>
          {formatDate(item.date)}
        </time>
        <h1 className={styles.title}>{item.title}</h1>
        <div className={styles.rule} />
        <div className={styles.imageWrap}>
          <Image
            src={item.imageUrl}
            alt={item.imageAlt ?? item.title}
            fill
            sizes="(max-width:768px) 100vw, 768px"
            className={styles.image}
            priority
            unoptimized={isDjangoMediaUrl(item.imageUrl)}
          />
        </div>
        <div className={styles.body}>
          {item.content.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>

      {docs.length > 0 && (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedTitle}>Documents liés</h2>
          <div className={styles.relatedGrid}>
            {docs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
