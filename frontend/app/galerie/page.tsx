import type { Metadata } from "next";
import PageHeader from "@/components/layout/PageHeader";
import Container from "@/components/layout/Container";
import Gallery from "@/components/gallery/Gallery";
import { getAlbums } from "@/lib/api";
import styles from "../pages.module.scss";

export const metadata: Metadata = {
  title: "Galerie",
  description: "Photographies des sessions et travaux du Conseil Supérieur de Transition.",
};
export const revalidate = 300;

export default async function GaleriePage() {
  const albums = await getAlbums();
  return (
    <>
      <PageHeader eyebrow="Mémoire visuelle" title="Galerie" subtitle="Images des sessions et moments marquants du processus." />
      <Container className={styles.section}>
        <Gallery albums={albums} />
      </Container>
    </>
  );
}
