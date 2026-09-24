import Link from "next/link";

// Réutilise volontairement le langage visuel déjà validé pour les tabs Membres.
import styles from "@/components/members/MembersSubnav.module.scss";

type OrganizationSubnavProps = {
  active: "world" | "diocesan";
};

export default function OrganizationSubnav({
  active,
}: OrganizationSubnavProps) {
  return (
    <nav className={styles.nav} aria-label="Niveaux de l’organigramme de l’Église">
      <Link
        href="/organigramme"
        className={`${styles.link} ${active === "world" ? styles.active : ""}`}
        aria-current={active === "world" ? "page" : undefined}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21M12 3c-2.4 2.5-3.6 5.5-3.6 9S9.6 18.5 12 21" />
        </svg>
        <span>Niveau mondial</span>
      </Link>

      <Link
        href="/organigramme/niveau-diocesain"
        className={`${styles.link} ${active === "diocesan" ? styles.active : ""}`}
        aria-current={active === "diocesan" ? "page" : undefined}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v5M5 21v-5h14v5" />
          <path d="M5 16v-4h14v4M12 8v4" />
          <circle cx="12" cy="3" r="1.5" />
          <circle cx="5" cy="21" r="1.5" />
          <circle cx="12" cy="21" r="1.5" />
          <circle cx="19" cy="21" r="1.5" />
        </svg>
        <span>Niveau diocésain</span>
      </Link>
    </nav>
  );
}
