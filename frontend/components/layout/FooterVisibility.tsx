"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Le footer global est masqué uniquement sur l'accueil :
 * le panneau Home V2 rend déjà le même SiteFooter dans son propre flux.
 */
export default function FooterVisibility({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/") return null;
  return children;
}
