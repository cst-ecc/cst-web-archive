"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { OrganizationHotspot } from "@/lib/organization";

import styles from "./OrganizationViewer.module.scss";

const ZOOM_STEPS = [1, 1.25, 1.5, 1.75, 2];

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.2 4.2M8 11h6" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.2 4.2M8 11h6M11 8v6" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4H4v4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.5 14.5l5-5M7.2 16.8l-1.4 1.4a3.4 3.4 0 004.8 4.8l3.2-3.2a3.4 3.4 0 000-4.8M16.8 7.2l1.4-1.4a3.4 3.4 0 00-4.8-4.8l-3.2 3.2a3.4 3.4 0 000 4.8" />
    </svg>
  );
}

export default function OrganizationViewer({
  hotspots,
}: {
  hotspots: OrganizationHotspot[];
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fallbackFullscreen, setFallbackFullscreen] = useState(false);
  const zoom = ZOOM_STEPS[zoomIndex];

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!fallbackFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [fallbackFullscreen]);

  const linkedHotspots = useMemo(
    () => hotspots.filter((hotspot) => Boolean(hotspot.href)),
    [hotspots],
  );

  const toggleFullscreen = async () => {
    const shell = shellRef.current;
    if (!shell || typeof document === "undefined") return;

    if (fallbackFullscreen) {
      setFallbackFullscreen(false);
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
      return;
    }

    if (shell.requestFullscreen) {
      try {
        await shell.requestFullscreen();
        return;
      } catch {
        // Certains navigateurs mobiles exposent l’API sans autoriser le plein écran.
      }
    }

    setFallbackFullscreen(true);
  };

  return (
    <section className={styles.section} aria-labelledby="organigramme-officiel-title">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Référence institutionnelle</span>
          <h2 id="organigramme-officiel-title">Organigramme officiel de l’Église</h2>
        </div>
      </div>

      <div
        className={`${styles.viewerShell} ${fallbackFullscreen ? styles.fallbackFullscreen : ""}`}
        ref={shellRef}
      >
        <div className={styles.toolbar} aria-label="Outils de consultation de l’organigramme">
          <div className={styles.zoomGroup}>
            <button
              type="button"
              onClick={() => setZoomIndex((current) => Math.max(0, current - 1))}
              disabled={zoomIndex === 0}
              aria-label="Réduire l’organigramme"
              title="Réduire"
            >
              <ZoomOutIcon />
            </button>
            <span className={styles.zoomValue} aria-live="polite">
              {Math.round(zoom * 100)} %
            </span>
            <button
              type="button"
              onClick={() =>
                setZoomIndex((current) => Math.min(ZOOM_STEPS.length - 1, current + 1))
              }
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              aria-label="Agrandir l’organigramme"
              title="Agrandir"
            >
              <ZoomInIcon />
            </button>
          </div>

          <button
            type="button"
            className={styles.fullscreenButton}
            onClick={toggleFullscreen}
            aria-label={isFullscreen || fallbackFullscreen ? "Quitter le plein écran" : "Afficher en plein écran"}
            title={isFullscreen || fallbackFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            <FullscreenIcon />
            <span>{isFullscreen || fallbackFullscreen ? "Quitter" : "Plein écran"}</span>
          </button>
        </div>

        <div className={styles.scroller}>
          <div
            className={styles.sheet}
            style={{ width: `${zoom * 100}%` }}
          >
            {/* L'image est un rendu HD de la page PDF officielle. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/organization/organigramme-ecc-officiel.png"
              alt="Organigramme officiel de l’Église du Christianisme Céleste : niveau mondial et niveau diocésain"
              width={1984}
              height={2807}
              className={styles.documentImage}
              draggable={false}
            />

            {hotspots.map((hotspot) => {
              if (!hotspot.href) return null;

              return (
                <Link
                  key={hotspot.id}
                  href={hotspot.href}
                  className={styles.hotspot}
                  style={{
                    left: `${hotspot.rect.x}%`,
                    top: `${hotspot.rect.y}%`,
                    width: `${hotspot.rect.width}%`,
                    height: `${hotspot.rect.height}%`,
                  }}
                  aria-label={`Consulter le document relatif à ${hotspot.label}`}
                  title={`Consulter le document relatif à ${hotspot.label}`}
                >
                  <span className={styles.hotspotIcon} aria-hidden="true">
                    <LinkIcon />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <p className={styles.helpText}>
          Utilisez le zoom ou le plein écran pour examiner l’organigramme. Les organes
          disposant d’un document publié sont cliquables directement sur le schéma.
        </p>
      </div>

      {linkedHotspots.length ? (
        <div className={styles.related} aria-labelledby="documents-organes-title">
          <div className={styles.relatedHeading}>
            <span className={styles.eyebrow}>Documents associés</span>
            <h3 id="documents-organes-title">Approfondir les organes de gouvernance</h3>
            <p>
              Ces liens conduisent vers les fiches documentaires publiées sur la plateforme,
              où le document peut être ouvert directement et téléchargé si nécessaire.
            </p>
          </div>

          <div className={styles.relatedGrid}>
            {linkedHotspots.map((hotspot) => (
              <Link key={hotspot.id} href={hotspot.href!} className={styles.relatedCard}>
                <span className={styles.relatedIcon} aria-hidden="true">
                  <LinkIcon />
                </span>
                <span className={styles.relatedText}>
                  <strong>{hotspot.label}</strong>
                  <small>{hotspot.documentTitle}</small>
                </span>
                <span className={styles.relatedArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
