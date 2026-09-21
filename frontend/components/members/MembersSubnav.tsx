import Link from "next/link";

import styles from "./MembersSubnav.module.scss";

type MembersSubnavProps = {
  active: "council" | "commissions";
};

export default function MembersSubnav({ active }: MembersSubnavProps) {
  return (
    <nav className={styles.nav} aria-label="Navigation des membres du CST">
      <Link
        href="/membres"
        className={`${styles.link} ${active === "council" ? styles.active : ""}`}
        aria-current={active === "council" ? "page" : undefined}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>Organisation du CST</span>
      </Link>

      <Link
        href="/membres/commissions"
        className={`${styles.link} ${active === "commissions" ? styles.active : ""}`}
        aria-current={active === "commissions" ? "page" : undefined}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 6h13M8 12h13M8 18h13" />
          <path d="M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
        <span>Membres des commissions</span>
      </Link>
    </nav>
  );
}
