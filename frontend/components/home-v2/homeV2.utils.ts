import { HOME_HASH_ALIASES, HOME_PANELS, type HomePanelId } from "@/lib/home-v2";
import { shouldBypassNextImageOptimization } from "@/lib/media";

export function panelIndexFromHash(hash: string): number {
  const rawId = hash.replace(/^#/, "");
  const id = (HOME_HASH_ALIASES[rawId] ?? rawId) as HomePanelId;
  const index = HOME_PANELS.findIndex((panel) => panel.id === id);
  return index >= 0 ? index : 0;
}

export function imageNeedsUnoptimized(src: string): boolean {
  return shouldBypassNextImageOptimization(src) || src.toLowerCase().endsWith(".svg");
}
