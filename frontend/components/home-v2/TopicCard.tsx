import PanelIcon from "./PanelIcon";
import styles from "./TopicCard.module.scss";

type TopicCardProps = {
  icon: string;
  title: string;
  text: string;
  tone?: "blue" | "gold" | "green" | "violet";
  actionLabel?: string;
  onAction?: () => void;
};

export default function TopicCard({
  icon,
  title,
  text,
  tone = "blue",
  actionLabel,
  onAction,
}: TopicCardProps) {
  return (
    <article className={styles.card} data-tone={tone}>
      <span className={styles.icon}>
        <PanelIcon name={icon} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
        {actionLabel && onAction ? (
          <button type="button" className={styles.action} onClick={onAction}>
            {actionLabel} <span aria-hidden>→</span>
          </button>
        ) : null}
      </div>
    </article>
  );
}
