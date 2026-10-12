'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import QRDisplay from '@/components/QRDisplay'
import { useRouter } from 'next/navigation'

interface AccountUser {
  id: string
  email: string
  freeSlots: number
  paidSlots: number
  usedSlots: number
  remainingSlots: number
}

interface AccountQr {
  slug: string
  order_type?: 'trial' | 'individual' | 'corporate' | 'demo'
  is_claimed: boolean
  title: string
  play_count: number
  created_at: string
  updated_at: string
}

export default function AccountPage() {
  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000
  const router = useRouter()
  const [user, setUser] = useState<AccountUser | null>(null)
  const [items, setItems] = useState<AccountQr[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [createCount, setCreateCount] = useState(1)
  const [creating, setCreating] = useState(false)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [origin] = useState(() => (typeof window !== 'undefined' ? window.location.origin : ''))
  const createSectionRef = useRef<HTMLDivElement | null>(null)
  const listSectionRef = useRef<HTMLDivElement | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/account/qrs', { cache: 'no-store' })
      const data = await res.json()

      if (res.status === 401) {
        setUser(null)
        setItems([])
        return
      }

      if (!res.ok) throw new Error(data.error || 'Hesap bilgisi alınamadı')

      setUser(data.user)
      setItems(data.items || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [])

  useEffect(() => {
    if (!user) return

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const logoutForInactivity = () => {
      void fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setItems([])
      setError('Güvenlik için oturumun zaman aşımına uğradı. Lütfen tekrar giriş yap.')
      router.push('/')
    }

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(logoutForInactivity, INACTIVITY_TIMEOUT_MS)
    }

    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    for (const eventName of events) {
      window.addEventListener(eventName, resetTimer, { passive: true })
    }

    resetTimer()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      for (const eventName of events) {
        window.removeEventListener(eventName, resetTimer)
      }
    }
  }, [INACTIVITY_TIMEOUT_MS, router, user])

  const handleAuth = async () => {
    setAuthLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız')

      setEmail('')
      setPassword('')
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!user?.remainingSlots) return

    setCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/account/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: createCount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'QR oluşturulamadı')

      await load()
      setSuccessMessage('QR başarıyla oluşturuldu. Aşağıdaki listede görebilirsin.')
      setTimeout(() => {
        listSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
      setTimeout(() => setSuccessMessage(null), 2800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (slug: string) => {
    const confirmed = window.confirm('Bu QR kodu silinsin mi? Bu işlem geri alınamaz ve hak iadesi yapılmaz.')
    if (!confirmed) return

    setDeletingSlug(slug)
    setError(null)

    try {
      const res = await fetch('/api/account/qr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'QR silinemedi')

      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setDeletingSlug(null)
    }
  }

  const handleLogout = async () => {
    setError(null)
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setItems([])
    router.push('/')
  }

  const stats = useMemo(() => {
    if (!user) return []

    return [
      { label: 'Toplam QR', value: items.length.toString(), tone: 'text-white' },
      { label: 'Sahiplenilen', value: items.filter((item) => item.is_claimed).length.toString(), tone: 'text-violet-300' },
      { label: 'Kalan Hak', value: user.remainingSlots.toString(), tone: 'text-green-400' },
      { label: 'Toplam Dinlenme', value: items.reduce((sum, item) => sum + Number(item.play_count || 0), 0).toString(), tone: 'text-sky-300' },
    ]
  }, [items, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-500">Yükleniyor...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <Link href="/" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
              ← Ana Sayfa
            </Link>
            <div className="mt-5 inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-full px-4 py-1.5 text-violet-400 text-sm font-medium">
              Üyelikle 1 Ücretsiz Gerçek QR
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mt-5 mb-3 tracking-tight">
              Hesabını aç, ücretsiz QR&apos;larını kullan
            </h1>
            <p className="text-neutral-400 max-w-2xl leading-relaxed">
              Ücretsiz hak artık hesap bazlı çalışır. Her yeni üyelik 1 gerçek çalışan QR hakkı alır. Satın aldığında aynı hesaba yeni hak eklenir ve kaldığın yerden devam edersin.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6 mb-8">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
              <h2 className="text-white text-xl font-bold mb-3">Hesap Oluştur veya Giriş Yap</h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-5">
                1 ücretsiz QR hakkını bu hesaba tanımlıyoruz. Böylece başka cihazdan giriş yaptığında da kalan hakkın kaybolmaz.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${authMode === 'register' ? 'bg-violet-600 text-white border-violet-500' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}
                >
                  Kayıt Ol
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${authMode === 'login' ? 'bg-neutral-100 text-neutral-950 border-neutral-100' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}
                >
                  Giriş Yap
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresin"
                  className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-600 rounded-xl px-4 py-3 outline-none transition-colors text-sm"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifren"
                  className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white placeholder-neutral-600 rounded-xl px-4 py-3 outline-none transition-colors text-sm"
                />
                <button
                  onClick={handleAuth}
                  disabled={authLoading || !email || !password}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  {authLoading ? 'İşleniyor...' : authMode === 'register' ? 'Ücretsiz Hesap Oluştur' : 'Hesaba Giriş Yap'}
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-950/40 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-2xl">
                  {error}
                </div>
              )}
            </div>

            <div className="bg-linear-to-br from-violet-950/50 via-neutral-900 to-neutral-900 border border-violet-800/30 rounded-3xl p-6">
              <h2 className="text-white text-xl font-bold mb-3">Yeni Hesap Akışı</h2>
              <div className="space-y-3 text-sm text-neutral-400 leading-relaxed">
                <p>1. E-posta ile hesabını oluşturursun.</p>
                <p>2. Sistem sana 1 ücretsiz gerçek QR hakkı tanımlar.</p>
                <p>3. QR&apos;ı oluşturup telefondan okutursun.</p>
                <p>4. İlk sesini kaydeder, sahip linkini alır ve daha sonra güncellersin.</p>
                <p>5. Satın alma yaparsan aynı hesaba ek hak yüklenir.</p>
              </div>
              <div className="mt-6 bg-black/20 border border-white/10 rounded-2xl p-4">
                <p className="text-white font-semibold mb-2">Satın alma sonrası ne olur?</p>
                <p className="text-neutral-400 text-sm mb-4">
                  Ücretsiz hakkın bittiğinde yeni hesap açmana gerek yok. Aynı kullanıcıya admin panelinden veya ödeme sonrası otomatik olarak yeni QR hakkı eklenebilir.
                </p>
                <a
                  href="https://wa.me/905433929230?text=Merhaba%20QRNote%2C%20hesab%C4%B1ma%20ek%20QR%20hakk%C4%B1%20sat%C4%B1n%20almak%20istiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-3 rounded-2xl transition-all active:scale-95"
                >
                  Satın Alma İçin WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <Link href="/" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
            ← Ana Sayfa
          </Link>
          <div className="mt-5 inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-full px-4 py-1.5 text-violet-400 text-sm font-medium">
            Hesabım
          </div>
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => createSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 border border-violet-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
              >
                QR Oluştur
              </button>
              <button
                onClick={() => listSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
              >
                QR&apos;larım
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mt-5 mb-3 tracking-tight">Oluşturduğun QR&apos;lar</h1>
          <p className="text-neutral-400 max-w-2xl leading-relaxed">
            {`${user.email} hesabına bağlı tüm QR'lar burada. Kullanım durumunu, dinlenmeleri ve elindeki yönetim linklerini tek yerde görebilirsin.`}
          </p>
        </div>

        <div ref={createSectionRef} className="grid lg:grid-cols-[1.25fr_0.75fr] gap-4 mb-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <h2 className="text-white text-xl font-bold mb-2">Yeni QR Oluştur</h2>
            <p className="text-neutral-400 text-sm mb-5">
              Hesabındaki kalan hak kadar QR üretebilirsin. Ürettiğin QR&apos;ları hemen aşağıdaki listeden yönetebilirsin.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCreateCount((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-2 text-neutral-300 hover:bg-neutral-800"
                  aria-label="Azalt"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, user.remainingSlots)}
                  value={createCount}
                  onChange={(e) => setCreateCount(Math.min(Math.max(1, Number(e.target.value) || 1), Math.max(1, user.remainingSlots)))}
                  className="w-20 bg-transparent text-center text-white px-2 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCreateCount((prev) => Math.min(Math.max(1, user.remainingSlots), prev + 1))}
                  className="px-3 py-2 text-neutral-300 hover:bg-neutral-800"
                  aria-label="Artır"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleCreate}
                disabled={creating || user.remainingSlots <= 0}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                {creating ? 'Oluşturuluyor...' : `${createCount} QR Oluştur`}
              </button>
            </div>

            <p className="text-xs text-neutral-500 mt-4">Kalan hak: {user.remainingSlots}</p>
            <p className="text-xs text-neutral-500 mt-1">Ücretsiz hesapta 1 QR hakkı vardır. Ek haklar admin tarafından tanımlanır.</p>
            {user.remainingSlots <= 0 && (
              <div className="mt-3 bg-amber-950/40 border border-amber-800 text-amber-200 text-sm px-4 py-3 rounded-2xl">
                <p className="font-semibold mb-2">QR hakkın bitti.</p>
                <p className="text-amber-300/90 mb-3">Yeni hak satın almak için WhatsApp üzerinden bize yazabilirsin.</p>
                <a
                  href="https://wa.me/905433929230?text=Merhaba%20QRNote%2C%20hesab%C4%B1ma%20yeni%20QR%20hakk%C4%B1%20sat%C4%B1n%20almak%20istiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  WhatsApp ile Hak Satın Al
                </a>
              </div>
            )}
            {successMessage && (
              <div className="mt-3 text-xs bg-emerald-950/40 border border-emerald-800 text-emerald-300 px-3 py-2 rounded-xl">
                {successMessage}
              </div>
            )}
          </div>

          <div className="bg-linear-to-br from-violet-950/50 via-neutral-900 to-neutral-900 border border-violet-800/30 rounded-3xl p-6">
            <p className="text-violet-300 text-xs uppercase tracking-[0.18em] mb-2">Hak Özeti</p>
            <p className="text-white text-3xl font-black mb-4">{user.remainingSlots}</p>
            <div className="space-y-2 text-sm text-neutral-300">
              <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-xl px-3 py-2">
                <span>Ücretsiz Hak</span>
                <span className="font-semibold text-white">{user.freeSlots}</span>
              </div>
              <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-xl px-3 py-2">
                <span>Satın Alınan Hak</span>
                <span className="font-semibold text-white">{user.paidSlots}</span>
              </div>
              <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-xl px-3 py-2">
                <span>Kullanılan</span>
                <span className="font-semibold text-white">{user.usedSlots}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {stats.map((card) => (
            <div key={card.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <p className="text-neutral-500 text-xs uppercase tracking-[0.18em] mb-2">{card.label}</p>
              <p className={`text-xl font-black ${card.tone}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div ref={listSectionRef} />

        {items.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center">
            <h2 className="text-white text-xl font-bold mb-3">Henüz QR oluşturmadın</h2>
            <p className="text-neutral-400 text-sm mb-6">Yukarıdaki panelden QR oluşturup bu listede görebilirsin.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item) => {
              const playUrl = `/q/${item.slug}`
              const token = typeof window !== 'undefined' ? localStorage.getItem(`qrnote_token_${item.slug}`) : null
              const manageUrl = token ? `${origin}/manage/${item.slug}?token=${token}` : null

              return (
                <div key={item.slug} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-white font-mono text-sm">{item.slug}</p>
                      <p className="text-neutral-500 text-xs mt-1">{item.title || 'Başlıksız QR'}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 text-[11px]">
                      <span className={`px-2 py-1 rounded-full border ${item.order_type === 'trial' ? 'bg-amber-950/40 text-amber-300 border-amber-800' : item.order_type === 'corporate' ? 'bg-green-950/40 text-green-300 border-green-800' : 'bg-violet-950/40 text-violet-300 border-violet-800'}`}>
                        {item.order_type === 'trial' ? 'Ücretsiz' : item.order_type === 'corporate' ? 'Kurumsal' : 'Bireysel'}
                      </span>
                      <span className={`px-2 py-1 rounded-full border ${item.is_claimed ? 'bg-sky-950/40 text-sky-300 border-sky-800' : 'bg-neutral-950 text-neutral-400 border-neutral-700'}`}>
                        {item.is_claimed ? 'Sahiplenildi' : 'Boş'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center gap-3 mb-4">
                    <QRDisplay url={`${origin}${playUrl}`} size={150} />
                    <a href={playUrl} className="text-violet-400 hover:text-violet-300 text-xs transition-colors">QR Sayfasını Aç</a>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500 mb-4">
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                      <p>Dinlenme</p>
                      <p className="text-white text-sm font-semibold mt-1">{item.play_count}</p>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                      <p>Oluşturma</p>
                      <p className="text-white text-sm font-semibold mt-1">{new Date(item.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <a href={playUrl} className="block w-full text-center bg-white hover:bg-neutral-100 text-neutral-950 font-semibold py-3 rounded-2xl transition-all">
                      {item.is_claimed ? 'Dinle' : 'Ses Kaydına Git'}
                    </a>
                    {manageUrl ? (
                      <a href={manageUrl} className="block w-full text-center bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-2xl transition-all">
                        Yönet / Güncelle
                      </a>
                    ) : item.is_claimed ? (
                      <Link href={`/recover/${item.slug}`} className="block w-full text-center bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-medium py-3 rounded-2xl transition-all">
                        Sahip Linkini Geri Al
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.slug)}
                      disabled={deletingSlug === item.slug}
                      className="block w-full text-center bg-red-950/40 hover:bg-red-900/50 border border-red-800 text-red-300 disabled:opacity-60 disabled:cursor-not-allowed font-medium py-3 rounded-2xl transition-all"
                    >
                      {deletingSlug === item.slug ? 'Siliniyor...' : 'QR Kodunu Sil (Hak İade Edilmez)'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}