import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import Container from "@/components/layout/Container";
import MemberCard from "@/components/members/MemberCard";
import { getMembers } from "@/lib/api";
import styles from "../pages.module.scss";

export const metadata: Metadata = {
  title: "Membres",
  description: "Composition du Conseil Supérieur de Transition.",
};
export const revalidate = 300;

export default async function MembresPage() {
  const members = await getMembers();
  return (
    <>
      <PageHeader eyebrow="Institution" title="Membres du Conseil" subtitle="Les membres qui composent le Conseil Supérieur de Transition." />
      <Container className={styles.section}>
        <div className={styles.grid4}>
          {members.map((m) => <MemberCard key={m.id} member={m} />)}
        </div>
      </Container>
    </>
  );
}
