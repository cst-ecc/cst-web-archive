"use client";

import { FormEvent, useState } from "react";
import { subscribeNewsletter } from "@/lib/communication";
import styles from "./NewsletterSignup.module.scss";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setFeedback("idle");
    setLoading(true);

    try {
      const result = await subscribeNewsletter(email, "", website);
      setMessage(result.message);
      setFeedback("success");
      setEmail("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Inscription impossible.",
      );
      setFeedback("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.intro}>
        <span className={styles.kicker}>Newsletter officielle</span>
        <strong>Restez informé de la marche vers l’unité.</strong>
        <p>
          Recevez les dernières actualités, communiqués et informations
          institutionnelles du CST et du CSMo.
        </p>
      </div>

      <form onSubmit={submit} className={styles.form}>
        <label className={styles.honeypot} aria-hidden="true">
          Site
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>

        <div className={styles.fieldShell}>
          <span className={styles.mailIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="m5 8 7 5 7-5" />
            </svg>
          </span>
          <input
            type="email"
            required
            placeholder="Votre adresse e-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-label="Votre adresse e-mail"
            autoComplete="email"
          />
          <button disabled={loading}>
            {loading ? "Inscription…" : "S’abonner"}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>

      <div className={styles.meta}>
        <span>Confirmation par e-mail · Désinscription à tout moment.</span>
        {message ? (
          <p
            className={feedback === "error" ? styles.error : styles.success}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
