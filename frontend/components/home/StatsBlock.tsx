import Container from "@/components/layout/Container";
import type { SiteStats } from "@/lib/types";
import styles from "./StatsBlock.module.scss";

const ITEMS = [
  { key: "members" as keyof SiteStats, label: "Membres" },
  { key: "sessions" as keyof SiteStats, label: "Sessions" },
  { key: "documents" as keyof SiteStats, label: "Documents publiés" },
  { key: "albums" as keyof SiteStats, label: "Albums photos" },
];

// Chiffres clés supplémentaires (statiques — issus du rapport officiel)
const STATIC = [
  { value: "15", label: "Membres" },
  { value: "9", label: "Sessions" },
  { value: "12", label: "Mois de travaux" },
  { value: "174M", label: "FCFA mobilisés" },
];

/**
 * Stats sur fond photo sombre — grands chiffres jaunes.
 * Utilise les chiffres réels du rapport financier du CST.
 * Photo de fond : remplacer stats-bg-placeholder.svg dans StatsBlock.module.scss
 */
export default function StatsBlock({ stats: _ }: { stats?: SiteStats }) {
  return (
    <section className={styles.section}>
      <div className={styles.overlay} aria-hidden />
      <Container className={styles.inner}>
        <h2 className={styles.sectionTitle}>Les chiffres parlent d'eux-mêmes</h2>
        <div className={styles.underline} />

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
