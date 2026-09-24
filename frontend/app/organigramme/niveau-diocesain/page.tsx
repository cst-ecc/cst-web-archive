import type { Metadata } from "next";

import PageHeader from "@/components/layout/PageHeader";
import OrganizationPageContent from "@/components/organization/OrganizationPageContent";
import { DIOCESAN_ORGANIZATION } from "@/lib/organization";

export const metadata: Metadata = {
  title: "Organigramme — Niveau diocésain",
  description:
    "Organisation diocésaine de l’Église du Christianisme Céleste, du Chef de Diocèse jusqu’aux paroisses.",
};

export default function NiveauDiocesainPage() {
  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Organigramme de l’Église du Christianisme Céleste"
        subtitle="Découvrez l’organisation structurelle de l’Église aux niveaux mondial et diocésain."
      />
      <OrganizationPageContent
        active="diocesan"
        data={DIOCESAN_ORGANIZATION}
      />
    </>
  );
}
