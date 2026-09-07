import Container from "@/components/layout/Container";
import { FAQ_GROUPS } from "@/lib/faq-data";
import FAQAccordion from "./FAQAccordion";
import styles from "./FAQSection.module.scss";

export default function FAQSection() {
  return (
    <section id="faq" className={styles.section}>
      <Container>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>L’essentiel en 12 questions</p>
            <h2 className={styles.title}>Comprendre la grande marche vers l’unité</h2>
          </div>
          <p className={styles.intro}>
            Des réponses structurées pour comprendre l’origine de la démarche, le rôle du CST et du CSMO, les institutions envisagées et la place de chacun dans le processus.
          </p>
        </div>
        <FAQAccordion groups={FAQ_GROUPS} />
      </Container>
    </section>
  );
}
