import { ImageResponse } from 'next/og'

// DPP sayfaları paylaşıldığında (LinkedIn, e-posta, WhatsApp) görünen görsel: B2B, İngilizce ağırlıklı.
export const alt = 'QRNot Digital Product Passport — for manufacturers exporting to the EU'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function DppOpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '72px 80px',
        background: 'linear-gradient(135deg, #0f1f2e 0%, #13324a 60%, #1d4a5e 100%)',
        color: '#f4efe8',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 36, fontWeight: 700 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: '#e8505b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, letterSpacing: 1 }}>DPP</div>
        QRNot · Digital Product Passport
      </div>
      <div style={{ marginTop: 44, fontSize: 76, lineHeight: 1.05, fontWeight: 700, display: 'flex', flexWrap: 'wrap' }}>
        Digital product passports&nbsp;<span style={{ color: '#7fd1c7' }}>for EU export.</span>
      </div>
      <div style={{ marginTop: 30, fontSize: 30, color: '#c9d6df', display: 'flex' }}>QR / NFC · GS1 Digital Link · Battery passport fields · 8 languages · API</div>
      <div style={{ marginTop: 34, display: 'flex', gap: 14, fontSize: 24 }}>
        {['Textile', 'Furniture', 'Batteries', 'Electronics'].map((s) => (
          <div key={s} style={{ display: 'flex', padding: '8px 18px', borderRadius: 999, border: '2px solid #7fd1c7', color: '#7fd1c7' }}>
            {s}
          </div>
        ))}
      </div>
    </div>,
    size
  )
}
