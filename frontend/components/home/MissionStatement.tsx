import Container from "@/components/layout/Container";
import styles from "./MissionStatement.module.scss";

/**
 * Introduction institutionnelle du footer.
 * Le composant est désormais monté DANS le Footer afin que la dernière
 * séquence éditoriale et le pied de page forment un seul bloc visuel.
 */
export default function MissionStatement() {
  return (
    <section className={styles.section} aria-labelledby="mission-footer-title">
      <Container className={styles.inner}>
        <p className={styles.eyebrow}>Une même Église, une même mission</p>
        <h2 id="mission-footer-title" className={styles.title}>
          L’unité n’est pas une fin en soi.
        </h2>
        <p className={styles.text}>
          Elle vise à permettre à l’Église du Christianisme Céleste, réconciliée
          et mieux organisée, de consacrer pleinement ses forces à ce pour quoi
          elle existe : rendre témoignage de Jésus-Christ, annoncer l’Évangile,
          prendre soin des âmes et accomplir sa mission dans le monde.
        </p>
        <div
          className={styles.words}
          aria-label="Réconcilier, rassembler, harmoniser, refonder, légitimer et transmettre"
        >
          <span>Réconcilier</span><i>•</i>
          <span>Rassembler</span><i>•</i>
          <span>Harmoniser</span><i>•</i>
          <span>Refonder</span><i>•</i>
          <span>Légitimer</span><i>•</i>
          <span>Transmettre</span>
        </div>
      </Container>
    </section>
  );
}
