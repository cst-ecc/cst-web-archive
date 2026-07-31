import { cn } from "@/lib/utils";
import styles from "./Badge.module.scss";

const toneClass = {
  blue: styles.blue,
  yellow: styles.yellow,
  muted: styles.muted,
} as const;

export default function Badge({
  children,
  tone = "blue",
  className,
}: {
  children: React.ReactNode;
  tone?: "blue" | "yellow" | "muted";
  className?: string;
}) {
  return <span className={cn(styles.badge, toneClass[tone], className)}>{children}</span>;
}
