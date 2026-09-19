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
  alert: NewsItem | null;
};

type AlertTickerResponse = {
  alert: NewsItem | null;
};

const AlertTickerContext = createContext<AlertTickerContextValue>({
  alert: null,
});

/*
 * Cette route Next s'exécute côté serveur et relaie la donnée publique
 * « Dernier INFO » depuis la source déjà utilisée par le site.
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
  const [alert, setAlert] = useState<NewsItem | null>(null);

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

        if (!payload || !("alert" in payload)) {
          return;
        }

        setAlert(payload.alert ?? null);
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
    () => ({ alert }),
    [alert],
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
