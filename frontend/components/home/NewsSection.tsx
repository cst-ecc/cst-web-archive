import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { getFeaturedNews, getRecentNews } from "@/lib/api";
import { isDjangoMediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/utils";
import styles from "./NewsSection.module.scss";

export default async function NewsSection() {
  const [featuredItems, recentItems] = await Promise.all([
    getFeaturedNews(1),
    getRecentNews(4),
  ]);

  const featured = featuredItems[0] ?? recentItems[0];
  if (!featured) return null;

  const secondary = recentItems
    .filter((item) => item.id !== featured.id)
    .slice(0, 2);

  return (
    <section className={styles.section} aria-labelledby="home-news-title">
      <Container>
        <div className={styles.sectionHeader}>
          <div className={styles.headingBlock}>
            <p className={styles.eyebrow}>Communication</p>
            <h2 id="home-news-title" className={styles.sectionTitle}>
              Actualités
            </h2>
            <p className={styles.intro}>
              Suivez les informations, rencontres et étapes marquantes de la
              Grande Marche vers l’Unité.
            </p>
          </div>

          <Link href="/actualites" className={styles.allNewsLink}>
            Toutes les actualités <span aria-hidden>→</span>
          </Link>
        </div>

        <div className={styles.layout}>
          <article className={styles.featured}>
            <Link
              href={`/actualites/${featured.slug}`}
              className={styles.featuredImageLink}
              aria-label={`Lire l’actualité : ${featured.title}`}
            >
              <div className={styles.featuredImageWrap}>
                <Image
                  src={featured.imageUrl}
                  alt={featured.imageAlt ?? featured.title}
                  fill
                  sizes="(max-width: 1023px) 100vw, 65vw"
                  className={styles.featuredImage}
                  unoptimized={isDjangoMediaUrl(featured.imageUrl)}
                />
                <span className={styles.featuredBadge}>À la une</span>
              </div>
            </Link>

            <div className={styles.featuredBody}>
              <time dateTime={featured.date} className={styles.date}>
                {formatDate(featured.date)}
              </time>
              <h3 className={styles.featuredTitle}>
                <Link href={`/actualites/${featured.slug}`}>
                  {featured.title}
                </Link>
              </h3>
              <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
              <Link
                href={`/actualites/${featured.slug}`}
                className={styles.readMore}
              >
                Lire la suite <span aria-hidden>→</span>
              </Link>
            </div>
          </article>

          {secondary.length > 0 && (
            <div className={styles.secondaryList}>
              {secondary.map((item) => (
                <article key={item.id} className={styles.secondaryCard}>
                  <Link
                    href={`/actualites/${item.slug}`}
                    className={styles.secondaryImageLink}
                    aria-label={`Lire l’actualité : ${item.title}`}
                  >
                    <div className={styles.secondaryImageWrap}>
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt ?? item.title}
                        fill
                        sizes="(max-width: 1023px) 100vw, 34vw"
                        className={styles.secondaryImage}
                        unoptimized={isDjangoMediaUrl(item.imageUrl)}
                      />
                    </div>
                  </Link>
                  <div className={styles.secondaryBody}>
                    <time dateTime={item.date} className={styles.date}>
                      {formatDate(item.date)}
                    </time>
                    <h3 className={styles.secondaryTitle}>
                      <Link href={`/actualites/${item.slug}`}>
                        {item.title}
                      </Link>
                    </h3>
                    <p className={styles.secondaryExcerpt}>{item.excerpt}</p>
                    <Link
                      href={`/actualites/${item.slug}`}
                      className={styles.readMore}
                    >
                      Lire la suite <span aria-hidden>→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
