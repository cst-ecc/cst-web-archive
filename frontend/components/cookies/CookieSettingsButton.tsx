"use client";

import { useCookieConsent } from "./CookieConsentProvider";
import styles from "./CookieConsent.module.scss";

export default function CookieSettingsButton() {
  const { openSettings } = useCookieConsent();
  return (
    <button type="button" className={styles.footerButton} onClick={openSettings}>
      Gestion des cookies
    </button>
  );
}
