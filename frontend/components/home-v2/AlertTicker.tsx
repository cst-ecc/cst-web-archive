"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from "react";

import type { NewsItem } from "@/lib/types";

import styles from "./AlertTicker.module.scss";

type AlertTickerProps = {
  items: NewsItem[];
};

type TickerSequenceProps = {
  items: NewsItem[];
  duplicate?: boolean;
  repeatCount?: number;
  sequenceRef?: Ref<HTMLDivElement>;
  trailingSeparator?: boolean;
};

const MAX_SUMMARY_LENGTH = 190;
const SEQUENCE_END_GAP = 72;

function normalizeTickerText(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function tickerSummary(value?: string): string {
  const summary = normalizeTickerText(value);
  if (summary.length <= MAX_SUMMARY_LENGTH) return summary;

  const clipped = summary.slice(0, MAX_SUMMARY_LENGTH + 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const end = lastSpace >= 120 ? lastSpace : MAX_SUMMARY_LENGTH;

  return `${summary.slice(0, end).trimEnd()}…`;
}

function TickerSequence({
  items,
  duplicate = false,
  repeatCount = 1,
  sequenceRef,
  trailingSeparator = false,
}: TickerSequenceProps) {
  return (
    <div
      ref={sequenceRef}
      className={`${styles.sequence}${duplicate ? ` ${styles.sequenceDuplicate}` : ""}`}
      aria-hidden={duplicate || undefined}
    >
      <div className={styles.sequenceContent}>
        {Array.from({ length: repeatCount }, (_, copyIndex) => (
          <span
            className={`${styles.sequenceCopy}${copyIndex > 0 ? ` ${styles.fillerCopy}` : ""}`}
            key={`${duplicate ? "duplicate-" : ""}copy-${copyIndex}`}
            aria-hidden={duplicate || copyIndex > 0 || undefined}
          >
            {items.map((item, index) => {
              const hiddenCopy = duplicate || copyIndex > 0;
              const showSeparator = copyIndex > 0 || index > 0;

              return (
                <span
                  className={styles.alertGroup}
                  key={`${duplicate ? "duplicate-" : ""}${copyIndex}-${item.id}-${item.slug}`}
                >
                  {showSeparator ? (
                    <span className={styles.separator} aria-hidden="true">
                      <span className={styles.separatorDot} />
                    </span>
                  ) : null}

                  <span className={styles.alertItem}>
                    <Link
                      href={`/actualites/${item.slug}`}
                      className={styles.alertText}
                      tabIndex={hiddenCopy ? -1 : undefined}
                      aria-label={hiddenCopy ? undefined : `${item.title} : ${tickerSummary(item.excerpt)}`}
                    >
                      <strong className={styles.alertTitle}>{normalizeTickerText(item.title)}</strong>
                      <span className={styles.colon} aria-hidden="true">:</span>
                      <span className={styles.alertSummary}>{tickerSummary(item.excerpt)}</span>
                    </Link>

                    <Link
                      href={`/actualites/${item.slug}`}
                      className={styles.readMore}
                      tabIndex={hiddenCopy ? -1 : undefined}
                      aria-label={hiddenCopy ? undefined : `Lire la suite : ${item.title}`}
                    >
                      <span>Lire la suite</span>
                      <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.arrow}>
                        <path d="M4 10h11M11 6l4 4-4 4" />
                      </svg>
                    </Link>
                  </span>
                </span>
              );
            })}
          </span>
        ))}

        {trailingSeparator ? (
          <span className={`${styles.separator} ${styles.trailingSeparator}`} aria-hidden="true">
            <span className={styles.separatorDot} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function AlertTicker({ items }: AlertTickerProps) {
  const alerts = useMemo(
    () =>
      items.filter(
        (item) =>
          item.homeSlot === "alert_info" &&
          item.status === "publie" &&
          Boolean(normalizeTickerText(item.title)) &&
          Boolean(normalizeTickerText(item.excerpt)),
      ),
    [items],
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef<HTMLDivElement>(null);
  const [singleNeedsMotion, setSingleNeedsMotion] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [sequenceWidth, setSequenceWidth] = useState<number | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = measureRef.current;
    if (!viewport || !content || alerts.length === 0) return;

    const measure = () => {
      const viewportWidth = viewport.clientWidth;
      const contentWidth = content.scrollWidth;

      setSingleNeedsMotion(
        alerts.length === 1 && contentWidth > viewportWidth,
      );

      if (alerts.length > 1 || contentWidth > viewportWidth) {
        const copies = alerts.length > 1 && contentWidth > 0
          ? Math.min(6, Math.max(1, Math.ceil((viewportWidth + SEQUENCE_END_GAP) / contentWidth)))
          : 1;

        setRepeatCount(copies);
      } else {
        setRepeatCount(1);
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);

    return () => observer.disconnect();
  }, [alerts]);

  const shouldAnimate = alerts.length > 1 || singleNeedsMotion;

  useEffect(() => {
    const sequence = sequenceRef.current;

    if (!shouldAnimate || !sequence) {
      setSequenceWidth(null);
      return;
    }

    const measureSequence = () => {
      setSequenceWidth(Math.ceil(sequence.scrollWidth));
    };

    measureSequence();

    const observer = new ResizeObserver(measureSequence);
    observer.observe(sequence);

    return () => observer.disconnect();
  }, [alerts, repeatCount, shouldAnimate]);

  if (alerts.length === 0) {
    return null;
  }

  const animationReady = shouldAnimate && sequenceWidth !== null;
  const totalCharacters = alerts.reduce(
    (total, item) =>
      total + normalizeTickerText(item.title).length + tickerSummary(item.excerpt).length,
    0,
  );
  const durationSeconds = Math.min(
    180,
    Math.max(30, Math.round(totalCharacters * repeatCount * 0.115)),
  );

  const tickerStyle = {
    "--ticker-duration": `${durationSeconds}s`,
    ...(sequenceWidth
      ? { "--ticker-sequence-width": `${sequenceWidth}px` }
      : {}),
  } as CSSProperties;

  return (
    <aside className={styles.shell} aria-label="Dernière INFO">
      <div className={styles.inner}>
        <div className={styles.ticker}>
          <span className={styles.label}>
            <span className={styles.dot} aria-hidden="true" />
            <span>Dernière INFO</span>
          </span>

          <div
            ref={viewportRef}
            className={styles.viewport}
            aria-live="off"
          >
            <div ref={measureRef} className={styles.measureProbe} aria-hidden="true">
              <TickerSequence items={alerts} duplicate />
            </div>

            <div
              className={`${styles.loop}${animationReady ? ` ${styles.loopAnimated}` : ` ${styles.loopStatic}`}`}
              style={tickerStyle}
            >
              <TickerSequence
                items={alerts}
                repeatCount={repeatCount}
                sequenceRef={sequenceRef}
                trailingSeparator={shouldAnimate}
              />

              {shouldAnimate ? (
                <TickerSequence
                  items={alerts}
                  duplicate
                  repeatCount={repeatCount}
                  trailingSeparator
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
