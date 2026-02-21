/**
 * Cookie Consent utilities
 *
 * Jurisdiction coverage:
 *  - EU / UK GDPR: consent-denied-by-default; user must actively accept analytics.
 *  - CCPA / CPRA (California): analytics data is not "sold" but we honour opt-out
 *    of sharing for cross-context behavioural advertising purposes.
 *  - US (other states): opt-out model; banner provides clear notice.
 *
 * Essential (strictly necessary) cookies – always active, never blockable:
 *   • Supabase auth session cookies  (sb-* / supabase-auth-token)
 *   • Locale preference cookie       (rowbook-locale)
 *
 * Analytics cookies – require consent before being activated:
 *   • Google Analytics               (_ga, _gid, _ga_*)
 */

export const CONSENT_COOKIE_NAME = "rowbook-cookie-consent";

/** Bump this if the consent schema changes so users are re-prompted. */
export const CONSENT_VERSION = 1;

export interface ConsentPreferences {
  /** Schema version – used to re-prompt if categories change. */
  version: number;
  /** True once the user has interacted with the banner at all. */
  decided: boolean;
  /** User has accepted analytics cookies. */
  analytics: boolean;
}

export const DEFAULT_CONSENT: ConsentPreferences = {
  version: CONSENT_VERSION,
  decided: false,
  analytics: false,
};

/** Serialises consent to a cookie-safe string. */
export function encodeConsent(prefs: ConsentPreferences): string {
  return JSON.stringify(prefs);
}

/** Parses the stored consent string; returns null if invalid / outdated. */
export function decodeConsent(raw: string | undefined): ConsentPreferences | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    if (typeof parsed !== "object" || parsed === null) return null;
    if (parsed.version !== CONSENT_VERSION) return null; // re-prompt on version bump
    return {
      version: CONSENT_VERSION,
      decided: Boolean(parsed.decided),
      analytics: Boolean(parsed.analytics),
    };
  } catch {
    return null;
  }
}

/** Reads consent from client-side document.cookie. */
export function readConsentFromBrowser(): ConsentPreferences | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!match) return null;
  const raw = decodeURIComponent(match.split("=").slice(1).join("="));
  return decodeConsent(raw);
}

/** Writes consent to document.cookie (1 year expiry). */
export function writeConsentToBrowser(prefs: ConsentPreferences): void {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = [
    `${CONSENT_COOKIE_NAME}=${encodeURIComponent(encodeConsent(prefs))}`,
    `path=/`,
    `expires=${expires.toUTCString()}`,
    `SameSite=Lax`,
  ].join("; ");
}

/**
 * Applies the GA4 Consent Mode v2 update.
 * Safe to call from any client context – no-ops if gtag is absent.
 */
export function applyGAConsent(analytics: boolean): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    // ad_storage and ad_user_data remain denied – we don't run ads.
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}
