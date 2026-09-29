"use client";

import { usePathname } from "next/navigation";

import Button from "@/components/ui/Button";

export default function DocumentDownloadButton({
  slug,
  label = "Télécharger",
  variant = "outline",
  className,
  returnHref,
}: {
  slug: string;
  label?: string;
  variant?: "solid" | "outline" | "ghost" | "yellow";
  className?: string;
  returnHref?: string;
}) {
  const pathname = usePathname();

  const handleDownload = () => {
    const source = returnHref ?? pathname ?? "/documents";
    const url = `/api/v1/documents/${encodeURIComponent(slug)}/download/?source=${encodeURIComponent(source)}`;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <Button variant={variant} className={className} onClick={handleDownload}>
      {label}
    </Button>
  );
}
