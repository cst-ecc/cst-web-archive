"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import styles from "./Hero.module.scss";

const SLIDES = [
  {
    eyebrow: "La grande marche vers l’unité",
    title: "CST & CSMO — de la transition à la mise en œuvre",
    lead:
      "Une même dynamique au service de l’unité, de la gouvernance et de l’avenir de l’Église du Christianisme Céleste.",
    primary: { label: "Comprendre le processus", href: "#processus" },
    secondary: { label: "Découvrir le CST", href: "/presentation" },
    tone: "unity",
  },
  {
    eyebrow: "Conseil Supérieur de Transition",
    title: "Préparer le cadre de la réunification",
    lead:
      "Dialogue, harmonisation, consolidation des textes et préparation d’une gouvernance commune : le CST a conduit la phase de transition.",
    primary: { label: "Découvrir le CST", href: "/presentation" },
    secondary: { label: "Voir le passage à la mise en œuvre", href: "#processus" },
    tone: "cst",
  },
  {
    eyebrow: "Conseil Supérieur de Mise en Œuvre",
    title: "Transformer les orientations en actions",
    lead:
      "Le CSMO accompagne désormais la mise en œuvre, l’appropriation des orientations retenues et la préparation progressive des institutions définitives.",
    primary: { label: "Comprendre le CSMO", href: "#processus" },
    secondary: { label: "Voir la digitalisation", href: "#digitalisation" },
    tone: "csmo",
  },
] as const;

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
      setActive((current) => (current + 1) % SLIDES.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [userPaused, interactionPaused, reducedMotion]);

  const slide = SLIDES[active];

  const goTo = (index: number) => setActive(index);
  const previous = () => setActive((active - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setActive((active + 1) % SLIDES.length);

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
      <div className={styles.overlay} aria-hidden />
      <div className={styles.glow} aria-hidden />

      <Container className={styles.inner}>
        <div key={active} className={styles.slideContent} aria-live="polite">
          <span className={styles.institution}>{slide.eyebrow}</span>
          <h1 className={styles.title}>{slide.title}</h1>
          <p className={styles.lead}>{slide.lead}</p>
          <div className={styles.actions}>
            <Button href={slide.primary.href} variant="yellow">
              {slide.primary.label}
            </Button>
            <Button href={slide.secondary.href} variant="outline" className={styles.outlineLight}>
              {slide.secondary.label}
            </Button>
          </div>
        </div>
      </Container>

      <div className={styles.controls}>
        <button type="button" className={styles.arrow} onClick={previous} aria-label="Diapositive précédente">
          <span aria-hidden>←</span>
        </button>

        <div className={styles.dots} aria-label="Choisir une diapositive">
          {SLIDES.map((item, index) => (
            <button
              key={item.eyebrow}
              type="button"
              className={`${styles.dot} ${index === active ? styles.dotActive : ""}`}
              onClick={() => goTo(index)}
              aria-label={`Afficher la diapositive ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
            />
          ))}
        </div>

        <button type="button" className={styles.arrow} onClick={next} aria-label="Diapositive suivante">
          <span aria-hidden>→</span>
        </button>

        <button
          type="button"
          className={styles.pause}
          onClick={() => setUserPaused((value) => !value)}
          aria-label={userPaused ? "Reprendre le défilement automatique" : "Mettre le carousel en pause"}
        >
          {userPaused ? "Lecture" : "Pause"}
        </button>
      </div>
    </section>
  );
}
