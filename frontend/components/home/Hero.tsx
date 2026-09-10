"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import { HERO_SLIDES } from "@/lib/home";
import styles from "./Hero.module.scss";

export default function Hero() {
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (userPaused || interactionPaused || reducedMotion) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % HERO_SLIDES.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [userPaused, interactionPaused, reducedMotion]);

  const slide = HERO_SLIDES[active];

  const goTo = (index: number) => setActive(index);
  const previous = () =>
    setActive((current) =>
      (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
    );
  const next = () =>
    setActive((current) => (current + 1) % HERO_SLIDES.length);

  return (
    <section
      className={styles.hero}
      data-tone={slide.tone}
      role="region"
      aria-roledescription="carousel"
      aria-label="Présentation du processus CST et CSMO"
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
        {HERO_SLIDES.map((item, index) => (
          <Image
            key={item.backgroundImage}
            src={item.backgroundImage}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className={`${styles.backgroundImage} ${
              index === active ? styles.backgroundImageActive : ""
            }`}
          />
        ))}
      </div>

      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <Container className={styles.inner}>
        <div
          key={active}
          className={styles.slideContent}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className={styles.institution}>{slide.eyebrow}</span>
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

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          onClick={previous}
          aria-label="Diapositive précédente"
        >
          <span aria-hidden>←</span>
        </button>

        <div className={styles.dots} aria-label="Choisir une diapositive">
          {HERO_SLIDES.map((item, index) => (
            <button
              key={item.eyebrow}
              type="button"
              className={`${styles.dot} ${
                index === active ? styles.dotActive : ""
              }`}
              onClick={() => goTo(index)}
              aria-label={`Afficher la diapositive ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.arrow}
          onClick={next}
          aria-label="Diapositive suivante"
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
    </section>
  );
}
