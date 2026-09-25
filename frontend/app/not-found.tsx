import SystemState from "@/components/system/SystemState";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <SystemState
      code="404"
      eyebrow="Erreur de navigation"
      title="Cette page est introuvable"
      description="L’adresse demandée n’existe pas, a été déplacée ou n’est plus disponible. Le site reste accessible : vous pouvez revenir à l’accueil ou poursuivre vers la bibliothèque documentaire."
      actions={
        <>
          <Button href="/">Retour à l’accueil</Button>
          <Button href="/documents" variant="outline">
            Consulter les documents
          </Button>
        </>
      }
      note="Si vous avez suivi un lien publié récemment, vous pouvez également revenir à la page précédente et réessayer."
    />
  );
}
