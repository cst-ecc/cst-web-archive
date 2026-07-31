import { cn } from "@/lib/utils";
import styles from "./Pagination.module.scss";

export default function Pagination({
  page,
  pageSize,
  count,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  count: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className={styles.nav} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={styles.navButton}
      >
        Précédent
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(styles.pageButton, p === page && styles.pageButtonActive)}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={styles.navButton}
      >
        Suivant
      </button>
    </nav>
  );
}
