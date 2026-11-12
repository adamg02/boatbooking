import { track as trackMixpanel } from "@/lib/mixpanel";

// GA4 recommends its own standard names; Mixpanel uses object_action names.
const MIXPANEL_EVENT_NAMES: Record<string, string> = {
  sign_up: "sign_up_completed",
  login: "login_completed",
};

/**
 * Fires an analytics event to GA4 (via the gtag function injected by
 * @next/third-parties/google) and Mixpanel. Safe to call on the server (no-op)
 * and when either tool is not configured or consent is not granted (no-op).
 */
export function fireEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") return;
  trackMixpanel(MIXPANEL_EVENT_NAMES[eventName] ?? eventName, params);
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}
