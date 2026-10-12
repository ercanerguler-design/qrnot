import Link from 'next/link'

// Kurumsal paneller (otel, eğitim, sektör, admin) için eski koyu tema kabuğu.
// Bu sayfalar sınıflarını koyu zemine göre yazdığı için kendi kabuklarında kalır.
export default function DarkShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-theme min-h-screen text-white">
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

      <div className="app-content">{children}</div>
    </div>
  )
}
