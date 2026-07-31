import type { Category } from "@/lib/types";
import styles from "./DocumentFilters.module.scss";

/** Barre de filtres présentational (état géré par le parent). */
export default function DocumentFilters({
  categories,
  years,
  categorySlug,
  year,
  ordering,
  onCategory,
  onYear,
  onOrdering,
}: {
  categories: Category[];
  years: number[];
  categorySlug: string;
  year: string;
  ordering: string;
  onCategory: (v: string) => void;
  onYear: (v: string) => void;
  onOrdering: (v: string) => void;
}) {
  return (
    <div className={styles.grid}>
      <div>
        <label htmlFor="f-cat" className={styles.label}>Catégorie</label>
        <select id="f-cat" className={styles.select} value={categorySlug} onChange={(e) => onCategory(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-year" className={styles.label}>Année</label>
        <select id="f-year" className={styles.select} value={year} onChange={(e) => onYear(e.target.value)}>
          <option value="">Toutes les années</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-order" className={styles.label}>Trier</label>
        <select id="f-order" className={styles.select} value={ordering} onChange={(e) => onOrdering(e.target.value)}>
          <option value="recent">Plus récents</option>
          <option value="ancien">Plus anciens</option>
          <option value="titre">Titre (A→Z)</option>
          <option value="populaire">Téléchargements</option>
        </select>
      </div>
    </div>
  );
}
