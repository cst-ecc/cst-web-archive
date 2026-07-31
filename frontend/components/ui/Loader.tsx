import styles from "./Loader.module.scss";

export default function Loader({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className={styles.loader} role="status">
      <span className={styles.spinner} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
