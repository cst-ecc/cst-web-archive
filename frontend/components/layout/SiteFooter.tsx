import { SITE } from "@/lib/constants";

import styles from "./SiteFooter.module.scss";

export default function SiteFooter() {
  const phones = SITE.phone
    .split("|")
    .map((phone) => phone.trim())
    .filter(Boolean);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <strong>
            © {new Date().getFullYear()} {SITE.institution}
          </strong>
          <span className={styles.process}>{SITE.fullName}</span>
        </div>

        <div className={styles.contacts} aria-label="Coordonnées">
          <a href={`mailto:${SITE.email}`} className={styles.contact}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            <span>{SITE.email}</span>
          </a>

          {phones.map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className={styles.contact}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
              </svg>
              <span>{phone}</span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
