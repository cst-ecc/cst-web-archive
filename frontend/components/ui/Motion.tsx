"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { AriaRole, ReactNode } from "react";

type RevealBaseProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
};

type MotionArticleProps = RevealBaseProps & {
  dataTone?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
};

type MotionSectionProps = RevealBaseProps & {
  ariaLabel?: string;
  ariaLabelledby?: string;
  dataTone?: string;
};

type MotionDivProps = RevealBaseProps & {
  role?: AriaRole;
};

const VIEWPORT = {
  once: true,
  amount: 0.16,
  margin: "0px 0px -48px 0px",
} as const;

function useRevealMotion(delay: number, hover: boolean) {
  const reducedMotion = useReducedMotion();

  return {
    initial: reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: VIEWPORT,
    transition: {
      duration: reducedMotion ? 0 : 0.44,
      delay: reducedMotion ? 0 : Math.max(0, delay),
      ease: "easeOut" as const,
    },
    whileHover:
      hover && !reducedMotion
        ? {
            y: -3,
            transition: { duration: 0.18, ease: "easeOut" as const },
          }
        : undefined,
  };
}

/**
 * Apparition douce au défilement pour les blocs éditoriaux.
 * Les déplacements sont supprimés lorsque l'utilisateur préfère
 * réduire les animations.
 */
export function FadeIn({
  children,
  delay = 0,
  className,
}: Omit<RevealBaseProps, "hover">) {
  const motionProps = useRevealMotion(delay, false);

  return (
    <motion.div className={className} {...motionProps}>
      {children}
    </motion.div>
  );
}

/** Carte sémantique animée, utilisée par les cards partagées du site. */
export function MotionArticle({
  children,
  className,
  delay = 0,
  hover = true,
  dataTone,
  ariaLabel,
  ariaLabelledby,
}: MotionArticleProps) {
  const motionProps = useRevealMotion(delay, hover);

  return (
    <motion.article
      className={className}
      data-tone={dataTone}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      {...motionProps}
    >
      {children}
    </motion.article>
  );
}

/** Section animée sans modifier la structure sémantique existante. */
export function MotionSection({
  children,
  className,
  delay = 0,
  hover = false,
  ariaLabel,
  ariaLabelledby,
  dataTone,
}: MotionSectionProps) {
  const motionProps = useRevealMotion(delay, hover);

  return (
    <motion.section
      className={className}
      data-tone={dataTone}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      {...motionProps}
    >
      {children}
    </motion.section>
  );
}


/** Variante aside pour conserver la sémantique des encadrés complémentaires. */
export function MotionAside({
  children,
  className,
  delay = 0,
  hover = false,
  ariaLabel,
  ariaLabelledby,
}: MotionSectionProps) {
  const motionProps = useRevealMotion(delay, hover);

  return (
    <motion.aside
      className={className}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      {...motionProps}
    >
      {children}
    </motion.aside>
  );
}

/** Bloc générique animé pour les nœuds et panneaux non sémantiques. */
export function MotionDiv({
  children,
  className,
  delay = 0,
  hover = false,
  role,
}: MotionDivProps) {
  const motionProps = useRevealMotion(delay, hover);

  return (
    <motion.div className={className} role={role} {...motionProps}>
      {children}
    </motion.div>
  );
}
