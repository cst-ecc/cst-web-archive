import type { Metadata } from "next";

import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import MemberCard from "@/components/members/MemberCard";
import MembersSubnav from "@/components/members/MembersSubnav";
import { getMembers } from "@/lib/api";
import { getCommissionMembers } from "@/lib/member-groups";

import styles from "./commissions.module.scss";

export const metadata: Metadata = {
  title: "Commissions du CST",
  description:
    "Composition des commissions du Conseil Supérieur de Transition.",
};

export const revalidate = 300;

const COMMISSIONS = [1, 2, 3] as const;

export default async function CommissionsPage() {
  const members = await getMembers();
  const commissionGroups = COMMISSIONS.map((number) => ({
    number,
    members: getCommissionMembers(members, number),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Institution"
        title="Commissions du CST"
        subtitle="Retrouvez les membres du Conseil regroupés selon leur appartenance aux différentes commissions."
      />

      <Container className={styles.section}>
        <MembersSubnav active="commissions" />

        <div className={styles.commissions}>
          {commissionGroups.map(({ number, members: commissionMembers }) => (
            <section
              key={number}
              className={styles.commission}
              aria-labelledby={`commission-${number}`}
            >
              <header className={styles.heading}>
                <div>
                  <span className={styles.eyebrow}>Commission</span>
                  <h2 id={`commission-${number}`}>Commission n°{number}</h2>
                </div>
                <span className={styles.count}>
                  {commissionMembers.length} membre
                  {commissionMembers.length > 1 ? "s" : ""}
                </span>
              </header>

              {commissionMembers.length > 0 ? (
                <div className={styles.grid}>
                  {commissionMembers.map((member, index) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      motionDelay={Math.min(index * 0.045, 0.22)}
                    />
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>Aucun membre publié pour cette commission.</p>
              )}
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
