import { SITE } from "@/lib/constants";

export default function HomeStructuredData() {
  const baseUrl = SITE.url.replace(/\/$/, "");

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: SITE.name,
    alternateName: [
      "CST ECC",
      "CSM ECC",
      "CSMo ECC",
      "CST & CSMo ECC",
      "Conseil Supérieur de Transition",
      "Conseil Supérieur de Mise en Œuvre",
    ],
    inLanguage: "fr",
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: SITE.fullName,
    parentOrganization: {
      "@type": "Organization",
      name: SITE.institution,
    },
    alternateName: [
      "CSMo",
      "CSM",
      "CSMo ECC",
      "CSM ECC",
      "Conseil Supérieur de Transition",
      "CST",
      "CST ECC",
    ],
    url: baseUrl,
    logo: `${baseUrl}/logo/logo-original.png`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(website),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organization),
        }}
      />
    </>
  );
}
