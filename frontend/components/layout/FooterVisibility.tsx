"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Le footer global est masqué sur l'accueil (Home V2 rend son propre footer)
 * et sur la page de maintenance, qui utilise une présentation plein écran.
 */
export default function FooterVisibility({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/maintenance") return null;
  return children;
}
