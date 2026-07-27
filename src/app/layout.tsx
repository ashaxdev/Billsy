import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://billsy.nexirasolution.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Billsy — Billing & Barcode Scanner for Small Businesses",
    template: "%s | Billsy",
  },
  description:
    "Billsy turns any phone into a billing counter. Scan barcodes, generate receipts in seconds, and share them straight to your customer's WhatsApp. Built for small business owners.",
  keywords: [
    "billing app for small business",
    "mobile barcode scanner",
    "receipt generator app",
    "barcode generator for products",
    "POS app India",
    "WhatsApp receipt sharing",
  ],
  openGraph: {
    title: "Billsy — Billing & Barcode Scanner for Small Businesses",
    description:
      "Scan barcodes, bill customers, and share receipts on WhatsApp — all from your phone.",
    url: siteUrl,
    siteName: "Billsy",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Billsy — Billing & Barcode Scanner for Small Businesses",
    description:
      "Scan barcodes, bill customers, and share receipts on WhatsApp — all from your phone.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
