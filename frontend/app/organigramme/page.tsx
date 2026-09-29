import type { Metadata } from "next";

import PageHeader from "@/components/layout/PageHeader";
import OrganizationPageContent from "@/components/organization/OrganizationPageContent";

export const metadata: Metadata = {
  title: "Organigramme de l’Église",
  description:
    "Organigramme officiel de l’Église du Christianisme Céleste : niveaux mondial et diocésain, avec accès aux documents relatifs aux organes de gouvernance.",
};

export default function OrganigrammePage() {
  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Organigramme de l’Église du Christianisme Céleste"
        subtitle="Consultez la représentation institutionnelle officielle des niveaux mondial et diocésain et accédez aux documents associés aux principaux organes."
      />
      <OrganizationPageContent />
    </>
  );
}
