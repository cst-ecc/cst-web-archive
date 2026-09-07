import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.scss";
import { SITE } from "@/lib/constants";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageLoader from "@/components/layout/PageLoader";
import styles from "./layout.module.scss";

const display = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "CST",
    "CSMO",
    "Conseil Supérieur de Transition",
    "Conseil Supérieur de Mise en Œuvre",
    "Église du Christianisme Céleste",
    "Grande Marche vers l'Unité",
    "réunification",
    "mise en œuvre",
    "gouvernance",
    "digitalisation ECC",
  ],
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: `${SITE.fullName} — ${SITE.processName}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#1F85CE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body className={styles.body}>
        <PageLoader />
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        <Navbar />
        <main id="contenu" className={styles.main}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
