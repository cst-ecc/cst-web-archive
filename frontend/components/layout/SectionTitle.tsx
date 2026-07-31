import Link from "next/link";
import { cn } from "@/lib/utils";
import styles from "./SectionTitle.module.scss";

/** Titre de section institutionnel : eyebrow + titre + filet CST. */
export default function SectionTitle({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn(styles.wrapper, className)}>
      <div>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.rule} />
      </div>
      {action && (
        <Link href={action.href} className={styles.action}>
          {action.label} →
        </Link>
      )}
    </div>
  );
}
