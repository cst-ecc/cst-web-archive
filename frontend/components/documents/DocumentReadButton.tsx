"use client";

import { usePathname, useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import { shouldUseNativePdfReader } from "@/lib/pdf-device";

export default function DocumentReadButton({
  slug,
  label = "Lire le document",
  variant = "solid",
  className,
  returnHref,
  isConfidential = false,
}: {
  slug: string;
  label?: string;
  variant?: "solid" | "outline" | "ghost" | "yellow";
  className?: string;
  returnHref?: string;
  isConfidential?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleRead = () => {
    const source = returnHref ?? pathname ?? "/documents";
    const encodedSlug = encodeURIComponent(slug);

    if (isConfidential) {
      router.push(`/documents/${encodedSlug}/demande-acces`);
      return;
    }
    const encodedSource = encodeURIComponent(source);
    const auditUrl = `/api/v1/documents/${encodedSlug}/view/?source=${encodedSource}`;

    // Le KPI demandé mesure une demande d'ouverture. L'appel reste non bloquant :
    // une panne de l'audit ne doit jamais empêcher l'utilisateur de lire le PDF.
    void fetch(auditUrl, {
      method: "POST",
      keepalive: true,
      headers: { Accept: "application/json" },
    }).catch((error) => {
      console.warn("[CST] Comptage d'ouverture indisponible :", error);
    });

    /*
     * iOS/iPadOS (et plusieurs navigateurs mobiles) peuvent figer un PDF embarqué
     * dans un iframe sur sa première page. Sur téléphone/tablette, on passe donc
     * par une route interne qui résout le document puis l'ouvre dans le lecteur
     * PDF natif du navigateur, où toutes les pages restent défilables.
     *
     * window.location.assign est volontaire : il s'agit d'une navigation de
     * premier niveau, nécessaire pour contourner la limitation des PDF embarqués.
     */
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
