import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import CookieSettingsButton from "@/components/cookies/CookieSettingsButton";
import { COOKIE_POLICY_VERSION } from "@/lib/cookies";
import styles from "./policy.module.scss";

export const metadata: Metadata = {
  title: "Politique de cookies",
  description: "Informations sur les cookies et contenus externes utilisés sur le site CST / CSMo ECC.",
};

export default function CookiePolicyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Confidentialité"
        title="Politique de cookies"
        subtitle="Comprendre ce qui est utilisé sur le site et modifier votre choix à tout moment."
      />
      <Container className={styles.wrapper}>
        <article className={styles.content}>
          <section>
            <h2>Principe</h2>
            <p>
              Le site limite l’usage des cookies aux besoins réellement présents. Les fonctions nécessaires restent disponibles sans consentement. Les contenus provenant de services externes ne sont chargés qu’après votre accord.
            </p>
          </section>

          <section>
            <h2>Catégories actuellement utilisées</h2>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Catégorie</th><th>Finalité</th><th>Durée</th><th>Source</th></tr></thead>
                <tbody>
                  <tr>
                    <td><strong>Nécessaires</strong></td>
                    <td>Mémoriser votre choix de consentement et permettre les fonctions de sécurité indispensables.</td>
                    <td>Jusqu’à 6 mois pour le choix de consentement ; durée technique variable pour les cookies de sécurité.</td>
                    <td>Site CST / CSMo ECC</td>
                  </tr>
                  <tr>
                    <td><strong>Contenus externes</strong></td>
                    <td>Autoriser l’affichage d’un lecteur intégré provenant de YouTube. Le service externe n’est pas chargé avant consentement.</td>
                    <td>Selon le service externe après activation.</td>
                    <td>YouTube</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>Mesure d’audience et marketing</h2>
            <p>
              Cette version du site ne charge actuellement ni outil de mesure d’audience, ni pixel marketing. Ces catégories ne sont donc pas proposées artificiellement dans le panneau de consentement.
            </p>
          </section>

          <section>
            <h2>Modifier votre choix</h2>
            <p>
              Vous pouvez rouvrir le panneau de préférences à tout moment. Une nouvelle version de la politique peut entraîner une nouvelle demande de consentement.
            </p>
            <div className={styles.settings}><CookieSettingsButton /></div>
          </section>

          <p className={styles.version}>Version de la politique de consentement : {COOKIE_POLICY_VERSION}</p>
        </article>
      </Container>
    </>
  );
}
