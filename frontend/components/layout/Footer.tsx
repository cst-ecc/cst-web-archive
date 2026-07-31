import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";
import Container from "./Container";
import { getUsefulLinks } from "@/lib/api";
import styles from "./Footer.module.scss";

export default async function Footer() {
  const links = await getUsefulLinks();
  const year = new Date().getFullYear();

  // Aplatir les liens de navigation pour le footer
  const flatLinks = NAV_LINKS.flatMap((g) => g.children ?? []);

  return (
    <footer className={styles.footer}>
      <div className={styles.rule} />
      <Container className={styles.grid}>
        <div className={styles.about}>
          <p className={styles.name}>{SITE.name}</p>
          <p className={styles.fullName}>{SITE.fullName}</p>
          <p className={styles.description}>{SITE.description}</p>
          <p style={{ marginTop: "0.75rem", fontStyle: "italic", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
            {SITE.motto}
          </p>
        </div>

        <nav aria-label="Plan du site">
          <p className={styles.heading}>Navigation</p>
          <ul className={styles.list}>
            {flatLinks.slice(0, 6).map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className={styles.heading}>Liens utiles</p>
          <ul className={styles.list}>
            {links.map((l) => (
              <li key={l.id}>
                <Link href={l.url}>{l.label}</Link>
              </li>
            ))}
            <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
          </ul>
        </div>
      </Container>

      <div className={styles.bottomBar}>
        <Container className={styles.bottomInner}>
          <p>© {year} {SITE.name} — {SITE.institution}. Tous droits réservés.</p>
        </Container>
      </div>
    </footer>
  );
}
