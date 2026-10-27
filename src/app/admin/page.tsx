'use client'

import { useCallback, useEffect, useState } from 'react'
import { CorporateTab, QrsTab, UsersTab } from './CoreTabs'
import { AdminPushCard } from './AdminPushCard'
import { AnalyticsTab } from './AnalyticsTab'
import { DppTab } from './DppTab'
import { QuotesTab } from './QuotesTab'
import { HomeTab, type Go } from './HomeTab'
import { btn, EtsyTab, input, OrdersTab, ProductionTab, RevenueTab } from './ShopTabs'

// Tek admin konsolu: tek giriş, solda menü. Eski /admin/shop adresi buraya yönlenir.

const SECTIONS = [
  {
    title: '',
    tabs: [
      { key: 'home', icon: '🏠', label: 'Genel bakış' },
      { key: 'analytics', icon: '📈', label: 'Ölçüm' },
    ],
  },
  {
    title: 'Satış',
    tabs: [
      { key: 'orders', icon: '🛒', label: 'Siparişler' },
      { key: 'quotes', icon: '📨', label: 'Teklif talepleri' },
      { key: 'revenue', icon: '💰', label: 'Gelir' },
      { key: 'etsy', icon: '🧡', label: 'Etsy' },
    ],
  },
  {
    title: 'Ürün',
    tabs: [
      { key: 'qrs', icon: '🔳', label: 'QR kodları' },
      { key: 'production', icon: '🏭', label: 'Üretim & NFC' },
    ],
  },
  {
    title: 'Müşteri',
    tabs: [
      { key: 'users', icon: '👤', label: 'Kullanıcılar' },
      { key: 'corporate', icon: '🏢', label: 'Kurumsal paneller' },
      { key: 'dpp', icon: '🛂', label: 'Ürün pasaportu (DPP)' },
    ],
  },
] as const

type TabInfo = { key: string; icon: string; label: string }
const ALL_TABS: readonly TabInfo[] = SECTIONS.flatMap((s): readonly TabInfo[] => s.tabs)
type Tab = (typeof SECTIONS)[number]['tabs'][number]['key']
const isTab = (value: string | null): value is Tab => ALL_TABS.some((t) => t.key === value)
const PW_KEY = 'qrnote_admin_pw'

export default function AdminConsole() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(false)
  const [tab, setTab] = useState<Tab>('home')
  const [orderStatus, setOrderStatus] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search)
      const fromUrl = params.get('tab')
      if (isTab(fromUrl)) setTab(fromUrl)
      setOrderStatus(params.get('status') || '')
      // Yönetici cihazı sitenin ölçümüne girmesin (sahibin kendi gezintisi istatistiği bozmasın)
      try {
        localStorage.setItem('qrnot_notrack', '1')
      } catch {}
      const saved = sessionStorage.getItem(PW_KEY)
      if (saved) {
        setPassword(saved)
        setAuthed(true)
      }
    })
    return () => window.cancelAnimationFrame(raf)
  }, [])

  const logout = useCallback((message: string | null = null) => {
    sessionStorage.removeItem(PW_KEY)
    setAuthed(false)
    setPassword('')
    setError(message)
  }, [])

  const call = useCallback(
    async <T,>(action: string, payload: Record<string, unknown> = {}): Promise<T | null> => {
      setError(null)
      const res = await fetch('/api/admin/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action, ...payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        logout('Oturum sona erdi, tekrar giriş yap')
        return null
      }
      if (!res.ok) {
        setError(data.error || 'İşlem başarısız')
        return null
      }
      return data as T
    },
    [password, logout]
  )

  const go: Go = (next, opts) => {
    if (!isTab(next)) return
    setTab(next)
    setOrderStatus(opts?.status || '')
    setError(null)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', next)
    if (opts?.status) url.searchParams.set('status', opts.status)
    else url.searchParams.delete('status')
    window.history.replaceState(null, '', url)
    window.scrollTo({ top: 0 })
  }

  const login = async () => {
    setChecking(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'dashboard' }),
      })
      if (res.ok) {
        sessionStorage.setItem(PW_KEY, password)
        setAuthed(true)
      } else setError(res.status === 429 ? 'Çok fazla deneme, biraz bekle' : 'Şifre hatalı')
    } finally {
      setChecking(false)
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <form
          className="w-full max-w-sm space-y-4 rounded-3xl border border-neutral-800 bg-neutral-950/80 p-6"
          onSubmit={(e) => {
            e.preventDefault()
            void login()
          }}
        >
          <div>
            <h1 className="text-xl font-bold">QRNot Yönetim</h1>
            <p className="mt-1 text-sm text-neutral-400">Siparişler, gelir, QR&apos;lar ve kullanıcılar tek yerde.</p>
          </div>
          <input className={input} type="password" autoFocus placeholder="Admin şifresi" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className={`${btn} w-full bg-cyan-500 py-3 text-neutral-950`} disabled={!password || checking}>
            {checking ? 'Kontrol ediliyor…' : 'Giriş yap'}
          </button>
        </form>
      </div>
    )
  }

  const current = ALL_TABS.find((t) => t.key === tab)!

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 lg:grid lg:grid-cols-[13rem_1fr] lg:gap-8">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 lg:mx-0 lg:block lg:space-y-5 lg:overflow-visible lg:px-0">
          {SECTIONS.map((section) => (
            <div key={section.title || 'top'} className="contents lg:block">
              {section.title && <p className="hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 lg:block">{section.title}</p>}
              {section.tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => go(t.key)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition lg:w-full ${
                    tab === t.key ? 'bg-white font-semibold text-neutral-950' : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span aria-hidden>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          ))}
          <button onClick={() => logout()} className="shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-800 lg:mt-6 lg:w-full lg:text-left">
            ⎋ Çıkış
          </button>
        </nav>
      </aside>

      <main className="min-w-0">
        <h1 className="mb-5 text-2xl font-bold">
          {current.icon} {current.label}
        </h1>
        {error && <p className="mb-4 rounded-xl border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-300">{error}</p>}
        {tab === 'home' && (
          <div className="space-y-6">
            <AdminPushCard password={password} />
            <HomeTab call={call} go={go} />
          </div>
        )}
        {tab === 'orders' && <OrdersTab key={orderStatus} call={call} initialStatus={orderStatus} />}
        {tab === 'quotes' && <QuotesTab call={call} />}
        {tab === 'revenue' && <RevenueTab call={call} password={password} />}
        {tab === 'etsy' && <EtsyTab call={call} />}
        {tab === 'qrs' && <QrsTab password={password} />}
        {tab === 'production' && <ProductionTab call={call} />}
        {tab === 'users' && <UsersTab password={password} />}
        {tab === 'corporate' && <CorporateTab password={password} />}
        {tab === 'dpp' && <DppTab password={password} />}
        {tab === 'analytics' && <AnalyticsTab password={password} />}
      </main>
    </div>
  )
}
