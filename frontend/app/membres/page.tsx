import type { Metadata } from "next";

import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import MemberCard from "@/components/members/MemberCard";
import MembersSubnav from "@/components/members/MembersSubnav";
import { getMembers } from "@/lib/api";
import { groupCouncilMembers } from "@/lib/member-groups";
import type { Member } from "@/lib/types";

import styles from "./membres.module.scss";

export const metadata: Metadata = {
  title: "Membres",
  description: "Composition du Conseil Supérieur de Transition.",
};
export const revalidate = 300;

type MemberRowProps = {
  title: string;
  members: Member[];
  columns: 2 | 3;
};

function MemberRow({ title, members, columns }: MemberRowProps) {
  if (members.length === 0) return null;

  const headingId = `role-${title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;

  return (
    <section className={styles.roleGroup} aria-labelledby={headingId}>
      <div className={styles.roleHeading}>
        <span className={styles.roleLine} aria-hidden="true" />
        <h2 id={headingId}>{title}</h2>
        <span className={styles.roleLine} aria-hidden="true" />
      </div>

      <div
        className={`${styles.memberRow} ${
          columns === 3 ? styles.memberRowThree : styles.memberRowTwo
        }`}
      >
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </section>
  );
}

export default async function MembresPage() {
  const members = await getMembers();
  const groups = groupCouncilMembers(members);

  return (
    <>
      <PageHeader
        eyebrow="Institution"
        title="Membres du Conseil"
        subtitle="La composition du Conseil Supérieur de Transition, organisée selon les responsabilités exercées."
      />

      <Container className={styles.section}>
        <MembersSubnav active="council" />

        {members.length > 0 ? (
          <div className={styles.content}>
            <MemberRow
              title="Sacré Collège"
              members={groups.sacredCollege}
              columns={2}
            />

            <div className={styles.executiveBlock}>
              <div className={styles.sectionIntro}>
                <span className={styles.eyebrow}>Secrétariat exécutif</span>
                <h2>Organisation des responsabilités</h2>
                <p>
                  Les principales fonctions exécutives sont présentées par
                  binôme ou collège afin de rendre la lecture de la structure
                  plus immédiate.
                </p>
              </div>

              <MemberRow
                title="Coordonnateurs"
                members={groups.coordinators}
                columns={3}
              />
              <MemberRow
                title="Rapporteurs"
                members={groups.rapporteurs}
                columns={2}
              />
              <MemberRow
                title="Trésoriers"
                members={groups.treasurers}
                columns={2}
              />
            </div>

            {groups.councilMembers.length > 0 ? (
              <section className={styles.otherMembers} aria-labelledby="membres-cst">
                <div className={styles.sectionIntro}>
                  <span className={styles.eyebrow}>Conseil</span>
                  <h2 id="membres-cst">Autres membres du CST</h2>
                  <p>
                    Membres du Conseil exerçant notamment des responsabilités
                    au sein des commissions.
                  </p>
                </div>

                <div className={styles.grid}>
                  {groups.councilMembers.map((member) => (
                    <MemberCard key={member.id} member={member} />
                  ))}
                </div>
              </section>
            ) : null}
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
