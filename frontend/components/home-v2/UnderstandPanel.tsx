import { BIBLE_VERSES, UNDERSTAND_STEPS, UNDERSTAND_TOPICS } from "@/lib/home-v2";
import type { HomeNavigate } from "./homeV2.types";
import PanelFrame from "./PanelFrame";
import SectionHeading from "./SectionHeading";
import TopicCard from "./TopicCard";
import styles from "./UnderstandPanel.module.scss";

export default function UnderstandPanel({ onNavigate }: { onNavigate: HomeNavigate }) {
  return (
    <PanelFrame
      hero={{
        eyebrow: "Comprendre",
        title: "Comprendre la réunification",
        subtitle: "Des repères simples pour comprendre la démarche, distinguer les rôles et avancer ensemble.",
        image: "/images/home/action-reunion.jpg",
        imageAlt: "Comprendre la démarche d’unité",
      }}
    >
      <div className={styles.topicGrid}>
        {UNDERSTAND_TOPICS.map((item, index) => (
          <TopicCard
            key={item.title}
            icon={item.icon}
            title={item.title}
            text={item.text}
            tone={index === 1 ? "green" : index === 3 ? "gold" : "blue"}
            actionLabel={index === 3 ? "Voir les questions" : undefined}
            onAction={index === 3 ? () => onNavigate("faq") : undefined}
          />
        ))}
      </div>

      <section className={styles.flow}>
        <SectionHeading
          eyebrow="Le fil conducteur"
          title="Du dialogue à la mise en œuvre"
          action={
            <button type="button" onClick={() => onNavigate("avancement")}>
              Voir l’avancement →
            </button>
          }
        />
        <div className={styles.steps}>
          {UNDERSTAND_STEPS.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>
              <div>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PanelFrame>
  );
}
