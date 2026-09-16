"use client";

import { useEffect, useState } from "react";
import { FAQ_GROUPS } from "@/lib/faq-data";
import { BIBLE_VERSES } from "@/lib/home-v2";
import PanelFrame from "./PanelFrame";
import PanelIcon from "./PanelIcon";
import SectionHeading from "./SectionHeading";
import styles from "./FAQPanel.module.scss";

export default function FAQPanel() {
  const [groupId, setGroupId] = useState(FAQ_GROUPS[0]?.id ?? "");
  const activeGroup = FAQ_GROUPS.find((group) => group.id === groupId) ?? FAQ_GROUPS[0];
  const [questionNumber, setQuestionNumber] = useState(activeGroup?.items[0]?.number ?? "");

  useEffect(() => {
    if (!activeGroup) return;
    if (!activeGroup.items.some((item) => item.number === questionNumber)) {
      setQuestionNumber(activeGroup.items[0]?.number ?? "");
    }
  }, [activeGroup, questionNumber]);

  const activeQuestion =
    activeGroup?.items.find((item) => item.number === questionNumber) ?? activeGroup?.items[0];

  return (
    <PanelFrame
      hero={{
        eyebrow: "FAQ",
        title: "Vos questions, nos réponses",
        subtitle: "Des réponses structurées pour comprendre la démarche, les organes, la gouvernance et la place de chacun dans le processus.",
        image: "/images/home/categories-main.jpg",
        imageAlt: "Questions fréquentes sur la réunification",
      }}
    >
      <div className={styles.explorer}>
        <section className={styles.column}>
          <SectionHeading eyebrow="Thèmes" title="Explorer la FAQ" />
          <div className={styles.list}>
            {FAQ_GROUPS.map((group, index) => (
              <button
                key={group.id}
                type="button"
                className={group.id === activeGroup?.id ? styles.activeItem : styles.item}
                onClick={() => {
                  setGroupId(group.id);
                  setQuestionNumber(group.items[0]?.number ?? "");
                }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{group.title}</strong>
                <i>→</i>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.column}>
          <SectionHeading eyebrow={activeGroup?.title ?? "FAQ"} title="Questions" />
          <div className={styles.list}>
            {activeGroup?.items.map((item) => (
              <button
                key={item.number}
                type="button"
                className={item.number === activeQuestion?.number ? styles.activeItem : styles.item}
                onClick={() => setQuestionNumber(item.number)}
              >
                <span>{item.number}</span>
                <strong>{item.question}</strong>
                <i>→</i>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.answer} aria-live="polite">
          {activeQuestion ? (
            <>
              <div className={styles.answerTitle}>
                <span>{activeQuestion.number}</span>
                <h3>{activeQuestion.question}</h3>
              </div>
              <div className={styles.answerText}>
                {activeQuestion.answer.slice(0, 2).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <div className={styles.takeaway}>
                <span className={styles.iconCircle}><PanelIcon name="check" /></span>
                <p><small>À retenir</small><strong>{activeQuestion.takeaway}</strong></p>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </PanelFrame>
  );
}
