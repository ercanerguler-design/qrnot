'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MsgKey } from '@/lib/dpp/i18n'
import { LangSelect, PanelI18nProvider, useT } from './i18n'
import Overview from './Overview'
import ProductEditor from './ProductEditor'
import Products from './Products'
import Settings from './Settings'
import { Alert, authApi, Button, Field, inputCls } from './ui'

// DPP firma paneli: giriş, ilk girişte şifre değiştirme ve sol menülü uygulama kabuğu (8 dil).

export interface Me {
  id: string
  email: string
  name: string
  role: 'owner' | 'editor' | 'viewer'
  mustChangePassword: boolean
  companyId: string
  companyName: string
  companyCode: string
  plan: string
  demoEndsAt: string | null
  demoDaysLeft: number | null
}

export type View = { page: 'overview' } | { page: 'products' } | { page: 'product'; id: string | null; tab?: string } | { page: 'company' } | { page: 'users' } | { page: 'account' }

const NAV: Array<{ page: View['page']; icon: string; label: MsgKey; ownerOnly?: boolean }> = [
  { page: 'overview', icon: '📊', label: 'nav_overview' },
  { page: 'products', icon: '📦', label: 'nav_products' },
  { page: 'company', icon: '🏢', label: 'nav_company' },
  { page: 'users', icon: '👥', label: 'nav_team', ownerOnly: true },
  { page: 'account', icon: '🔑', label: 'nav_account' },
]

function viewFromUrl(): View {
  const p = new URLSearchParams(window.location.search)
  const page = p.get('v')
  if (page === 'product') return { page: 'product', id: p.get('id'), tab: p.get('tab') || undefined }
  if (page === 'products' || page === 'company' || page === 'users' || page === 'account') return { page }
  return { page: 'overview' }
}

export default function PanelApp() {
  return (
    <PanelI18nProvider>
      <Shell />
    </PanelI18nProvider>
  )
}

function Shell() {
  const { t } = useT()
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const [view, setView] = useState<View>({ page: 'overview' })

  const loadMe = useCallback(async () => {
    const res = await fetch('/api/dpp/auth', { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    setMe(res.ok ? (data.user as Me) : null)
  }, [])

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setView(viewFromUrl())
      void loadMe()
    })
    const onLogout = () => setMe(null)
    const onPop = () => setView(viewFromUrl())
    window.addEventListener('dpp:logout', onLogout)
    window.addEventListener('popstate', onPop)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('dpp:logout', onLogout)
      window.removeEventListener('popstate', onPop)
    }
  }, [loadMe])

  const go = useCallback((next: View) => {
    setView(next)
    const url = new URL(window.location.href)
    url.search = ''
    if (next.page !== 'overview') url.searchParams.set('v', next.page)
    if (next.page === 'product' && next.id) url.searchParams.set('id', next.id)
    if (next.page === 'product' && next.tab) url.searchParams.set('tab', next.tab)
    window.history.pushState(null, '', url)
    window.scrollTo({ top: 0 })
  }, [])

  const logout = async () => {
    await authApi({ action: 'logout' }).catch(() => undefined)
    setMe(null)
  }

  if (me === undefined) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">{t('loading')}</div>
  if (me === null) return <Login onDone={loadMe} />
  if (me.mustChangePassword) return <FirstPassword me={me} onDone={loadMe} />

  const active = view.page === 'product' ? 'products' : view.page

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0f3d5e] text-xs font-bold text-white">DPP</span>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-semibold">{me.companyName}</p>
              <p className="truncate text-xs text-slate-500">{t('app_subtitle')}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span className="hidden text-slate-500 md:inline">
              {me.email} · {t(`role_${me.role}`)}
            </span>
            <LangSelect />
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>

      {me.demoEndsAt && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-amber-950">
            <span>🧪 {t('demo_banner', { days: me.demoDaysLeft ?? 0 })}</span>
            <a
              href={`https://wa.me/905433929230?text=${encodeURIComponent(`QRNot DPP demo: ${me.companyName} (${me.companyCode})`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600"
            >
              {t('demo_upgrade')}
            </a>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-8">
        <nav className="-mx-4 mb-5 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:mb-0 lg:block lg:space-y-1 lg:self-start lg:px-0">
          {NAV.filter((n) => !n.ownerOnly || me.role === 'owner').map((n) => (
            <button
              key={n.page}
              type="button"
              onClick={() => go({ page: n.page } as View)}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition lg:w-full ${
                active === n.page ? 'bg-[#0f3d5e] font-semibold text-white' : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <span aria-hidden>{n.icon}</span>
              {t(n.label)}
            </button>
          ))}
          <a href="/dpp" target="_blank" className="hidden rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-slate-200/60 lg:mt-6 lg:block">
            {t('nav_guide')}
          </a>
        </nav>

        <main className="min-w-0">
          {view.page === 'overview' && <Overview go={go} me={me} />}
          {view.page === 'products' && <Products go={go} me={me} />}
          {view.page === 'product' && <ProductEditor key={view.id || 'new'} productId={view.id} initialTab={view.tab} go={go} me={me} />}
          {(view.page === 'company' || view.page === 'users' || view.page === 'account') && <Settings section={view.page} me={me} />}
        </main>
      </div>
    </div>
  )
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { t } = useT()
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-sky-50 px-4 py-10 text-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <LangSelect />
        </div>
        <div className="mb-6 text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-[#0f3d5e] text-sm font-bold text-white">DPP</span>
          <h1 className="mt-3 text-xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
        <p className="mt-4 text-center text-xs text-slate-500">
          {t('footer_brand')} ·{' '}
          <a href="/dpp" className="underline">
            {t('footer_info')}
          </a>
        </p>
      </div>
    </div>
  )
}

function Login({ onDone }: { onDone: () => Promise<void> }) {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await authApi({ action: 'login', email, password })
      await onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('err_login_failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame title={t('login_title')} subtitle={t('login_sub')}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('f_email')}>
          <input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
        </Field>
        <Field label={t('f_password')}>
          <input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" variant="primary" className="w-full py-3" disabled={busy}>
          {busy ? t('login_busy') : t('login_btn')}
        </Button>
        <p className="text-center text-xs text-slate-500">{t('login_forgot')}</p>
      </form>
    </AuthFrame>
  )
}

function FirstPassword({ me, onDone }: { me: Me; onDone: () => Promise<void> }) {
  const { t } = useT()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (next !== again) return setError(t('err_pw_mismatch'))
    setBusy(true)
    setError(null)
    try {
      await authApi({ action: 'password', current, next })
      await onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('err_pw_change'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame title={t('fp_title')} subtitle={t('fp_sub', { email: me.email })}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('fp_temp')}>
          <input className={inputCls} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label={t('f_new_pw')} hint={t('hint_min8')}>
          <input className={inputCls} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required />
        </Field>
        <Field label={t('f_new_pw_again')}>
          <input className={inputCls} type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} minLength={8} required />
        </Field>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" variant="primary" className="w-full py-3" disabled={busy}>
          {busy ? t('saving') : t('fp_btn')}
        </Button>
      </form>
    </AuthFrame>
  )
}
