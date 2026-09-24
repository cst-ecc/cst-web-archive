/**
 * Données de l'organigramme de l'Église du Christianisme Céleste.
 *
 * Source : organigramme institutionnel fourni avec le projet. La structure est
 * volontairement indépendante du rendu afin de pouvoir être remplacée plus
 * tard par une réponse API sans réécrire le composant d'affichage.
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

export type OrganizationMarkerSeries = {
  prefix: string;
  from: number;
  to: number;
};

export type OrganizationChartData = {
  level: "world" | "diocesan";
  title: string;
  description: string;
  authority: OrganizationNode;
  organs: OrganizationNode[];
  executive: OrganizationNode;
  cabinet: OrganizationNode;
  markers: OrganizationMarkerSeries;
  territorialChain?: OrganizationNode[];
};

export const WORLD_ORGANIZATION: OrganizationChartData = {
  level: "world",
  title: "Niveau mondial",
  description:
    "Structure mondiale de l'Église du Christianisme Céleste, autour du Pasteur et des organes présentés dans l'organigramme institutionnel.",
  authority: {
    id: "pasteur",
    label: "Pasteur",
    tone: "authority",
  },
  organs: [
    {
      id: "conseil-pastoral-ecc",
      label: "Conseil Pastoral de l’ECC",
      acronym: "CP-ECC",
      tone: "institution",
    },
    {
      id: "synode",
      label: "Synode",
      tone: "institution",
    },
    {
      id: "conseil-administration-ecc",
      label: "Conseil d’Administration de l’Église du Christianisme Céleste",
      acronym: "CA-ECC",
      tone: "institution",
    },
  ],
  executive: {
    id: "comite-executif-ecc",
    label: "Comité Exécutif de l’ECC",
    acronym: "CE-ECC",
    tone: "executive",
  },
  cabinet: {
    id: "cabinet-pasteur",
    label: "Cabinet du Pasteur",
    acronym: "CP",
    tone: "cabinet",
  },
  markers: {
    prefix: "D",
    from: 1,
    to: 24,
  },
};

export const DIOCESAN_ORGANIZATION: OrganizationChartData = {
  level: "diocesan",
  title: "Niveau diocésain",
  description:
    "Structure diocésaine et déclinaison territoriale de l'Église, du Chef de Diocèse jusqu'aux paroisses.",
  authority: {
    id: "chef-diocese",
    label: "Chef de Diocèse",
    acronym: "CD",
    tone: "authority",
  },
  organs: [
    {
      id: "conseil-diocesain",
      label: "Conseil Diocésain",
      acronym: "CD",
      tone: "institution",
    },
    {
      id: "assemblee-diocesaine",
      label: "Assemblée Diocésaine",
      acronym: "AD",
      tone: "institution",
    },
    {
      id: "conseil-administration-diocesain",
      label: "Conseil d’Administration Diocésain",
      acronym: "CA-D",
      tone: "institution",
    },
  ],
  executive: {
    id: "comite-executif-diocesain",
    label: "Comité Exécutif Diocésain",
    acronym: "CED",
    tone: "executive",
  },
  cabinet: {
    id: "cabinet-chef-diocese",
    label: "Cabinet du Chef de Diocèse",
    acronym: "CCD",
    tone: "cabinet",
  },
  markers: {
    prefix: "D",
    from: 1,
    to: 12,
  },
  territorialChain: [
    {
      id: "regions",
      label: "Régions",
      tone: "territorial",
    },
    {
      id: "provinces",
      label: "Provinces",
      tone: "territorial",
    },
    {
      id: "districts",
      label: "Districts",
      tone: "territorial",
    },
    {
      id: "zones",
      label: "Zones",
      tone: "territorial",
    },
    {
      id: "paroisses",
      label: "Paroisses",
      tone: "territorial",
    },
  ],
};
