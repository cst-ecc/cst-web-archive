/**
 * Helpers médias Django.
 *
 * Les fichiers retournés par le backend sont servis sous /media/.
 * Ils ne doivent pas passer par l'optimizer Next.js, car ils ne sont pas dans
 * /public du projet frontend.
 */
export function isDjangoMediaUrl(src?: string | null): boolean {
  if (!src) return false;

  if (src.startsWith("/media/")) return true;

  try {
    return new URL(src).pathname.startsWith("/media/");
  } catch {
    return false;
  }
}

export function shouldBypassNextImageOptimization(
  src?: string | null,
): boolean {
  return isDjangoMediaUrl(src);
}

/**
 * Retourne l'URL publique à utiliser dans le navigateur pour un média Django.
 *
 * En Docker, l'API peut renvoyer une URL absolue construite avec un host interne
 * (cst-backend, 0.0.0.0, localhost, etc.). Le navigateur du visiteur ne doit
 * jamais recevoir cette origine interne. Dès que le fichier appartient à
 * /media/, on ne conserve donc que pathname + query + hash : le navigateur le
 * résout automatiquement sur le domaine public courant (cst.ecc.bj en prod).
 */
export function toPublicMediaHref(src?: string | null): string {
  const value = src?.trim() ?? "";
  if (!value) return "";

  if (value.startsWith("/media/")) return value;

  try {
    const url = new URL(value);

    if (url.pathname.startsWith("/media/")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // Les chemins relatifs non /media/ sont conservés tels quels.
  }

  return value;
}
