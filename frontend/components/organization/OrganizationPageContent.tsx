import Container from "@/components/layout/Container";
import BackButton from "@/components/navigation/BackButton";
import type { OrganizationChartData } from "@/lib/organization";

import OrganizationChart from "./OrganizationChart";
import OrganizationSubnav from "./OrganizationSubnav";
import styles from "./OrganizationPageContent.module.scss";

export default function OrganizationPageContent({
  active,
  data,
}: {
  active: "world" | "diocesan";
  data: OrganizationChartData;
}) {
  return (
    <Container className={styles.section}>
      <div className={styles.topline}>
        <BackButton fallbackHref="/#cst" label="Retour au CST" />
      </div>

      <div className={styles.intro}>
        <p>
          L’organigramme présente l’organisation structurelle de l’Église du
          Christianisme Céleste aux niveaux mondial et diocésain.
        </p>
      </div>

      <OrganizationSubnav active={active} />
      <OrganizationChart data={data} />
    </Container>
  );
}
