import type { Member } from "@/lib/types";

function normalize(value: string | undefined): string {
  return (value ?? "").toLocaleLowerCase("fr");
}

function roleIncludes(member: Member, value: string): boolean {
  return normalize(member.role).includes(normalize(value));
}

function responsibilityIncludes(member: Member, value: string): boolean {
  return normalize(member.responsibility).includes(normalize(value));
}

export type CouncilMemberGroups = {
  sacredCollege: Member[];
  coordinators: Member[];
  rapporteurs: Member[];
  treasurers: Member[];
  councilMembers: Member[];
};

export function groupCouncilMembers(members: Member[]): CouncilMemberGroups {
  const sacredCollege = members.filter((member) =>
    responsibilityIncludes(member, "Sacré Collège"),
  );

  const coordinators = members.filter((member) =>
    roleIncludes(member, "Coordonnateur"),
  );

  const rapporteurs = members.filter((member) =>
    roleIncludes(member, "Rapporteur"),
  );

  const treasurers = members.filter((member) =>
    roleIncludes(member, "Trésorier"),
  );

  const reservedIds = new Set(
    [...sacredCollege, ...coordinators, ...rapporteurs, ...treasurers].map(
      (member) => member.id,
    ),
  );

  const councilMembers = members.filter((member) => {
    if (reservedIds.has(member.id)) return false;

    // Les membres dont la fonction principale est uniquement « Membre de
    // Commission » sont présentés dans la vue dédiée aux commissions.
    return !normalize(member.role).startsWith("membre de commission");
  });

  return {
    sacredCollege,
    coordinators,
    rapporteurs,
    treasurers,
    councilMembers,
  };
}

export function getMemberCommissionNumbers(member: Member): number[] {
  const source = `${member.role} ${member.responsibility ?? ""}`;
  const numbers = new Set<number>();
  const expression = /N[°º]\s*(\d+)/gi;

  for (const match of source.matchAll(expression)) {
    const value = Number.parseInt(match[1] ?? "", 10);
    if (Number.isFinite(value)) numbers.add(value);
  }

  return [...numbers].sort((a, b) => a - b);
}

export function getCommissionMembers(
  members: Member[],
  commissionNumber: number,
): Member[] {
  return members
    .filter((member) =>
      getMemberCommissionNumbers(member).includes(commissionNumber),
    )
    .sort((a, b) => {
      const aPresident = normalize(a.role).includes(
        `président de commission n°${commissionNumber}`,
      );
      const bPresident = normalize(b.role).includes(
        `président de commission n°${commissionNumber}`,
      );

      if (aPresident !== bPresident) return aPresident ? -1 : 1;
      return a.order - b.order;
    });
}
