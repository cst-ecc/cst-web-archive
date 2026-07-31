"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Apparition douce au défilement. Framer Motion respecte automatiquement
 * `prefers-reduced-motion` lorsque l'option est activée sur l'OS.
 */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
