import type { Metadata } from "next";

import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import MemberCard from "@/components/members/MemberCard";
import { getMembers } from "@/lib/api";

import styles from "./membres.module.scss";

export const metadata: Metadata = {
  title: "Membres",
  description: "Composition du Conseil Supérieur de Transition.",
};
export const revalidate = 300;

export default async function MembresPage() {
  const members = await getMembers();

  return (
    <>
      <PageHeader
        eyebrow="Institution"
        title="Membres du Conseil"
        subtitle="Les membres qui composent le Conseil Supérieur de Transition."
      />
      <Container className={styles.section}>
        {members.length > 0 ? (
          <div className={styles.grid}>
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <div className={styles.empty} role="status">
            Aucun membre publié pour le moment.
          </div>
        )}
      </Container>
    </>
  );
}
