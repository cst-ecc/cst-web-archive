"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./PdfViewer.module.scss";

type Availability = "checking" | "ready" | "error";

export default function PdfViewer({
  src,
  title,
  compact = false,
}: {
  src: string;
  title: string;
  compact?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [availability, setAvailability] = useState<Availability>("checking");
  const [loaded, setLoaded] = useState(false);

  const viewerSrc = useMemo(() => {
    const fragment = "toolbar=0&navpanes=0&scrollbar=1&view=FitH";
    return src.includes("#") ? src : `${src}#${fragment}`;
  }, [src]);

  useEffect(() => {
    let active = true;

    if (!src || src === "#") {
      setAvailability("error");
      return () => {
        active = false;
      };
    }

    try {
      const resolved = new URL(src, window.location.href);
      if (resolved.origin !== window.location.origin) {
        setAvailability("ready");
        return () => {
          active = false;
        };
      }
    } catch {
      setAvailability("error");
      return () => {
        active = false;
      };
    }

    void fetch(src, { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (active) setAvailability(response.ok ? "ready" : "error");
      })
      .catch(() => {
        if (active) setAvailability("error");
      });

    return () => {
      active = false;
    };
  }, [src]);

  const enterFullscreen = async () => {
    if (!frameRef.current?.requestFullscreen) return;

    try {
      await frameRef.current.requestFullscreen();
    } catch {
      // Le plein écran est un confort facultatif ; son refus ne bloque pas la lecture.
    }
  };

  if (availability === "error") {
    return (
      <div className={styles.error} role="status">
        <strong>Document indisponible</strong>
        <span>
          Le fichier PDF ne peut pas être chargé pour le moment. Réessayez ultérieurement.
        </span>
      </div>
    );
  }

  return (
    <section
      ref={frameRef}
      className={compact ? styles.viewerCompact : styles.viewer}
      aria-label={`Lecteur PDF — ${title}`}
    >
      <div className={styles.toolbar}>
        <div className={styles.toolbarText}>
          <span className={styles.format}>PDF</span>
          <span className={styles.hint}>Lecture intégrée</span>
        </div>
        <button type="button" className={styles.fullscreenButton} onClick={enterFullscreen}>
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <path
              d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Plein écran</span>
        </button>
      </div>

      <div className={styles.frameWrap}>
        {(availability === "checking" || !loaded) && (
          <div className={styles.loading} role="status" aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            Chargement du document…
          </div>
        )}

        {availability === "ready" && (
          <iframe
            src={viewerSrc}
            title={title}
            className={styles.frame}
            onLoad={() => setLoaded(true)}
            onError={() => setAvailability("error")}
          />
        )}
      </div>
    </section>
  );
}
