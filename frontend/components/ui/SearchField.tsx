import { cn } from "@/lib/utils";
import styles from "./SearchField.module.scss";

/** Champ de recherche présentational (contrôlé par le parent). */
export default function SearchField({
  value,
  onChange,
  placeholder = "Rechercher un document…",
  className,
  id = "recherche",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn(styles.wrapper, className)}>
      <label htmlFor={id} className="visually-hidden">Rechercher</label>
      <svg
        aria-hidden
        className={styles.icon}
        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
    </div>
  );
}
