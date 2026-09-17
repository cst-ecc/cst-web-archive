import Image from "next/image";
import Link from "next/link";

import type {
    NewsHomeSlot,
    NewsItem,
} from "@/lib/types";

import { formatDate } from "@/lib/utils";
import { imageNeedsUnoptimized } from "./homeV2.utils";

import styles from "./HomeSpecialNews.module.scss";

type HomeSpecialNewsProps = {
    items: NewsItem[];
};

type SpecialNewsCardProps = {
    item: NewsItem;
    slot: NewsHomeSlot;
};

function SpecialNewsCard({
    item,
    slot,
}: SpecialNewsCardProps) {
    const attachment = item.attachment;

    const mediaUrl =
        attachment?.type === "image"
            ? attachment.url
            : attachment?.previewUrl;

    const isAlert = slot === "alert_info";
    const showEventDate =
        slot === "upcoming_event" && Boolean(item.eventDate);

    return (
        <article
            className={styles.card}
            data-tone={isAlert ? "alert" : "event"}
        >
            <div className={styles.media}>
                {mediaUrl ? (
                    <Image
                        src={mediaUrl}
                        alt={
                            item.imageAlt ??
                            attachment?.label ??
                            item.title
                        }
                        fill
                        sizes="(max-width: 639px) 100vw, 12rem"
                        className={styles.image}
                        unoptimized={imageNeedsUnoptimized(mediaUrl)}
                    />
                ) : attachment?.type === "pdf" ? (
                    <div
                        className={styles.pdfPreview}
                        aria-hidden="true"
                    >
                        <svg viewBox="0 0 24 24">
                            <path d="M6 2h8l4 4v16H6z" />
                            <path d="M14 2v5h5" />
                        </svg>

                        <strong>PDF</strong>
                    </div>
                ) : (
                    <Image
                        src={item.imageUrl}
                        alt={item.imageAlt ?? item.title}
                        fill
                        sizes="(max-width: 639px) 100vw, 12rem"
                        className={styles.image}
                        unoptimized={imageNeedsUnoptimized(item.imageUrl)}
                    />
                )}

                <span className={styles.mediaType}>
                    {attachment?.type === "pdf"
                        ? "PDF"
                        : "IMAGE"}
                </span>
            </div>

            <div className={styles.content}>
                <div className={styles.topLine}>
                    <span className={styles.badge}>
                        {isAlert
                            ? "Alerte Info"
                            : "Événement à venir"}
                    </span>

                    {showEventDate ? (
                        <time dateTime={item.eventDate}>
                            {formatDate(item.eventDate!)}
                        </time>
                    ) : null}
                </div>

                <h3>{item.title}</h3>

                <p>{item.excerpt}</p>

                <Link
                    href={`/actualites/${item.slug}`}
                    className={styles.readMore}
                >
                    Lire la suite
                    <span aria-hidden="true">→</span>
                </Link>
            </div>
        </article>
    );
}

export default function HomeSpecialNews({
    items,
}: HomeSpecialNewsProps) {
    const event = items.find(
        (item) => item.homeSlot === "upcoming_event",
    );

    const alert = items.find(
        (item) => item.homeSlot === "alert_info",
    );

    if (!event && !alert) {
        return null;
    }

    return (
        <div
            className={styles.wrapper}
            aria-label="Événement à venir et informations importantes"
        >
            {/* Gauche */}
            {event ? (
                <SpecialNewsCard
                    item={event}
                    slot="upcoming_event"
                />
            ) : null}

            {/* Droite */}
            {alert ? (
                <SpecialNewsCard
                    item={alert}
                    slot="alert_info"
                />
            ) : null}
        </div>
    );
}