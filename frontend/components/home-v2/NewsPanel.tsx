import Image from "next/image";
import Link from "next/link";
import { BIBLE_VERSES } from "@/lib/home-v2";
import type { NewsItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { imageNeedsUnoptimized } from "./homeV2.utils";
import PanelFrame from "./PanelFrame";
import PanelIcon from "./PanelIcon";
import SectionHeading from "./SectionHeading";
import styles from "./NewsPanel.module.scss";

export default function NewsPanel({ newsItems }: { newsItems: NewsItem[] }) {
  const [featured, ...rest] = newsItems;
  const heroImage = featured?.imageUrl || "/images/home/hero-unite.jpeg";

  return (
    <PanelFrame
      hero={{
        eyebrow: "Actualités",
        title: "Suivre la Grande Marche",
        subtitle: "Rencontres, décisions, restitutions et temps forts : l’essentiel de l’actualité du processus CST–CSMO.",
        image: heroImage,
        imageAlt: featured?.imageAlt ?? featured?.title ?? "Actualités du processus",
      }}
      verse={BIBLE_VERSES[0]}
    >
      {featured ? (
        <div className={styles.dashboard}>
          <Link href={`/actualites/${featured.slug}`} className={styles.leadCard}>
            <div className={styles.leadImage}>
              <Image
                src={featured.imageUrl}
                alt={featured.imageAlt ?? featured.title}
                fill
                sizes="(max-width: 900px) 100vw, 32vw"
                className={styles.coverImage}
                unoptimized={imageNeedsUnoptimized(featured.imageUrl)}
              />
            </div>
            <div className={styles.leadBody}>
              <span>À la une · {formatDate(featured.date)}</span>
              <h3>{featured.title}</h3>
              <p>{featured.excerpt}</p>
              <strong>Lire la suite →</strong>
            </div>
          </Link>

          <section className={styles.card}>
            <SectionHeading
              eyebrow="Dernières publications"
              title="Autres actualités"
              action={<Link href="/actualites">Tout voir →</Link>}
            />
            <div className={styles.newsList}>
              {rest.slice(0, 4).map((item) => (
                <Link key={item.id} href={`/actualites/${item.slug}`}>
                  <strong>{item.title}</strong>
                  <small>{formatDate(item.date)}</small>
                  <i>→</i>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <SectionHeading eyebrow="Communication" title="Explorer" />
            <div className={styles.linkList}>
              <Link href="/galerie"><PanelIcon name="people" /><span><strong>Galerie</strong><small>Photos et temps forts</small></span><i>→</i></Link>
              <Link href="/documents?q=communiqu%C3%A9"><PanelIcon name="news" /><span><strong>Communiqués</strong><small>Informations officielles</small></span><i>→</i></Link>
              <Link href="/contact"><PanelIcon name="link" /><span><strong>Contact</strong><small>Joindre l’équipe institutionnelle</small></span><i>→</i></Link>
            </div>
          </section>
        </div>
      ) : (
        <div className={styles.empty}>Aucune actualité publiée pour le moment.</div>
      )}
    </PanelFrame>
  );
}
