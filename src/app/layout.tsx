import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boat Booking",
  description: "Book rowing boats easily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
