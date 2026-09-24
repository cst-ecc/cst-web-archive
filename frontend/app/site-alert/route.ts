import { NextResponse } from "next/server";

import { getHomeSpecialNews } from "@/lib/api";
import type { NewsItem } from "@/lib/types";

export const dynamic = "force-dynamic";

function selectAlerts(items: NewsItem[]): NewsItem[] {
  return items.filter(
    (item) =>
      item.homeSlot === "alert_info" &&
      item.status === "publie",
  );
}

/**
 * Relais public du « Dernière INFO ».
 *
 * La récupération se fait ici côté serveur afin que le navigateur n'ait
 * jamais à connaître l'adresse réseau interne du backend Django.
 */
export async function GET() {
  const items = await getHomeSpecialNews();
  const alerts = selectAlerts(items);

  return NextResponse.json(
    { alerts },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
