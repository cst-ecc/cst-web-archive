import type { Metadata } from "next";
import Image from "next/image";

import BackButton from "@/components/navigation/BackButton";
import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import { HOME_LEADERSHIP_MESSAGE } from "@/lib/home-v2";

import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Mot du Coordonnateur Général",
  description:
    "Mot de bienvenue du Général Bertin BADA, Coordonnateur Général du Conseil Supérieur de Mise en Œuvre (CSMo).",
};

export default function CoordinatorMessagePage() {
  const message = HOME_LEADERSHIP_MESSAGE;

  return (
    <>
      <PageHeader
        eyebrow="Message institutionnel"
        title="Mot du Coordonnateur Général"
        subtitle="Un appel à la paix, au dialogue et à l’unité"
      />

      <Container className={styles.page}>
        <BackButton fallbackHref="/" label="Retour à l’accueil" />

        <article className={styles.document}>
          <header className={styles.documentHeader}>
            <div className={styles.portraitWrap}>
              <Image
                src={message.image}
                alt={message.imageAlt}
                fill
                sizes="(max-width: 640px) 5.5rem, 7rem"
                className={styles.portrait}
                priority
              />
            </div>

            <div className={styles.identity}>
              <p className={styles.kicker}>Mot de bienvenue</p>
              <h2>{message.title}</h2>
              <p>{message.role}</p>
            </div>
          </header>

          <div className={styles.rule} aria-hidden="true" />

          <div className={styles.letterBody}>
            {message.paragraphs.map((paragraph, index) => (
              <p
                key={`${index}-${paragraph.slice(0, 24)}`}
                className={index === 0 ? styles.salutation : undefined}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <footer className={styles.signatureBlock}>
            <p className={styles.dateLine}>{message.dateLine}</p>
            <p className={styles.signatureRole}>{message.signatureRole}</p>
            <p className={styles.signatureName}>{message.signatureName}</p>
          </footer>
        </article>
      </Container>
    </>
  );
}
