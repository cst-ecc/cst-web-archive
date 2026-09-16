import { BIBLE_VERSES } from "@/lib/home-v2";
import PanelFrame from "./PanelFrame";
import PanelIcon from "./PanelIcon";
import ProcessPyramid from "./ProcessPyramid";
import {
  CST_CURRENT_PYRAMID_STEP,
  CST_PYRAMID_STEPS,
} from "./progress-data";
import styles from "./ProgressPanel.module.scss";

export default function ProgressPanel() {
  const completedCount = CST_CURRENT_PYRAMID_STEP - 1;
  const remainingCount = CST_PYRAMID_STEPS.length - CST_CURRENT_PYRAMID_STEP;

  return (
    <PanelFrame
      hero={{
        eyebrow: "Où en sommes-nous ?",
        title: "Un chemin déjà parcouru, une mise en œuvre à conduire",
        subtitle:
          "La feuille de route du CST conduit progressivement des acquis de la transition vers les institutions définitives de l’Église.",
        image: "/images/home/action-gouvernance.jpg",
        imageAlt: "Progression du processus d’unité",
      }}
    >
      <div className={styles.layout}>
        <section className={styles.pyramidSection} aria-labelledby="cst-pyramid-title">
          <div className={styles.heading}>
            <div>
              <span>Feuille de route du processus</span>
              <h3 id="cst-pyramid-title">La marche en 7 étapes</h3>
            </div>
            <div className={styles.stepBadge} aria-label="Étape actuelle 4 sur 7">
              <small>Étape actuelle</small>
              <strong>{CST_CURRENT_PYRAMID_STEP} / {CST_PYRAMID_STEPS.length}</strong>
            </div>
          </div>

          <ProcessPyramid
            steps={CST_PYRAMID_STEPS}
            currentStep={CST_CURRENT_PYRAMID_STEP}
          />
        </section>

        <aside className={styles.currentCard} aria-labelledby="current-stage-title">
          <span className={styles.iconCircle} aria-hidden="true">
            <PanelIcon name="chart" />
          </span>
          <p className={styles.kicker}>Nous sommes ici</p>
          <h3 id="current-stage-title">
            Déploiement pour constitution des organes diocésains
          </h3>
          <p className={styles.description}>
            Le processus se situe actuellement à la quatrième marche de la pyramide.
            Les trois premières étapes constituent le socle déjà franchi ; les étapes
            de validation, du Synode-Conclave puis du Pasteur restent à conduire.
          </p>

          <div className={styles.metrics}>
            <div>
              <strong>{completedCount}</strong>
              <span>étapes franchies</span>
            </div>
            <div className={styles.activeMetric}>
              <strong>1</strong>
              <span>étape en cours</span>
            </div>
            <div>
              <strong>{remainingCount}</strong>
              <span>étapes à venir</span>
            </div>
          </div>

          <div className={styles.legend} aria-label="Légende de la pyramide">
            <span><i data-tone="done" /> Franchi</span>
            <span><i data-tone="current" /> En cours</span>
            <span><i data-tone="next" /> À venir</span>
          </div>
        </aside>
      </div>
    </PanelFrame>
  );
}
