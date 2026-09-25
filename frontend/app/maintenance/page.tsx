import type { Metadata } from "next";

import SystemState from "@/components/system/SystemState";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Site en maintenance",
  description:
    "Le site CST & CSMo ECC est momentanément indisponible pour une opération de maintenance.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenancePage() {
  return (
    <SystemState
      code="503"
      eyebrow="Intervention technique"
      title="Site en maintenance"
      description="Une opération de maintenance est en cours afin d’améliorer la disponibilité et la qualité du service. Merci pour votre compréhension."
      tone="maintenance"
      standalone
      actions={<Button href="/">Vérifier à nouveau</Button>}
      note="Les services d’administration et les ressources techniques peuvent rester disponibles aux personnes autorisées pendant l’intervention."
    />
  );
}
