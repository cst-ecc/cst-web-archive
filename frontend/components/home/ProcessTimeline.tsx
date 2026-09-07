import Container from "@/components/layout/Container";
import styles from "./ProcessTimeline.module.scss";

const STEPS = [
  { word: "Réconcilier", text: "Rétablir le dialogue et restaurer la confiance entre les différentes sensibilités." },
  { word: "Rassembler", text: "Permettre aux différentes composantes de se retrouver autour d’une seule Église." },
  { word: "Harmoniser", text: "Mettre en cohérence les textes, les rites, la liturgie, la hiérarchie et les pratiques." },
  { word: "Refonder", text: "Construire une organisation commune capable de prévenir durablement les crises de gouvernance." },
  { word: "Légitimer", text: "Mettre en place des institutions et des autorités reconnues selon les mécanismes prévus." },
  { word: "Transmettre", text: "Passer progressivement des organes de transition à la gouvernance définitive de l’Église réunifiée." },
];

export default function ProcessTimeline() {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>La démarche en 6 mots</p>
          <h2 className={styles.title}>Un chemin progressif vers une Église réunifiée</h2>
          <p className={styles.subtitle}>Six verbes pour comprendre la logique du processus, de la réconciliation à la transmission vers une gouvernance définitive.</p>
        </div>

        <ol className={styles.timeline}>
          {STEPS.map((step, index) => (
            <li key={step.word} className={styles.step}>
              <div className={styles.marker}>{String(index + 1).padStart(2, "0")}</div>
              <div className={styles.card}>
                <h3>{step.word}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
