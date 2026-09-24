import type { Metadata } from "next";

import PageHeader from "@/components/layout/PageHeader";
import OrganizationPageContent from "@/components/organization/OrganizationPageContent";
import { WORLD_ORGANIZATION } from "@/lib/organization";

export const metadata: Metadata = {
  title: "Organigramme de l’Église",
  description:
    "Organisation structurelle de l’Église du Christianisme Céleste aux niveaux mondial et diocésain.",
};

export default function OrganigrammePage() {
  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Organigramme de l’Église du Christianisme Céleste"
        subtitle="Découvrez l’organisation structurelle de l’Église aux niveaux mondial et diocésain."
      />
      <OrganizationPageContent active="world" data={WORLD_ORGANIZATION} />
    </>
  );
}
