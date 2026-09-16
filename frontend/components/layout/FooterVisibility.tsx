"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Le footer historique reste inchangé sur toutes les pages internes.
 * L'accueil V2 utilise un pied de page compact intégré à son panneau afin
 * d'éviter un deuxième bloc vertical et le double scroll sur desktop.
 */
export default function FooterVisibility({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") return null;
  return children;
}
