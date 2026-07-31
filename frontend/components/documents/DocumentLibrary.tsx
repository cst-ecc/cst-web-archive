"use client";

import { useMemo, useState } from "react";
import DocumentCard from "./DocumentCard";
import DocumentFilters from "./DocumentFilters";
import SearchField from "@/components/ui/SearchField";
import Pagination from "@/components/ui/Pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { normalize, yearOf } from "@/lib/utils";
import type { Category, DocumentItem } from "@/lib/types";
import styles from "./DocumentLibrary.module.scss";

/**
 * Bibliothèque interactive. En phase 1, le filtrage s'effectue côté client
 * sur l'ensemble reçu du serveur (petit volume). Lors du branchement Django,
 * ce composant pourra déléguer le filtrage à l'API via des paramètres d'URL.
 */
export default function DocumentLibrary({
  documents,
  categories,
  years,
  lockedCategorySlug,
}: {
  documents: DocumentItem[];
  categories: Category[];
  years: number[];
  /** Verrouille la catégorie (pages Décisions / Rapports). */
  lockedCategorySlug?: string;
}) {
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState(lockedCategorySlug ?? "");
  const [year, setYear] = useState("");
  const [ordering, setOrdering] = useState("recent");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...documents];
    const effectiveCat = lockedCategorySlug ?? categorySlug;
    if (effectiveCat) list = list.filter((d) => d.categorySlug === effectiveCat);
    if (year) list = list.filter((d) => yearOf(d.date) === Number(year));
    if (search) {
      const q = normalize(search);
      list = list.filter(
        (d) =>
          normalize(d.title).includes(q) ||
          normalize(d.summary).includes(q) ||
          normalize(d.reference).includes(q),
      );
    }
    switch (ordering) {
      case "ancien": list.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "titre": list.sort((a, b) => a.title.localeCompare(b.title, "fr")); break;
      case "populaire": list.sort((a, b) => b.downloads - a.downloads); break;
      default: list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return list;
  }, [documents, lockedCategorySlug, categorySlug, year, search, ordering]);

  const count = filtered.length;
  const start = (page - 1) * DEFAULT_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + DEFAULT_PAGE_SIZE);

  const reset = (fn: (v: string) => void) => (v: string) => {
    setPage(1);
    fn(v);
  };

  return (
    <div>
      <div className={styles.searchRow}>
        <SearchField value={search} onChange={reset(setSearch)} />
      </div>

      {!lockedCategorySlug && (
        <div className={styles.filtersRow}>
          <DocumentFilters
            categories={categories}
            years={years}
            categorySlug={categorySlug}
            year={year}
            ordering={ordering}
            onCategory={reset(setCategorySlug)}
            onYear={reset(setYear)}
            onOrdering={reset(setOrdering)}
          />
        </div>
      )}

      {lockedCategorySlug && (
        <div className={styles.lockedFilters}>
          <div>
            <label htmlFor="f-year" className={styles.label}>Année</label>
            <select id="f-year" className={styles.select} value={year} onChange={(e) => reset(setYear)(e.target.value)}>
              <option value="">Toutes les années</option>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-order" className={styles.label}>Trier</label>
            <select id="f-order" className={styles.select} value={ordering} onChange={(e) => reset(setOrdering)(e.target.value)}>
              <option value="recent">Plus récents</option>
              <option value="ancien">Plus anciens</option>
              <option value="titre">Titre (A→Z)</option>
              <option value="populaire">Téléchargements</option>
            </select>
          </div>
        </div>
      )}

      <p className={styles.count} aria-live="polite">
        {count} document{count > 1 ? "s" : ""} trouvé{count > 1 ? "s" : ""}
      </p>

      {count === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Aucun document ne correspond</p>
          <p className={styles.emptyHint}>Modifiez la recherche ou les filtres pour élargir les résultats.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {pageItems.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} count={count} onPageChange={setPage} />
    </div>
  );
}
