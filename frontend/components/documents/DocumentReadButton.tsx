"use client";

import { usePathname, useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import { shouldUseNativePdfReader } from "@/lib/pdf-device";

export default function DocumentReadButton({
  slug,
  label = "Ouvrir le document",
  variant = "solid",
  className,
  returnHref,
}: {
  slug: string;
  label?: string;
  variant?: "solid" | "outline" | "ghost" | "yellow";
  className?: string;
  returnHref?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleRead = () => {
    const source = returnHref ?? pathname ?? "/documents";
    const encodedSlug = encodeURIComponent(slug);
    const encodedSource = encodeURIComponent(source);
    const auditUrl = `/api/v1/documents/${encodedSlug}/view/?source=${encodedSource}`;

    // Une ouverture et un téléchargement sont deux métriques distinctes.
    // Cet appel compte uniquement l’ouverture du lecteur.
    void fetch(auditUrl, {
      method: "POST",
      keepalive: true,
      headers: { Accept: "application/json" },
    }).catch((error) => {
      console.warn("[CST] Comptage d'ouverture indisponible :", error);
    });

    if (shouldUseNativePdfReader()) {
      window.location.assign(
        `/documents/${encodedSlug}/lire/mobile?from=${encodedSource}`,
      );
      return;
    }

    router.push(`/documents/${encodedSlug}/lire?from=${encodedSource}`);
  };

  return (
    <Button variant={variant} className={className} onClick={handleRead}>
      {label}
    </Button>
  );
}
