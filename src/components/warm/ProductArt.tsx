import type { ProductKind } from '@/lib/commerce/catalog'

// Gerçek ürün fotoğrafı gelene kadar kullanılan vektör çizimler.

const METAL: Record<string, [string, string]> = {
  gold: ['#f3d48a', '#b9862f'],
  silver: ['#eef0f4', '#9ea3ae'],
  rose: ['#f4c9bd', '#c07d6c'],
  black: ['#5a5d6b', '#1f2028'],
}

function MiniQr({ x, y, size, color = '#1f2440' }: { x: number; y: number; size: number; color?: string }) {
  const cells = [
    '1111111010111',
    '1000001001001',
    '1011101011101',
    '1011101000101',
    '1011101010111',
    '1000001001001',
    '1111111010101',
    '0000000011000',
    '1101011101101',
    '0110100100110',
    '1011011011011',
    '0100110110100',
    '1110101101011',
  ]
  const cell = size / cells.length
  return (
    <g>
      {cells.flatMap((row, r) =>
        row.split('').map((v, c) =>
          v === '1' ? <rect key={`${r}-${c}`} x={x + c * cell} y={y + r * cell} width={cell + 0.2} height={cell + 0.2} fill={color} /> : null
        )
      )}
    </g>
  )
}

function NfcWaves({ x, y }: { x: number; y: number }) {
  return (
    <g fill="none" stroke="#e8505b" strokeWidth="3" strokeLinecap="round">
      <path d={`M${x} ${y - 10} a 14 14 0 0 1 0 20`} />
      <path d={`M${x + 9} ${y - 18} a 24 24 0 0 1 0 36`} opacity="0.7" />
      <path d={`M${x + 18} ${y - 26} a 34 34 0 0 1 0 52`} opacity="0.4" />
    </g>
  )
}

export default function ProductArt({
  kind,
  nfc = false,
  variant = 'gold',
  className = '',
}: {
  kind: ProductKind
  nfc?: boolean
  variant?: string
  className?: string
}) {
  const [light, dark] = METAL[variant] || METAL.gold
  const gradId = `g-${kind}-${variant}-${nfc ? 'n' : 'q'}`

  return (
    <svg viewBox="0 0 320 320" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={`${gradId}-bg`} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fbe9df" />
        </radialGradient>
      </defs>
      <rect width="320" height="320" rx="28" fill={`url(#${gradId}-bg)`} />

      {kind === 'necklace' && (
        <g>
          <path d="M40 20 C 70 150, 250 150, 280 20" fill="none" stroke={dark} strokeWidth="3" strokeDasharray="2 5" strokeLinecap="round" />
          <circle cx="160" cy="132" r="9" fill="none" stroke={`url(#${gradId})`} strokeWidth="5" />
          <path d="M160 140 m-62 0 a62 62 0 1 0 124 0 a62 62 0 1 0 -124 0" transform="translate(0 66)" fill={`url(#${gradId})`} />
          <circle cx="160" cy="206" r="50" fill="#fff" opacity="0.92" />
          <MiniQr x={128} y={174} size={64} />
          {nfc && <NfcWaves x={236} y={206} />}
        </g>
      )}

      {kind === 'keychain' && (
        <g>
          <circle cx="160" cy="62" r="30" fill="none" stroke={`url(#${gradId})`} strokeWidth="7" />
          <rect x="150" y="88" width="20" height="22" rx="6" fill={dark} />
          <rect x="92" y="108" width="136" height="168" rx="30" fill={`url(#${gradId})`} />
          <rect x="112" y="132" width="96" height="96" rx="12" fill="#fff" opacity="0.94" />
          <MiniQr x={122} y={142} size={76} />
          <rect x="128" y="242" width="64" height="8" rx="4" fill="#fff" opacity="0.55" />
          {nfc && <NfcWaves x={244} y={192} />}
        </g>
      )}

      {kind === 'guestbook' && (
        <g>
          <rect x="70" y="70" width="180" height="200" rx="16" fill="#fff" stroke="#efe1d6" strokeWidth="2" />
          <rect x="70" y="70" width="180" height="46" rx="16" fill="#e8505b" />
          <rect x="70" y="100" width="180" height="16" fill="#e8505b" />
          <text x="160" y="100" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff" fontFamily="Georgia, serif">
            ♥ Anı / Memory
          </text>
          <MiniQr x={120} y={132} size={80} />
          <rect x="102" y="228" width="116" height="9" rx="4.5" fill="#efe1d6" />
          <rect x="120" y="244" width="80" height="9" rx="4.5" fill="#f6ebe3" />
          <g transform="translate(232 70)">
            <circle r="26" fill="#c9963a" />
            <path d="M-8 -10 v20 M0 -16 v32 M8 -8 v16" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>
      )}

      {kind === 'digital' && (
        <g>
          <rect x="72" y="60" width="176" height="200" rx="18" fill="#fff" stroke="#efe1d6" strokeWidth="2" />
          <MiniQr x={110} y={98} size={100} />
          <rect x="104" y="218" width="112" height="10" rx="5" fill="#e8505b" opacity="0.85" />
          <path d="M236 228 l18 18 m0 -18 v18 h-18" stroke="#1f2440" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  )
}
