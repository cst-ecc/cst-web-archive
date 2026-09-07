import styles from "./InfoBar.module.scss";

const items = [
  {
    label: "Transition",
    value: "CST",
    sub: "Dialogue, harmonisation, consolidation et préparation du cadre commun.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12h16M12 4l8 8-8 8" />
      </svg>
    ),
  },
  {
    label: "Mise en œuvre",
    value: "CSMO",
    sub: "Appropriation, déploiement et préparation progressive des institutions définitives.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12l5 5L21 4" />
      </svg>
    ),
  },
  {
    label: "Modernisation",
    value: "DIGECC",
    sub: "Digitalisation, recensement et structuration numérique au service de l’ECC.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" />
      </svg>
    ),
  },
];

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
