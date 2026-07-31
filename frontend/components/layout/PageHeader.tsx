import Container from "./Container";
import styles from "./PageHeader.module.scss";

/** Bandeau d'en-tête des pages internes. */
export default function PageHeader({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <header className={styles.header}>
      <div aria-hidden className={styles.grid} />
      <Container className={styles.inner}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </Container>
      <div className={styles.rule} />
    </header>
  );
}
