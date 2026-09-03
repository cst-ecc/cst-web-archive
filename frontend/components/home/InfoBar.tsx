import styles from "./InfoBar.module.scss";

const items = [
  {
    label: "Installation officielle",
    value: "26 avril 2025",
    sub: "Sous la facilitation du Président de la République du Bénin",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    label: "Sessions de travail",
    value: "9 sessions",
    sub: "Mai 2025 – Avril 2026 · Cotonou & diaspora",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: "Contact",
    value: "support@ecc.bj",
    sub: "Conseil Supérieur de Transition · Cotonou, Bénin",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
];

/** Barre d'informations clés — remonte légèrement sur le hero */
export default function InfoBar() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.bar}>
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.label} className={styles.item}>
              <div className={styles.iconWrap}>{item.icon}</div>
              <div>
                <p className={styles.label}>{item.label}</p>
                <p className={styles.value}>{item.value}</p>
                <p className={styles.sub}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
