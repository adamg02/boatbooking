import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import { GoogleAnalytics } from "@next/third-parties/google";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en">
      <body>
        {children}
        <ToastProvider />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
