"use client";

import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

import styles from "./BackButton.module.scss";

export default function BackButton({
  fallbackHref,
  label = "Retour",
  className,
}: {
  fallbackHref: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  const handleBack = () => {
    let hasInternalReferrer = false;

    if (document.referrer) {
      try {
        hasInternalReferrer =
          new URL(document.referrer).origin === window.location.origin;
      } catch {
        hasInternalReferrer = false;
      }
    }

    if (hasInternalReferrer && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      className={cn(styles.button, className)}
      onClick={handleBack}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M15 18l-6-6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
