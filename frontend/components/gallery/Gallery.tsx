"use client";

import { useState } from "react";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { GalleryAlbum, GalleryImage } from "@/lib/types";
import styles from "./Gallery.module.scss";

export default function Gallery({ albums }: { albums: GalleryAlbum[] }) {
  const [active, setActive] = useState<GalleryImage | null>(null);

  return (
    <div className={styles.wrapper}>
      {albums.map((album) => (
        <section key={album.id}>
          <div className={styles.albumHead}>
            <div>
              <h2 className={styles.albumTitle}>{album.title}</h2>
              {album.description && <p className={styles.albumDescription}>{album.description}</p>}
            </div>
            <Badge tone="muted">{formatDate(album.date)}</Badge>
          </div>
          <div className={styles.grid}>
            {album.images.map((img) => (
              <button key={img.id} type="button" onClick={() => setActive(img)} className={styles.thumb}>
                <Image
                  src={img.imageUrl}
                  alt={img.title}
                  fill
                  sizes="(max-width:768px) 50vw, 25vw"
                  className={styles.thumbImage}
                />
              </button>
            ))}
          </div>
        </section>
      ))}

      {active && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={() => setActive(null)}
        >
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogImageWrap}>
              <Image src={active.imageUrl} alt={active.title} fill className={styles.dialogImage} />
            </div>
            <p className={styles.caption}>{active.title}</p>
            <button type="button" onClick={() => setActive(null)} className={styles.closeButton} aria-label="Fermer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
