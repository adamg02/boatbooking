"use client";

import { useMemo } from "react";
import { getDict, LOCALE_COOKIE, type LocaleDict } from "@/lib/locales";

/** Read a cookie value by name in the browser (synchronous). */
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Returns the locale dictionary for the current user's detected locale.
 * Safe to call in any client component — reads the locale cookie set by middleware.
 */
export function useLocale(): LocaleDict {
  return useMemo(() => getDict(readCookie(LOCALE_COOKIE)), []);
}

/**
 * Format a date ISO string using the user's locale.
 * Pass the `dateLocale` value from `useLocale()`.
 */
export function formatDate(iso: string, dateLocale: string): string {
  return new Date(iso).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
