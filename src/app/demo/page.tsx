'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRDisplay from '@/components/QRDisplay'

interface DemoQr {
  slug: string
  qrUrl: string
}

interface DemoQuota {
  maxQr: number
  maxQrPerIp: number
  sessionUsed: number
  ipUsed: number
  networkRemaining: number
  remaining: number
}

export default function DemoPage() {
  const [quota, setQuota] = useState<DemoQuota | null>(null)
  const [created, setCreated] = useState<DemoQr[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadQuota = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/demo/qr', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Demo bilgisi alınamadı')
      setQuota(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadQuota()
  }, [])

  const handleCreate = async () => {
    if (!quota?.remaining) return

    setCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/demo/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: quota.remaining }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Demo QR oluşturulamadı')

      setCreated(data.created || [])
      setQuota((current) =>
        current
          ? {
              ...current,
              ipUsed: data.ipUsed,
              sessionUsed: data.used,
              networkRemaining: data.networkRemaining,
              remaining: data.remaining,
            }
          : current
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setCreating(false)
    }
  }

  const showUpsellCard = Boolean(quota && quota.remaining === 0)

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <Link href="/" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
            ← Ana Sayfa
          </Link>
          <div className="mt-5 inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-full px-4 py-1.5 text-violet-400 text-sm font-medium">
            3 Ücretsiz Demo QR
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mt-5 mb-3 tracking-tight">
            Sistemi canlı dene
          </h1>
          <p className="text-neutral-400 max-w-2xl leading-relaxed">
            Bu public demo akışında en fazla 3 ücretsiz QR oluşturabilirsin. QR'ları okut, ses kaydını bırak, sahip linkini gör ve sistemin nasıl çalıştığını anında test et.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6 mb-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <h2 className="text-white text-xl font-bold mb-3">Demo Hakkın</h2>
            {loading ? (
              <p className="text-neutral-500 text-sm">Kontrol ediliyor...</p>
            ) : quota ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
                    <p className="text-violet-400 text-2xl font-black">{quota.maxQr}</p>
                    <p className="text-neutral-600 text-xs mt-1">Toplam demo</p>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
                    <p className="text-white text-2xl font-black">{quota.sessionUsed}</p>
                    <p className="text-neutral-600 text-xs mt-1">Kullandığın</p>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
                    <p className="text-green-400 text-2xl font-black">{quota.remaining}</p>
                    <p className="text-neutral-600 text-xs mt-1">Kalan</p>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <p className="text-amber-300 text-2xl font-black">{quota.networkRemaining}</p>
                      <span
                        title="Aynı internet bağlantısından toplam kaç demo QR daha açılabileceğini gösterir. Ortak Wi‑Fi veya mobil ağda başka denemeler yapıldıysa bu sayı düşebilir."
                        className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 text-xs cursor-help"
                      >
                        ?
                      </span>
                    </div>
                    <p className="text-neutral-600 text-xs mt-1">Ağ kotası</p>
                  </div>
                </div>

                {quota.remaining === 0 && quota.sessionUsed === 0 && quota.networkRemaining === 0 && (
                  <div className="mb-4 bg-amber-950/40 border border-amber-800 text-amber-300 text-sm px-4 py-3 rounded-2xl">
                    Bu ağdaki demo kotası dolmuş. Başka bir bağlantı ile deneyebilir veya WhatsApp üzerinden demo linki isteyebilirsin.
                  </div>
                )}

                {showUpsellCard && (
                  <div className="mb-4 bg-gradient-to-r from-green-950/60 via-neutral-950 to-violet-950/60 border border-green-800/40 rounded-2xl p-5">
                    <p className="text-green-400 text-xs font-semibold tracking-[0.18em] uppercase mb-2">Demo Bitti</p>
                    <h3 className="text-white font-bold text-lg mb-2">Kalıcı QR için tek tuşla devam et</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                      Demo akışını gördün. Şimdi kalıcı QR, fiziksel ürün veya özel paket için doğrudan WhatsApp üzerinden devam edebilirsin.
                    </p>
                    <a
                      href="https://wa.me/905433929230?text=Merhaba%20QRNote%2C%20demo%20hakk%C4%B1m%20bitti.%20Kal%C4%B1c%C4%B1%20QR%20veya%20paket%20sat%C4%B1n%20almak%20istiyorum."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-3.5 rounded-2xl transition-all active:scale-95"
                    >
                      WhatsApp ile Satın Almaya Geç
                    </a>
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={creating || quota.remaining === 0}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  {creating
                    ? 'Demo QR hazırlanıyor...'
                    : quota.remaining > 0
                      ? `${quota.remaining} Demo QR Oluştur`
                      : 'Demo Hakkın Bitti'}
                </button>
              </>
            ) : null}

            {error && (
              <div className="mt-4 bg-red-950/40 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-violet-950/50 via-neutral-900 to-neutral-900 border border-violet-800/30 rounded-3xl p-6">
            <h2 className="text-white text-xl font-bold mb-3">Demo Sonrası Ne Oluyor?</h2>
            <div className="space-y-3 text-sm text-neutral-400 leading-relaxed">
              <p>1. QR'ı oluşturursun.</p>
              <p>2. Telefonla okutursun ve ilk sesini bırakırsın.</p>
              <p>3. Sistem sana sahip linkini verir.</p>
              <p>4. Daha sonra istediğin zaman sesi güncelleyebilirsin.</p>
            </div>
            <div className="mt-6 bg-black/20 border border-white/10 rounded-2xl p-4">
              <p className="text-white font-semibold mb-2">Kalıcı kullanım için</p>
              <p className="text-neutral-400 text-sm mb-4">Demo bittikten sonra bireysel paket veya fiziksel ürün siparişi ile devam edebilirsin.</p>
              <a
                href="https://wa.me/905433929230?text=Merhaba%20QRNote%2C%20demo%20sonras%C4%B1%20kal%C4%B1c%C4%B1%20paket%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-3 rounded-2xl transition-all active:scale-95"
              >
                Satın Alma İçin WhatsApp
              </a>
            </div>
          </div>
        </div>

        {created.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-5">Hazır Demo QR'ların</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {created.map((item) => (
                <div key={item.slug} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center gap-3">
                  <QRDisplay url={item.qrUrl} size={150} />
                  <p className="text-neutral-500 text-xs font-mono">{item.slug}</p>
                  <a
                    href={item.qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 text-xs text-center break-all transition-colors"
                  >
                    {item.qrUrl}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}