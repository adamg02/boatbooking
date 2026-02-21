"use client";

/**
 * CookieBanner
 *
 * Compliant with:
 *  • EU / UK GDPR (PECR) – consent-denied-by-default, explicit opt-in required.
 *  • CCPA / CPRA (California) – right to opt-out of sharing; analytics data is
 *    not sold but users can withdraw consent at any time via "Manage Cookies".
 *  • US (other states) – clear notice and opt-out model.
 *
 * Essential cookies (always active, cannot be disabled):
 *  • Supabase auth session  – required for login / session management.
 *  • Locale preference      – required for the UI to display in the correct language.
 *
 * Analytics cookies (require consent):
 *  • Google Analytics (_ga, _gid, _ga_*) – used for anonymous usage statistics.
 */

import { useEffect, useState, useCallback } from "react";
import {
  type ConsentPreferences,
  DEFAULT_CONSENT,
  CONSENT_VERSION,
  readConsentFromBrowser,
  writeConsentToBrowser,
  applyGAConsent,
} from "@/lib/cookie-consent";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type View = "banner" | "preferences";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  const isDisabled = !!disabled;
  return (
    // eslint-disable-next-line jsx-a11y/aria-proptypes
    <button
      role="switch"
      aria-checked={checked}
      aria-disabled={isDisabled}
      id={id}
      onClick={() => !isDisabled && onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        disabled
          ? "cursor-not-allowed bg-blue-500 opacity-60"
          : checked
          ? "cursor-pointer bg-blue-600"
          : "cursor-pointer bg-gray-300",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  id,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={id}
          className={`block text-sm font-medium ${disabled ? "text-gray-400" : "text-gray-900"}`}
        >
          {title}
          {disabled && (
            <span className="ml-2 text-xs font-normal text-gray-400 italic">
              Always active
            </span>
          )}
        </label>
        <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
      <div className="flex-shrink-0 mt-0.5">
        <Toggle id={id} checked={checked} onChange={onChange} disabled={disabled} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<View>("banner");
  const [draft, setDraft] = useState<ConsentPreferences>({ ...DEFAULT_CONSENT, version: CONSENT_VERSION });

  // ── Boot: read stored consent ─────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const stored = readConsentFromBrowser();
    if (!stored || !stored.decided) {
      // No valid consent stored – show the banner
      setVisible(true);
    } else {
      // Re-apply consent so GA respects stored preference on every page load
      applyGAConsent(stored.analytics);
    }
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const save = useCallback(
    (prefs: ConsentPreferences) => {
      writeConsentToBrowser(prefs);
      applyGAConsent(prefs.analytics);
      setVisible(false);
    },
    []
  );

  const acceptAll = useCallback(() => {
    const prefs: ConsentPreferences = { version: CONSENT_VERSION, decided: true, analytics: true };
    setDraft(prefs);
    save(prefs);
  }, [save]);

  const rejectAll = useCallback(() => {
    const prefs: ConsentPreferences = { version: CONSENT_VERSION, decided: true, analytics: false };
    setDraft(prefs);
    save(prefs);
  }, [save]);

  const savePreferences = useCallback(() => {
    save({ ...draft, decided: true });
  }, [draft, save]);

  // ── Expose a way for the user to re-open the banner later ────────────────
  useEffect(() => {
    if (!mounted) return;
    // Attach a global function that other parts of the app (e.g. footer link) can call
    (window as unknown as Record<string, unknown>).rowbookOpenCookieSettings = () => {
      setView("preferences");
      setVisible(true);
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).rowbookOpenCookieSettings;
    };
  }, [mounted]);

  if (!mounted || !visible) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop for preferences modal */}
      {view === "preferences" && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
          onClick={() => setView("banner")}
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cookie preferences"
        className={[
          "fixed z-50 shadow-2xl",
          view === "banner"
            ? "bottom-0 left-0 right-0 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm w-full rounded-t-2xl sm:rounded-2xl"
            : "bottom-0 left-0 right-0 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg w-full rounded-t-2xl sm:rounded-2xl",
        ].join(" ")}
      >
        <div className="bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl overflow-hidden">
          {/* ── Banner view ──────────────────────────────────────────────────── */}
          {view === "banner" && (
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl" aria-hidden="true">🍪</span>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    We use cookies
                  </h2>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    We use <strong>strictly necessary</strong> cookies to keep the site
                    working (login session, language preference). With your consent we
                    also use <strong>Google Analytics</strong> to understand how the
                    site is used — no personal data is shared with third parties for
                    advertising.
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                You can change your preference at any time via the &ldquo;Manage
                cookies&rdquo; link in the footer. For details see our{" "}
                <a
                  href="/privacy"
                  className="underline hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                >
                  Privacy Policy
                </a>
                .
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={acceptAll}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Accept all cookies
                </button>
                <button
                  onClick={rejectAll}
                  className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                >
                  Reject non-essential
                </button>
                <button
                  onClick={() => setView("preferences")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                >
                  Manage preferences
                </button>
              </div>
            </div>
          )}

          {/* ── Preferences view ─────────────────────────────────────────────── */}
          {view === "preferences" && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold text-gray-900">
                  Cookie preferences
                </h2>
                <button
                  onClick={() => setView("banner")}
                  aria-label="Close preferences"
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Choose which cookies you allow. Essential cookies cannot be disabled
                as they are required for the site to function. Your choice is saved for
                one year and can be changed at any time.
              </p>

              <div className="mb-5">
                <CategoryRow
                  id="cookie-essential"
                  title="Strictly necessary"
                  description="Authentication session (Supabase) and language preference. Without these, you cannot log in or use the site."
                  checked={true}
                  onChange={() => {}}
                  disabled={true}
                />
                <CategoryRow
                  id="cookie-analytics"
                  title="Analytics (Google Analytics)"
                  description="Anonymous page-view and usage statistics via Google Analytics (_ga, _gid). Helps us improve the product. No data is sold or used for advertising."
                  checked={draft.analytics}
                  onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
                />
              </div>

              {/* CCPA notice */}
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                <strong className="text-gray-500">California residents:</strong> We do
                not sell your personal information. Disabling analytics cookies opts
                you out of any sharing of usage data with Google Analytics. See our{" "}
                <a href="/privacy" className="underline hover:text-gray-600">
                  Privacy Policy
                </a>{" "}
                for more information.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={savePreferences}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Save preferences
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                >
                  Accept all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
