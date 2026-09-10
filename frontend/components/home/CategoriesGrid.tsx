import Image from "next/image";
import Container from "@/components/layout/Container";
import styles from "./CategoriesGrid.module.scss";

const categories = [
  { title: "Unité", text: "Rétablir le dialogue, restaurer la confiance et rapprocher durablement les différentes composantes de l’Église." },
  { title: "Gouvernance", text: "Clarifier les responsabilités et préparer des institutions communes, lisibles, légitimes et durables." },
  { title: "Textes communs", text: "Relire, harmoniser et consolider les textes destinés à constituer un socle commun pour l’Église réunifiée." },
  { title: "Mise en œuvre", text: "Accompagner l’appropriation des orientations retenues et leur déploiement progressif dans la vie de l’Église." },
  { title: "Digitalisation", text: "Moderniser les outils de connaissance, de recensement, de cartographie et d’administration de l’ECC." },
  { title: "Transmission", text: "Préparer le passage progressif des organes de transition vers les institutions définitives de l’Église réunifiée." },
];

export default function CategoriesGrid() {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Chantiers structurants</p>
          <h2 className={styles.title}>Une transformation globale au service de l’Église</h2>
          <div className={styles.underline} />
          <p className={styles.subtitle}>Les principaux domaines qui relient les acquis du CST à la phase de mise en œuvre portée par le CSMO.</p>
        </div>

        <div className={styles.layout}>
          <div className={styles.imageWrap}>
            <Image src="/images/home/categories-main.jpg" alt="Processus institutionnel CST et CSMO" fill sizes="(max-width:1024px) 100vw, 40vw" className={styles.image} />
            <div className={styles.imageCaption}>
              <span>Une même foi</span>
              <strong>Une même Église</strong>
            </div>
          </div>

          <div className={styles.grid}>
            {categories.map((cat, index) => (
              <div key={cat.title} className={styles.cell}>
                <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
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
