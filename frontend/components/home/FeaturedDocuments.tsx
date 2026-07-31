import Container from "@/components/layout/Container";
import SectionTitle from "@/components/layout/SectionTitle";
import DocumentCard from "@/components/documents/DocumentCard";
import { FadeIn } from "@/components/ui/Motion";
import type { DocumentItem } from "@/lib/types";
import styles from "./FeaturedDocuments.module.scss";

export default function FeaturedDocuments({ documents }: { documents: DocumentItem[] }) {
  if (documents.length === 0) return null;
  return (
    <section className={styles.section}>
      <Container>
        <SectionTitle
          eyebrow="À la une"
          title="Documents mis en avant"
          action={{ href: "/documents", label: "Toute la bibliothèque" }}
        />
        <div className={styles.grid}>
          {documents.map((d, i) => (
            <FadeIn key={d.id} delay={i * 0.05}>
              <DocumentCard doc={d} />
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
