"use client";

import { useEffect } from "react";

import SystemState from "@/components/system/SystemState";
import Button from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CST frontend error boundary:", error);
  }, [error]);

  return (
    <SystemState
      code="500"
      eyebrow="Incident technique"
      title="Une difficulté technique est survenue"
      description="La page n’a pas pu être affichée correctement. Vous pouvez relancer son chargement. Si l’incident persiste, revenez à l’accueil et réessayez dans quelques instants."
      actions={
        <>
          <Button onClick={reset}>Réessayer</Button>
          <Button href="/" variant="outline">
            Retour à l’accueil
          </Button>
        </>
      }
      note="Aucune action supplémentaire n’est requise de votre part."
    />
  );
}
