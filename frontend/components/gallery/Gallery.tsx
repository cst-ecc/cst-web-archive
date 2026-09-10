"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent,
} from "react";
import Badge from "@/components/ui/Badge";
import { shouldBypassNextImageOptimization } from "@/lib/media";
import { formatDate } from "@/lib/utils";
import type { GalleryAlbum } from "@/lib/types";
import styles from "./Gallery.module.scss";

type ActiveImage = {
  albumIndex: number;
  imageIndex: number;
};

export default function Gallery({ albums }: { albums: GalleryAlbum[] }) {
  const [active, setActive] = useState<ActiveImage | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const captionId = useId();

  const activeAlbum = active ? albums[active.albumIndex] : null;
  const activeImage =
    activeAlbum && active ? activeAlbum.images[active.imageIndex] : null;
  const imageCount = activeAlbum?.images.length ?? 0;

  const close = useCallback(() => {
    setActive(null);
    window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }, []);

  const previous = useCallback(() => {
    setActive((current) => {
      if (!current) return current;
      const album = albums[current.albumIndex];
      if (!album || album.images.length <= 1) return current;
      return {
        ...current,
        imageIndex:
          (current.imageIndex - 1 + album.images.length) % album.images.length,
      };
    });
  }, [albums]);

  const next = useCallback(() => {
    setActive((current) => {
      if (!current) return current;
      const album = albums[current.albumIndex];
      if (!album || album.images.length <= 1) return current;
      return {
        ...current,
        imageIndex: (current.imageIndex + 1) % album.images.length,
      };
    });
  }, [albums]);

  useEffect(() => {
    if (!active) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key === "ArrowLeft" && imageCount > 1) {
        event.preventDefault();
        previous();
        return;
      }

      if (event.key === "ArrowRight" && imageCount > 1) {
        event.preventDefault();
        next();
        return;
      }

      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>("[data-gallery-dialog]");
        if (!dialog) return;

        const controls = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        );

        if (controls.length === 0) return;

        const first = controls[0];
        const last = controls[controls.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, imageCount, close, previous, next]);

  const openImage = (
    albumIndex: number,
    imageIndex: number,
    trigger: HTMLButtonElement,
  ) => {
    lastTriggerRef.current = trigger;
    setActive({ albumIndex, imageIndex });
  };

  const onOverlayClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) close();
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;

    if (start == null || end == null || imageCount <= 1) return;
    const delta = end - start;
    if (Math.abs(delta) < 55) return;
    if (delta > 0) previous();
    else next();
  };

  if (albums.length === 0) {
    return <p className={styles.empty}>Aucune image publiée pour le moment.</p>;
  }

  return (
    <div className={styles.wrapper}>
      {albums.map((album, albumIndex) => (
        <section key={album.id} className={styles.album}>
          <div className={styles.albumHead}>
            <div>
              <h2 className={styles.albumTitle}>{album.title}</h2>
              {album.description && (
                <p className={styles.albumDescription}>{album.description}</p>
              )}
            </div>
            <Badge tone="muted">{formatDate(album.date)}</Badge>
          </div>

          <div className={styles.grid}>
            {album.images.map((image, imageIndex) => (
              <button
                key={image.id}
                type="button"
                onClick={(event) =>
                  openImage(albumIndex, imageIndex, event.currentTarget)
                }
                className={styles.thumb}
                aria-label={`Agrandir : ${image.title || image.alt || album.title}`}
              >
                <Image
                  src={image.imageUrl}
                  alt={image.alt ?? image.title}
                  width={image.width ?? 1200}
                  height={image.height ?? 900}
                  sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                  className={styles.thumbImage}
                  unoptimized={shouldBypassNextImageOptimization(image.imageUrl)}
                />
                <span className={styles.thumbShade} aria-hidden="true" />
                <span className={styles.thumbTitle}>
                  {image.title || image.alt || album.title}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {activeImage && active && activeAlbum && (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={onOverlayClick}
        >
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={captionId}
            data-gallery-dialog
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className={styles.topBar}>
              <span className={styles.counter} aria-live="polite">
                {active.imageIndex + 1} / {imageCount}
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                className={styles.closeButton}
                aria-label="Fermer l’aperçu"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className={styles.viewer}>
              {imageCount > 1 && (
                <button
                  type="button"
                  onClick={previous}
                  className={`${styles.navButton} ${styles.previousButton}`}
                  aria-label="Image précédente"
                >
                  <span aria-hidden>‹</span>
                </button>
              )}

              <div className={styles.dialogImageWrap}>
                <Image
                  key={activeImage.imageUrl}
                  src={activeImage.imageUrl}
                  alt={activeImage.alt ?? activeImage.title}
                  fill
                  sizes="100vw"
                  className={styles.dialogImage}
                  priority
                  unoptimized={shouldBypassNextImageOptimization(activeImage.imageUrl)}
                />
              </div>

              {imageCount > 1 && (
                <button
                  type="button"
                  onClick={next}
                  className={`${styles.navButton} ${styles.nextButton}`}
                  aria-label="Image suivante"
                >
                  <span aria-hidden>›</span>
                </button>
              )}
            </div>

            <div className={styles.captionBar}>
              <p id={captionId} className={styles.caption}>
                {activeImage.title || activeImage.alt || activeAlbum.title}
              </p>
              <p className={styles.albumName}>{activeAlbum.title}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
