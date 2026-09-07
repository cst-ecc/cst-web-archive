"use client";

import { useState } from "react";
import type { FAQGroup } from "@/lib/faq-data";
import styles from "./FAQSection.module.scss";

export default function FAQAccordion({ groups }: { groups: FAQGroup[] }) {
  const [openItem, setOpenItem] = useState<string | null>("03");

  return (
    <div className={styles.grid}>
      {groups.map((group, groupIndex) => (
        <article key={group.id} className={styles.groupCard}>
          <div className={styles.groupHeader}>
            <span className={styles.groupNumber}>{String(groupIndex + 1).padStart(2, "0")}</span>
            <div>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <p className={styles.groupSubtitle}>{group.subtitle}</p>
            </div>
          </div>

          <div className={styles.questions}>
            {group.items.map((item) => {
              const isOpen = openItem === item.number;
              const panelId = `faq-panel-${item.number}`;
              const buttonId = `faq-button-${item.number}`;

              return (
                <div key={item.number} className={`${styles.question} ${isOpen ? styles.questionOpen : ""}`}>
                  <button
                    id={buttonId}
                    type="button"
                    className={styles.questionButton}
                    onClick={() => setOpenItem(isOpen ? null : item.number)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span className={styles.questionNumber}>{item.number}</span>
                    <span className={styles.questionText}>{item.question}</span>
                    <span className={styles.icon} aria-hidden>{isOpen ? "−" : "+"}</span>
                  </button>

                  <div
                    id={panelId}
                    className={`${styles.answerWrap} ${isOpen ? styles.answerWrapOpen : ""}`}
                    role="region"
                    aria-labelledby={buttonId}
                  >
                    <div className={styles.answerInner}>
                      <div className={styles.answerBody}>
                        {item.answer.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                        <div className={styles.takeaway}>
                          <span>À retenir</span>
                          <strong>{item.takeaway}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}
