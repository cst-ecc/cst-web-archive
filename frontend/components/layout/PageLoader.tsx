"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./PageLoader.module.scss";
import { cn } from "@/lib/utils";

/**
 * Barre de chargement animée lors des changements de page.
 * Inspirée de NProgress, sans dépendance externe.
 */
export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Démarre la barre
    setLoading(true);
    setWidth(30);

    const t1 = setTimeout(() => setWidth(60), 100);
    const t2 = setTimeout(() => setWidth(80), 300);
    const t3 = setTimeout(() => {
      setWidth(100);
      setTimeout(() => {
        setLoading(false);
        setWidth(0);
      }, 200);
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  if (!loading && width === 0) return null;

  return (
    <div
      className={cn(styles.bar, width < 100 && styles.pulse)}
      style={{ width: `${width}%` }}
      role="progressbar"
      aria-valuenow={width}
    />
  );
}
