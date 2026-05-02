'use client'

import { useState } from 'react'
import QRDisplay from '@/components/QRDisplay'
import Link from 'next/link'

interface CreatedQR {
  slug: string
  qrUrl: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [count, setCount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedQR[]>([])

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hata oluştu')
      setCreated(data.created)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-neutral-600 hover:text-neutral-400 text-sm transition-colors">
            ← Ana Sayfa
          </Link>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <span className="text-3xl">⚙️</span>
            <h1 className="text-2xl font-bold text-white">Admin Paneli</h1>
          </div>
          <p className="text-neutral-500 text-sm">Boş QR kodları oluştur, yazdır, müşterilere gönder.</p>
        </div>

        {/* Form */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-8 max-w-md">
          <h2 className="text-white font-semibold mb-5">Yeni QR Oluştur</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-neutral-400 text-sm mb-2">Admin Şifresi</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-700 rounded-xl px-4 py-3 outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-neutral-400 text-sm mb-2">
                Kaç adet? <span className="text-neutral-700">(maks. 100)</span>
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                min={1}
                max={100}
                className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white rounded-xl px-4 py-3 outline-none transition-colors text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={loading || !password}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Oluşturuluyor...
                </>
              ) : `${count} QR Kodu Oluştur`}
            </button>
          </div>
        </div>

        {/* Results */}
        {created.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">
                {created.length} QR Kodu Oluşturuldu ✓
              </h2>
              <button
                onClick={handlePrint}
                className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-sm px-4 py-2 rounded-xl transition-all flex items-center gap-2"
              >
                🖨️ Yazdır
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-4">
              {created.map((item) => (
                <div
                  key={item.slug}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center gap-3 print:border print:rounded-none print:p-2"
                >
                  <QRDisplay url={item.qrUrl} size={140} />
                  <p className="text-neutral-500 text-xs font-mono">{item.slug}</p>
                  <a
                    href={item.qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 text-xs transition-colors text-center break-all print:hidden"
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
