"use client";

import { usePathname, useRouter } from "next/navigation";

import Button from "@/components/ui/Button";

export default function DocumentReadButton({
  slug,
  label = "Lire le document",
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
    const auditUrl = `/api/v1/documents/${encodeURIComponent(slug)}/view/?source=${encodeURIComponent(source)}`;

    // Le KPI demandé mesure une demande d'ouverture. L'appel reste non bloquant :
    // une panne de l'audit ne doit jamais empêcher l'utilisateur de lire le PDF.
    void fetch(auditUrl, {
      method: "POST",
      keepalive: true,
      headers: { Accept: "application/json" },
    }).catch((error) => {
      console.warn("[CST] Comptage d'ouverture indisponible :", error);
    });

    router.push(
      `/documents/${encodeURIComponent(slug)}/lire?from=${encodeURIComponent(source)}`,
    );
  };

  return (
    <Button variant={variant} className={className} onClick={handleRead}>
      {label}
    </Button>
  );
}
