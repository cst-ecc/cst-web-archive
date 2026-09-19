import Image from "next/image";

import Button from "@/components/ui/Button";

import styles from "./LeadershipMessageCard.module.scss";

export type LeadershipMessage = {
  image: string;
  imageAlt: string;
  title: string;
  role?: string;
  text: string;
  excerpt?: string;
  href?: string;
};

export default function LeadershipMessageCard({
  message,
}: {
  message: LeadershipMessage;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={message.image}
          alt={message.imageAlt}
          fill
          sizes="(max-width: 1023px) 100vw, 16rem"
          className={styles.image}
        />
      </div>

      <div className={styles.content}>
        <h3>{message.title}</h3>

        {message.role ? (
          <p className={styles.role}>{message.role}</p>
        ) : null}

        <blockquote className={styles.quote}>
          {message.excerpt ?? message.text}
        </blockquote>

        {message.href ? (
          <Button
            href={message.href}
            variant="ghost"
            className={styles.readMore}
          >
            Lire la suite <span aria-hidden="true">→</span>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
