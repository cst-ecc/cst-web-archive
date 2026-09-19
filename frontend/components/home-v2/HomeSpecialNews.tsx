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

type MediaSource = {
    url?: string;
    type: "image" | "pdf" | "none";
};

function getMediaSource(
    item: NewsItem,
    slot: NewsHomeSlot,
): MediaSource {
    const attachment = item.attachment;

    /*
     * ALERTE INFO
     *
     * 1. Image de couverture
     * 2. Preview d'un PDF
     * 3. Pièce jointe image
     * 4. PDF sans preview
     */
    if (slot === "alert_info") {
        if (item.imageUrl) {
            return {
                url: item.imageUrl,
                type: "image",
            };
        }

        if (
            attachment?.type === "pdf" &&
            attachment.previewUrl
        ) {
            return {
                url: attachment.previewUrl,
                type: "pdf",
            };
        }

        if (
            attachment?.type === "image" &&
            attachment.url
        ) {
            return {
                url: attachment.url,
                type: "image",
            };
        }

        if (attachment?.type === "pdf") {
            return {
                type: "pdf",
            };
        }

        return {
            type: "none",
        };
    }

    /*
     * ÉVÉNEMENT À VENIR
     *
     * 1. Flyer / pièce jointe image
     * 2. Preview d'un PDF
     * 3. Image de couverture
     * 4. PDF sans preview
     */
    if (
        attachment?.type === "image" &&
        attachment.url
    ) {
        return {
            url: attachment.url,
            type: "image",
        };
    }

    if (
        attachment?.type === "pdf" &&
        attachment.previewUrl
    ) {
        return {
            url: attachment.previewUrl,
            type: "pdf",
        };
    }

    if (item.imageUrl) {
        return {
            url: item.imageUrl,
            type: "image",
        };
    }

    if (attachment?.type === "pdf") {
        return {
            type: "pdf",
        };
    }

    return {
        type: "none",
    };
}

function PdfPlaceholder() {
    return (
        <div
            className={styles.pdfPreview}
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M6 2h8l4 4v16H6z" />
                <path d="M14 2v5h5" />
            </svg>

            <strong>PDF</strong>
        </div>
    );
}

function EmptyMediaPlaceholder() {
    return (
        <div
            className={styles.pdfPreview}
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M4 5h16v14H4z" />
                <path d="m4 15 4-4 3 3 2-2 7 7" />
            </svg>
        </div>
    );
}

function SpecialNewsCard({
    item,
    slot,
}: SpecialNewsCardProps) {
    const attachment = item.attachment;

    const isAlert =
        slot === "alert_info";

    const media = getMediaSource(
        item,
        slot,
    );

    const showEventDate =
        slot === "upcoming_event" &&
        Boolean(item.eventDate);

    const imageAlt =
        item.imageAlt?.trim() ||
        attachment?.label?.trim() ||
        item.title;

    return (
        <article
            className={styles.card}
            data-tone={
                isAlert
                    ? "alert"
                    : "event"
            }
        >
            <div className={styles.media}>
                {media.url ? (
                    <Image
                        src={media.url}
                        alt={imageAlt}
                        fill
                        sizes="(max-width: 639px) 100vw, 12rem"
                        className={styles.image}
                        unoptimized={imageNeedsUnoptimized(
                            media.url,
                        )}
                    />
                ) : media.type === "pdf" ? (
                    <PdfPlaceholder />
                ) : (
                    <EmptyMediaPlaceholder />
                )}
            </div>

            <div className={styles.content}>
                {showEventDate ? (
                    <time
                        className={styles.date}
                        dateTime={item.eventDate}
                    >
                        {formatDate(
                            item.eventDate!,
                        )}
                    </time>
                ) : null}

                <h3>
                    {item.title}
                </h3>

                {item.excerpt ? (
                    <p>
                        {item.excerpt}
                    </p>
                ) : null}

                <Link
                    href={`/actualites/${item.slug}`}
                    className={styles.readMore}
                >
                    Lire la suite

                    <span aria-hidden="true">
                        →
                    </span>
                </Link>
            </div>
        </article>
    );
}

export default function HomeSpecialNews({
    items,
}: HomeSpecialNewsProps) {
    const event = items.find(
        (item) =>
            item.homeSlot ===
            "upcoming_event",
    );

    const alert = items.find(
        (item) =>
            item.homeSlot ===
            "alert_info",
    );

    if (!event && !alert) {
        return null;
    }

    return (
        <div
            className={styles.wrapper}
            aria-label="Événement à venir et informations importantes"
        >
            {event ? (
                <section
                    className={styles.specialBox}
                    aria-labelledby="home-upcoming-event-title"
                >
                    <div
                        className={styles.heading}
                    >
                        <h2
                            id="home-upcoming-event-title"
                        >
                            Événement à venir
                        </h2>
                    </div>

                    <SpecialNewsCard
                        item={event}
                        slot="upcoming_event"
                    />
                </section>
            ) : null}

            {alert ? (
                <section
                    className={styles.specialBox}
                    aria-labelledby="home-alert-info-title"
                >
                    <div
                        className={styles.heading}
                    >
                        <h2
                            id="home-alert-info-title"
                        >
                            Alerte Info
                        </h2>
                    </div>

                    <SpecialNewsCard
                        item={alert}
                        slot="alert_info"
                    />
                </section>
            ) : null}
        </div>
    );
}