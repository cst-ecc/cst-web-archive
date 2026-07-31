import Link from "next/link";
import { cn } from "@/lib/utils";
import styles from "./Button.module.scss";

type Variant = "solid" | "outline" | "ghost" | "yellow";

const variantClass: Record<Variant, string> = {
  solid: styles.solid,
  outline: styles.outline,
  ghost: styles.ghost,
  yellow: styles.yellow,
};

type BaseProps = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  /** Si fourni, le bouton est rendu comme un lien. */
  href?: string;
  /** Passé à l'ancre de téléchargement le cas échéant. */
  download?: boolean | string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  "aria-label"?: string;
};

export default function Button({
  variant = "solid",
  className,
  children,
  href,
  download,
  onClick,
  type = "button",
  disabled,
  ...rest
}: BaseProps) {
  const classes = cn(styles.base, variantClass[variant], className);

  if (href) {
    const isExternal = href.startsWith("http");
    if (isExternal) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} download={download} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  );
}
