"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import styles from "./CookieConsent.module.scss";
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from "@/lib/cookie-consent";

const STORAGE_KEY = CONSENT_STORAGE_KEY;

type Consent = { version: string; necessary: true; preferences: boolean; analytics: boolean; external: boolean; decidedAt: string };
type ContextValue = { consent: Consent | null; allowed: (category: keyof Omit<Consent, "version" | "decidedAt">) => boolean; openSettings: () => void };
const Context = createContext<ContextValue>({ consent: null, allowed: (category) => category === "necessary", openSettings: () => undefined });

function buildConsent(values: Pick<Consent, "preferences" | "analytics" | "external">): Consent {
  return { version: CONSENT_VERSION, necessary: true, ...values, decidedAt: new Date().toISOString() };
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Consent;
        if (parsed.version === CONSENT_VERSION) setConsent(parsed);
      }
    } catch { localStorage.removeItem(STORAGE_KEY); }
    setReady(true);
  }, []);

  const save = useCallback((next: Consent) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConsent(next);
    setSettings(false);
    window.dispatchEvent(new CustomEvent("cst-consent-changed", { detail: next }));
  }, []);
  const value = useMemo(() => ({ consent, allowed: (category: keyof Omit<Consent, "version" | "decidedAt">) => category === "necessary" || Boolean(consent?.[category]), openSettings: () => setSettings(true) }), [consent]);

  return <Context.Provider value={value}>{children}{ready && <AnimatePresence>{(!consent || settings) && <motion.div className={styles.layer} initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: reduced ? 0 : .22 }}>
    {settings ? <Preferences initial={consent} onCancel={() => consent && setSettings(false)} onSave={save} /> : <Banner onAccept={() => save(buildConsent({ preferences: true, analytics: true, external: true }))} onReject={() => save(buildConsent({ preferences: false, analytics: false, external: false }))} onSettings={() => setSettings(true)} />}
  </motion.div>}</AnimatePresence>}</Context.Provider>;
}

function Banner({ onAccept, onReject, onSettings }: { onAccept: () => void; onReject: () => void; onSettings: () => void }) {
  return <section className={styles.banner} role="dialog" aria-label="Gestion des cookies"><div><strong>Votre confidentialité, simplement.</strong><p>Nous utilisons les éléments strictement nécessaires au fonctionnement du site. Les contenus externes et futurs outils de mesure restent désactivés sans votre choix.</p><Link href="/politique-cookies">Politique de cookies</Link></div><div className={styles.actions}><button className={styles.secondary} onClick={onReject}>Refuser</button><button className={styles.secondary} onClick={onSettings}>Personnaliser</button><button className={styles.primary} onClick={onAccept}>Accepter</button></div></section>;
}

function Preferences({ initial, onCancel, onSave }: { initial: Consent | null; onCancel: () => void; onSave: (c: Consent) => void }) {
  const [preferences, setPreferences] = useState(initial?.preferences ?? false);
  const [analytics, setAnalytics] = useState(initial?.analytics ?? false);
  const [external, setExternal] = useState(initial?.external ?? false);
  return <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="cookie-title"><div className={styles.modalHead}><div><span>Confidentialité</span><h2 id="cookie-title">Préférences cookies</h2></div>{initial && <button className={styles.close} onClick={onCancel} aria-label="Fermer">×</button>}</div><p>Choisissez les catégories autorisées. Fermer cette fenêtre ne vaut jamais consentement.</p>
    <ConsentRow label="Strictement nécessaires" description="Sécurité, session et fonctions indispensables." checked disabled />
    <ConsentRow label="Préférences" description="Langue et préférences d’interface lorsqu’elles sont utilisées." checked={preferences} onChange={setPreferences} />
    <ConsentRow label="Mesure d’audience" description="Réservée à un futur outil d’analytics, actuellement absent." checked={analytics} onChange={setAnalytics} />
    <ConsentRow label="Contenus externes" description="Permet notamment l’affichage de la vidéo YouTube intégrée." checked={external} onChange={setExternal} />
    <div className={styles.modalActions}><button className={styles.secondary} onClick={() => onSave(buildConsent({ preferences: false, analytics: false, external: false }))}>Tout refuser</button><button className={styles.primary} onClick={() => onSave(buildConsent({ preferences, analytics, external }))}>Enregistrer mes choix</button></div></section>;
}

function ConsentRow({ label, description, checked, disabled, onChange }: { label: string; description: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void }) {
  return <label className={styles.row}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} /></label>;
}

export const useCookieConsent = () => useContext(Context);
export function CookieSettingsButton() { const { openSettings } = useCookieConsent(); return <button className={styles.footerButton} onClick={openSettings}>Gestion des cookies</button>; }
