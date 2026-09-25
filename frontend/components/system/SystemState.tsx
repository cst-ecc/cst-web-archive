import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import styles from "./SystemState.module.scss";

type SystemStateTone = "error" | "maintenance";

export default function SystemState({
  code,
  eyebrow,
  title,
  description,
  actions,
  note,
  tone = "error",
  standalone = false,
}: {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  note?: ReactNode;
  tone?: SystemStateTone;
  standalone?: boolean;
}) {
  return (
    <section
      className={cn(
        styles.shell,
        tone === "maintenance" && styles.maintenance,
        standalone && styles.standalone,
      )}
      aria-labelledby="system-state-title"
    >
      <div className={styles.orbLeft} aria-hidden />
      <div className={styles.orbRight} aria-hidden />

      <div className={styles.card}>
        <div className={styles.accentBar} aria-hidden />

        <div className={styles.brandRow}>
          <img
            src="/logo/logo-original.png"
            alt="ECC — Eglise du Christianisme Céleste"
            className={styles.logo}
          />
          <span className={styles.eyebrow}>{eyebrow}</span>
        </div>

        <div className={styles.content}>
          <div className={styles.codeWrap} aria-hidden>
            <span className={styles.code}>{code}</span>
          </div>

          <div className={styles.copy}>
            <p className={styles.kicker}>
              Église du Christianisme Céleste
            </p>
            <h1 id="system-state-title" className={styles.title}>
              {title}
            </h1>
            <p className={styles.description}>{description}</p>

            {actions ? <div className={styles.actions}>{actions}</div> : null}
            {note ? <div className={styles.note}>{note}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
