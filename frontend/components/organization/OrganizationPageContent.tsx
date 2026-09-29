import Container from "@/components/layout/Container";
import BackButton from "@/components/navigation/BackButton";
import { getDocuments } from "@/lib/api";
import { resolveOrganizationHotspots } from "@/lib/organization";

import OrganizationViewer from "./OrganizationViewer";
import styles from "./OrganizationPageContent.module.scss";

export default async function OrganizationPageContent() {
  const { results: documents } = await getDocuments({ pageSize: 1000 });
  const hotspots = resolveOrganizationHotspots(documents);

  return (
    <Container className={styles.section}>
      <div className={styles.topline}>
        <BackButton fallbackHref="/#cst" label="Retour au CST" />
      </div>

      <div className={styles.intro}>
        <span className={styles.introEyebrow}>Organisation structurelle</span>
        <h2>Une lecture fidèle du document institutionnel</h2>
      </div>

      <OrganizationViewer hotspots={hotspots} />
    </Container>
  );
}
