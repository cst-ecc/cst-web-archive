"use client";

import AlertTicker from "@/components/home-v2/AlertTicker";
import { useAlertTicker } from "./AlertTickerProvider";
import styles from "./SiteAlertTicker.module.scss";

/**
 * Bande "Dernière INFO" partagée.
 * Son emplacement est volontairement décidé par la page qui la rend :
 * juste après le Hero / PageHeader, jamais automatiquement sous la Navbar.
 */
export default function SiteAlertTicker() {
  const { alert } = useAlertTicker();

  if (!alert) {
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
