"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_CONSENT_CATEGORIES,
  readConsentCookie,
  writeConsentCookie,
  type ConsentCategories,
  type ConsentRecord,
} from "@/lib/cookies";
import styles from "./CookieConsent.module.scss";

type CookieConsentContextValue = {
  consent: ConsentRecord | null;
  ready: boolean;
  externalAllowed: boolean;
  openSettings: () => void;
  allowExternal: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent() {
  const value = useContext(CookieConsentContext);
  if (!value) {
    throw new Error("useCookieConsent doit être utilisé dans CookieConsentProvider.");
  }
  return value;
}

export default function CookieConsentProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [external, setExternal] = useState(false);

  useEffect(() => {
    const stored = readConsentCookie();
    setConsent(stored);
    setExternal(stored?.categories.external ?? false);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [settingsOpen]);

  const save = useCallback((categories: ConsentCategories) => {
    const record = writeConsentCookie(categories);
    setConsent(record);
    setExternal(record.categories.external);
    setSettingsOpen(false);
  }, []);

  const acceptAll = useCallback(() => {
    save({ necessary: true, external: true });
  }, [save]);

  const rejectOptional = useCallback(() => {
    save(DEFAULT_CONSENT_CATEGORIES);
  }, [save]);

  const allowExternal = useCallback(() => {
    save({ necessary: true, external: true });
  }, [save]);

  const openSettings = useCallback(() => {
    setExternal(consent?.categories.external ?? false);
    setSettingsOpen(true);
  }, [consent]);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      ready,
      externalAllowed: consent?.categories.external === true,
      openSettings,
      allowExternal,
    }),
    [consent, ready, openSettings, allowExternal],
  );

  const transition = reducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" as const };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {ready && !consent ? (
          <motion.aside
            className={styles.banner}
            role="region"
            aria-label="Choix des cookies"
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={transition}
          >
            <div className={styles.bannerCopy}>
              <strong>Votre choix, simplement.</strong>
              <p>
                Ce site utilise des éléments strictement nécessaires à son fonctionnement.
                Les contenus externes, comme YouTube, ne sont chargés qu’avec votre accord.
                {" "}<Link href="/politique-cookies">Politique de cookies</Link>
              </p>
            </div>
            <div className={styles.bannerActions}>
              <button type="button" className={styles.secondary} onClick={rejectOptional}>Refuser les non essentiels</button>
              <button type="button" className={styles.secondary} onClick={openSettings}>Personnaliser</button>
              <button type="button" className={styles.primary} onClick={acceptAll}>Accepter</button>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen ? (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target && consent) setSettingsOpen(false);
            }}
          >
            <motion.section
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cookie-settings-title"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={transition}
            >
              <div className={styles.modalHead}>
                <div>
                  <span>Confidentialité</span>
                  <h2 id="cookie-settings-title">Gestion des cookies</h2>
                </div>
                {consent ? (
                  <button type="button" className={styles.close} onClick={() => setSettingsOpen(false)} aria-label="Fermer">×</button>
                ) : null}
              </div>

              <p className={styles.intro}>
                Vous pouvez modifier votre choix à tout moment. Les cookies nécessaires restent actifs car ils servent notamment à mémoriser votre consentement et aux fonctions de sécurité.
              </p>

              <div className={styles.categories}>
                <div className={styles.category}>
                  <div><strong>Nécessaires</strong><p>Fonctionnement, sécurité et mémorisation du choix de consentement.</p></div>
                  <span className={styles.alwaysOn}>Toujours actifs</span>
                </div>

                <label className={styles.category}>
                  <div><strong>Contenus externes</strong><p>Autorise le chargement de services tiers intégrés, actuellement YouTube.</p></div>
                  <span className={styles.switch}>
                    <input type="checkbox" checked={external} onChange={(event) => setExternal(event.target.checked)} />
                    <span aria-hidden="true" />
                  </span>
                </label>
              </div>

              <div className={styles.modalFoot}>
                <Link href="/politique-cookies" className={styles.policyLink}>Voir la politique de cookies</Link>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondary} onClick={rejectOptional}>Tout refuser</button>
                  <button type="button" className={styles.primary} onClick={() => save({ necessary: true, external })}>Enregistrer mes choix</button>
                </div>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </CookieConsentContext.Provider>
  );
}
