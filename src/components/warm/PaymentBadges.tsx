// Kabul edilen kart logoları (Visa, Mastercard, Troy) ve güvenli ödeme ibaresi.
// Alt bilgi, sepet ve ödeme sayfasında kullanılır.

function Badge({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-11 items-center justify-center rounded-md border border-line bg-white"
    >
      {children}
    </span>
  )
}

export function CardLogos() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge label="Visa">
        <svg viewBox="0 0 48 16" className="h-3 w-9" aria-hidden="true">
          <text x="24" y="13.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="900" fontStyle="italic" fill="#1A1F71">
            VISA
          </text>
        </svg>
      </Badge>
      <Badge label="Mastercard">
        <svg viewBox="0 0 32 20" className="h-4 w-7" aria-hidden="true">
          <circle cx="12" cy="10" r="8" fill="#EB001B" />
          <circle cx="20" cy="10" r="8" fill="#F79E1B" />
          <path d="M16 3.07a8 8 0 0 1 0 13.86a8 8 0 0 1 0-13.86z" fill="#FF5F00" />
        </svg>
      </Badge>
      <Badge label="Troy">
        <svg viewBox="0 0 40 16" className="h-3 w-8" aria-hidden="true">
          <text x="20" y="12.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="14" fontWeight="700" fill="#1E2B33">
            troy
          </text>
        </svg>
      </Badge>
    </span>
  )
}

export default function PaymentBadges({ lang, transfer = true }: { lang: 'tr' | 'en'; transfer?: boolean }) {
  const en = lang === 'en'
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2">
      <CardLogos />
      <span>
        🔒 {en ? 'Secure payment with PayTR · 3D Secure' : 'PayTR ile güvenli ödeme · 3D Secure'}
        {transfer && !en ? ' · Havale/EFT' : ''}
      </span>
    </span>
  )
}
