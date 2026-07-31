import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import styles from "./not-found.module.scss";

export default function NotFound() {
  return (
    <Container className={styles.wrapper}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Page introuvable</h1>
      <p className={styles.text}>
        La page demandée n'existe pas ou a été déplacée. Vous pouvez revenir à
        l'accueil ou consulter la bibliothèque documentaire.
      </p>
      <div className={styles.actions}>
        <Button href="/">Accueil</Button>
        <Button href="/documents" variant="outline">Bibliothèque</Button>
      </div>
    </Container>
  );
}
