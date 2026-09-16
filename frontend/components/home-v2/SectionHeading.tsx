import type { ReactNode } from "react";
import styles from "./SectionHeading.module.scss";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  action?: ReactNode;
};

export default function SectionHeading({ eyebrow, title, action }: SectionHeadingProps) {
  return (
    <div className={styles.heading}>
      <div>
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </div>
      {action}
    </div>
  );
}
