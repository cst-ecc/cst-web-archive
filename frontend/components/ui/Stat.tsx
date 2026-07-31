import styles from "./Stat.module.scss";

export default function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className={styles.stat}>
      <p className={styles.value}>{value}</p>
      <p className={styles.label}>{label}</p>
    </div>
  );
}
