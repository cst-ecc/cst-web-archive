"use client";

import AlertTicker from "@/components/home-v2/AlertTicker";
import { useAlertTicker } from "./AlertTickerProvider";

/**
 * Bande d'information partagée.
 *
 * Son emplacement est volontairement décidé par la page qui l'utilise :
 * juste après le Hero/PageHeader sur les pages qui en possèdent un.
 */
export default function SiteAlertTicker() {
  const { alert } = useAlertTicker();

  if (!alert) {
    return null;
  }

  return <AlertTicker item={alert} />;
}
