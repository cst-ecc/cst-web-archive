"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import Button from "@/components/ui/Button";

import styles from "./SecureDocumentAccess.module.scss";

type AccessInfo = {
  verified: boolean;
  recipientHint: string;
  expiresAt: string;
  remainingOpens: number;
  maxOpens: number;
  grantReference: string;
  document: {
    slug: string;
    title: string;
    reference: string;
  };
  watermark?: {
    name: string;
    reference: string;
  };
};

type LoadState = "loading" | "ready" | "invalid";

export default function SecureDocumentAccess({ token }: { token: string }) {
  const [state, setState] = useState<LoadState>("loading");
  const [info, setInfo] = useState<AccessInfo | null>(null);
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const viewerRef = useRef<HTMLElement>(null);

  const encodedToken = useMemo(() => encodeURIComponent(token), [token]);
  const infoUrl = `/api/v1/documents/access/${encodedToken}/`;

  const loadInfo = async () => {
    setError("");
    try {
      const response = await fetch(infoUrl, {
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        setState("invalid");
        return;
      }
      const payload = (await response.json()) as AccessInfo;
      setInfo(payload);
      setState("ready");
    } catch {
      setState("invalid");
    }
  };

  useEffect(() => {
    void loadInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const sendOtp = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/v1/documents/access/${encodedToken}/otp/`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        detail?: string;
      };
      if (!response.ok) {
        throw new Error(payload.detail || "Le code n’a pas pu être envoyé.");
      }
      setOtpSent(true);
      setMessage(payload.message || "Un code de vérification a été envoyé.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/v1/documents/access/${encodedToken}/verify/`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        detail?: string;
      };
      if (!response.ok) {
        throw new Error(payload.detail || "Le code n’est pas valide.");
      }
      setCode("");
      await loadInfo();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  const enterFullscreen = async () => {
    if (!viewerRef.current?.requestFullscreen) return;
    try {
      await viewerRef.current.requestFullscreen();
    } catch {
      // Le refus du plein écran n'empêche pas la consultation.
    }
  };

  if (state === "loading") {
    return <div className={styles.stateCard}>Vérification du lien sécurisé…</div>;
  }

  if (state === "invalid" || !info) {
    return (
      <div className={styles.stateCard} role="status">
        <strong>Autorisation indisponible</strong>
        <span>
          Ce lien est invalide, expiré, révoqué ou a atteint son nombre maximal
          d’ouvertures. Une nouvelle demande d’accès peut être nécessaire.
        </span>
      </div>
    );
  }

  if (!info.verified) {
    return (
      <section className={styles.verifyCard}>
        <span className={styles.lock}>Accès nominatif</span>
        <h1>{info.document.title}</h1>
        <p>
          Cette autorisation est liée à <strong>{info.recipientHint}</strong>. Un
          code de vérification est requis avant la consultation.
        </p>
        <div className={styles.meta}>
          <span>Référence : {info.grantReference}</span>
          <span>Expire : {new Date(info.expiresAt).toLocaleString("fr-FR")}</span>
          <span>Ouvertures restantes : {info.remainingOpens}</span>
        </div>

        {!otpSent ? (
          <Button onClick={sendOtp} disabled={busy}>
            {busy ? "Envoi…" : "Recevoir le code de vérification"}
          </Button>
        ) : (
          <form className={styles.otpForm} onSubmit={verify}>
            <label>
              <span>Code à 6 chiffres</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                required
              />
            </label>
            <div className={styles.otpActions}>
              <Button type="submit" disabled={busy || code.length !== 6}>
                {busy ? "Vérification…" : "Vérifier et ouvrir"}
              </Button>
              <Button type="button" variant="ghost" onClick={sendOtp} disabled={busy}>
                Renvoyer le code
              </Button>
            </div>
          </form>
        )}

        {message ? <p className={styles.message}>{message}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </section>
    );
  }

  const contentUrl = `/api/v1/documents/access/${encodedToken}/content/#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  const watermark = info.watermark
    ? `${info.watermark.name} • ${info.watermark.reference}`
    : info.grantReference;

  return (
    <section ref={viewerRef} className={styles.viewer} aria-label={`Lecteur sécurisé — ${info.document.title}`}>
      <div className={styles.toolbar}>
        <div>
          <strong>Lecteur sécurisé CST</strong>
          <span>Autorisation {info.grantReference} · {info.remainingOpens} ouverture(s) restante(s)</span>
        </div>
        <button type="button" onClick={enterFullscreen}>Plein écran</button>
      </div>
      <div className={styles.frameWrap}>
        <iframe
          src={contentUrl}
          className={styles.frame}
          title={info.document.title}
          referrerPolicy="same-origin"
        />
        <div className={styles.watermarkLayer} aria-hidden="true">
          {Array.from({ length: 12 }).map((_, index) => (
            <span key={index}>{watermark}</span>
          ))}
        </div>
      </div>
      <div className={styles.footerNote}>
        Consultation personnelle et temporaire. Les accès sont journalisés. Aucun
        téléchargement n’est proposé depuis cette interface.
      </div>
    </section>
  );
}
