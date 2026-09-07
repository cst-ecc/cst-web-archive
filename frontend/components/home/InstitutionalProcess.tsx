import Container from "@/components/layout/Container";
import styles from "./InstitutionalProcess.module.scss";

export default function InstitutionalProcess() {
  return (
    <section id="processus" className={styles.section}>
      <Container>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Un même processus institutionnel</p>
          <h2 className={styles.title}>De la transition à la mise en œuvre</h2>
          <div className={styles.rule} />
          <p className={styles.subtitle}>
            Le CST a préparé le cadre de la réunification. Le CSMO accompagne aujourd’hui sa mise en œuvre et le passage progressif vers les institutions définitives.
          </p>
        </div>

        <div className={styles.flow}>
          <article className={styles.card}>
            <span className={styles.step}>01</span>
            <p className={styles.kicker}>Phase de transition</p>
            <h3 className={styles.cardTitle}>Conseil Supérieur de Transition</h3>
            <p className={styles.cardText}>
              Restaurer le dialogue, harmoniser les pratiques, moderniser les textes et préparer une gouvernance commune, durable et respectueuse de l’héritage spirituel de l’Église.
            </p>
            <div className={styles.tags}>
              <span>Dialogue</span>
              <span>Harmonisation</span>
              <span>Textes</span>
              <span>Gouvernance</span>
            </div>
          </article>

          <div className={styles.bridge} aria-hidden>
            <span className={styles.bridgeLine} />
            <span className={styles.bridgeIcon}>→</span>
            <span className={styles.bridgeLabel}>Continuité</span>
          </div>

          <article className={`${styles.card} ${styles.cardCurrent}`}>
            <span className={styles.step}>02</span>
            <p className={styles.kicker}>Phase de mise en œuvre</p>
            <h3 className={styles.cardTitle}>Conseil Supérieur de Mise en Œuvre</h3>
            <p className={styles.cardText}>
              Accompagner l’appropriation des orientations retenues, poursuivre le rapprochement et préparer progressivement l’installation des institutions définitives de l’Église réunifiée.
            </p>
            <div className={styles.tags}>
              <span>Mise en œuvre</span>
              <span>Appropriation</span>
              <span>Déploiement</span>
              <span>Suivi</span>
            </div>
          </article>
        </div>

        <p className={styles.takeaway}>
          <strong>À retenir :</strong> deux organes, deux étapes, une même marche vers une Église réunifiée, légitime et durable.
        </p>
      </Container>
    </section>
  );
}
