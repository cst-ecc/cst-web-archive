import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";
import { SITE } from "@/lib/constants";
import { getUsefulLinks } from "@/lib/api";
import styles from "./contact.module.scss";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter l’équipe institutionnelle du CST et du CSMo.",
};

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m5 8 7 5 7-5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.76 19.76 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.76 19.76 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
      <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15" />
    </svg>
  );
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: { newsletter?: string };
}) {
  const links = await getUsefulLinks();
  const phones = SITE.phone
    .split("|")
    .map((phone) => phone.trim())
    .filter(Boolean);

  return (
    <section className={styles.page} aria-labelledby="contact-title">
      <div className={styles.pageGlow} aria-hidden="true" />

      <div className={styles.shell}>
        <aside className={styles.visualPanel}>
          <div className={styles.visualTop}>
            <span className={styles.eyebrow}>Contact institutionnel</span>
            <h1 id="contact-title">
              Parlons de votre demande.
              <em> Nous sommes à votre écoute.</em>
            </h1>
            <p className={styles.lead}>
              Information, document, média ou assistance technique : adressez
              votre demande à l’équipe du CST / CSMo. Elle sera transmise aux
              personnes habilitées à la traiter.
            </p>
          </div>

          <div className={styles.contactList} aria-label="Coordonnées">
            <a href={`mailto:${SITE.email}`}>
              <span className={styles.contactIcon}>
                <MailIcon />
              </span>
              <span>
                <small>E-mail</small>
                <strong>{SITE.email}</strong>
              </span>
            </a>

            {phones.slice(0, 1).map((phone) => (
              <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                <span className={styles.contactIcon}>
                  <PhoneIcon />
                </span>
                <span>
                  <small>Téléphone</small>
                  <strong>{phone}</strong>
                </span>
              </a>
            ))}

            {links.slice(0, 1).map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                <span className={styles.contactIcon}>
                  <LinkIcon />
                </span>
                <span>
                  <small>Ressource utile</small>
                  <strong>{link.label}</strong>
                </span>
              </a>
            ))}
          </div>
        </aside>

        <div className={styles.formPanel}>
          {searchParams?.newsletter === "confirmed" ? (
            <div className={styles.successBanner} role="status">
              Votre abonnement à la newsletter est confirmé.
            </div>
          ) : null}

          <div className={styles.formIntro}>
            <span>Écrivez-nous</span>
            <h2>Envoyez-nous un message</h2>
            <p>
              Complétez le formulaire ci-dessous. Les champs obligatoires nous
              permettent de traiter correctement votre demande.
            </p>
          </div>

          <ContactForm />

          <p className={styles.formNote}>
            {SITE.motto}
          </p>
        </div>
      </div>
    </section>
  );
}
