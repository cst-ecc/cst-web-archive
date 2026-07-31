/** Utilitaires d'affichage — purs, sans effet de bord. */

/** Concatène des classes conditionnelles (mini-`clsx`). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Formate une date ISO en français lisible (ex. "12 mai 2024"). */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Formate une taille de fichier en Ko/Mo. */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "—";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Extrait l'année d'une date ISO. */
export function yearOf(iso: string): number {
  return new Date(iso).getFullYear();
}

/** Normalise une chaîne pour la recherche (minuscule, sans accents). */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
