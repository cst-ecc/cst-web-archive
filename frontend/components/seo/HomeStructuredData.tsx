import { SITE } from "@/lib/constants";

export default function HomeStructuredData() {
  const baseUrl = SITE.url.replace(/\/$/, "");

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "CST – CSMO ECC",
    alternateName: [
      "CST ECC",
      "CSM ECC",
      "CSMO ECC",
      "Conseil Supérieur de Transition",
      "Conseil Supérieur de Mise en Œuvre",
    ],
    inLanguage: "fr",
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name:
      "Conseil Supérieur de Mise en Œuvre de l'Église du Christianisme Céleste",
    alternateName: [
      "CSMO",
      "CSMO ECC",
      "CSM",
      "CSM ECC",
      "Conseil Supérieur de Transition",
      "CST",
      "CST ECC",
    ],
    url: baseUrl,
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
