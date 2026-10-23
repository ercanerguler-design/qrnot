import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import SiteAnalytics from "@/components/SiteAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const displaySerif = Fraunces({
  variable: "--font-display-serif",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "QRNot — Hediyene Bir Ses Ver | Sesli Kolye ve Anahtarlık",
    template: "%s | QRNot",
  },
  description:
    "QR ve NFC'li kolye ve anahtarlıklara sesli mesaj, video ve fotoğraf ekle. Uygulama gerekmez, mesajını sonradan güncelle. Düğünler için dijital anı defteri.",
  keywords: [
    "sesli kolye",
    "qr kodlu kolye",
    "sesli anahtarlık",
    "nfc anahtarlık",
    "sesli hediye",
    "anı defteri",
    "audio guestbook",
    "voice message necklace",
    "qr code keychain",
  ],
  applicationName: "QRNot",
  openGraph: {
    title: "QRNot — Hediyene Bir Ses Ver",
    description: "QR ve NFC'li kolye ve anahtarlıklara sesli mesaj, video ve fotoğraf ekle. Uygulama gerekmez.",
    type: "website",
    url: SITE_URL,
    siteName: "QRNot",
    locale: "tr_TR",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "QRNot — Hediyene Bir Ses Ver",
    description: "Sesli kolye, sesli anahtarlık ve dijital anı defteri.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fff8f3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${displaySerif.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
