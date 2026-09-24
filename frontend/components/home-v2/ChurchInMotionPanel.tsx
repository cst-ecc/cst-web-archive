import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { BIBLE_VERSES, CHURCH_IN_MOTION } from "@/lib/home-v2";
import type { NewsItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { imageNeedsUnoptimized } from "./homeV2.utils";
import PanelFrame from "./PanelFrame";
import PanelIcon from "./PanelIcon";
import SectionHeading from "./SectionHeading";
import TopicCard from "./TopicCard";
import { MotionSection } from "@/components/ui/Motion";
import styles from "./ChurchInMotionPanel.module.scss";

export default function ChurchInMotionPanel({ newsItems }: { newsItems: NewsItem[] }) {
  return (
    <PanelFrame
      hero={{
        eyebrow: "L’Église en marche",
        title: "L’unité prend vie au cœur de nos communautés.",
        subtitle: "Des rencontres, des initiatives, des visages et des outils donnent une réalité concrète à la marche commune.",
        image: "/images/home/categories-main.jpg",
        imageAlt: "La vie de l’Église en mouvement",
      }}
      // verse={BIBLE_VERSES[0]}
    >
      <div className={styles.topicGrid}>
        {CHURCH_IN_MOTION.map((item, index) => (
          <TopicCard
            key={item.title}
            icon={index === 0 ? "book" : index === 1 ? "people" : "globe"}
            title={item.eyebrow}
            text={`${item.title}. ${item.text}`}
            tone={index === 1 ? "gold" : index === 2 ? "green" : "blue"}
            motionDelay={Math.min(index * 0.055, 0.16)}
          />
        ))}
      </div>

      <div className={styles.contentGrid}>
        <MotionSection className={styles.card} hover>
          <SectionHeading
            eyebrow="Histoires et rencontres"
            title="Les derniers temps forts"
            action={<Link href="/actualites">Toutes les actualités →</Link>}
          />
          <div className={styles.storyList}>
            {newsItems.slice(0, 3).map((item) => (
              <Link key={item.id} href={`/actualites/${item.slug}`}>
                <div className={styles.storyThumb}>
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt ?? item.title}
                    fill
                    sizes="7rem"
                    className={styles.coverImage}
                    unoptimized={imageNeedsUnoptimized(item.imageUrl)}
                  />
                </div>
                <span><strong>{item.title}</strong><small>{formatDate(item.date)}</small></span>
                <i>→</i>
              </Link>
            ))}
          </div>
        </MotionSection>

        <MotionSection className={styles.card} delay={0.05} hover>
          <SectionHeading eyebrow="À découvrir" title="Voir l’Église vivre" />
          <div className={styles.linkList}>
            <Link href="/galerie"><PanelIcon name="people" /><span><strong>Galerie</strong><small>Rencontres et temps forts en images</small></span><i>→</i></Link>
            <Link href="/actualites"><PanelIcon name="news" /><span><strong>Actualités</strong><small>Suivre la dynamique en cours</small></span><i>→</i></Link>
            <Link href="/contact"><PanelIcon name="link" /><span><strong>Nous contacter</strong><small>Partager une initiative ou une information</small></span><i>→</i></Link>
          </div>
        </MotionSection>

        <MotionSection className={styles.card} delay={0.1} hover>
          <SectionHeading eyebrow="Modernisation" title="Des outils au service de l’Église" />
          <p className={styles.detailLead}>
            La digitalisation accompagne la connaissance du territoire ecclésial, le recensement et une administration plus structurée.
          </p>
          <a className={styles.largeAction} href={SITE.digitalisationUrl} target="_blank" rel="noopener noreferrer">
            <PanelIcon name="globe" />
            <span><strong>Accéder à DIGECC</strong><small>Plateforme de digitalisation de l’ECC</small></span>
            <i>↗</i>
          </a>
        </MotionSection>
      </div>
    </PanelFrame>
  );
}
