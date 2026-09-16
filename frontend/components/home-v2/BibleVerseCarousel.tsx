"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FocusEvent as ReactFocusEvent,
} from "react";

import type { BibleVerse } from "@/lib/home-v2";
import { BIBLE_VERSES } from "@/lib/home-v2";
import { cn } from "@/lib/utils";

import SocialInlineLinks from "../layout/SocialFloatingLinks";

import styles from "./BibleVerseCarousel.module.scss";

type BibleVerseCarouselProps = {
  verses?: BibleVerse[];
  intervalMs?: number;
  variant?: "strip" | "card";
  className?: string;
};

export default function BibleVerseCarousel({
  verses = BIBLE_VERSES,
  intervalMs = 180_000,
  variant = "card",
  className,
}: BibleVerseCarouselProps) {
  const availableVerses = useMemo(
    () =>
      verses.filter(
        (verse) =>
          Boolean(
            verse.text &&
            verse.reference,
          ),
      ),
    [verses],
  );

  const [activeIndex, setActiveIndex] =
    useState(0);

  const [paused, setPaused] =
    useState(false);

  useEffect(() => {
    if (
      availableVerses.length <= 1 ||
      paused
    ) {
      return;
    }

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

    if (reducedMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex(
        (current) =>
          (current + 1) %
          availableVerses.length,
      );
    }, intervalMs);

    return () =>
      window.clearInterval(timer);
  }, [
    availableVerses.length,
    intervalMs,
    paused,
  ]);

  useEffect(() => {
    if (
      activeIndex >=
      availableVerses.length
    ) {
      setActiveIndex(0);
    }
  }, [
    activeIndex,
    availableVerses.length,
  ]);

  if (
    availableVerses.length === 0
  ) {
    return null;
  }

  const verse =
    availableVerses[activeIndex] ??
    availableVerses[0];

  return (
    <figure
      className={cn(
        styles.root,
        styles[variant],
        className,
      )}
      aria-roledescription="carousel"
      aria-label="Versets bibliques"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(
        event: ReactFocusEvent<HTMLElement>,
      ) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget as Node | null,
          )
        ) {
          setPaused(false);
        }
      }}
    >
      <blockquote
        className={styles.quote}
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          className={styles.mark}
          aria-hidden="true"
        >
          “
        </span>

        <p
          key={`${verse.reference}-${activeIndex}`}
        >
          {verse.text}
        </p>

        <cite>
          {verse.reference}
        </cite>
      </blockquote>

      <div className={styles.actions}>
        {availableVerses.length > 1 ? (
          <div
            className={styles.controls}
            aria-label="Choisir un verset"
          >
            {availableVerses.map(
              (item, index) => (
                <button
                  key={`${item.reference}-${index}`}
                  type="button"
                  className={
                    index === activeIndex
                      ? styles.dotActive
                      : styles.dot
                  }
                  onClick={() =>
                    setActiveIndex(index)
                  }
                  aria-label={`Afficher le verset ${index + 1}`}
                  aria-current={
                    index === activeIndex
                      ? "true"
                      : undefined
                  }
                />
              ),
            )}
          </div>
        ) : null}

        {variant === "strip" ? (
          <>
            <span
              className={styles.divider}
              aria-hidden="true"
            />

            <SocialInlineLinks />
          </>
        ) : null}
      </div>
    </figure>
  );
}