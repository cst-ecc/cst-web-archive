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

const AlertTickerContext = createContext<AlertTickerContextValue>({
  alert: null,
});

const ALERT_ENDPOINT = "/api/v1/news/home-special/";

function selectAlert(items: NewsItem[]): NewsItem | null {
  return (
    items.find(
      (item) =>
        item.homeSlot === "alert_info" &&
        item.status === "publie",
    ) ?? null
  );
}

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
