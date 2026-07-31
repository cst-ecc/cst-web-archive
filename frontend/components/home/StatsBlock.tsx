import Container from "@/components/layout/Container";
import Stat from "@/components/ui/Stat";
import type { SiteStats } from "@/lib/types";
import styles from "./StatsBlock.module.scss";

export default function StatsBlock({ stats }: { stats: SiteStats }) {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.grid}>
          <Stat value={stats.documents} label="Documents publiés" />
          <Stat value={stats.sessions} label="Sessions" />
          <Stat value={stats.members} label="Membres" />
          <Stat value={stats.albums} label="Albums" />
        </div>
      </Container>
    </section>
  );
}
