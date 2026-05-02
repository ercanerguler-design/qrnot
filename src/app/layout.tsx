import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QRNote — Hediyene Bir Ses Ver",
  description: "QR kodlu anahtarlık ve hediyeler için sesli mesaj platformu. Tara, dinle, güncelle.",
  openGraph: {
    title: "QRNote — Hediyene Bir Ses Ver",
    description: "QR kodlu fiziksel ürünlere sesli mesaj ekle. Uygulama gerekmez.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full bg-neutral-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
