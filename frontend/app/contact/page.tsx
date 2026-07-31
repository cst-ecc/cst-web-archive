import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import Container from "@/components/layout/Container";
import ContactForm from "@/components/contact/ContactForm";
import { SITE } from "@/lib/constants";
import { getUsefulLinks } from "@/lib/api";
import styles from "./contact.module.scss";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter le Conseil Supérieur de Transition.",
};

export default async function ContactPage() {
  const links = await getUsefulLinks();
  return (
    <>
      <PageHeader eyebrow="Nous joindre" title="Contact" subtitle="Pour toute demande d'information institutionnelle." />
      <Container className={styles.wrapper}>
        <div className={styles.layout}>
          <ContactForm />
          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>Coordonnées</h2>
            <ul className={styles.coordList}>
              <li><span className={styles.coordLabel}>Institution :</span> {SITE.institution}</li>
              <li><span className={styles.coordLabel}>Instance :</span> {SITE.fullName}</li>
              <li>
                <span className={styles.coordLabel}>E-mail :</span>{" "}
                <a href={`mailto:${SITE.email}`} className={styles.emailLink}>{SITE.email}</a>
              </li>
            </ul>
            <h3 className={styles.linksTitle}>Liens utiles</h3>
            <ul className={styles.linksList}>
              {links.map((l) => (
                <li key={l.id}><a href={l.url}>{l.label}</a></li>
              ))}
            </ul>
          </aside>
        </div>
      </Container>
    </>
  );
}
