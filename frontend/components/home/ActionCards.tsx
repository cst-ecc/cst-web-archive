import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import styles from "./ActionCards.module.scss";

const cards = [
  {
    image: "/images/home/action-reunion.jpg",
    alt: "Transition et réunification",
    tag: "CST",
    title: "Transition & consolidation",
    text: "Le CST a structuré le dialogue, conduit les travaux d’harmonisation et préparé le cadre institutionnel de la réunification.",
    href: "/presentation",
    linkLabel: "Découvrir le CST",
    external: false,
  },
  {
    image: "/images/home/action-gouvernance.jpg",
    alt: "Mise en œuvre",
    tag: "CSMO",
    title: "Mise en œuvre & suivi",
    text: "Le CSMO accompagne l’appropriation des orientations, leur mise en œuvre progressive et la préparation des institutions définitives.",
    href: "#processus",
    linkLabel: "Comprendre le CSMO",
    external: false,
  },
  {
    image: "/images/home/action-reforme.jpg",
    alt: "Digitalisation de l’ECC",
    tag: "DIGECC",
    title: "Digitalisation de l’ECC",
    text: "La modernisation numérique accompagne la structuration de l’Église à travers le recensement, la cartographie et de nouveaux outils de gestion.",
    href: "https://recensement-paroisses.ecc.bj",
    linkLabel: "Accéder à DIGECC",
    external: true,
  },
];

export default function ActionCards() {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Une dynamique commune</p>
          <h2 className={styles.title}>Trois dimensions complémentaires</h2>
          <div className={styles.underline} />
          <p className={styles.subtitle}>Transition, mise en œuvre et modernisation au service d’une même mission.</p>
        </div>

        <div className={styles.grid}>
          {cards.map((card) => (
            <article key={card.tag} className={styles.card}>
              <div className={styles.cardImage}>
                <Image src={card.image} alt={card.alt} fill sizes="(max-width:768px) 100vw, 33vw" />
                <span className={styles.cardTag}>{card.tag}</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardRule} />
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardText}>{card.text}</p>
                {card.external ? (
                  <a href={card.href} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                    {card.linkLabel} <span aria-hidden>↗</span>
                  </a>
                ) : (
                  <Link href={card.href} className={styles.cardLink}>
                    {card.linkLabel} <span aria-hidden>→</span>
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
