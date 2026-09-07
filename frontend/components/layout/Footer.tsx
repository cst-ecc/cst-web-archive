import Link from "next/link";
import Container from "./Container";
import MissionStatement from "@/components/home/MissionStatement";
import { FOOTER_GROUPS, SITE, type NavLink } from "@/lib/constants";
import { getUsefulLinks } from "@/lib/api";
import styles from "./Footer.module.scss";

function FooterLink({ link }: { link: NavLink }) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer">
        <span>{link.label}</span>
        <span className={styles.externalMark} aria-hidden>↗</span>
      </a>
    );
  }

  return <Link href={link.href}>{link.label}</Link>;
}

export default async function Footer() {
  const links = await getUsefulLinks();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <MissionStatement />

      <div className={styles.navigationArea}>
        <Container className={styles.grid}>
          <div className={styles.about}>
            <p className={styles.processBadge}>CST → CSMO</p>
            <p className={styles.name}>{SITE.name}</p>
            <p className={styles.fullName}>{SITE.processName}</p>
            <p className={styles.description}>
              Une plateforme institutionnelle pour comprendre la transition,
              suivre la mise en œuvre et accéder aux initiatives structurantes
              de l’Église du Christianisme Céleste.
            </p>
            <p className={styles.motto}>{SITE.motto}</p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className={styles.heading}>{group.title}</p>
              <ul className={styles.list}>
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className={styles.heading}>Liens utiles</p>
            <ul className={styles.list}>
              {links.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <span>{link.label}</span>
                    <span className={styles.externalMark} aria-hidden>↗</span>
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
            </ul>
          </div>
        </Container>
      </div>

      <div className={styles.bottomBar}>
        <Container className={styles.bottomInner}>
          <p>© {year} {SITE.institution}. Tous droits réservés.</p>
          <p className={styles.bottomProcess}>{SITE.fullName} · {SITE.processName}</p>
        </Container>
      </div>
    </footer>
  );
}
