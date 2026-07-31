import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import { SITE } from "@/lib/constants";
import styles from "./Hero.module.scss";

/**
 * Héro simplifié. Pour ajouter une photo de fond :
 * - placer l'image dans public/images/hero.jpg
 * - ajouter style={{ backgroundImage: "url(/images/hero.jpg)" }} sur la section
 * Le voile .overlay assure la lisibilité du texte sur n'importe quelle photo.
 */
export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay} />
      <Container className={styles.inner}>
        <p className={styles.institution}>{SITE.institution}</p>
        <h1 className={styles.title}>Conseil Supérieur de Transition</h1>
        <p className={styles.lead}>
          Organe chargé de conduire le processus de réunification et de réforme
          institutionnelle de l'Église du Christianisme Céleste. Dialogue,
          consensus et construction d'une gouvernance commune.
        </p>
        <p className={styles.motto}>{SITE.motto}</p>

        <div className={styles.actions}>
          <Button href="/presentation" variant="yellow">Découvrir le CST</Button>
          <Button href="/documents" variant="outline" className={styles.outlineOnDark}>
            Documents officiels
          </Button>
        </div>
      </Container>
      <div className={styles.bottomLine} />
    </section>
  );
}
