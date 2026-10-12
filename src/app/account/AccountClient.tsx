'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import QrCard from '@/components/warm/QrCard'
import { formatMoney, type Currency } from '@/lib/commerce/catalog'
import { formatDate, withLang, type Lang } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'

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
  nfc_scan_count?: number
  qr_mode?: string
  created_at: string
}

interface AccountOrder {
  order_no: string
  access_key: string
  status: string
  currency: Currency
  total: number
  tracking_no: string
  created_at: string
}

const T = {
  tr: {
    loading: 'Yükleniyor…',
    welcomeBadge: 'Üyelikle 1 ücretsiz QR',
    welcomeTitle: "Hesabını aç, ilk QR'ın bizden",
    welcomeDesc: 'Her yeni hesap 1 gerçek, çalışan QR hakkı alır. Sesini kaydet, sevdiklerinle paylaş; beğenirsen kolye ya da anahtarlık olarak sipariş et.',
    register: 'Kayıt ol',
    login: 'Giriş yap',
    email: 'E-posta adresin',
    password: 'Şifren (en az 8 karakter)',
    createAccount: 'Ücretsiz hesap oluştur',
    signIn: 'Giriş yap',
    working: 'İşleniyor…',
    why: [
      'Ücretsiz 1 QR ile hemen dene',
      'Satın aldığın haklar aynı hesaba eklenir',
      "Tüm QR'ların ve siparişlerin tek yerde",
      'Başka cihazdan girince de kaybolmaz',
    ],
    myAccount: 'Hesabım',
    myQrs: "QR'larım",
    logout: 'Çıkış yap',
    newQr: 'Yeni QR oluştur',
    newQrDesc: "Kalan hakkın kadar QR oluşturabilirsin. QR'ı indirip kendi kartına basabilir ya da telefonla okutup hemen içerik ekleyebilirsin.",
    create: 'QR oluştur',
    creating: 'Oluşturuluyor…',
    remaining: 'Kalan hak',
    buyMore: 'Daha fazla QR hakkı al',
    noCredits: 'QR hakkın bitti. Yeni hak satın alarak devam edebilirsin.',
    created: 'QR oluşturuldu ✓',
    total: 'Toplam QR',
    claimed: 'Hazırlanan',
    views: 'Toplam görüntülenme',
    empty: 'Henüz QR oluşturmadın.',
    free: 'Ücretsiz',
    individual: 'Bireysel',
    corporate: 'Kurumsal',
    guestbook: 'Anı defteri',
    ready: 'Hazır',
    blank: 'Boş',
    open: 'Aç',
    setup: 'İçerik ekle',
    manage: 'Yönet',
    recover: 'Sahip linkini geri al',
    remove: 'Sil',
    confirmDelete: 'Bu QR silinsin mi? Bu işlem geri alınamaz ve hak iadesi yapılmaz.',
    orders: 'Siparişlerim',
    viewOrder: 'Detay',
    timeout: 'Güvenlik için oturumun kapatıldı. Lütfen tekrar giriş yap.',
    error: 'Bir hata oluştu',
  },
  en: {
    loading: 'Loading…',
    welcomeBadge: '1 free QR with every account',
    welcomeTitle: 'Create your account — your first QR is on us',
    welcomeDesc: 'Every new account gets 1 real, working QR. Record your voice, share it with loved ones, then order it as a necklace or keychain.',
    register: 'Sign up',
    login: 'Sign in',
    email: 'Your email',
    password: 'Password (min. 8 characters)',
    createAccount: 'Create free account',
    signIn: 'Sign in',
    working: 'Working…',
    why: ['Try instantly with 1 free QR', 'Purchased credits go to the same account', 'All your QRs and orders in one place', 'Works from any device'],
    myAccount: 'My account',
    myQrs: 'My QRs',
    logout: 'Sign out',
    newQr: 'Create a new QR',
    newQrDesc: 'Create as many QRs as you have credits. Download and print it on your own card, or scan it with your phone to add content right away.',
    create: 'Create QR',
    creating: 'Creating…',
    remaining: 'Credits left',
    buyMore: 'Buy more QR credits',
    noCredits: 'You are out of credits. Buy more to continue.',
    created: 'QR created ✓',
    total: 'Total QRs',
    claimed: 'Set up',
    views: 'Total views',
    empty: "You haven't created a QR yet.",
    free: 'Free',
    individual: 'Personal',
    corporate: 'Business',
    guestbook: 'Guestbook',
    ready: 'Ready',
    blank: 'Blank',
    open: 'Open',
    setup: 'Add content',
    manage: 'Manage',
    recover: 'Recover owner link',
    remove: 'Delete',
    confirmDelete: 'Delete this QR? This cannot be undone and the credit is not refunded.',
    orders: 'My orders',
    viewOrder: 'Details',
    timeout: 'You were signed out for security. Please sign in again.',
    error: 'Something went wrong',
  },
}

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000

export default function AccountClient({ lang }: { lang: Lang }) {
  const t = T[lang]
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const [user, setUser] = useState<AccountUser | null>(null)
  const [items, setItems] = useState<AccountQr[]>([])
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [count, setCount] = useState(1)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [tokens, setTokens] = useState<Record<string, string>>({})
  const listRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/account/qrs', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        setUser(null)
        setItems([])
        return
      }
      if (!res.ok) throw new Error(data.error || t.error)
      setUser(data.user)
      setItems(data.items || [])
      const found: Record<string, string> = {}
      for (const item of (data.items || []) as AccountQr[]) {
        const token = localStorage.getItem(`qrnote_token_${item.slug}`)
        if (token) found[item.slug] = token
      }
      setTokens(found)
      const ordersRes = await fetch('/api/account/orders', { cache: 'no-store' })
      if (ordersRes.ok) setOrders((await ordersRes.json()).orders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setLoading(false)
    }
  }, [t.error])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  useEffect(() => {
    if (!user) return
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const logout = () => {
      void fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setItems([])
      setError(t.timeout)
    }
    const reset = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(logout, INACTIVITY_TIMEOUT_MS)
    }
    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach((name) => window.addEventListener(name, reset, { passive: true }))
    reset()
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      events.forEach((name) => window.removeEventListener(name, reset))
    }
  }, [t.timeout, user])

  const handleAuth = async () => {
    setAuthLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      setPassword('')
      if (next && next.startsWith('/') && !next.startsWith('//')) {
        router.push(next)
        return
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
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
        body: JSON.stringify({ count }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t.error)
      await load()
      setNotice(t.created)
      setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
      setTimeout(() => setNotice(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (slug: string) => {
    if (!window.confirm(t.confirmDelete)) return
    const res = await fetch('/api/account/qr/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) setError(data.error || t.error)
    await load()
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setItems([])
    setOrders([])
  }

  const stats = useMemo(
    () => [
      { label: t.total, value: items.length },
      { label: t.claimed, value: items.filter((item) => item.is_claimed).length },
      { label: t.remaining, value: user?.remainingSlots ?? 0 },
      { label: t.views, value: items.reduce((sum, item) => sum + Number(item.play_count || 0), 0) },
    ],
    [items, t, user]
  )

  if (loading && !user) {
    return <p className="py-24 text-center text-muted">{t.loading}</p>
  }

  if (!user) {
    return (
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="w-chip">🎁 {t.welcomeBadge}</span>
          <h1 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">{t.welcomeTitle}</h1>
          <p className="mt-4 text-lg text-ink-2">{t.welcomeDesc}</p>
          <ul className="mt-6 space-y-2">
            {t.why.map((line) => (
              <li key={line} className="flex items-center gap-2 text-ink-2">
                <span className="text-sage">✓</span> {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="w-card space-y-4 p-6 sm:p-8">
          <div className="w-seg grid-cols-2" role="group">
            <button type="button" aria-pressed={authMode === 'register'} onClick={() => setAuthMode('register')}>
              {t.register}
            </button>
            <button type="button" aria-pressed={authMode === 'login'} onClick={() => setAuthMode('login')}>
              {t.login}
            </button>
          </div>
          <input className="w-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email} autoComplete="email" />
          <input
            className="w-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.password}
            autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && email && password) void handleAuth()
            }}
          />
          {error && <div className="w-alert w-alert-error">{error}</div>}
          <button type="button" onClick={handleAuth} disabled={authLoading || !email || !password} className="w-btn w-btn-primary w-btn-block py-4">
            {authLoading ? t.working : authMode === 'register' ? t.createAccount : t.signIn}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="w-chip w-chip-ink">{t.myAccount}</span>
          <h1 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">{t.myQrs}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <button type="button" onClick={handleLogout} className="w-btn w-btn-ghost w-btn-sm">
          {t.logout}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="w-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="w-card grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <h2 className="font-display text-2xl font-semibold">{t.newQr}</h2>
          <p className="mt-2 text-sm text-ink-2">{t.newQrDesc}</p>
          {error && <div className="w-alert w-alert-error mt-4">{error}</div>}
          {notice && <div className="w-alert w-alert-success mt-4">{notice}</div>}
        </div>
        <div className="space-y-3">
          {user.remainingSlots > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-xl border border-line-2 bg-paper">
                <button type="button" className="px-3 py-2.5 text-ink-2" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="-">
                  −
                </button>
                <span className="w-8 text-center font-semibold">{count}</span>
                <button type="button" className="px-3 py-2.5 text-ink-2" onClick={() => setCount((c) => Math.min(user.remainingSlots, c + 1))} aria-label="+">
                  +
                </button>
              </div>
              <button type="button" onClick={handleCreate} disabled={creating} className="w-btn w-btn-primary flex-1">
                {creating ? t.creating : `${t.create} (${count})`}
              </button>
            </div>
          ) : (
            <div className="w-alert w-alert-warn">{t.noCredits}</div>
          )}
          <p className="text-xs text-muted">
            {t.remaining}: <strong className="text-ink">{user.remainingSlots}</strong>
          </p>
          <Link href={withLang('/shop/dijital-qr', lang)} className="w-btn w-btn-ghost w-btn-block">
            {t.buyMore} →
          </Link>
        </div>
      </section>

      <div ref={listRef} />
      {items.length === 0 ? (
        <p className="py-10 text-center text-muted">{t.empty}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const token = tokens[item.slug]
            const manageHref = token ? withLang(`/manage/${item.slug}?token=${token}`, lang) : null
            const typeLabel =
              item.qr_mode === 'guestbook'
                ? `📖 ${t.guestbook}`
                : item.order_type === 'trial'
                  ? t.free
                  : item.order_type === 'corporate'
                    ? t.corporate
                    : t.individual
            return (
              <article key={item.slug} className="w-card flex flex-col gap-4 p-5">
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{item.title?.replace(/\[(TEL|LOC):[^\]]+\]/g, '').trim() || item.slug}</p>
                    <p className="font-mono text-xs text-muted">{item.slug}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="w-chip w-chip-ink">{typeLabel}</span>
                    <span className={`w-chip ${item.is_claimed ? 'w-chip-sage' : 'w-chip-gold'}`}>{item.is_claimed ? t.ready : t.blank}</span>
                  </div>
                </header>
                <QrCard url={`${SITE_URL}/q/${item.slug}`} slug={item.slug} lang={lang} size={140} />
                <p className="text-xs text-muted">
                  👁 {item.play_count} · 📶 {item.nfc_scan_count || 0} · {formatDate(item.created_at, lang)}
                </p>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Link href={withLang(`/q/${item.slug}`, lang)} className="w-btn w-btn-dark w-btn-sm">
                    {item.is_claimed ? t.open : t.setup}
                  </Link>
                  {manageHref ? (
                    <a href={manageHref} className="w-btn w-btn-ghost w-btn-sm">
                      {t.manage}
                    </a>
                  ) : item.is_claimed ? (
                    <Link href={withLang(`/recover/${item.slug}`, lang)} className="w-btn w-btn-ghost w-btn-sm">
                      {t.recover}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => handleDelete(item.slug)} className="w-btn w-btn-ghost w-btn-sm">
                      {t.remove}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {orders.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">{t.orders}</h2>
          <div className="w-card divide-y divide-line">
            {orders.map((order) => (
              <div key={order.order_no} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-mono font-semibold">{order.order_no}</p>
                  <p className="text-xs text-muted">{formatDate(order.created_at, lang)}</p>
                </div>
                <span className="w-chip w-chip-ink">{order.status}</span>
                <span className="font-semibold">{formatMoney(order.total, order.currency)}</span>
                <Link href={withLang(`/order/${order.order_no}?key=${order.access_key}`, lang)} className="w-link">
                  {t.viewOrder} →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
