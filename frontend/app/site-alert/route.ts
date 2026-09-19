import { NextResponse } from "next/server";

import { getHomeSpecialNews } from "@/lib/api";
import type { NewsItem } from "@/lib/types";

export const dynamic = "force-dynamic";

function selectAlert(items: NewsItem[]): NewsItem | null {
  return (
    items.find(
      (item) =>
        item.homeSlot === "alert_info" &&
        item.status === "publie",
    ) ?? null
  );
}

/**
 * Relais public du « Dernier INFO ».
 *
 * La récupération se fait ici côté serveur afin que le navigateur n'ait
 * jamais à connaître l'adresse réseau interne du backend Django.
 */
export async function GET() {
  const items = await getHomeSpecialNews();
  const alert = selectAlert(items);

  return NextResponse.json(
    { alert },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
