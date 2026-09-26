import type { Metadata } from "next";

import SecureDocumentAccess from "@/components/documents/SecureDocumentAccess";
import Container from "@/components/layout/Container";
import SiteAlertTicker from "@/components/layout/SiteAlertTicker";

import styles from "./secure-access.module.scss";

export const metadata: Metadata = {
  title: "Accès sécurisé à un document",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default function SecureDocumentAccessPage({
  params,
}: {
  params: { token: string };
}) {
  return (
    <>
      <SiteAlertTicker />
      <Container className={styles.wrapper}>
        <SecureDocumentAccess token={params.token} />
      </Container>
    </>
  );
}
