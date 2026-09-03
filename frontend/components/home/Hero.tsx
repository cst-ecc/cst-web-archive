import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import { SITE } from "@/lib/constants";
import styles from "./Hero.module.scss";

/**
 * HÉRO — Grande photo plein écran, texte centré, dots de navigation.
 * Pour ajouter la vraie photo : remplacer background-image dans Hero.module.scss
 * (.hero { background-image: url("/images/home/votre-photo.jpg") })
 */
export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay} aria-hidden />

      <Container className={styles.inner}>
        <span className={styles.institution}>{SITE.institution}</span>
        <h1 className={styles.title}>
          Conseil Supérieur de Transition
        </h1>
        <p className={styles.lead}>
          Organe de dialogue, de réforme et de réunification de l'Église
          du Christianisme Céleste. Douze mois de travaux pour bâtir une
          gouvernance commune, moderne et durable.
        </p>
        <div className={styles.actions}>
          <Button href="/presentation" variant="yellow">Découvrir le CST</Button>
          <Button href="/documents" variant="outline" className={styles.outlineLight}>
            Documents officiels
          </Button>
        </div>
      </Container>

      {/* Dots — à relier à un vrai carousel quand les photos seront prêtes */}
      <div className={styles.dots} aria-hidden>
        <button className={`${styles.dot} ${styles.dotActive}`} />
        <button className={styles.dot} />
        <button className={styles.dot} />
      </div>
    </section>
  );
}
