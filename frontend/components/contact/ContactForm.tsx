"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import styles from "./ContactForm.module.scss";

type ContactFormState = {
  name: string;
  first_names: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
  website: string;
};

const INITIAL_FORM: ContactFormState = {
  name: "",
  first_names: "",
  email: "",
  phone: "",
  subject: "",
  category: "general",
  message: "",
  website: "",
};

const CATEGORIES = [
  ["general", "Information générale"],
  ["documents", "Documents et ressources"],
  ["communication", "Presse et communication"],
  ["contribution", "Contribution ou proposition"],
  ["other", "Autre demande"],
] as const;

function firstError(value: unknown): string | undefined {
  if (Array.isArray(value)) return value.map(String).join(" ");
  if (typeof value === "string") return value;
  return undefined;
}

export default function ContactForm() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (field: keyof ContactFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Veuillez indiquer votre nom.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Adresse e-mail invalide.";
    if (form.subject.trim().length < 3) next.subject = "Veuillez préciser l’objet de votre demande.";
    if (form.phone.trim() && !/^[0-9+().\-\s]{6,40}$/.test(form.phone.trim())) next.phone = "Numéro de téléphone invalide.";
    if (form.message.trim().length < 10) next.message = "Le message doit contenir au moins 10 caractères.";
    if (form.message.length > 5000) next.message = "Le message ne peut pas dépasser 5 000 caractères.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const csrfResponse = await fetch("/api/v1/contact/csrf/", {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!csrfResponse.ok) throw new Error("csrf");
      const csrfPayload = (await csrfResponse.json()) as { csrfToken?: string };
      if (!csrfPayload.csrfToken) throw new Error("csrf");

      const response = await fetch("/api/v1/contact/", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRFToken": csrfPayload.csrfToken,
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        detail?: string;
        errors?: Record<string, unknown>;
      };

      if (response.status === 429) {
        setServerError(payload.detail || "Trop de demandes ont été envoyées. Veuillez réessayer plus tard.");
        return;
      }

      if (!response.ok) {
        if (payload.errors) {
          const backendErrors: Record<string, string> = {};
          Object.entries(payload.errors).forEach(([key, value]) => {
            const message = firstError(value);
            if (message) backendErrors[key] = message;
          });
          setErrors(backendErrors);
        }
        setServerError(payload.detail || "Le message n’a pas pu être envoyé. Vérifiez les champs puis réessayez.");
        return;
      }

      setSent(true);
      setForm(INITIAL_FORM);
    } catch {
      setServerError("Le service de contact est momentanément indisponible. Vous pouvez aussi utiliser l’adresse e-mail indiquée sur cette page.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.confirmation} role="status">
        <span className={styles.confirmIcon} aria-hidden>✓</span>
        <p className={styles.kicker}>Message enregistré</p>
        <h2 className={styles.confirmTitle}>Merci pour votre message.</h2>
        <p className={styles.confirmText}>
          Votre demande a bien été transmise à l’équipe chargée du suivi institutionnel.
        </p>
        <Button onClick={() => setSent(false)} variant="outline" className={styles.confirmButton}>
          Envoyer un autre message
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={submit} noValidate>
      <div className={styles.heading}>
        <p className={styles.kicker}>Votre demande</p>
        <h2>Écrivez-nous</h2>
        <p>Les champs marqués d’un astérisque sont obligatoires.</p>
      </div>

      {serverError ? <div className={styles.serverError} role="alert">{serverError}</div> : null}

      <div className={styles.row2}>
        <div className={styles.field}>
          <label htmlFor="c-first-names" className={styles.label}>Prénoms</label>
          <input id="c-first-names" name="first_names" autoComplete="given-name" maxLength={160} className={styles.input} value={form.first_names} onChange={(e) => update("first_names", e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="c-name" className={styles.label}>Nom <span>*</span></label>
          <input id="c-name" name="name" autoComplete="family-name" maxLength={160} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "c-name-error" : undefined} className={styles.input} value={form.name} onChange={(e) => update("name", e.target.value)} />
          {errors.name && <p id="c-name-error" className={styles.error}>{errors.name}</p>}
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label htmlFor="c-email" className={styles.label}>E-mail <span>*</span></label>
          <input id="c-email" name="email" type="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "c-email-error" : undefined} className={styles.input} value={form.email} onChange={(e) => update("email", e.target.value)} />
          {errors.email && <p id="c-email-error" className={styles.error}>{errors.email}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="c-phone" className={styles.label}>Téléphone <span className={styles.optional}>optionnel</span></label>
          <input id="c-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "c-phone-error" : undefined} className={styles.input} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          {errors.phone && <p id="c-phone-error" className={styles.error}>{errors.phone}</p>}
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label htmlFor="c-category" className={styles.label}>Catégorie <span>*</span></label>
          <select id="c-category" name="category" className={styles.input} value={form.category} onChange={(e) => update("category", e.target.value)}>
            {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="c-subject" className={styles.label}>Objet <span>*</span></label>
          <input id="c-subject" name="subject" maxLength={220} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? "c-subject-error" : undefined} className={styles.input} value={form.subject} onChange={(e) => update("subject", e.target.value)} />
          {errors.subject && <p id="c-subject-error" className={styles.error}>{errors.subject}</p>}
        </div>
      </div>

      <div className={styles.field}>
        <div className={styles.messageLabel}>
          <label htmlFor="c-message" className={styles.label}>Message <span>*</span></label>
          <small>{form.message.length}/5000</small>
        </div>
        <textarea id="c-message" name="message" rows={8} maxLength={5000} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "c-message-error" : undefined} className={styles.input} value={form.message} onChange={(e) => update("message", e.target.value)} />
        {errors.message && <p id="c-message-error" className={styles.error}>{errors.message}</p>}
      </div>

      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="c-website">Site web</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} />
      </div>

      <div className={styles.formFooter}>
        <p>Vos coordonnées sont utilisées uniquement pour traiter cette demande.</p>
        <Button type="submit" disabled={submitting} className={styles.submitButton}>
          {submitting ? "Envoi en cours…" : "Envoyer le message"}
        </Button>
      </div>
    </form>
  );
}
