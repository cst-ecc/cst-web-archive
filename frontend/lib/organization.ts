import type { DocumentItem } from "./types";
import { normalize } from "./utils";

/**
 * Types de compatibilité conservés pour l’ancien composant OrganizationChart.
 *
 * Le nouvel organigramme public utilise OrganizationViewer + les hotspots ci-dessous.
 * OrganizationChart.tsx n’est plus rendu, mais reste présent dans le dépôt pour éviter
 * de casser un build TypeScript tant qu’il n’a pas été supprimé définitivement.
 */
export type OrganizationNodeTone =
  | "authority"
  | "institution"
  | "executive"
  | "cabinet"
  | "territorial";

export type OrganizationNode = {
  id: string;
  label: string;
  acronym?: string;
  tone: OrganizationNodeTone;
};

export type OrganizationChartData = {
  level: "world" | "diocesan";
  title: string;
  description: string;
  authority: OrganizationNode;
  organs: OrganizationNode[];
  executive: OrganizationNode;
  cabinet: OrganizationNode;
  markers: {
    prefix: string;
    from: number;
    to: number;
  };
  territorialChain?: OrganizationNode[];
};

export type OrganizationHotspotRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OrganizationHotspotDefinition = {
  id: string;
  label: string;
  acronym?: string;
  rect: OrganizationHotspotRect;
  candidateSlugs?: string[];
  requiredTerms: string[];
  preferredTerms?: string[];
  excludedTerms?: string[];
};

export type OrganizationHotspot = OrganizationHotspotDefinition & {
  documentSlug?: string;
  documentTitle?: string;
  href?: string;
};

/**
 * Source visuelle officielle : page 23 de l'organigramme institutionnel.
 *
 * Les coordonnées ci-dessous sont exprimées en pourcentage de la page PDF
 * (595 x 842 pt). Elles suivent les rectangles officiels du document afin
 * que la couche interactive reste parfaitement alignée quel que soit le zoom.
 */
export const ORGANIZATION_HOTSPOTS: OrganizationHotspotDefinition[] = [
  {
    id: "conseil-pastoral-ecc",
    label: "Conseil Pastoral de l’ECC",
    acronym: "CP-ECC",
    rect: { x: 21.21, y: 23.12, width: 19.8, height: 3.86 },
    candidateSlugs: [
      "projet-aof-du-conseil-pastoral-de-lecc",
      "aof-du-conseil-pastoral-de-lecc",
      "conseil-pastoral-de-lecc",
    ],
    requiredTerms: ["conseil", "pastoral"],
    preferredTerms: ["aof", "ecc"],
  },
  {
    id: "synode",
    label: "Synode",
    rect: { x: 47.82, y: 25.26, width: 11.61, height: 2.29 },
    candidateSlugs: [
      "projet-aof-du-synode-de-lecc",
      "aof-du-synode-de-lecc",
      "synode-de-lecc",
    ],
    requiredTerms: ["synode"],
    preferredTerms: ["aof", "ecc"],
  },
  {
    id: "conseil-administration-ecc",
    label: "Conseil d’Administration de l’Église du Christianisme Céleste",
    acronym: "CA-ECC",
    rect: { x: 64.81, y: 22.46, width: 26.47, height: 6.45 },
    candidateSlugs: [
      "projet-aof-du-conseil-dadministration-de-lecc",
      "aof-du-conseil-dadministration-de-lecc",
      "conseil-dadministration-de-lecc",
    ],
    requiredTerms: ["conseil", "administration"],
    preferredTerms: ["aof", "ecc", "eglise"],
    excludedTerms: ["diocesain", "diocesaine"],
  },
  {
    id: "comite-executif-ecc",
    label: "Comité Exécutif de l’ECC",
    acronym: "CE-ECC",
    rect: { x: 43.66, y: 30.82, width: 18.87, height: 3.57 },
    candidateSlugs: [
      "comite-executif-de-lecc",
      "aof-du-comite-executif-de-lecc",
      "projet-aof-du-comite-executif-de-lecc",
    ],
    requiredTerms: ["comite", "executif"],
    preferredTerms: ["aof", "ecc"],
    excludedTerms: ["diocesain", "diocesaine"],
  },
  {
    id: "cabinet-pasteur",
    label: "Cabinet du Pasteur",
    acronym: "CP",
    rect: { x: 68.81, y: 31.09, width: 20.1, height: 3.87 },
    candidateSlugs: ["cabinet-du-pasteur"],
    requiredTerms: ["cabinet", "pasteur"],
    preferredTerms: ["aof", "ecc"],
  },
  {
    id: "conseil-diocesain",
    label: "Conseil Diocésain",
    acronym: "CD",
    rect: { x: 21.18, y: 49.11, width: 17.14, height: 4.38 },
    candidateSlugs: ["conseil-diocesain", "aof-du-conseil-diocesain"],
    requiredTerms: ["conseil", "diocesain"],
    preferredTerms: ["aof"],
    excludedTerms: ["administration"],
  },
  {
    id: "assemblee-diocesaine",
    label: "Assemblée Diocésaine",
    acronym: "AD",
    rect: { x: 48.91, y: 51.81, width: 13.51, height: 4.99 },
    candidateSlugs: ["assemblee-diocesaine", "aof-de-lassemblee-diocesaine"],
    requiredTerms: ["assemblee", "diocesaine"],
    preferredTerms: ["aof"],
  },
  {
    id: "conseil-administration-diocesain",
    label: "Conseil d’Administration Diocésain",
    acronym: "CA-D",
    rect: { x: 64.71, y: 48.47, width: 26.57, height: 5.01 },
    candidateSlugs: [
      "conseil-dadministration-diocesain",
      "aof-du-conseil-dadministration-diocesain",
    ],
    requiredTerms: ["conseil", "administration", "diocesain"],
    preferredTerms: ["aof"],
  },
  {
    id: "comite-executif-diocesain",
    label: "Comité Exécutif Diocésain",
    acronym: "CED",
    rect: { x: 44.77, y: 59.1, width: 18.87, height: 3.56 },
    candidateSlugs: [
      "comite-executif-diocesain",
      "aof-du-comite-executif-diocesain",
    ],
    requiredTerms: ["comite", "executif", "diocesain"],
    preferredTerms: ["aof"],
  },
  {
    id: "cabinet-chef-diocese",
    label: "Cabinet du Chef de Diocèse",
    acronym: "CCD",
    rect: { x: 70.05, y: 59.35, width: 20.1, height: 3.69 },
    candidateSlugs: ["cabinet-du-chef-de-diocese"],
    requiredTerms: ["cabinet", "chef", "diocese"],
    preferredTerms: ["aof"],
  },
];

function normalizedDocumentText(document: DocumentItem) {
  return normalize(
    `${document.slug} ${document.title} ${document.summary ?? ""} ${document.reference ?? ""}`,
  ).replace(/[’']/g, "");
}

function scoreDocument(
  document: DocumentItem,
  definition: OrganizationHotspotDefinition,
) {
  if (definition.candidateSlugs?.includes(document.slug)) return 10_000;

  const haystack = normalizedDocumentText(document);
  const title = normalize(document.title).replace(/[’']/g, "");
  const required = definition.requiredTerms.map((term) => normalize(term));
  const excluded = (definition.excludedTerms ?? []).map((term) => normalize(term));

  // Les termes structurants doivent être présents dans le titre : cela évite
  // qu’une Constitution ou un rapport mentionnant simplement « Synode » soit
  // pris par erreur comme document de référence de l’organe.
  if (required.some((term) => !title.includes(term))) return -1;
  if (excluded.some((term) => title.includes(term))) return -1;

  let score = 100 + required.length * 20;
  for (const term of definition.preferredTerms ?? []) {
    if (haystack.includes(normalize(term))) score += 12;
  }

  for (const term of required) {
    if (title.includes(term)) score += 20;
  }

  return score;
}

export function resolveOrganizationHotspots(
  documents: DocumentItem[],
): OrganizationHotspot[] {
  return ORGANIZATION_HOTSPOTS.map((definition) => {
    const best = documents
      .map((document) => ({ document, score: scoreDocument(document, definition) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score || b.document.date.localeCompare(a.document.date))[0]
      ?.document;

    if (!best) return definition;

    const href =
      !best.isConfidential && best.fileType === "pdf" && best.fileUrl
        ? `/documents/${best.slug}/lire?from=/organigramme`
        : `/documents/${best.slug}`;

    return {
      ...definition,
      documentSlug: best.slug,
      documentTitle: best.title,
      href,
    };
  });
}
