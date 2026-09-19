import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Container from "@/components/layout/Container";
import DocumentCard from "@/components/documents/DocumentCard";
import NewsAttachmentViewer from "@/components/news/NewsAttachmentViewer";
import NewsMedia from "@/components/news/NewsMedia";
import SiteAlertTicker from "@/components/layout/SiteAlertTicker";
import {
  getDocumentBySlug,
  getNews,
  getNewsBySlug,
} from "@/lib/api";
import { formatDate } from "@/lib/utils";

import styles from "../actu-detail.module.scss";

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

  if (!item) {
    return { title: "Actualité introuvable" };
  }

  return {
    title: item.title,
    description: item.excerpt,
    openGraph: item.imageUrl
      ? {
          images: [
            {
              url: item.imageUrl,
              alt: item.imageAlt ?? item.title,
            },
          ],
        }
      : undefined,
  };
}

function articleLabel(homeSlot?: string) {
  if (homeSlot === "upcoming_event") return "Événement à venir";
  if (homeSlot === "alert_info") return "Dernier INFO";
  return "Actualité";
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

  const displayDate = item.eventDate ?? item.date;
  const attachmentImageAlreadyShown =
    item.attachment?.type === "image" &&
    (!item.imageUrl || item.attachment.url === item.imageUrl);

  const paragraphs = item.content
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const useEditorialColumns =
    paragraphs.length >= 4 && item.content.trim().length >= 1800;

  return (
    <Container className={styles.wrapper}>
      <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
        <Link href="/actualites">← Toutes les actualités</Link>
      </nav>

      <article className={styles.article}>
        <header className={styles.articleHeader}>
          <p className={styles.eyebrow}>{articleLabel(item.homeSlot)}</p>

          <time dateTime={displayDate} className={styles.date}>
            {formatDate(displayDate)}
          </time>

          <h1 className={styles.title}>{item.title}</h1>
          <p className={styles.excerpt}>{item.excerpt}</p>
          <div className={styles.rule} />
        </header>

        <SiteAlertTicker />

        {item.imageUrl || item.attachment ? (
          <div className={styles.imageWrap}>
            <NewsMedia
              item={item}
              priority
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 90vw, 1440px"
            />
          </div>
        ) : null}

        <div
          className={styles.body}
          data-editorial-columns={useEditorialColumns ? "true" : "false"}
        >
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {item.attachment &&
        (item.attachment.type === "pdf" || !attachmentImageAlreadyShown) ? (
          <div className={styles.attachmentWrap}>
            <NewsAttachmentViewer item={item} />
          </div>
        ) : null}
      </article>

      {docs.length > 0 ? (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedTitle}>Documents liés</h2>
          <div className={styles.relatedGrid}>
            {docs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}
