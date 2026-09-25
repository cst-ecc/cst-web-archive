"use client";

import { useEffect } from "react";

import SystemState from "@/components/system/SystemState";
import Button from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CST global frontend error:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>
        <SystemState
          code="500"
          eyebrow="Service momentanément perturbé"
          title="Le site rencontre une difficulté"
          description="Une erreur inattendue empêche l’affichage normal du site. Vous pouvez tenter de relancer la page ou revenir à l’accueil."
          standalone
          actions={
            <>
              <Button onClick={reset}>Réessayer</Button>
              <Button href="/" variant="outline">
                Retour à l’accueil
              </Button>
            </>
          }
        />
      </body>
    </html>
  );
}
