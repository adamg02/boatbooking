import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import CookieBanner from "@/components/CookieBanner";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import { cookies } from "next/headers";
import { getDict, LOCALE_COOKIE } from "@/lib/locales";
import { CONSENT_COOKIE_NAME, decodeConsent } from "@/lib/cookie-consent";

export const metadata: Metadata = {
  title: {
    default: "RowBook – Rowing Club Boat Booking",
    template: "%s | RowBook",
  },
  description:
    "RowBook is the simple online booking system built for rowing clubs. Manage boat availability, reserve time slots, and keep your fleet organised – from any device.",
  keywords: [
    "rowing club booking",
    "boat booking system",
    "rowing boat scheduler",
    "crew booking app",
    "sculling club software",
    "rowing club management",
  ],
  openGraph: {
    type: "website",
    title: "RowBook – Rowing Club Boat Booking",
    description:
      "The simple booking system built for rowing clubs. Reserve boats by the slot or full day, manage groups, and keep your fleet organised.",
    siteName: "RowBook",
  },
  twitter: {
    card: "summary_large_image",
    title: "RowBook – Rowing Club Boat Booking",
    description:
      "The simple booking system built for rowing clubs. Reserve boats by the slot or full day, manage groups, and keep your fleet organised.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value;
  const dict = getDict(locale);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const isDev = process.env.NODE_ENV === "development";

  // Read stored consent so we can initialise GA Consent Mode v2 with the
  // correct default on the server, avoiding a false "denied" flash for
  // returning users who have already accepted analytics.
  const consentRaw = cookieStore.get(CONSENT_COOKIE_NAME)?.value;
  const storedConsent = decodeConsent(consentRaw ? decodeURIComponent(consentRaw) : undefined);
  const analyticsGranted = storedConsent?.decided && storedConsent?.analytics;

  // GA4 Consent Mode v2 defaults – must be set before gtag.js loads.
  // wait_for_update: 500 gives the client-side CookieBanner ~500 ms to call
  // gtag('consent','update') for returning users before GA fires any hits.
  const consentInitScript = gaId
    ? `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: '${analyticsGranted ? "granted" : "denied"}',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
gtag('js', new Date());
`.trim()
    : null;

  return (
    <html lang={dict.htmlLang}>
      <head>
        {/* GA4 Consent Mode v2 – must execute before gtag.js loads */}
        {consentInitScript && (
          <Script
            id="ga-consent-init"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: consentInitScript }}
          />
        )}
      </head>
      <body>
        {children}
        <ToastProvider />
        <CookieBanner />
        {gaId && <GoogleAnalytics gaId={gaId} debugMode={isDev} />}
      </body>
    </html>
  );
}
