'use client'

import { useCallback, useEffect, useState } from 'react'
import Overview from './Overview'
import ProductEditor from './ProductEditor'
import Products from './Products'
import Settings from './Settings'
import { Alert, Button, Field, inputCls } from './ui'

// DPP firma paneli: giriş, ilk girişte şifre değiştirme ve sol menülü uygulama kabuğu.

export interface Me {
  id: string
  email: string
  name: string
  role: 'owner' | 'editor' | 'viewer'
  mustChangePassword: boolean
  companyId: string
  companyName: string
  companyCode: string
}

export type View = { page: 'overview' } | { page: 'products' } | { page: 'product'; id: string | null } | { page: 'company' } | { page: 'users' } | { page: 'account' }

const NAV: Array<{ page: View['page']; icon: string; label: string; ownerOnly?: boolean }> = [
  { page: 'overview', icon: '📊', label: 'Genel bakış' },
  { page: 'products', icon: '📦', label: 'Ürün pasaportları' },
  { page: 'company', icon: '🏢', label: 'Firma bilgileri' },
  { page: 'users', icon: '👥', label: 'Ekip', ownerOnly: true },
  { page: 'account', icon: '🔑', label: 'Hesabım' },
]

const ROLE_LABEL = { owner: 'Yönetici', editor: 'Editör', viewer: 'İzleyici' }

function viewFromUrl(): View {
  const p = new URLSearchParams(window.location.search)
  const page = p.get('v')
  if (page === 'product') return { page: 'product', id: p.get('id') }
  if (page === 'products' || page === 'company' || page === 'users' || page === 'account') return { page }
  return { page: 'overview' }
}

export default function PanelApp() {
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
    window.history.pushState(null, '', url)
    window.scrollTo({ top: 0 })
  }, [])

  const logout = async () => {
    await fetch('/api/dpp/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
    setMe(null)
  }

  if (me === undefined) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Yükleniyor…</div>
  if (me === null) return <Login onDone={loadMe} />
  if (me.mustChangePassword) return <FirstPassword me={me} onDone={loadMe} />

  const active = view.page === 'product' ? 'products' : view.page

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0f3d5e] text-xs font-bold text-white">DPP</span>
            <div className="leading-tight">
              <p className="font-semibold">{me.companyName}</p>
              <p className="text-xs text-slate-500">Dijital Ürün Pasaportu · QRNot</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">
              {me.email} · {ROLE_LABEL[me.role]}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              Çıkış
            </Button>
          </div>
        </div>
      </header>

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
              {n.label}
            </button>
          ))}
          <a href="/dpp" target="_blank" className="hidden rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-slate-200/60 lg:mt-6 lg:block">
            DPP rehberi ↗
          </a>
        </nav>

        <main className="min-w-0">
          {view.page === 'overview' && <Overview go={go} me={me} />}
          {view.page === 'products' && <Products go={go} me={me} />}
          {view.page === 'product' && <ProductEditor key={view.id || 'new'} productId={view.id} go={go} me={me} />}
          {(view.page === 'company' || view.page === 'users' || view.page === 'account') && <Settings section={view.page} me={me} />}
        </main>
      </div>
    </div>
  )
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-sky-50 px-4 py-10 text-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-[#0f3d5e] text-sm font-bold text-white">DPP</span>
          <h1 className="mt-3 text-xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
        <p className="mt-4 text-center text-xs text-slate-500">
          QRNot Dijital Ürün Pasaportu ·{' '}
          <a href="/dpp" className="underline">
            Bilgi
          </a>
        </p>
      </div>
    </div>
  )
}

function Login({ onDone }: { onDone: () => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/dpp/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', email, password }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Giriş yapılamadı')
      await onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame title="DPP Paneli" subtitle="Firma hesabınla giriş yap">
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-posta">
          <input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Şifre">
          <input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" variant="primary" className="w-full py-3" disabled={busy}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </Button>
        <p className="text-center text-xs text-slate-500">Şifreni unuttuysan firma yöneticinden ya da QRNot destekten sıfırlama iste.</p>
      </form>
    </AuthFrame>
  )
}

function FirstPassword({ me, onDone }: { me: Me; onDone: () => Promise<void> }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (next !== again) return setError('Yeni şifreler eşleşmiyor')
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/dpp/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'password', current, next }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Şifre değiştirilemedi')
      await onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre değiştirilemedi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame title="Şifreni belirle" subtitle={`${me.email} · ilk giriş için kendi şifreni oluştur`}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Size verilen geçici şifre">
          <input className={inputCls} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label="Yeni şifre" hint="En az 8 karakter">
          <input className={inputCls} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required />
        </Field>
        <Field label="Yeni şifre (tekrar)">
          <input className={inputCls} type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} minLength={8} required />
        </Field>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" variant="primary" className="w-full py-3" disabled={busy}>
          {busy ? 'Kaydediliyor…' : 'Şifreyi kaydet ve devam et'}
        </Button>
      </form>
    </AuthFrame>
  )
}
