"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { normalize } from "@/lib/utils";
import styles from "./ContactForm.module.scss";

/**
 * Formulaire de contact — phase 1 : validation côté client uniquement.
 * L'envoi réel sera branché plus tard sur un endpoint Django (POST /contact/),
 * avec protection anti-spam et validation serveur.
 */
export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Veuillez indiquer votre nom.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Adresse e-mail invalide.";
    if (form.message.trim().length < 10) e.message = "Message trop court (10 caractères minimum).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    // Phase 1 : aucune donnée n'est transmise à un serveur.
    void normalize(form.message);
    setSent(true);
  };

  if (sent) {
    return (
      <div className={styles.confirmation}>
        <h2 className={styles.confirmTitle}>Message prêt à l'envoi</h2>
        <p className={styles.confirmText}>
          En phase 1, le formulaire n'envoie pas encore de données : l'envoi sera
          activé lors de la mise en place de l'API. Vous pouvez nous écrire
          directement par e-mail en attendant.
        </p>
        <Button href="/" variant="outline" className={styles.confirmButton}>Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.row2}>
        <div>
          <label htmlFor="c-name" className={styles.label}>Nom</label>
          <input id="c-name" className={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <p className={styles.error}>{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="c-email" className={styles.label}>E-mail</label>
          <input id="c-email" type="email" className={styles.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {errors.email && <p className={styles.error}>{errors.email}</p>}
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor="c-subject" className={styles.label}>Objet</label>
        <input id="c-subject" className={styles.input} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor="c-message" className={styles.label}>Message</label>
        <textarea id="c-message" rows={6} className={styles.input} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        {errors.message && <p className={styles.error}>{errors.message}</p>}
      </div>
      <Button onClick={submit} className={styles.submitButton}>Envoyer le message</Button>
    </div>
  );
}
