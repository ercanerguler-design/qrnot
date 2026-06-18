'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>()
  const token = Array.isArray(params.token) ? params.token[0] : params.token
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Şifre güncellenemedi')
      setDone(true)
      setPassword('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
          ← Ana Sayfa
        </Link>

        <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
          <h1 className="text-2xl font-bold text-white mb-3">Şifreni Yenile</h1>
          <p className="text-neutral-400 text-sm mb-6">
            Admin tarafından gönderilen link ile hesabının şifresini burada güncelleyebilirsin.
          </p>

          {done ? (
            <div className="bg-green-950/40 border border-green-800 text-green-300 text-sm px-4 py-3 rounded-2xl">
              Şifre güncellendi. Artık yeni şifren ile giriş yapabilirsin.
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Yeni şifren"
                className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-600 rounded-xl px-4 py-3 outline-none transition-colors text-sm"
              />

              {error && (
                <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-2xl">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !password}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-95"
              >
                {loading ? 'Kaydediliyor...' : 'Yeni Şifreyi Kaydet'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}