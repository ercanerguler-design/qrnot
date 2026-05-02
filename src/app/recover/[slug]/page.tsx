'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function RecoverPage({ params }: Props) {
  const { slug } = await params
  return <RecoverClient slug={slug} />
}

function RecoverClient({ slug }: { slug: string }) {
  const [recoveryCode, setRecoveryCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manageUrl, setManageUrl] = useState('')

  const handleRecover = async () => {
    if (!recoveryCode.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/qr/${slug}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryCode }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Kurtarma başarısız')
      }

      localStorage.setItem(`qrnote_token_${slug}`, data.ownerToken)
      setManageUrl(data.manageUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!manageUrl) return
    await navigator.clipboard.writeText(manageUrl)
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <Link href="/" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
          ← Ana Sayfa
        </Link>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mt-4 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Sahip Linkini Geri Al</h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              İlk sahiplenmede sana verilen kurtarma kodunu gir. Sistem yeni bir sahip linki üretecek.
            </p>
          </div>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">Kurtarma Kodu</label>
            <input
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
              placeholder="Örn: A1B2C3D4"
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white rounded-xl px-4 py-3 outline-none transition-colors text-sm uppercase tracking-[0.2em]"
            />
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {manageUrl && (
            <div className="bg-green-950/40 border border-green-800 rounded-2xl p-4 space-y-3">
              <p className="text-green-400 text-sm font-semibold">Yeni sahip linkin hazır</p>
              <p className="text-green-200/80 text-xs break-all">{manageUrl}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-sm font-medium py-3 rounded-xl transition-all"
                >
                  Linki Kopyala
                </button>
                <a
                  href={manageUrl}
                  className="flex-1 text-center bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-3 rounded-xl transition-all"
                >
                  Aç →
                </a>
              </div>
            </div>
          )}

          <button
            onClick={handleRecover}
            disabled={loading || !recoveryCode.trim()}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
          >
            {loading ? 'Kontrol ediliyor...' : 'Yeni Sahip Linki Oluştur'}
          </button>
        </div>
      </div>
    </div>
  )
}