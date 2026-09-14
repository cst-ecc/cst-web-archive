"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import { HERO_SLIDES } from "@/lib/home";
import { isDjangoMediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/utils";
import type { NewsItem } from "@/lib/types";
import styles from "./Hero.module.scss";

type HeroProps = {
  newsItems?: NewsItem[];
};

type HeroSlide = {
  key: string;
  backgroundImage: string;
  backgroundAlt: string;
  eyebrow: string;
  title: string;
  lead: string;
  date?: string;
  tone: string;
  primary: {
    href: string;
    label: string;
  };
  secondary: {
    href: string;
    label: string;
  };
};

const FALLBACK_BACKGROUND_IMAGE =
  HERO_SLIDES[0]?.backgroundImage ?? "/og-image.svg";

function shouldBypassImageOptimization(src: string) {
  return isDjangoMediaUrl(src) || src.toLowerCase().endsWith(".svg");
}

function buildNewsSlide(item: NewsItem, index: number): HeroSlide {
  const fallbackSlide = HERO_SLIDES[index % HERO_SLIDES.length] ?? HERO_SLIDES[0];

  return {
    key: `news-${item.slug || item.id}`,
    backgroundImage:
      item.imageUrl || fallbackSlide?.backgroundImage || FALLBACK_BACKGROUND_IMAGE,
    backgroundAlt: item.imageAlt ?? item.title,
    eyebrow: item.featured ? "Actualité à la une" : "Actualité",
    title: item.title,
    lead: item.excerpt,
    date: item.date,
    tone: fallbackSlide?.tone ?? HERO_SLIDES[0]?.tone ?? "blue",
    primary: {
      href: `/actualites/${item.slug}`,
      label: "Lire la suite",
    },
    secondary: {
      href: "/actualites",
      label: "Toutes les actualités",
    },
  };
}

function buildFallbackSlide(
  item: (typeof HERO_SLIDES)[number],
  index: number,
): HeroSlide {
  return {
    key: `fallback-${item.eyebrow}-${index}`,
    backgroundImage: item.backgroundImage || FALLBACK_BACKGROUND_IMAGE,
    backgroundAlt: "",
    eyebrow: item.eyebrow,
    title: item.title,
    lead: item.lead,
    tone: item.tone,
    primary: item.primary,
    secondary: item.secondary,
  };
}

export default function Hero({ newsItems = [] }: HeroProps) {
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const slides = useMemo(() => {
    const newsSlides = newsItems
      .filter((item) => Boolean(item.slug && item.title))
      .slice(0, 3)
      .map((item, index) => buildNewsSlide(item, index));

    if (newsSlides.length > 0) {
      return newsSlides;
    }

    return HERO_SLIDES.map((item, index) => buildFallbackSlide(item, index));
  }, [newsItems]);

  useEffect(() => {
    setActive((current) =>
      slides.length === 0 ? 0 : Math.min(current, slides.length - 1),
    );
  }, [slides.length]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (
      slides.length <= 1 ||
      userPaused ||
      interactionPaused ||
      reducedMotion
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [slides.length, userPaused, interactionPaused, reducedMotion]);

  if (slides.length === 0) {
    return null;
  }

  const slide = slides[Math.min(active, slides.length - 1)];

  const goTo = (index: number) => setActive(index);
  const previous = () =>
    setActive((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setActive((current) => (current + 1) % slides.length);

  return (
    <section
      className={styles.hero}
      data-tone={slide.tone}
      role="region"
      aria-roledescription="carousel"
      aria-label="Actualités importantes du processus CST et CSMO"
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setInteractionPaused(false);
        }
      }}
    >
      <div className={styles.backgrounds} aria-hidden="true">
        {slides.map((item, index) => (
          <Image
            key={item.key}
            src={item.backgroundImage}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className={`${styles.backgroundImage} ${
              index === active ? styles.backgroundImageActive : ""
            }`}
            unoptimized={shouldBypassImageOptimization(item.backgroundImage)}
          />
        ))}
      </div>

      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <Container className={styles.inner}>
        <div
          key={slide.key}
          className={styles.slideContent}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className={styles.institution}>
            {slide.eyebrow}
            {slide.date ? (
              <>
                <span aria-hidden="true"> • </span>
                <time dateTime={slide.date}>{formatDate(slide.date)}</time>
              </>
            ) : null}
          </span>
          <h1 className={styles.title}>{slide.title}</h1>
          <p className={styles.lead}>{slide.lead}</p>
          <div className={styles.actions}>
            <Button href={slide.primary.href} variant="yellow">
              {slide.primary.label}
            </Button>
            <Button
              href={slide.secondary.href}
              variant="outline"
              className={styles.outlineLight}
            >
              {slide.secondary.label}
            </Button>
          </div>
        </div>
      </Container>

      {slides.length > 1 && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.arrow}
            onClick={previous}
            aria-label="Actualité précédente"
          >
            <span aria-hidden>←</span>
          </button>

          <div className={styles.dots} aria-label="Choisir une actualité">
            {slides.map((item, index) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.dot} ${
                  index === active ? styles.dotActive : ""
                }`}
                onClick={() => goTo(index)}
                aria-label={`Afficher l’actualité ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
              />
            ))}
          </div>

          <button
            type="button"
            className={styles.arrow}
            onClick={next}
            aria-label="Actualité suivante"
          >
            <span aria-hidden>→</span>
          </button>

          <button
            type="button"
            className={styles.pause}
            onClick={() => setUserPaused((value) => !value)}
            aria-label={
              userPaused
                ? "Reprendre le défilement automatique"
                : "Mettre le carousel en pause"
            }
          >
            {userPaused ? "Lecture" : "Pause"}
          </button>
        </div>
      )}
    </section>
  );
}
