import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import styles from "./ActionCards.module.scss";

const cards = [
  {
    image: "/images/home/action-reunion.svg",
    alt: "Réunification",
    title: "Réunification",
    text: "Restaurer l'unité de l'Église du Christianisme Céleste à travers un cadre formel de dialogue, de concertation et de décision réunissant tous les diocèses.",
    href: "/presentation",
    linkLabel: "En savoir plus",
  },
  {
    image: "/images/home/action-reforme.svg",
    alt: "Réforme institutionnelle",
    title: "Réforme institutionnelle",
    text: "Relire, actualiser et consolider la Constitution et le Règlement intérieur. Clarifier les organes, les fonctions et la hiérarchie ecclésiale.",
    href: "/documents",
    linkLabel: "Voir les textes",
  },
  {
    image: "/images/home/action-gouvernance.svg",
    alt: "Bonne gouvernance",
    title: "Bonne gouvernance",
    text: "Renforcer la transparence, la discipline et la reddition de comptes. Préparer des institutions communes, légitimes et fonctionnelles pour l'Église unifiée.",
    href: "/sessions",
    linkLabel: "Voir les sessions",
  },
];

/** Section 3 cartes avec image en header — équivalent "Choose your course" */
export default function ActionCards() {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Axes de travail</p>
          <h2 className={styles.title}>Le CST en action</h2>
          <div className={styles.underline} />
          <p className={styles.subtitle}>Trois piliers fondamentaux pour une Église une et indivisible</p>
        </div>

        <div className={styles.grid}>
          {cards.map((card) => (
            <article key={card.title} className={styles.card}>
              <div className={styles.cardImage}>
                <Image src={card.image} alt={card.alt} fill sizes="(max-width:768px) 100vw, 33vw" />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardRule} />
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardText}>{card.text}</p>
                <Link href={card.href} className={styles.cardLink}>
                  {card.linkLabel} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
