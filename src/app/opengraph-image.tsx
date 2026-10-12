import { ImageResponse } from 'next/og'

export const alt = 'QRNot — Hediyene bir ses ver'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #fff8f3 0%, #fdeee4 100%)',
        color: '#1f2440',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 40, fontWeight: 700 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: '#e8505b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 40,
          }}
        >
          ♪
        </div>
        QRNot
      </div>
      <div style={{ marginTop: 50, fontSize: 92, lineHeight: 1.02, fontWeight: 700, display: 'flex', flexWrap: 'wrap' }}>
        Hediyene&nbsp;<span style={{ color: '#e8505b' }}>bir ses ver.</span>
      </div>
      <div style={{ marginTop: 30, fontSize: 34, color: '#4a4f6a' }}>Sesli kolye · Sesli anahtarlık · NFC · Dijital anı defteri</div>
    </div>,
    size
  )
}
