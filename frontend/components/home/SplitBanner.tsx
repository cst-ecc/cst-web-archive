import Link from "next/link";
import Container from "@/components/layout/Container";
import styles from "./SplitBanner.module.scss";

/**
 * SPLIT BANNER — Photo de fond plein largeur + carte blanche à gauche.
 * Photo de fond : remplacer split-bg-placeholder.svg par votre photo dans
 * SplitBanner.module.scss (.section { background-image: url("...") })
 */
export default function SplitBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.overlay} aria-hidden />
      <Container className={styles.inner}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Rapport final — 30 avril 2026</p>
          <h2 className={styles.title}>
            Une Église réunifiée, des institutions renouvelées
          </h2>
          <p className={styles.text}>
            Après douze mois de travaux, neuf sessions plénières et
            l'implication de trois commissions spécialisées, le CST a remis
            son rapport final. Constitution consolidée, Règlement intérieur
            actualisé, nouvelle architecture de gouvernance mondiale et
            diocésaine : les fondations de l'Église unifiée sont posées.
          </p>
          <Link href="/rapports" className={styles.date}>
            Consulter le rapport final
          </Link>
        </div>
      </Container>
    </section>
  );
}
