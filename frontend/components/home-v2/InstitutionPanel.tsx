import Link from "next/link";
import { SITE } from "@/lib/constants";
import {
  BIBLE_VERSES,
  CSMO_APPROACH,
  CSMO_SUMMARY,
  CSMO_WORKSTREAMS,
  CST_MILESTONES,
  CST_SUMMARY,
} from "@/lib/home-v2";
import type { NewsItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import PanelFrame from "./PanelFrame";
import PanelIcon from "./PanelIcon";
import SectionHeading from "./SectionHeading";
import TopicCard from "./TopicCard";
import styles from "./InstitutionPanel.module.scss";

type InstitutionPanelProps = {
  type: "cst" | "csmo";
  newsItems: NewsItem[];
};

export default function InstitutionPanel({ type, newsItems }: InstitutionPanelProps) {
  const isCst = type === "cst";
  const summary = isCst ? CST_SUMMARY : CSMO_SUMMARY;
  const latest = newsItems.slice(0, 3);

  return (
    <PanelFrame
      hero={{
        eyebrow: isCst ? "Le Conseil Supérieur de Transition" : "Le Conseil Supérieur de Mise en Œuvre",
        title: isCst
          ? "La transition au service d’un cadre commun"
          : "Conduire la mise en œuvre pour une Église réunifiée",
        subtitle: isCst
          ? "Le Conseil Supérieur de Transition a structuré le dialogue, consolidé les textes et préparé le passage vers une nouvelle étape institutionnelle."
          : "Le Conseil Supérieur de Mise en Œuvre accompagne l’appropriation des orientations, leur déploiement et la préparation progressive des institutions définitives.",
        image: isCst ? "/images/home/hero-cst.jpg" : "/images/home/hero-csmo.jpg",
        imageAlt: isCst ? "Conseil Supérieur de Transition" : "Conseil Supérieur de Mise en Œuvre",
      }}      
      sideImage={{
        src: isCst ? "/logo/logo-cst-blanc.png" : "/logo/logo-csmo-blanc.png",
        alt: isCst ? "Logo du cst" : "Logo du csmo",
      }}
      // verse={isCst ? BIBLE_VERSES[0] : BIBLE_VERSES[2]}
    >
      <div className={styles.topicGrid}>
        {summary.map((item, index) => (
          <TopicCard
            key={item.title}
            icon={item.icon}
            title={item.title}
            text={item.text}
            tone={index === 1 ? "gold" : index === 2 ? "green" : index === 3 ? "violet" : "blue"}
          />
        ))}
      </div>

      {isCst ? (
        <div className={styles.details}>
          <section className={styles.card}>
            <SectionHeading eyebrow="Repères" title="Les grandes étapes" />
            <ol className={styles.milestones}>
              {CST_MILESTONES.map((item, index) => (
                <li key={item.label}>
                  <span>{index + 1}</span>
                  <div><strong>{item.label}</strong><small>{item.value}</small></div>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.card}>
            <SectionHeading eyebrow="Le Conseil" title="Connaître le CST" />
            <div className={styles.linkList}>
              <Link href="/membres"><PanelIcon name="people" /><span><strong>Les membres</strong><small>Composition du Conseil</small></span><i>→</i></Link>
              <Link href="/sessions"><PanelIcon name="chart" /><span><strong>Les sessions</strong><small>Dates, thèmes et travaux</small></span><i>→</i></Link>
              <Link href="/rapports"><PanelIcon name="document" /><span><strong>Le rapport final</strong><small>Synthèse et conclusions</small></span><i>→</i></Link>
            </div>
          </section>

          <section className={styles.card}>
            <SectionHeading eyebrow="Ressources" title="Approfondir" />
            <div className={styles.linkList}>
              <Link href="/presentation"><PanelIcon name="target" /><span><strong>Présentation</strong><small>Mission, vision et rôle</small></span><i>→</i></Link>
              <Link href="/decisions"><PanelIcon name="check" /><span><strong>Décisions</strong><small>Actes officiels publiés</small></span><i>→</i></Link>
              <Link href="/documents"><PanelIcon name="book" /><span><strong>Documents</strong><small>Bibliothèque documentaire</small></span><i>→</i></Link>
            </div>
          </section>
        </div>
      ) : (
        <div className={styles.details}>
          <section className={styles.card}>
            <SectionHeading eyebrow="Priorités" title="Les chantiers" />
            <ol className={styles.workstreams}>
              {CSMO_WORKSTREAMS.map((item, index) => (
                <li key={item}><span>{index + 1}</span><strong>{item}</strong></li>
              ))}
            </ol>
          </section>

          <section className={styles.card}>
            <SectionHeading eyebrow="Méthode" title="Notre approche" />
            <div className={styles.approach}>
              {CSMO_APPROACH.map((item, index) => (
                <div key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p><strong>{item.title}</strong><small>{item.text}</small></p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <SectionHeading
              eyebrow="Suivre"
              title="Actualités du processus"
              action={<Link href="/actualites">Tout voir →</Link>}
            />
            <div className={styles.newsList}>
              {latest.map((item) => (
                <Link key={item.id} href={`/actualites/${item.slug}`}>
                  <strong>{item.title}</strong>
                  <small>{formatDate(item.date)}</small>
                  <i>→</i>
                </Link>
              ))}
            </div>
            <a className={styles.digitalCallout} href={SITE.digitalisationUrl} target="_blank" rel="noopener noreferrer">
              <PanelIcon name="globe" />
              <span><strong>DIGECC</strong><small>Digitalisation, recensement et cartographie</small></span>
              <i>↗</i>
            </a>
          </section>
        </div>
      )}
    </PanelFrame>
  );
}
