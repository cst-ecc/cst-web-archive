import Link from "next/link";
import Container from "@/components/layout/Container";
import styles from "./SplitBanner.module.scss";

export default function SplitBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.overlay} aria-hidden />
      <Container className={styles.inner}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Du rapport final à la mise en œuvre</p>
          <h2 className={styles.title}>Les fondations sont posées. La marche se poursuit.</h2>
          <p className={styles.text}>
            La phase conduite par le CST a permis de préparer un cadre commun, de consolider les textes et de définir les orientations de la réunification. Le CSMO prend désormais le relais pour accompagner leur appropriation et leur mise en œuvre progressive.
          </p>
          <div className={styles.actions}>
            <Link href="#processus" className={styles.link}>Comprendre la continuité CST → CSMO</Link>
            <Link href="/rapports" className={styles.linkSecondary}>Consulter les rapports</Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
