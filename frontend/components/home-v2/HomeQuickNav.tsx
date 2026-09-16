import type { HomePanelId } from "@/lib/home-v2";
import type { HomeNavigate } from "./homeV2.types";
import styles from "./HomeQuickNav.module.scss";

const LINKS: Array<{ number: string; label: string; target: HomePanelId }> = [
  { number: "01", label: "Pourquoi l’unité ?", target: "comprendre" },
  { number: "02", label: "Où en sommes-nous ?", target: "avancement" },
  { number: "03", label: "L’Église en marche", target: "eglise-en-marche" },
  { number: "04", label: "FAQ · 12 questions clés", target: "faq" },
];

export default function HomeQuickNav({ onNavigate }: { onNavigate: HomeNavigate }) {
  return (
    <nav className={styles.nav} aria-label="Accès rapides de la page d’accueil">
      <div className={styles.inner}>
        {LINKS.map((item) => (
          <button key={item.number} type="button" onClick={() => onNavigate(item.target)}>
            <span className={styles.icon}>{item.number}</span>
            <strong>{item.label}</strong>
            <span className={styles.arrow} aria-hidden>→</span>
          </button>
        ))}
        <p className={styles.quote}>« Une Église plus forte, pour des communautés plus vivantes. »</p>
      </div>
    </nav>
  );
}
