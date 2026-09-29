import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import Container from "@/components/layout/Container";
import ContactForm from "@/components/contact/ContactForm";
import { MotionAside } from "@/components/ui/Motion";
import { SITE } from "@/lib/constants";
import { getUsefulLinks } from "@/lib/api";
import styles from "./contact.module.scss";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter le CST et le CSMo de l’Église du Christianisme Céleste.",
};

export default async function ContactPage() {
  const links = await getUsefulLinks();
  const phones = SITE.phone.split("|").map((phone) => phone.trim()).filter(Boolean);

  return (
    <>
      <PageHeader
        eyebrow="Nous joindre"
        title="Contact"
        subtitle="Une question, une demande institutionnelle ou une contribution ? Écrivez-nous depuis cet espace sécurisé."
      />
      <Container className={styles.wrapper}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>À votre écoute</p>
          <h2>Un point de contact clair pour vos demandes.</h2>
          <p>
            Utilisez le formulaire pour transmettre votre message. Les coordonnées ci-dessous
            restent disponibles pour un contact direct lorsque cela est plus approprié.
          </p>
        </div>

        <div className={styles.layout}>
          <ContactForm />

          <MotionAside className={styles.sidebar} delay={0.08} ariaLabel="Coordonnées institutionnelles">
            <section className={styles.infoCard}>
              <span className={styles.cardIcon} aria-hidden>@</span>
              <div>
                <p className={styles.cardLabel}>E-mail</p>
                <a href={`mailto:${SITE.email}`} className={styles.primaryLink}>{SITE.email}</a>
                <p className={styles.cardHint}>Pour les demandes institutionnelles et générales.</p>
              </div>
            </section>

            <section className={styles.infoCard}>
              <span className={styles.cardIcon} aria-hidden>☎</span>
              <div>
                <p className={styles.cardLabel}>Téléphone</p>
                <div className={styles.phoneList}>
                  {phones.map((phone) => (
                    <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={styles.primaryLink}>{phone}</a>
                  ))}
                </div>
                <p className={styles.cardHint}>Coordonnées déjà publiées sur le site.</p>
              </div>
            </section>

            <section className={styles.institutionCard}>
              <p className={styles.cardLabel}>Institution</p>
              <strong>{SITE.institution}</strong>
              <span>{SITE.fullName}</span>
            </section>

            {links.length > 0 ? (
              <section className={styles.usefulLinks}>
                <p className={styles.cardLabel}>Liens utiles</p>
                <ul>
                  {links.map((link) => (
                    <li key={link.id}><a href={link.url}>{link.label}<span aria-hidden>↗</span></a></li>
                  ))}
                </ul>
              </section>
            ) : null}
          </MotionAside>
        </div>
      </Container>
    </>
  );
}
