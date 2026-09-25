"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { toPublicMediaHref } from "@/lib/media";
import { shouldUseNativePdfReader } from "@/lib/pdf-device";

import styles from "./PdfViewer.module.scss";

type Availability = "checking" | "ready" | "error";
type ReaderMode = "detecting" | "embedded" | "native";

export default function PdfViewer({
  src,
  title,
  compact = false,
}: {
  src: string;
  title: string;
  compact?: boolean;
}) {
  const frameRef = useRef<HTMLElement>(null);
  const [availability, setAvailability] = useState<Availability>("checking");
  const [loaded, setLoaded] = useState(false);
  const [readerMode, setReaderMode] = useState<ReaderMode>("detecting");

  const publicSrc = useMemo(() => toPublicMediaHref(src), [src]);

  const viewerSrc = useMemo(() => {
    const fragment = "toolbar=0&navpanes=0&scrollbar=1&view=FitH";
    return publicSrc.includes("#") ? publicSrc : `${publicSrc}#${fragment}`;
  }, [publicSrc]);

  useEffect(() => {
    setReaderMode(shouldUseNativePdfReader() ? "native" : "embedded");
  }, []);

  useEffect(() => {
    let active = true;

    if (!publicSrc || publicSrc === "#") {
      setAvailability("error");
      return () => {
        active = false;
      };
    }

    try {
      const resolved = new URL(publicSrc, window.location.href);
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

    void fetch(publicSrc, { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (active) setAvailability(response.ok ? "ready" : "error");
      })
      .catch(() => {
        if (active) setAvailability("error");
      });

    return () => {
      active = false;
    };
  }, [publicSrc]);

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

  if (readerMode === "native") {
    return (
      <section
        ref={frameRef}
        className={compact ? styles.viewerCompact : styles.viewer}
        aria-label={`Lecteur PDF — ${title}`}
      >
        <div className={styles.toolbar}>
          <div className={styles.toolbarText}>
            <span className={styles.format}>PDF</span>
            <span className={styles.hint}>Lecture mobile</span>
          </div>
        </div>

        <div className={styles.mobileReader}>
          <div className={styles.mobileReaderIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="34" height="34">
              <path
                d="M7 3h7l4 4v14H7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path d="M9.5 13h5M9.5 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>

          <div className={styles.mobileReaderCopy}>
            <strong>Lecture optimisée pour téléphone et tablette</strong>
            <span>
              Le PDF s’ouvre dans le lecteur natif du navigateur afin de permettre le
              défilement de toutes les pages.
            </span>
          </div>

          {availability === "ready" ? (
            <a className={styles.mobileOpenButton} href={publicSrc}>
              Lire toutes les pages
              <span aria-hidden="true">→</span>
            </a>
          ) : (
            <div className={styles.mobileChecking} role="status" aria-live="polite">
              <span className={styles.spinner} aria-hidden="true" />
              Vérification du document…
            </div>
          )}
        </div>
      </section>
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
        {(readerMode === "detecting" || availability === "checking" || !loaded) && (
          <div className={styles.loading} role="status" aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            Chargement du document…
          </div>
        )}

        {readerMode === "embedded" && availability === "ready" && (
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
