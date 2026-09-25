"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ContactCategory,
  getContactCategories,
  sendContact,
} from "@/lib/communication";
import { MotionDiv } from "@/components/ui/Motion";
import styles from "./ContactForm.module.scss";

const EMPTY = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  subject: "",
  category: "",
  message: "",
  consent_acknowledged: false,
  website: "",
};

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState<ContactCategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [serverMessage, setServerMessage] = useState("");

  useEffect(() => {
    getContactCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (form.last_name.trim().length < 2) {
      nextErrors.last_name = "Veuillez indiquer votre nom.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Adresse e-mail invalide.";
    }
    if (form.subject.trim().length < 3) {
      nextErrors.subject = "Veuillez préciser l’objet.";
    }
    if (form.message.trim().length < 10) {
      nextErrors.message = "Le message doit contenir au moins 10 caractères.";
    }
    if (!form.consent_acknowledged) {
      nextErrors.consent_acknowledged =
        "Veuillez confirmer avoir pris connaissance de cette information.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    setServerMessage("");

    try {
      const response = await sendContact({
        ...form,
        category: form.category || null,
      });
      setStatus("success");
      setServerMessage(response.message);
      setForm(EMPTY);
    } catch (error) {
      setStatus("error");
      setServerMessage(
        error instanceof Error
          ? error.message
          : "Votre message n’a pas pu être envoyé.",
      );
    }
  }

  if (status === "success") {
    return (
      <MotionDiv className={styles.confirmation}>
        <span className={styles.successIcon}>✓</span>
        <span className={styles.confirmationKicker}>Message transmis</span>
        <h2>Merci pour votre message.</h2>
        <p>{serverMessage}</p>
        <button className={styles.reset} onClick={() => setStatus("idle")}>
          Envoyer un autre message
          <span aria-hidden="true">↗</span>
        </button>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv className={styles.card}>
      <form onSubmit={submit} noValidate>
        <div className={styles.row2}>
          <Field label="Prénoms" optional>
            <input
              value={form.first_name}
              onChange={(event) =>
                setForm({ ...form, first_name: event.target.value })
              }
              maxLength={120}
              autoComplete="given-name"
              placeholder="Vos prénoms"
            />
          </Field>

          <Field label="Nom" error={errors.last_name}>
            <input
              required
              value={form.last_name}
              onChange={(event) =>
                setForm({ ...form, last_name: event.target.value })
              }
              maxLength={120}
              autoComplete="family-name"
              placeholder="Votre nom"
            />
          </Field>
        </div>

        <Field label="Adresse e-mail" error={errors.email}>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            autoComplete="email"
            placeholder="nom@exemple.com"
          />
        </Field>

        <Field label="Numéro de téléphone" optional>
          <input
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
            maxLength={40}
            autoComplete="tel"
            placeholder="+229 ..."
          />
        </Field>

        <div className={styles.row2}>
          <Field label="Catégorie" optional>
            <select
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
            >
              <option value="">Choisir une catégorie</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Objet" error={errors.subject}>
            <input
              required
              value={form.subject}
              onChange={(event) =>
                setForm({ ...form, subject: event.target.value })
              }
              maxLength={220}
              placeholder="Objet de votre demande"
            />
          </Field>
        </div>

        <Field label="Message" error={errors.message}>
          <textarea
            required
            rows={6}
            maxLength={5000}
            value={form.message}
            onChange={(event) =>
              setForm({ ...form, message: event.target.value })
            }
            placeholder="Écrivez votre message..."
          />
          <span className={styles.counter}>{form.message.length}/5000</span>
        </Field>

        <label className={styles.honeypot} aria-hidden="true">
          Site web
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) =>
              setForm({ ...form, website: event.target.value })
            }
          />
        </label>

        <label className={styles.consent}>
          <input
            type="checkbox"
            checked={form.consent_acknowledged}
            onChange={(event) =>
              setForm({
                ...form,
                consent_acknowledged: event.target.checked,
              })
            }
          />
          <span>
            J’ai pris connaissance du fait que les informations fournies seront
            utilisées pour traiter ma demande.
          </span>
        </label>

        {errors.consent_acknowledged ? (
          <p className={styles.error}>{errors.consent_acknowledged}</p>
        ) : null}

        <div className={styles.actions}>
          <button className={styles.submit} disabled={status === "loading"}>
            <span>
              {status === "loading" ? "Envoi en cours…" : "Envoyer le message"}
            </span>
            <i aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </i>
          </button>

          {status === "error" ? (
            <p className={styles.serverError} role="alert">
              {serverMessage}
            </p>
          ) : null}
        </div>
      </form>
    </MotionDiv>
  );
}

function Field({
  label,
  optional,
  error,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>
        {label}
        {optional ? <small> optionnel</small> : null}
      </span>
      {children}
      {error ? <em>{error}</em> : null}
    </label>
  );
}
