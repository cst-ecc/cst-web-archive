"use client";

import { usePathname } from "next/navigation";

import AlertTicker from "@/components/home-v2/AlertTicker";
import { useAlertTicker } from "./AlertTickerProvider";

import styles from "./SiteAlertTicker.module.scss";

function tickerIsHidden(pathname: string): boolean {
  // Le détail d'une actualité ne doit pas réafficher son propre bandeau.
  if (/^\/actualites\/[^/]+\/?$/.test(pathname)) {
    return true;
  }

  // La galerie et ses éventuelles futures sous-routes restent sans bandeau.
  if (
    pathname === "/galerie" ||
    pathname.startsWith("/galerie/")
  ) {
    return true;
  }

  return false;
}

export default function SiteAlertTicker() {
  const pathname = usePathname();
  const { alert } = useAlertTicker();

  if (
    !alert ||
    !pathname ||
    tickerIsHidden(pathname)
  ) {
    return null;
  }

  return (
    <div className={styles.shell}>
      <div className={styles.inner}>
        <AlertTicker item={alert} />
      </div>
    </div>
  );
}
