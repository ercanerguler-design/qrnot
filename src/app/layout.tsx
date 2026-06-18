import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://qrnet.com'),
  title: "QRNote — Hediyene Bir Ses Ver",
  description: "QR kodlu anahtarlık ve hediyeler için sesli mesaj platformu. Tara, dinle, güncelle.",
  openGraph: {
    title: "QRNote — Hediyene Bir Ses Ver",
    description: "QR kodlu fiziksel ürünlere sesli mesaj ekle. Uygulama gerekmez.",
    type: "website",
    url: 'https://qrnet.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} h-full`}>
      <body className="app-theme min-h-full text-white antialiased">
        <div className="app-background" aria-hidden="true">
          <div className="aurora aurora-a" />
          <div className="aurora aurora-b" />
          <div className="aurora aurora-c" />
        </div>

        <Link href="/" className="brand-ribbon" aria-label="QRNot anasayfaya don">
          <span className="brand-mark">🎙️</span>
          <span className="brand-text">QRNot</span>
          <span className="brand-dot">●</span>
        </Link>

        <div className="emoji-float emoji-one" aria-hidden="true">🎙️</div>
        <div className="emoji-float emoji-two" aria-hidden="true">✨</div>
        <div className="emoji-float emoji-three" aria-hidden="true">💡</div>
        <div className="emoji-float emoji-four" aria-hidden="true">⚡</div>
        <div className="emoji-float emoji-five" aria-hidden="true">🎉</div>

        <div className="app-content">{children}</div>
      </body>
    </html>
  );
}
