import Link from "next/link";
import { BIBLE_VERSES, RESOURCE_GROUPS } from "@/lib/home-v2";
import type { HomeNavigate } from "./homeV2.types";
import PanelFrame from "./PanelFrame";
import PanelIcon from "./PanelIcon";
import styles from "./ResourcesPanel.module.scss";

export default function ResourcesPanel({ onNavigate }: { onNavigate: HomeNavigate }) {
  return (
    <PanelFrame
      hero={{
        eyebrow: "Ressources",
        title: "S’informer, comprendre et vérifier",
        subtitle: "Un accès organisé aux documents, aux travaux, aux actualités et aux outils institutionnels du processus.",
        image: "/images/home/action-reforme.jpg",
        imageAlt: "Ressources et documentation",
      }}
    >
      <div className={styles.grid}>
        {RESOURCE_GROUPS.map((group, groupIndex) => (
          <section key={group.title} className={styles.card} data-tone={groupIndex === 1 ? "gold" : groupIndex === 2 ? "green" : "blue"}>
            <div className={styles.header}>
              <span className={styles.iconCircle}>
                <PanelIcon name={groupIndex === 0 ? "document" : groupIndex === 1 ? "book" : "link"} />
              </span>
              <div><h3>{group.title}</h3><p>{group.intro}</p></div>
            </div>
            <div className={styles.links}>
              {group.items.map((item) => item.external ? (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">
                  <span><strong>{item.label}</strong>{item.description ? <small>{item.description}</small> : null}</span><i>↗</i>
                </a>
              ) : (
                <Link key={item.label} href={item.href}>
                  <span><strong>{item.label}</strong>{item.description ? <small>{item.description}</small> : null}</span><i>→</i>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className={styles.callout}>
        <div>
          <span className={styles.iconCircle}><PanelIcon name="question" /></span>
          <p><strong>Vous cherchez une information précise ?</strong><small>La FAQ répond aux principales questions et la recherche documentaire permet d’aller plus loin.</small></p>
        </div>
        <div>
          <button type="button" onClick={() => onNavigate("faq")}>Consulter la FAQ →</button>
          <Link href="/contact">Nous contacter →</Link>
        </div>
      </div>
    </PanelFrame>
  );
}
