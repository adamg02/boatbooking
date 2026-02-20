/**
 * Fires a GA4 event via the gtag function injected by @next/third-parties/google.
 * Safe to call on the server (no-op) and when GA is not configured (no-op).
 */
export function fireEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}
