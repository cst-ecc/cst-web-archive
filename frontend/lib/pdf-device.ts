/**
 * Les navigateurs mobiles (notamment Safari iOS/iPadOS) ne savent pas toujours
 * faire défiler un PDF multi-pages lorsqu'il est embarqué dans un iframe.
 *
 * On privilégie alors le lecteur PDF natif en navigation de premier niveau.
 * La détection reste volontairement limitée aux téléphones/tablettes et aux
 * périphériques tactiles de taille tablette afin de conserver l'iframe sur desktop.
 */
export function shouldUseNativePdfReader(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const touchPoints = navigator.maxTouchPoints ?? 0;

  const isIOS =
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && touchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);
  const isMobileUA = /Mobile|Tablet/i.test(userAgent);
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const tabletViewport = window.matchMedia?.("(max-width: 1366px)").matches ?? false;

  return isIOS || isAndroid || isMobileUA || (coarsePointer && tabletViewport);
}
