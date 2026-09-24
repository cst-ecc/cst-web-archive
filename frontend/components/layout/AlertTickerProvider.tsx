"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { NewsItem } from "@/lib/types";

type AlertTickerContextValue = {
  alerts: NewsItem[];
};

type AlertTickerResponse = {
  alerts: NewsItem[];
};

const AlertTickerContext = createContext<AlertTickerContextValue>({
  alerts: [],
});

/*
 * Cette route Next s'exécute côté serveur et relaie la donnée publique
 * « Dernière INFO » depuis la source déjà utilisée par le site.
 *
 * On évite ainsi de faire dépendre le navigateur de l'URL interne Docker
 * du backend Django. Le même bandeau peut donc être utilisé sur tous les
 * panneaux de la Home V2 et sur les pages internes.
 */
const ALERT_ENDPOINT = "/site-alert";

export default function AlertTickerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [alerts, setAlerts] = useState<NewsItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAlert() {
      try {
        const response = await fetch(ALERT_ENDPOINT, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as AlertTickerResponse;

        if (!payload || !Array.isArray(payload.alerts)) {
          return;
        }

        setAlerts(payload.alerts);
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

    return () => {
      controller.abort();
    };
  }, []);

  const value = useMemo(
    () => ({ alerts }),
    [alerts],
  );

  return (
    <AlertTickerContext.Provider value={value}>
      {children}
    </AlertTickerContext.Provider>
  );
}

export function useAlertTicker() {
  return useContext(AlertTickerContext);
}
