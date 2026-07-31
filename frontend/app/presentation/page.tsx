import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import Container from "@/components/layout/Container";
import { SITE } from "@/lib/constants";
import styles from "../pages.module.scss";

export const metadata: Metadata = {
  title: "Présentation",
  description: "Présentation, mission, vision et objectifs du Conseil Supérieur de Transition de l'Église du Christianisme Céleste.",
};

const missions = [
  {
    title: "Réunification",
    text: "Restaurer durablement l'unité de l'Église, rapprocher les instances et renforcer la cohésion institutionnelle entre les diocèses.",
  },
  {
    title: "Réforme",
    text: "Relire, actualiser et consolider la Constitution et le Règlement intérieur. Moderniser la gouvernance et l'administration.",
  },
  {
    title: "Dialogue",
    text: "Constituer un cadre de concertation réunissant hauts dignitaires, responsables ecclésiaux et personnes ressources du Bénin et des diocèses internationaux.",
  },
  {
    title: "Transparence",
    text: "Renforcer la discipline, la reddition de comptes et rendre accessibles les décisions, rapports et textes du Conseil.",
  },
];

const vision = [
  "Une Église une et indivisible",
  "Réconciliée autour de son identité spirituelle et historique",
  "Organisée autour d'institutions clairement définies",
  "Gouvernée dans le respect de la Constitution et du Règlement intérieur",
  "Dotée d'une administration moderne, transparente et responsable",
  "Capable de coordonner efficacement ses diocèses dans le monde",
];

export default function PresentationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Institution"
        title="Le Conseil Supérieur de Transition"
        subtitle={`Organe de transition de l'${SITE.institution}`}
      />
      <Container className={styles.section}>
        <div className={styles.prose}>
          <p>
            Le <strong>Conseil Supérieur de Transition (CST)</strong> est l'organe
            mis en place pour conduire le processus de transition, de réunification
            et de réorganisation institutionnelle de l'Église du Christianisme
            Céleste (ECC).
          </p>
          <p>
            Le processus ayant conduit à sa création a été formalisé par un
            procès-verbal en date du <strong>26 mars 2025</strong>. Le CST a
            ensuite été officiellement installé à Cotonou le{" "}
            <strong>26 avril 2025</strong>, sous la facilitation du Président de
            la République du Bénin. Le démarrage effectif de ses activités est
            intervenu le <strong>8 mai 2025</strong>.
          </p>
          <p>
            Son action s'inscrit dans une perspective précise : restaurer
            durablement l'unité de l'Église, actualiser ses textes fondamentaux,
            moderniser sa gouvernance et préparer la mise en place d'institutions
            communes, légitimes et fonctionnelles.
          </p>
        </div>

        {/* Missions */}
        <div className={styles.grid2} style={{ marginTop: "3rem" }}>
          {missions.map((m) => (
            <div key={m.title} className={styles.missionCard}>
              <div className={styles.missionRule} />
              <h2 className={styles.missionTitle}>{m.title}</h2>
              <p className={styles.missionText}>{m.text}</p>
            </div>
          ))}
        </div>

        {/* Vision */}
        <div style={{ marginTop: "3rem" }}>
          <h2 className={styles.missionTitle} style={{ marginBottom: "1rem" }}>
            Vision
          </h2>
          <div className={styles.prose}>
            <p>La vision portée par le CST est celle d'une Église :</p>
            <ul style={{ marginTop: "0.75rem", paddingLeft: "1.25rem", listStyle: "disc" }}>
              {vision.map((v) => (
                <li key={v} style={{ marginBottom: "0.375rem" }}>{v}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Motto */}
        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          <p style={{
            fontStyle: "italic",
            fontSize: "1.125rem",
            color: "#12547F",
            fontWeight: 500,
          }}>
            « {SITE.motto} »
          </p>
        </div>
      </Container>
    </>
  );
}
