import Container from "@/components/layout/Container";
import type { SiteStats } from "@/lib/types";
import styles from "./StatsBlock.module.scss";

const STATIC = [
  { value: "15", label: "Membres" },
  { value: "9", label: "Sessions" },
  { value: "12", label: "Mois de travaux" },
  { value: "174M", label: "FCFA mobilisés" },
];

export default function StatsBlock({ stats: _ }: { stats?: SiteStats }) {
  return (
    <section className={styles.section}>
      <div className={styles.overlay} aria-hidden />
      <Container className={styles.inner}>
        <p className={styles.eyebrow}>Bilan de la phase CST</p>
        <h2 className={styles.sectionTitle}>La transition en quelques chiffres</h2>
        <div className={styles.underline} />
        <p className={styles.subtitle}>Des repères pour mesurer l’ampleur des travaux conduits avant le passage à la phase de mise en œuvre.</p>

        <div className={styles.grid}>
          {STATIC.map((item) => (
            <div key={item.label} className={styles.stat}>
              <span className={styles.value}>{item.value}</span>
              <span className={styles.label}>{item.label}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
