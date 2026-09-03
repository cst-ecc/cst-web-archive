import Image from "next/image";
import Container from "@/components/layout/Container";
import styles from "./CategoriesGrid.module.scss";

const categories = [
  {
    title: "Constitution",
    text: "Relecture, actualisation et consolidation du texte fondamental de l'Église.",
  },
  {
    title: "Gouvernance",
    text: "Définition des organes mondiaux, diocésains et locaux. Clarification des fonctions.",
  },
  {
    title: "Dialogue",
    text: "Concertation entre les composantes de l'Église et les différents diocèses.",
  },
  {
    title: "Pèlerinages",
    text: "Réaffirmation de Sèmè-Kpodji comme site principal de la Nativité.",
  },
  {
    title: "Harmonisation",
    text: "Unification des grades entre les espaces francophone et anglophone.",
  },
  {
    title: "Synode",
    text: "Préparation du Synode de réunification et du conclave de désignation.",
  },
];

/** Grande image à gauche + grille de thèmes 2×3 à droite */
export default function CategoriesGrid() {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Domaines d'intervention</p>
          <h2 className={styles.title}>Thèmes des travaux</h2>
          <div className={styles.underline} />
          <p className={styles.subtitle}>Les six chantiers fondamentaux conduits par le Conseil</p>
        </div>

        <div className={styles.layout}>
          {/* Image institutionnelle gauche */}
          <div className={styles.imageWrap}>
            <Image
              src="/images/home/categories-main.svg"
              alt="Travaux du CST"
              fill
              sizes="(max-width:1024px) 100vw, 40vw"
              className={styles.image}
            />
          </div>

          {/* Grille 2×3 */}
          <div className={styles.grid}>
            {categories.map((cat) => (
              <div key={cat.title} className={styles.cell}>
                <h3 className={styles.cellTitle}>{cat.title}</h3>
                <p className={styles.cellText}>{cat.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
