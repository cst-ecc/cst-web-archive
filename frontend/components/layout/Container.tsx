import { cn } from "@/lib/utils";
import styles from "./Container.module.scss";

export default function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(styles.container, className)}>{children}</div>;
}
