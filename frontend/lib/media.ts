/**
 * Helpers médias Django.
 *
 * Les fichiers retournés par le backend sont servis sous /media/.
 * Ils ne doivent pas passer par l'optimizer Next.js, car ils ne sont pas dans
 * /public du projet frontend.
 */
export function isDjangoMediaUrl(src?: string | null): boolean {
  return Boolean(src && src.startsWith("/media/"));
}

export function shouldBypassNextImageOptimization(
  src?: string | null,
): boolean {
  return isDjangoMediaUrl(src);
}
