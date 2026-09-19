"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import AlertTicker from "@/components/home-v2/AlertTicker";
import type { NewsItem } from "@/lib/types";

const ALERT_ENDPOINT = "/api/v1/news/home-special/";

function isHiddenDetailRoute(pathname: string): boolean {
  // Détail d'une actualité.
  if (/^\/actualites\/[^/]+\/?$/.test(pathname)) {
    return true;
  }

  // Détail d'une galerie, présent ou futur. La liste /galerie reste autorisée.
  if (/^\/galerie\/[^/]+\/?$/.test(pathname)) {
    return true;
  }

  return false;
}

function selectAlert(items: NewsItem[]): NewsItem | null {
  return (
    items.find(
      (item) =>
        item.homeSlot === "alert_info" &&
        item.status === "publie",
    ) ?? null
  );
}

export default function GlobalAlertTicker() {
  const pathname = usePathname();
  const [alert, setAlert] = useState<NewsItem | null>(null);
  const [homeHash, setHomeHash] = useState("");

  useEffect(() => {
    if (pathname !== "/") {
      setHomeHash("");
      return;
    }

    const syncHash = () => {
      setHomeHash(window.location.hash || "#accueil");
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    window.addEventListener("homepanelchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
      window.removeEventListener("homepanelchange", syncHash);
    };
  }, [pathname]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAlert() {
      try {
        const response = await fetch(ALERT_ENDPOINT, {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as unknown;
        if (!Array.isArray(payload)) {
          return;
        }

        setAlert(selectAlert(payload as NewsItem[]));
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }
      }
    }

    void loadAlert();

    return () => controller.abort();
  }, []);

  if (!pathname || !alert || isHiddenDetailRoute(pathname)) {
    return null;
  }

  // Sur le premier écran de la Home, le bandeau est rendu directement
  // après le Hero pour respecter la composition visuelle demandée.
  // Sur les autres panneaux Home, il reste disponible globalement.
  if (
    pathname === "/" &&
    (!homeHash || homeHash === "#accueil")
  ) {
    return null;
  }

  return <AlertTicker item={alert} />;
}
