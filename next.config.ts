import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proje kökünü açıkça belirt: üst klasörde (C:\Users\ercan) başka bir package-lock.json
  // olduğu için Turbopack kökü yanlış seçip "Masaüstü" yolundaki Türkçe karakterde çöküyordu.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
