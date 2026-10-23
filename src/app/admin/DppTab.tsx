'use client'

import { useCallback, useEffect, useState } from 'react'
import { DPP_PLANS, type DppPlan } from '@/lib/dpp/types'
import { btn, input } from './ShopTabs'

// Admin → DPP firmaları: firma aç (yönetici hesabıyla), paket ve ürün sınırı, aktif/pasif, şifre sıfırlama, silme.

interface Company {
  id: string
  code: string
  name: string
  country: string
  email: string
  phone: string
  plan: DppPlan
  product_limit: number
  is_active: boolean
  admin_note: string
  created_at: string
  products: number
  published: number
  items: number
  scans30: number
  users: Array<{ id: string; email: string; role: string; is_active: boolean; last_login_at: string | null }> | null
  demo_expires_at: string | null
  demo_days_left: number | null
  panel_access: boolean
  demo_request: { name: string; email: string; phone: string; sector: string; products: string; message: string; created_at: string } | null
}

interface Safety {
  backups: Array<{ day: string; status: string; size_bytes: number; counts: Record<string, number>; finished_at: string | null }>
  trashFiles: number
  audit30: number
}

const card = 'rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5'
const field = input.replace('w-full ', '')

async function post<T>(password: string, action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch('/api/admin/dpp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, action, ...payload }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'İşlem başarısız')
  return data as T
}

export function DppTab({ password }: { password: string }) {
  const [companies, setCompanies] = useState<Company[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [secret, setSecret] = useState<{ title: string; email: string; password: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', ownerEmail: '', ownerName: '', phone: '', country: 'TR', plan: 'pilot' as DppPlan, note: '' })
  const [search, setSearch] = useState('')
  const [safety, setSafety] = useState<Safety | null>(null)

  const load = useCallback(async () => {
    try {
      setCompanies((await post<{ companies: Company[] }>(password, 'companies.list')).companies)
      setSafety(await post<Safety>(password, 'safety.status').catch(() => null))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Liste alınamadı')
    }
  }, [password])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const act = async (task: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await task()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setBusy(false)
    }
  }

  const panelUrl = typeof window !== 'undefined' ? `${window.location.origin}/dpp/panel` : '/dpp/panel'
  const list = (companies || []).filter((c) => !search.trim() || `${c.name} ${c.code} ${c.email}`.toLowerCase().includes(search.trim().toLowerCase()))
  const totals = (companies || []).reduce((s, c) => ({ products: s.products + c.products, items: s.items + c.items, scans: s.scans + c.scans30 }), { products: 0, items: 0, scans: 0 })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Firma', companies?.length ?? '…'],
          ['Aktif ürün pasaportu', totals.products],
          ['Seri numaralı ürün', totals.items],
          ['Okutma · 30 gün', totals.scans],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <a href="/dpp" target="_blank" className={`${btn} bg-neutral-800`}>
          Tanıtım sayfası ↗
        </a>
        <a href="/dpp/panel" target="_blank" className={`${btn} bg-neutral-800`}>
          Firma paneli girişi ↗
        </a>
      </div>

      {error && <p className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-300">{error}</p>}
      {secret && (
        <div className="rounded-2xl border border-emerald-700 bg-emerald-950/40 p-4 text-sm">
          <p className="font-semibold text-emerald-300">{secret.title} — bu şifre bir daha gösterilmeyecek</p>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-emerald-100">{`Panel: ${panelUrl}\nE-posta: ${secret.email}\nGeçici şifre: ${secret.password}`}</pre>
          <div className="mt-3 flex gap-2">
            <button className={`${btn} bg-emerald-600`} onClick={() => void navigator.clipboard.writeText(`QRNot DPP Paneli\n${panelUrl}\nE-posta: ${secret.email}\nGeçici şifre: ${secret.password}\n(İlk girişte kendi şifrenizi belirleyeceksiniz.)`)}>
              Kopyala
            </button>
            <button className={`${btn} bg-neutral-800`} onClick={() => setSecret(null)}>
              Kapat
            </button>
          </div>
        </div>
      )}

      <details className={`${card} group`}>
        <summary className="flex cursor-pointer list-none items-center justify-between">
          <span>
            <span className="text-lg font-semibold">＋ Yeni DPP firması aç</span>
            <span className="block text-sm text-neutral-400">Firma ve yönetici hesabı oluşturulur; geçici şifre bir kez gösterilir.</span>
          </span>
          <span className="text-neutral-500 transition group-open:rotate-90">›</span>
        </summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className={input} placeholder="Firma adı *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={input} type="email" placeholder="Yönetici e-postası *" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
          <input className={input} placeholder="Yönetici adı soyadı" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
          <input className={input} placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className={input} placeholder="Ülke (TR)" maxLength={2} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} />
          <select className={input} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as DppPlan })}>
            {Object.entries(DPP_PLANS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label} · {v.productLimit >= 100000 ? 'sınırsız' : `${v.productLimit} ürün`}
              </option>
            ))}
          </select>
          <textarea className={`${input} sm:col-span-2 lg:col-span-3`} placeholder="İç not (sözleşme, fiyat, iletişim…)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
        <button
          className={`${btn} mt-3 bg-cyan-500 text-neutral-950`}
          disabled={busy || !form.name || !form.ownerEmail}
          onClick={() =>
            void act(async () => {
              const res = await post<{ code: string; ownerEmail: string; password: string }>(password, 'companies.create', form)
              setSecret({ title: `${form.name} (${res.code}) açıldı`, email: res.ownerEmail, password: res.password })
              setForm({ name: '', ownerEmail: '', ownerName: '', phone: '', country: 'TR', plan: 'pilot', note: '' })
            })
          }
        >
          Firmayı aç
        </button>
      </details>

      <section className={`${card} space-y-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">🛡️ Veri güvenliği</h3>
          <button
            className={`${btn} ml-auto bg-neutral-800`}
            disabled={busy}
            onClick={() =>
              void act(async () => {
                await post(password, 'backup.run')
              })
            }
          >
            Şimdi yedekle
          </button>
        </div>
        <p className="text-sm text-neutral-400">
          Tüm DPP verisi her gün otomatik yedeklenir (30 gün saklanır). Silinen dosyalar 30 gün çöp kutusunda bekler. Her değişiklik işlem kaydına yazılır.
        </p>
        {safety && (
          <div className="grid gap-3 text-sm md:grid-cols-[1fr_auto_auto]">
            <ul className="space-y-1">
              {safety.backups.length === 0 && <li className="text-amber-300">Henüz yedek yok</li>}
              {safety.backups.map((b) => (
                <li key={b.day} className={b.status === 'ok' ? 'text-emerald-300' : 'text-amber-300'}>
                  {b.day} · {b.status === 'ok' ? '✓' : b.status} · {(b.size_bytes / 1024).toFixed(0)} KB · {b.counts?.dpp_products ?? 0} ürün, {b.counts?.dpp_companies ?? 0} firma
                </li>
              ))}
            </ul>
            <p>Çöp kutusu: <b>{safety.trashFiles}</b> dosya</p>
            <p>İşlem kaydı (30 gün): <b>{safety.audit30}</b></p>
          </div>
        )}
      </section>

      <section className={`${card} space-y-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">Firmalar</h3>
          <input className={`${field} ml-auto w-full max-w-xs`} placeholder="Firma, kod ya da e-posta ara…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {companies === null ? (
          <p className="text-neutral-500">Yükleniyor…</p>
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-neutral-500">{companies.length ? 'Aramaya uyan firma yok' : 'Henüz DPP firması yok'}</p>
        ) : (
          <div className="divide-y divide-neutral-800 overflow-hidden rounded-2xl border border-neutral-800">
            {list.map((c) => (
              <CompanyRow key={c.id} c={c} password={password} busy={busy} act={act} onSecret={setSecret} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CompanyRow({
  c,
  password,
  busy,
  act,
  onSecret,
}: {
  c: Company
  password: string
  busy: boolean
  act: (task: () => Promise<void>) => Promise<void>
  onSecret: (s: { title: string; email: string; password: string }) => void
}) {
  const [plan, setPlan] = useState<DppPlan>(c.plan)
  const [limit, setLimit] = useState(String(c.product_limit))
  const [note, setNote] = useState(c.admin_note)
  const [newUser, setNewUser] = useState('')

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm hover:bg-neutral-900">
        <span className="font-semibold">{c.name}</span>
        <span className="font-mono text-xs text-neutral-500">{c.code}</span>
        <span className="rounded-full border border-sky-800 px-2 py-0.5 text-[11px] text-sky-300">{DPP_PLANS[c.plan]?.label || c.plan}</span>
        {!c.is_active && <span className="rounded-full border border-red-800 px-2 py-0.5 text-[11px] text-red-300">Pasif</span>}
        {c.is_active && !c.panel_access && <span className="rounded-full border border-orange-700 px-2 py-0.5 text-[11px] text-orange-300">🔒 Panel kilitli · pasaportlar açık</span>}
        {c.demo_expires_at && (
          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${(c.demo_days_left ?? 0) <= 0 ? 'border-red-800 text-red-300' : 'border-amber-700 text-amber-300'}`}>
            🧪 {(c.demo_days_left ?? 0) <= 0 ? 'Demo süresi doldu' : `Demo · ${c.demo_days_left} gün`}
          </span>
        )}
        <span className="ml-auto text-xs text-neutral-400">
          {c.products}/{c.product_limit >= 100000 ? '∞' : c.product_limit} ürün · {c.published} yayında · {c.items.toLocaleString('tr-TR')} seri · {c.scans30} okutma
        </span>
        <span className="text-neutral-600 transition group-open:rotate-90">›</span>
      </summary>
      <div className="grid gap-4 bg-neutral-950/60 px-4 py-4 text-sm lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-neutral-400">
            {c.email || '—'} · {c.phone || '—'} · {c.country} · açılış {new Date(c.created_at).toLocaleDateString('tr-TR')}
          </p>
          {c.demo_request && (
            <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-3 text-xs text-amber-100">
              <p className="font-semibold text-amber-300">🧪 Web sitesinden demo talebi · {new Date(c.demo_request.created_at).toLocaleString('tr-TR')}</p>
              <p className="mt-1">
                {c.demo_request.name} · {c.demo_request.email} · {c.demo_request.phone || 'telefon yok'} · sektör: {c.demo_request.sector} · ürün: {c.demo_request.products}
              </p>
              {c.demo_request.message && <p className="mt-1 text-amber-200/80">“{c.demo_request.message}”</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {c.demo_request.phone && (
                  <a className={`${btn} bg-emerald-700`} href={`https://wa.me/${c.demo_request.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Merhaba ${c.demo_request.name}, QRNot DPP demonuz için yazıyorum.`)}`} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                )}
                {c.demo_expires_at && (
                  <button className={`${btn} bg-neutral-800`} disabled={busy} onClick={() => void act(() => post(password, 'demo.extend', { id: c.id, days: 7 }))}>
                    Demoyu 7 gün uzat
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-neutral-500">
              Paket
              <select
                className={input}
                value={plan}
                onChange={(e) => {
                  const p = e.target.value as DppPlan
                  setPlan(p)
                  setLimit(String(DPP_PLANS[p].productLimit))
                }}
              >
                {Object.entries(DPP_PLANS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-neutral-500">
              Ürün sınırı
              <input className={`${field} w-28`} inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ''))} />
            </label>
          </div>
          <textarea className={input} placeholder="İç not" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button className={`${btn} bg-cyan-500 text-neutral-950`} disabled={busy} onClick={() => void act(() => post(password, 'companies.update', { id: c.id, plan, productLimit: Number(limit), note, isActive: c.is_active }))}>
              Kaydet
            </button>
            <button
              className={`${btn} ${c.is_active ? 'border border-amber-800 text-amber-300' : 'bg-emerald-600'}`}
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  if (c.is_active && !window.confirm(`${c.name} pasifleştirilsin mi? Panel girişi kapanır ve TÜM pasaportları erişilemez olur.`)) return
                  await post(password, 'companies.update', { id: c.id, plan, productLimit: Number(limit), note, isActive: !c.is_active })
                })
              }
            >
              {c.is_active ? 'Pasifleştir' : 'Aktifleştir'}
            </button>
            <button
              className={`${btn} border border-orange-800 text-orange-300`}
              disabled={busy || !c.is_active}
              title="Ödeme gecikmesi ya da sözleşme sonu: panel girişi kapanır, yayınlanmış pasaportlar açık kalır"
              onClick={() =>
                void act(async () => {
                  if (c.panel_access && !window.confirm(`${c.name} paneli kilitlensin mi? Kullanıcılar giriş yapamaz; yayınlanmış pasaportlar açık kalır.`)) return
                  await post(password, 'companies.update', { id: c.id, plan, productLimit: Number(limit), note, isActive: true, panelAccess: !c.panel_access })
                })
              }
            >
              {c.panel_access ? '🔒 Paneli kilitle' : '🔓 Panel kilidini aç'}
            </button>
            <button
              className={`${btn} border border-red-800 text-red-300`}
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  const typed = window.prompt(`${c.name} ve TÜM ürün pasaportları, belgeleri, seri numaraları silinecek. Silmeden önce tam kopyası alınır, dosyalar 30 gün çöp kutusunda bekler. Yayınlanmış pasaportu olan firma önce pasife alınmalıdır. Onaylamak için firma kodunu yaz: ${c.code}`)
                  if (typed !== c.code) return
                  await post(password, 'companies.delete', { id: c.id, confirm: typed })
                })
              }
            >
              Firmayı sil
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Kullanıcılar</p>
          {(c.users || []).map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800 px-3 py-2">
              <span className="break-all">
                {u.email} <span className="text-xs text-neutral-500">· {u.role}{u.is_active ? '' : ' · pasif'} · son giriş {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('tr-TR') : '—'}</span>
              </span>
              <button
                className={`${btn} bg-neutral-800 text-xs`}
                disabled={busy}
                onClick={() =>
                  void act(async () => {
                    if (!window.confirm(`${u.email} için yeni geçici şifre üretilsin mi?`)) return
                    const res = await post<{ password: string }>(password, 'users.resetPassword', { userId: u.id })
                    onSecret({ title: `${u.email} şifresi sıfırlandı`, email: u.email, password: res.password })
                  })
                }
              >
                Şifre sıfırla
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input className={input} type="email" placeholder="Yeni yönetici e-postası" value={newUser} onChange={(e) => setNewUser(e.target.value)} />
            <button
              className={`${btn} bg-neutral-800`}
              disabled={busy || !newUser}
              onClick={() =>
                void act(async () => {
                  const res = await post<{ email: string; password: string }>(password, 'users.add', { id: c.id, email: newUser, role: 'owner' })
                  onSecret({ title: `${c.name} için yönetici eklendi`, email: res.email, password: res.password })
                  setNewUser('')
                })
              }
            >
              Ekle
            </button>
          </div>
        </div>
      </div>
    </details>
  )
}
