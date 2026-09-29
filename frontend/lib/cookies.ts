export const COOKIE_CONSENT_NAME = "cst_cookie_consent";
export const COOKIE_POLICY_VERSION = "2026-09-29.1";
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 6 mois

export type ConsentCategories = {
  necessary: true;
  external: boolean;
};

export type ConsentRecord = {
  version: string;
  date: string;
  categories: ConsentCategories;
};

export const DEFAULT_CONSENT_CATEGORIES: ConsentCategories = {
  necessary: true,
  external: false,
};

export function readConsentCookie(): ConsentRecord | null {
  if (typeof document === "undefined") return null;

  const prefix = `${COOKIE_CONSENT_NAME}=`;
  const raw = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentRecord>;
    if (
      parsed.version !== COOKIE_POLICY_VERSION ||
      typeof parsed.date !== "string" ||
      !parsed.categories ||
      parsed.categories.necessary !== true ||
      typeof parsed.categories.external !== "boolean"
    ) {
      return null;
    }
    return parsed as ConsentRecord;
  } catch {
    return null;
  }
}

export function writeConsentCookie(categories: ConsentCategories): ConsentRecord {
  const record: ConsentRecord = {
    version: COOKIE_POLICY_VERSION,
    date: new Date().toISOString(),
    categories,
  };

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_NAME}=${encodeURIComponent(JSON.stringify(record))}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
  return record;
}
