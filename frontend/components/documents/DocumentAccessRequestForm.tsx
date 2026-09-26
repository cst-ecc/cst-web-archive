"use client";

import { FormEvent, useState } from "react";

import Button from "@/components/ui/Button";

import styles from "./DocumentAccessRequestForm.module.scss";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  reason: string;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  organization: "",
  reason: "",
};

export default function DocumentAccessRequestForm({
  slug,
}: {
  slug: string;
}) {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/v1/documents/${encodeURIComponent(slug)}/request-access/`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        detail?: string;
        [key: string]: unknown;
      };

      if (!response.ok) {
        throw new Error(
          payload.detail || "La demande n’a pas pu être enregistrée.",
        );
      }

      setSuccess(
        payload.message ||
          "Votre demande a été enregistrée. Elle sera examinée par l’administration.",
      );
      setForm(initialState);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Une erreur est survenue. Réessayez plus tard.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={styles.success} role="status">
        <span className={styles.icon} aria-hidden="true">✓</span>
        <strong>Demande transmise</strong>
        <p>{success}</p>
        <p>
          Si votre demande est autorisée, un lien personnel et temporaire sera
          envoyé à l’adresse e-mail indiquée.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Nom et prénoms *</span>
          <input
            required
            autoComplete="name"
            value={form.fullName}
            onChange={(event) => update("fullName", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Adresse e-mail *</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Téléphone</span>
          <input
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Organisation / qualité</span>
          <input
            value={form.organization}
            onChange={(event) => update("organization", event.target.value)}
            placeholder="Ex. Paroisse, diocèse, fonction…"
          />
        </label>
      </div>

      <label className={styles.field}>
        <span>Motif de la demande *</span>
        <textarea
          required
          rows={5}
          minLength={10}
          value={form.reason}
          onChange={(event) => update("reason", event.target.value)}
          placeholder="Précisez la raison pour laquelle vous souhaitez consulter ce document."
        />
      </label>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <div className={styles.actions}>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Envoi en cours…" : "Envoyer la demande"}
        </Button>
      </div>

      <p className={styles.note}>
        Les informations transmises sont utilisées uniquement pour examiner et
        tracer l’accès à ce document confidentiel.
      </p>
    </form>
  );
}
