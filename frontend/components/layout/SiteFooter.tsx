import Image from "next/image";
import Link from "next/link";
import { FOOTER_GROUPS, SITE } from "@/lib/constants";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";
import { CookieSettingsButton } from "@/components/cookies/CookieConsent";
import BibleVerseCarousel from "@/components/home-v2/BibleVerseCarousel";
import SocialInlineLinks from "./SocialFloatingLinks";
import styles from "./SiteFooter.module.scss";

function NewsletterArt() {
  return (
    <div className={styles.newsletterArt} aria-hidden="true">
      <span className={styles.artOrbitOne} />
      <span className={styles.artOrbitTwo} />
      <span className={styles.artDotOne} />
      <span className={styles.artDotTwo} />
      <div className={styles.envelope}>
        <svg viewBox="0 0 120 92">
          <rect x="7" y="17" width="106" height="68" rx="16" />
          <path d="M15 28 60 59l45-31" />
          <path d="M14 76 48 49" />
          <path d="m106 76-34-27" />
        </svg>
        <span>+</span>
      </div>
    </div>
  );
}

function ContactIcon({ type }: { type: "mail" | "phone" }) {
  if (type === "mail") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m5 8 7 5 7-5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.76 19.76 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.76 19.76 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

export default function SiteFooter() {
  const phones = SITE.phone
    .split("|")
    .map((phone) => phone.trim())
    .filter(Boolean);

  return (
    <footer className={styles.footer}>
      <div className={styles.scriptureBand}>
        <BibleVerseCarousel
          intervalMs={180_000}
          variant="strip"
          showSocials={false}
        />
      </div>

      <div className={styles.surface}>
        <div className={styles.newsletterWrap}>
          <section className={styles.newsletterCard} aria-label="Newsletter">
            <NewsletterArt />
            <NewsletterSignup />
          </section>
        </div>

        <div className={styles.mainFooter}>
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.brand} aria-label="Retour à l’accueil">
              <span className={styles.brandLogo}>
                <Image
                  src="/logo/logo-original.png"
                  alt="Logo de l’Église du Christianisme Céleste"
                  width={74}
                  height={74}
                />
              </span>
              <span className={styles.brandText}>
                <strong>CST · CSMo</strong>
                <small>Église du Christianisme Céleste</small>
              </span>
            </Link>

            <p className={styles.brandDescription}>
              Le site institutionnel consacré aux travaux du Conseil Supérieur
              de Transition et à la mise en œuvre des acquis du processus de
              réunification de l’Église.
            </p>

            <SocialInlineLinks variant="light" />
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} className={styles.linkColumn} aria-label={group.title}>
              <h3>{group.title}</h3>
              <div>
                {group.links.map((item) =>
                  item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.label}
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <Link key={item.href} href={item.href}>
                      {item.label}
                    </Link>
                  ),
                )}
              </div>
            </nav>
          ))}

          <div className={styles.contactColumn}>
            <h3>Nous contacter</h3>
            <div className={styles.contactItems}>
              <a href={`mailto:${SITE.email}`}>
                <span className={styles.contactIcon}>
                  <ContactIcon type="mail" />
                </span>
                <span>
                  <small>E-mail</small>
                  <strong>{SITE.email}</strong>
                </span>
              </a>

              {phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  <span className={styles.contactIcon}>
                    <ContactIcon type="phone" />
                  </span>
                  <span>
                    <small>Téléphone</small>
                    <strong>{phone}</strong>
                  </span>
                </a>
              ))}
            </div>

            <Link href="/contact" className={styles.contactCta}>
              Écrire à l’équipe
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p>
            © {new Date().getFullYear()} {SITE.institution}. Tous droits réservés.
          </p>
          <div className={styles.legal}>
            <Link href="/politique-cookies">Politique de cookies</Link>
            <Link href="/contact">Contact</Link>
            <CookieSettingsButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
