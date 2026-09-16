import { HOME_PANELS } from "@/lib/home-v2";
import styles from "./PanelNavigation.module.scss";

type PanelNavigationProps = {
  activeIndex: number;
  onNavigate: (index: number) => void;
};

export default function PanelNavigation({ activeIndex, onNavigate }: PanelNavigationProps) {
  return (
    <>
      <nav className={styles.rail} aria-label="Sections de la page d’accueil">
        {HOME_PANELS.map((panel, index) => (
          <button
            key={panel.id}
            type="button"
            className={index === activeIndex ? styles.active : styles.button}
            onClick={() => onNavigate(index)}
            aria-label={`Afficher la section ${panel.label}`}
            aria-current={index === activeIndex ? "page" : undefined}
          >
            {String(index + 1).padStart(2, "0")}
          </button>
        ))}
      </nav>

      <div className={styles.controls}>
        <span>
          {String(activeIndex + 1).padStart(2, "0")} / {String(HOME_PANELS.length).padStart(2, "0")}
        </span>
        <div>
          <button
            type="button"
            onClick={() => onNavigate(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Section précédente"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => onNavigate(activeIndex + 1)}
            disabled={activeIndex === HOME_PANELS.length - 1}
            aria-label="Section suivante"
          >
            →
          </button>
        </div>
      </div>
    </>
  );
}
