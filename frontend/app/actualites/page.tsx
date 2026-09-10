import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import Container from "@/components/layout/Container";
import NewsCard from "@/components/news/NewsCard";
import { getNews } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import styles from "./actualites.module.scss";
import { isDjangoMediaUrl } from "@/lib/media";

export const metadata: Metadata = {
  title: "Actualités",
  description:
    "Actualités, rencontres et communications du processus CST et CSMO.",
};
export const revalidate = 300;

export default async function ActualitesPage() {
  const news = await getNews();
  const featured = news.find((item) => item.featured) ?? news[0];
  const others = featured
    ? news.filter((item) => item.id !== featured.id)
    : [];

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Actualités"
        subtitle="Suivez les informations, rencontres et étapes marquantes de la Grande Marche vers l’Unité."
      />

      <Container className={styles.section}>
        {!featured ? (
          <p className={styles.empty}>Aucune actualité publiée pour le moment.</p>
        ) : (
          <>
            <article className={styles.featured}>
              <Link
                href={`/actualites/${featured.slug}`}
                className={styles.featuredImageLink}
              >
                <div className={styles.featuredImageWrap}>
                  <Image
                    src={featured.imageUrl}
                    alt={featured.imageAlt ?? featured.title}
                    fill
                    priority
                    sizes="(max-width: 1023px) 100vw, 58vw"
                    className={styles.featuredImage}
                    unoptimized={isDjangoMediaUrl(featured.imageUrl)}
                  />
                </div>
              </Link>

              <div className={styles.featuredBody}>
                <p className={styles.kicker}>À la une</p>
                <time dateTime={featured.date} className={styles.date}>
                  {formatDate(featured.date)}
                </time>
                <h2 className={styles.featuredTitle}>
                  <Link href={`/actualites/${featured.slug}`}>
                    {featured.title}
                  </Link>
                </h2>
                <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
                <Link
                  href={`/actualites/${featured.slug}`}
                  className={styles.readMore}
                >
                  Lire la suite <span aria-hidden>→</span>
                </Link>
              </div>
            </article>

            {others.length > 0 && (
              <section className={styles.archive} aria-labelledby="news-list-title">
                <div className={styles.archiveHead}>
                  <div>
                    <p className={styles.archiveEyebrow}>Toutes les publications</p>
                    <h2 id="news-list-title" className={styles.archiveTitle}>
                      Les dernières informations
                    </h2>
                  </div>
                </div>

                <div className={styles.grid}>
                  {others.map((item) => (
                    <NewsCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </Container>
    </>
  );
}
