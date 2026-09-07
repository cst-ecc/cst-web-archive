import Container from "@/components/layout/Container";
import styles from "./DigitalisationSection.module.scss";

export default function DigitalisationSection() {
  return (
    <section id="digitalisation" className={styles.section}>
      <Container className={styles.inner}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>Digitalisation de l’ECC</p>
          <h2 className={styles.title}>Moderniser pour mieux connaître, organiser et servir l’Église</h2>
          <p className={styles.text}>
            La digitalisation accompagne la modernisation institutionnelle de l’Église du Christianisme Céleste. DIGECC met à disposition des outils destinés à structurer les données, le recensement et la connaissance du territoire ecclésial.
          </p>
          <div className={styles.features}>
            <span>Recensement</span>
            <span>Cartographie</span>
            <span>Structuration numérique</span>
          </div>
          <a
            href="https://recensement-paroisses.ecc.bj"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cta}
          >
            Accéder à DIGECC <span aria-hidden>↗</span>
          </a>
        </div>

        <div className={styles.visual} aria-hidden>
          <div className={styles.screen}>
            <div className={styles.screenTop}><span /><span /><span /></div>
            <div className={styles.screenBody}>
              <div className={styles.metric}><strong>ECC</strong><small>Digitalisation</small></div>
              <div className={styles.lines}><i /><i /><i /></div>
              <div className={styles.cards}><b /><b /><b /></div>
            </div>
          </div>
          <div className={styles.badge}>DIGECC</div>
        </div>
      </Container>
    </section>
  );
}
