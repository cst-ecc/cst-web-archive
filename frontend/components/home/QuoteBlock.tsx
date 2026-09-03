import Image from "next/image";
import Container from "@/components/layout/Container";
import styles from "./QuoteBlock.module.scss";

/** Citation institutionnelle avec avatar + dots — équivalent témoignages */
export default function QuoteBlock() {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Message institutionnel</p>
          <h2 className={styles.title}>La parole du Conseil</h2>
          <div className={styles.underline} />
          <p className={styles.subtitle}>Vision et engagement du Conseil Supérieur de Transition</p>
        </div>

        <div className={styles.quoteWrap}>
          <div className={styles.avatar}>
            <Image
              src="/images/home/coordonnateur.svg"
              alt="Général d'Armée Aérienne Bertin BADA"
              fill
              sizes="90px"
            />
          </div>

          <p className={styles.quoteIcon}>&ldquo;</p>

          <blockquote>
            <p className={styles.quoteText}>
              Le Conseil Supérieur de Transition a représenté une étape historique
              dans le processus de réunification et de réorganisation de l'Église
              du Christianisme Céleste. À travers ses sessions, ses commissions et
              ses consultations, il a contribué à poser les bases d'une Église plus
              unie, plus structurée, plus disciplinée, plus transparente et mieux
              préparée à répondre aux défis de son développement mondial.
            </p>
            <footer>
              <span className={styles.author}>
                Général d'Armée Aérienne Bertin BADA
              </span>
              <span className={styles.role}>
                Coordonnateur Général — Conseil Supérieur de Transition
              </span>
            </footer>
          </blockquote>

          <div className={styles.dots} aria-hidden>
            <div className={`${styles.dot} ${styles.dotActive}`} />
            <div className={styles.dot} />
            <div className={styles.dot} />
          </div>
        </div>
      </Container>
    </section>
  );
}
