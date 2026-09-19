import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
// The stylesheet is processed by Next.js/Sass and has no runtime module shape.
// @ts-ignore — keep the side-effect import type-check safe when Sass declarations are unavailable.
import "./globals.scss";
import { SITE } from "@/lib/constants";
import Navbar from "@/components/layout/Navbar";
import SiteFooter from "@/components/layout/SiteFooter";
import FooterVisibility from "@/components/layout/FooterVisibility";
import PageLoader from "@/components/layout/PageLoader";
import AlertTickerProvider from "@/components/layout/AlertTickerProvider";
// import SocialFloatingLinks from "@/components/layout/SocialFloatingLinks";
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

  /**
   * Google n'utilise pas meta keywords comme signal de classement.
   * On peut donc l'omettre et privilégier le contenu réel des pages,
   * les titres, descriptions, H1 et données structurées.
   */

  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [
      {
        url: "/og-image.jpg",
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
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
  },
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

        <AlertTickerProvider>
          <Navbar />

          {/* <SocialFloatingLinks /> */}

          <main id="contenu" className={styles.main}>
            {children}
          </main>

          <FooterVisibility>
            <SiteFooter />
          </FooterVisibility>
        </AlertTickerProvider>
      </body>
    </html>
  );
}
