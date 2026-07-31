"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./HomeSearch.module.scss";

/** Recherche rapide de l'accueil : redirige vers la bibliothèque. */
export default function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = () => {
    const query = q.trim();
    router.push(query ? `/documents?q=${encodeURIComponent(query)}` : "/documents");
  };

  return (
    <div className={styles.bar}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Rechercher une décision, un rapport, un communiqué…"
        aria-label="Rechercher dans la bibliothèque documentaire"
        className={styles.input}
      />
      <button type="button" onClick={submit} className={styles.button}>
        Rechercher
      </button>
    </div>
  );
}
