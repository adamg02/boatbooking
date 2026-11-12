import mixpanel from "mixpanel-browser";
import type { User } from "@supabase/supabase-js";
import { readConsentFromBrowser } from "@/lib/cookie-consent";

/**
 * Mixpanel analytics (client-side only).
 *
 * Mixpanel is only initialised once the user has granted analytics consent via
 * the CookieBanner (GDPR / CCPA). Until then every call here is a no-op and no
 * Mixpanel cookies / storage are written.
 */

const MIXPANEL_TOKEN =
  process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || "df9f73c348c25292aa2a8f8244c3ac45";

type Props = Record<string, string | number | boolean | null | undefined>;

let initialized = false;
let identifiedUserId: string | null = null;
// Remembered so we can identify as soon as consent is granted mid-session.
let currentUser: AnalyticsUser | null = null;

function hasAnalyticsConsent(): boolean {
  const consent = readConsentFromBrowser();
  return Boolean(consent?.decided && consent.analytics);
}

/** Initialises Mixpanel if consent has been granted. Returns true when ready. */
function ensureInit(): boolean {
  if (typeof window === "undefined" || !MIXPANEL_TOKEN) return false;
  if (initialized) return !mixpanel.has_opted_out_tracking();
  if (!hasAnalyticsConsent()) return false;

  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === "development",
    track_pageview: "url-with-path",
    persistence: "localStorage",
    api_host: "https://api-eu.mixpanel.com",
    // Session Replay. SDK defaults mask all text and inputs and block
    // img/video/audio; add class="mp-block" to hide any other element.
    record_sessions_percent: 100,
    record_heatmap_data: true,
  });
  initialized = true;
  if (mixpanel.has_opted_out_tracking()) return false;
  if (currentUser) applyIdentity(currentUser);
  return true;
}

/** Called by the CookieBanner whenever consent is set or changed. */
export function applyMixpanelConsent(analytics: boolean): void {
  if (typeof window === "undefined") return;
  if (analytics) {
    // A previous withdrawal persists an opt-out flag; clear it on re-consent.
    if (!ensureInit() && initialized) {
      mixpanel.opt_in_tracking();
      mixpanel.start_session_recording();
      if (currentUser) applyIdentity(currentUser);
    }
  } else if (initialized && !mixpanel.has_opted_out_tracking()) {
    mixpanel.stop_session_recording();
    mixpanel.opt_out_tracking();
    identifiedUserId = null;
  }
}

export function track(eventName: string, props?: Props): void {
  if (!ensureInit()) return;
  mixpanel.track(eventName, { platform: "web", ...props });
}

export interface AnalyticsUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

export function toAnalyticsUser(user: User): AnalyticsUser {
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  };
}

/** Links this device's events to the authenticated user. Safe to call repeatedly. */
export function identifyUser(user: AnalyticsUser): void {
  currentUser = user;
  if (!ensureInit()) return;
  applyIdentity(user);
}

function applyIdentity(user: AnalyticsUser): void {
  if (identifiedUserId === user.id) return;
  mixpanel.identify(user.id);
  const profile: Props = {};
  if (user.email) profile.$email = user.email;
  if (user.name) profile.$name = user.name;
  if (Object.keys(profile).length) mixpanel.people.set(profile);
  identifiedUserId = user.id;
}

/** Clears identity on sign-out so the next user on this device starts fresh. */
export function resetUser(): void {
  identifiedUserId = null;
  currentUser = null;
  if (!initialized || mixpanel.has_opted_out_tracking()) return;
  mixpanel.reset();
}
