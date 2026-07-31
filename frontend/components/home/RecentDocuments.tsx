import Container from "@/components/layout/Container";
import SectionTitle from "@/components/layout/SectionTitle";
import DocumentCard from "@/components/documents/DocumentCard";
import type { DocumentItem } from "@/lib/types";
import styles from "./RecentDocuments.module.scss";

export default function RecentDocuments({ documents }: { documents: DocumentItem[] }) {
  if (documents.length === 0) return null;
  return (
    <section className={styles.section}>
      <Container>
        <SectionTitle
          eyebrow="Derniers dépôts"
          title="Documents récents"
          action={{ href: "/documents", label: "Voir tout" }}
        />
        <div className={styles.grid}>
          {documents.map((d) => (
            <DocumentCard key={d.id} doc={d} />
          ))}
        </div>
      </Container>
    </section>
  );
}
