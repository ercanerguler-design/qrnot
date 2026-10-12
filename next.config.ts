import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proje kökünü açıkça belirt: üst klasörde (C:\Users\ercan) başka bir package-lock.json
  // olduğu için Turbopack kökü yanlış seçip "Masaüstü" yolundaki Türkçe karakterde çöküyordu.
  turbopack: {
    root: path.join(__dirname),
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Yönetim linkleri ?token= taşır; başka sitelere giderken adres sızmasın
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Kamera/mikrofon kayıt için gerekli, NFC yazma için gerekli
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), nfc=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
