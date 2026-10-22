'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import QRDisplay from '@/components/QRDisplay'
import { btn, input } from './ShopTabs'

// Admin konsolunun QR, kullanıcı ve kurumsal panel sekmeleri (eski tek sayfalık admin panelinin yerini alır).

interface AdminQRItem {
  slug: string
  is_demo: boolean
  order_type: 'demo' | 'trial' | 'individual' | 'corporate'
  is_active: boolean
  is_claimed: boolean
  title: string
  play_count: number
  recording_count: number
  recording_limit: number
  video_recording_count: number
  video_recording_limit: number
  video_max_seconds: number | null
  created_at: string
}

interface AdminStats {
  totalQrs: number
  claimedQrs: number
  trialQrs: number
  individualQrs: number
  corporateQrs: number
  demoQrs: number
  registeredUsers: number
  individualSoldSlots: number
  corporateSoldSlots: number
}

interface AdminUser {
  id: string
  email: string
  accountType: 'individual' | 'corporate'
  freeSlots: number
  paidSlots: number
  usedSlots: number
  remainingSlots: number
  premiumUntil: string | null
  createdAt: string
}

type Limits = { recordingLimit: number; videoRecordingLimit: number; videoMaxSeconds: number | null }

const card = 'rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5'
const chip = 'rounded-full border px-2 py-0.5 text-[11px]'
const PAGE = 60
const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 })

async function adminPost<T>(path: string, password: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, ...body }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'İşlem başarısız')
  return data as T
}

function useAdminList(password: string) {
  const [items, setItems] = useState<AdminQRItem[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminPost<{ items: AdminQRItem[]; users: AdminUser[]; stats: AdminStats }>('/api/admin/qr/list', password)
      setItems(data.items || [])
      setUsers(data.users || [])
      setStats(data.stats || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Liste alınamadı')
    } finally {
      setLoading(false)
    }
  }, [password])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { items, users, stats, loading, error, setError, load }
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null
  return <p className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-300">{error}</p>
}

/* ───────────── QR kodları ───────────── */

export function QrsTab({ password }: { password: string }) {
  const { items, stats, loading, error, setError, load } = useAdminList(password)
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<'all' | 'claimed' | 'blank' | 'individual' | 'corporate' | 'demo'>('claimed')
  const [shown, setShown] = useState(PAGE)
  const [busy, setBusy] = useState<string | null>(null)
  const [limits, setLimits] = useState<Record<string, Limits>>({})

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (kind === 'claimed' && !(item.is_claimed && !item.is_demo)) return false
      if (kind === 'blank' && (item.is_claimed || item.is_demo)) return false
      if (kind === 'individual' && (item.is_demo || item.order_type !== 'individual')) return false
      if (kind === 'corporate' && (item.is_demo || item.order_type !== 'corporate')) return false
      if (kind === 'demo' && !item.is_demo) return false
      return !q || item.slug.toLowerCase().includes(q) || (item.title || '').toLowerCase().includes(q)
    })
  }, [items, kind, search])

  const run = async (key: string, task: () => Promise<unknown>) => {
    setBusy(key)
    setError(null)
    try {
      await task()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setBusy(null)
    }
  }

  const limitFor = (item: AdminQRItem): Limits =>
    limits[item.slug] || {
      recordingLimit: Number(item.recording_limit ?? 3),
      videoRecordingLimit: Number(item.video_recording_limit ?? 2),
      videoMaxSeconds: item.video_max_seconds === null ? null : Number(item.video_max_seconds),
    }
  const setLimit = (item: AdminQRItem, patch: Partial<Limits>) => setLimits((cur) => ({ ...cur, [item.slug]: { ...limitFor(item), ...patch } }))

  const exportList = async (exportType: 'individual' | 'corporate') => {
    setBusy(`export-${exportType}`)
    setError(null)
    try {
      const res = await fetch('/api/admin/qr/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, exportType }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Liste indirilemedi')
      const href = URL.createObjectURL(await res.blob())
      const link = document.createElement('a')
      link.href = href
      link.download = `qr-list-${exportType}.csv`
      link.click()
      setTimeout(() => URL.revokeObjectURL(href), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Liste indirilemedi')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ['Toplam QR', stats.totalQrs - stats.demoQrs],
            ['Sahiplenilmiş', items.filter((i) => i.is_claimed && !i.is_demo).length],
            ['Boş (stok)', items.filter((i) => !i.is_claimed && !i.is_demo).length],
            ['Bireysel', stats.individualQrs],
            ['Kurumsal', stats.corporateQrs],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      <CreateQrCard password={password} onCreated={load} />

      <section className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${input.replace('w-full ', '')} w-full max-w-xs sm:w-72`} placeholder="Kod ya da başlık ara…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className={`${input.replace('w-full ', '')} w-auto`} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="all">Tümü</option>
            <option value="claimed">Sahiplenilmiş</option>
            <option value="blank">Boş (stok)</option>
            <option value="individual">Bireysel</option>
            <option value="corporate">Kurumsal</option>
            <option value="demo">Demo</option>
          </select>
          <button className={`${btn} bg-neutral-800`} onClick={() => void load()} disabled={loading}>
            {loading ? 'Yükleniyor…' : '↻ Yenile'}
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            <button className={`${btn} bg-neutral-800`} disabled={busy !== null} onClick={() => void exportList('individual')}>
              ⬇ Bireysel liste
            </button>
            <button className={`${btn} bg-neutral-800`} disabled={busy !== null} onClick={() => void exportList('corporate')}>
              ⬇ Kurumsal liste
            </button>
          </div>
        </div>
        <ErrorBox error={error} />
        <p className="text-xs text-neutral-500">{filtered.length} kayıt</p>

        <div className="divide-y divide-neutral-800 overflow-hidden rounded-2xl border border-neutral-800">
          {filtered.length === 0 && <p className="p-6 text-center text-neutral-500">{loading ? 'Yükleniyor…' : 'Kayıt yok'}</p>}
          {filtered.slice(0, shown).map((item) => {
            const l = limitFor(item)
            return (
              <details key={item.slug} className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm hover:bg-neutral-900">
                  <span className="font-mono font-semibold">{item.slug}</span>
                  <span className="min-w-0 flex-1 truncate text-neutral-400">{item.title || 'Başlıksız'}</span>
                  {item.is_demo ? (
                    <span className={`${chip} border-amber-800 text-amber-300`}>Demo</span>
                  ) : (
                    <span className={`${chip} ${item.order_type === 'corporate' ? 'border-emerald-800 text-emerald-300' : 'border-violet-800 text-violet-300'}`}>
                      {item.order_type === 'corporate' ? 'Kurumsal' : item.order_type === 'trial' ? 'Eski deneme' : 'Bireysel'}
                    </span>
                  )}
                  <span className={`${chip} ${item.is_claimed ? 'border-sky-800 text-sky-300' : 'border-neutral-700 text-neutral-400'}`}>
                    {item.is_claimed ? 'Sahiplenildi' : 'Boş'}
                  </span>
                  {!item.is_active && <span className={`${chip} border-neutral-700 text-neutral-500`}>Pasif</span>}
                  <span className="text-xs text-neutral-500">▶ {item.play_count}</span>
                  <span className="text-xs text-neutral-600">{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
                  <span className="text-neutral-600 transition group-open:rotate-90">›</span>
                </summary>
                <div className="grid gap-4 bg-neutral-950/60 px-4 py-4 text-sm md:grid-cols-[1fr_auto]">
                  <div className="space-y-2">
                    <p className="text-neutral-400">
                      Ses kaydı: {item.recording_count}/{item.recording_limit} · Video: {item.video_recording_count}/{item.video_recording_limit}
                    </p>
                    <div className="grid max-w-md grid-cols-3 gap-2">
                      <label className="text-xs text-neutral-500">
                        Kayıt hakkı
                        <input className={input} type="number" min={1} value={l.recordingLimit} onChange={(e) => setLimit(item, { recordingLimit: Math.max(1, Number(e.target.value) || 1) })} />
                      </label>
                      <label className="text-xs text-neutral-500">
                        Video hakkı
                        <input className={input} type="number" min={0} value={l.videoRecordingLimit} onChange={(e) => setLimit(item, { videoRecordingLimit: Math.max(0, Number(e.target.value) || 0) })} />
                      </label>
                      <label className="text-xs text-neutral-500">
                        Video süre (sn)
                        <input
                          className={input}
                          type="number"
                          min={1}
                          placeholder="varsayılan"
                          value={l.videoMaxSeconds ?? ''}
                          onChange={(e) => setLimit(item, { videoMaxSeconds: e.target.value.trim() === '' ? null : Math.max(1, Number(e.target.value) || 1) })}
                        />
                      </label>
                    </div>
                    <button
                      className={`${btn} bg-cyan-500 text-neutral-950`}
                      disabled={busy !== null}
                      onClick={() => void run(`limits-${item.slug}`, () => adminPost('/api/admin/qr/limits', password, { slug: item.slug, ...l }))}
                    >
                      {busy === `limits-${item.slug}` ? 'Kaydediliyor…' : 'Hakları kaydet'}
                    </button>
                  </div>
                  <div className="flex flex-wrap content-start gap-2 md:flex-col">
                    <a className={`${btn} bg-neutral-800 text-center`} href={`/q/${item.slug}`} target="_blank" rel="noopener noreferrer">
                      Sayfayı aç ↗
                    </a>
                    <button
                      className={`${btn} border border-amber-800 text-amber-300`}
                      disabled={busy !== null}
                      onClick={() =>
                        window.confirm(`${item.slug} için ses, video, resim ve link içerikleri silinsin mi?`) &&
                        void run(`media-${item.slug}`, () => adminPost('/api/admin/qr/media/delete', password, { slug: item.slug }))
                      }
                    >
                      İçeriği temizle
                    </button>
                    <button
                      className={`${btn} border border-red-800 text-red-300`}
                      disabled={busy !== null}
                      onClick={() =>
                        window.confirm(`${item.slug} kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`) &&
                        void run(`delete-${item.slug}`, () => adminPost('/api/admin/qr/delete', password, { slug: item.slug }))
                      }
                    >
                      QR&apos;ı sil
                    </button>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
        {filtered.length > shown && (
          <button className={`${btn} w-full bg-neutral-800`} onClick={() => setShown((n) => n + PAGE)}>
            Daha fazla göster ({filtered.length - shown})
          </button>
        )}
      </section>
    </div>
  )
}

function CreateQrCard({ password, onCreated }: { password: string; onCreated: () => Promise<void> }) {
  const [orderType, setOrderType] = useState<'individual' | 'corporate'>('individual')
  const [count, setCount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<Array<{ slug: string; qrUrl: string }>>([])
  const min = orderType === 'corporate' ? 100 : 1
  const total = orderType === 'corporate' ? Number((count * 25.99).toFixed(2)) : count * 249

  const create = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminPost<{ created: Array<{ slug: string; qrUrl: string }> }>('/api/qr/create', password, { count, orderType })
      setCreated(data.created || [])
      await onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'QR oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <details className={`${card} group`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span>
          <span className="text-lg font-semibold">＋ Elle QR oluştur</span>
          <span className="block text-sm text-neutral-400">Tek tek ya da kurumsal müşteri için. Ürün stoğu (kolye/anahtarlık) için “Üretim &amp; NFC” sekmesini kullan.</span>
        </span>
        <span className="text-neutral-500 transition group-open:rotate-90">›</span>
      </summary>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(['individual', 'corporate'] as const).map((type) => (
              <button
                key={type}
                className={`${btn} border ${orderType === type ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200' : 'border-neutral-700 bg-neutral-900 text-neutral-300'}`}
                onClick={() => {
                  setOrderType(type)
                  setCount((c) => Math.min(500, Math.max(type === 'corporate' ? 100 : 1, c)))
                }}
              >
                {type === 'corporate' ? 'Kurumsal' : 'Bireysel'}
              </button>
            ))}
          </div>
          <label className="block text-xs text-neutral-500">
            Adet (en az {min}, en fazla 500)
            <input className={input} type="number" min={min} max={500} value={count} onChange={(e) => setCount(Math.min(500, Math.max(min, Number(e.target.value) || min)))} />
          </label>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm">
            <div className="flex justify-between text-neutral-400">
              <span>Birim fiyat</span>
              <span>{orderType === 'corporate' ? `${currency.format(25.99)} / QR` : currency.format(249)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Tahmini toplam</span>
              <span>{currency.format(total)}</span>
            </div>
          </div>
          <ErrorBox error={error} />
          <button className={`${btn} w-full bg-cyan-500 py-3 text-neutral-950`} disabled={loading} onClick={() => void create()}>
            {loading ? 'Oluşturuluyor…' : `${count} QR oluştur`}
          </button>
        </div>
        {created.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{created.length} QR oluşturuldu ✓</p>
              <button className={`${btn} bg-neutral-800`} onClick={() => window.print()}>
                🖨️ Yazdır
              </button>
            </div>
            <div className="grid max-h-[28rem] grid-cols-2 gap-3 overflow-auto sm:grid-cols-3 print:max-h-none print:grid-cols-4">
              {created.map((item) => (
                <div key={item.slug} className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                  <QRDisplay url={item.qrUrl} size={110} />
                  <p className="font-mono text-xs text-neutral-400">{item.slug}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  )
}

/* ───────────── Kullanıcılar ───────────── */

export function UsersTab({ password }: { password: string }) {
  const { users, loading, error, setError, load } = useAdminList(password)
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<'all' | 'individual' | 'corporate' | 'premium'>('all')
  const [shown, setShown] = useState(PAGE)
  const [busy, setBusy] = useState<string | null>(null)
  const [credits, setCredits] = useState<Record<string, number>>({})
  const [resetLinks, setResetLinks] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (kind === 'premium' && !u.premiumUntil) return false
      if ((kind === 'individual' || kind === 'corporate') && u.accountType !== kind) return false
      return !q || u.email.toLowerCase().includes(q)
    })
  }, [users, kind, search])

  const run = async (key: string, task: () => Promise<unknown>, reload = true) => {
    setBusy(key)
    setError(null)
    try {
      await task()
      if (reload) await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className={`${card} space-y-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <input className={`${input.replace('w-full ', '')} w-full max-w-xs sm:w-72`} placeholder="E-posta ara…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={`${input.replace('w-full ', '')} w-auto`} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="all">Tüm kullanıcılar</option>
          <option value="individual">Bireysel</option>
          <option value="corporate">Kurumsal</option>
          <option value="premium">Premium üyeler</option>
        </select>
        <button className={`${btn} bg-neutral-800`} onClick={() => void load()} disabled={loading}>
          {loading ? 'Yükleniyor…' : '↻ Yenile'}
        </button>
        <span className="ml-auto text-xs text-neutral-500">
          {filtered.length} kullanıcı · {users.filter((u) => u.premiumUntil).length} Premium
        </span>
      </div>
      <p className="text-xs text-neutral-500">QR hakkı normalde satın alma ile otomatik eklenir. Buradan elle hak tanımlayabilir, şifre sıfırlama linki üretebilirsin.</p>
      <ErrorBox error={error} />

      <div className="divide-y divide-neutral-800 overflow-hidden rounded-2xl border border-neutral-800">
        {filtered.length === 0 && <p className="p-6 text-center text-neutral-500">{loading ? 'Yükleniyor…' : 'Kullanıcı yok'}</p>}
        {filtered.slice(0, shown).map((user) => (
          <details key={user.id} className="group">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm hover:bg-neutral-900">
              <span className="min-w-0 flex-1 truncate font-medium">{user.email}</span>
              {user.premiumUntil && <span className={`${chip} border-amber-600 text-amber-300`}>⭐ Premium · {new Date(user.premiumUntil).toLocaleDateString('tr-TR')}</span>}
              <span className={`${chip} ${user.accountType === 'corporate' ? 'border-emerald-800 text-emerald-300' : 'border-violet-800 text-violet-300'}`}>
                {user.accountType === 'corporate' ? 'Kurumsal' : 'Bireysel'}
              </span>
              <span className="text-xs text-neutral-400">
                QR hakkı: {user.usedSlots} kullanıldı · {user.remainingSlots} kaldı
              </span>
              <span className="text-xs text-neutral-600">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
              <span className="text-neutral-600 transition group-open:rotate-90">›</span>
            </summary>
            <div className="flex flex-wrap items-end gap-3 bg-neutral-950/60 px-4 py-4 text-sm">
              <label className="text-xs text-neutral-500">
                Hesap tipi
                <select
                  className={input}
                  value={user.accountType}
                  disabled={busy !== null}
                  onChange={(e) => void run(`type-${user.id}`, () => adminPost('/api/admin/user/type', password, { userId: user.id, accountType: e.target.value }))}
                >
                  <option value="individual">Bireysel</option>
                  <option value="corporate">Kurumsal</option>
                </select>
              </label>
              <div className="flex items-end gap-2">
                <label className="text-xs text-neutral-500">
                  QR hakkı ekle
                  <input
                    className={`${input} w-24`}
                    type="number"
                    min={1}
                    value={credits[user.id] ?? 1}
                    onChange={(e) => setCredits((cur) => ({ ...cur, [user.id]: Math.max(1, Number(e.target.value) || 1) }))}
                  />
                </label>
                <button
                  className={`${btn} bg-emerald-600`}
                  disabled={busy !== null}
                  onClick={() => void run(`credit-${user.id}`, () => adminPost('/api/admin/user/credits', password, { userId: user.id, amount: credits[user.id] ?? 1 }))}
                >
                  Ekle
                </button>
              </div>
              <button
                className={`${btn} bg-neutral-800`}
                disabled={busy !== null}
                onClick={() =>
                  void run(
                    `reset-${user.id}`,
                    async () => {
                      const data = await adminPost<{ resetUrl: string }>('/api/admin/user/reset-link', password, { userId: user.id })
                      setResetLinks((cur) => ({ ...cur, [user.id]: data.resetUrl }))
                      await navigator.clipboard.writeText(data.resetUrl).catch(() => undefined)
                    },
                    false
                  )
                }
              >
                Şifre sıfırlama linki
              </button>
              <button
                className={`${btn} border border-red-800 text-red-300`}
                disabled={busy !== null}
                onClick={() =>
                  window.confirm(`${user.email} ve ona bağlı QR kayıtları silinsin mi? Bu işlem geri alınamaz.`) &&
                  void run(`delete-${user.id}`, () => adminPost('/api/admin/user/delete', password, { userId: user.id }))
                }
              >
                Kullanıcıyı sil
              </button>
              {resetLinks[user.id] && <p className="w-full break-all text-xs text-neutral-400">Panoya kopyalandı: {resetLinks[user.id]}</p>}
            </div>
          </details>
        ))}
      </div>
      {filtered.length > shown && (
        <button className={`${btn} w-full bg-neutral-800`} onClick={() => setShown((n) => n + PAGE)}>
          Daha fazla göster ({filtered.length - shown})
        </button>
      )}
    </section>
  )
}

/* ───────────── Kurumsal paneller ───────────── */

interface PlatformOverview {
  sectorOverview: Array<{ sector: string; tenantCount: number; userCount: number; moduleCount: number; activeModuleCount: number; formSubmissionCount: number; countEventCount: number }>
  topModules: Array<{ sector: string; tenantCode: string; moduleSlug: string; moduleType: string; title: string; submissions: number; scans: number }>
  hotelOverview: { moduleCount: number; activeModuleCount: number; hotelUserCount: number; educationUserCount: number }
  panelAdmins: Array<{ realm: string; userId: string; email: string; role: string; tenantCode: string; isActive: boolean }>
  generatedAt: string
}

const SECTOR_LABEL: Record<string, string> = {
  hotel: '🏨 Otel',
  education: '🎓 Eğitim',
  health: '🏥 Sağlık',
  factory: '🏭 Fabrika',
  retail: '🛍️ Perakende',
  logistics: '🚚 Lojistik',
}

export function CorporateTab({ password }: { password: string }) {
  const [data, setData] = useState<PlatformOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [links, setLinks] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await adminPost<PlatformOverview>('/api/admin/platform/overview', password))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Özet alınamadı')
    } finally {
      setLoading(false)
    }
  }, [password])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const resetLink = async (realm: string, userId: string) => {
    const key = `${realm}:${userId}`
    setBusy(key)
    setError(null)
    try {
      const res = await adminPost<{ resetUrl: string }>('/api/admin/sector-user/reset-link', password, { realm, userId })
      setLinks((cur) => ({ ...cur, [key]: res.resetUrl }))
      await navigator.clipboard.writeText(res.resetUrl).catch(() => undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link üretilemedi')
    } finally {
      setBusy(null)
    }
  }

  const admins = (data?.panelAdmins || []).filter((a) => !search.trim() || `${a.email} ${a.tenantCode}`.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <p className="text-sm text-neutral-400">Sektör panellerinin (otel, eğitim, sağlık, fabrika, perakende, lojistik) kullanım özeti.</p>
        <button className={`${btn} ml-auto bg-neutral-800`} onClick={() => void load()} disabled={loading}>
          {loading ? 'Yükleniyor…' : '↻ Yenile'}
        </button>
      </div>
      <ErrorBox error={error} />
      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 text-sm">
              <p className="font-semibold">{SECTOR_LABEL.hotel} · {SECTOR_LABEL.education}</p>
              <p className="mt-2 text-neutral-400">
                Otel modülü: {data.hotelOverview.activeModuleCount}/{data.hotelOverview.moduleCount} aktif
              </p>
              <p className="text-neutral-400">
                Otel kullanıcı: {data.hotelOverview.hotelUserCount} · Eğitim yönetici: {data.hotelOverview.educationUserCount}
              </p>
            </div>
            {data.sectorOverview.map((row) => (
              <div key={row.sector} className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 text-sm">
                <p className="font-semibold">{SECTOR_LABEL[row.sector] || row.sector}</p>
                <p className="mt-2 text-neutral-400">
                  {row.tenantCount} kurum · {row.userCount} kullanıcı
                </p>
                <p className="text-neutral-400">
                  Modül {row.activeModuleCount}/{row.moduleCount} aktif · Form {row.formSubmissionCount} · Sayım {row.countEventCount}
                </p>
              </div>
            ))}
          </div>

          {data.topModules.length > 0 && (
            <section className={card}>
              <h3 className="mb-3 font-semibold">En çok kullanılan modüller</h3>
              <div className="max-h-72 divide-y divide-neutral-800 overflow-auto text-sm">
                {data.topModules.map((m) => (
                  <div key={`${m.sector}-${m.moduleSlug}`} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>
                      {SECTOR_LABEL[m.sector] || m.sector} · <span className="text-neutral-400">{m.tenantCode}</span> · {m.title || m.moduleType}
                    </span>
                    <span className="text-neutral-500">
                      Form {m.submissions} · Okutma {m.scans}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={`${card} space-y-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">Panel yöneticileri</h3>
              <input className={`${input.replace('w-full ', '')} ml-auto w-full max-w-xs`} placeholder="E-posta ya da kurum kodu…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <p className="text-xs text-neutral-500">Şifresini unutan kurumsal yönetici için sıfırlama linki üret; link panoya kopyalanır.</p>
            <div className="max-h-96 divide-y divide-neutral-800 overflow-auto text-sm">
              {admins.length === 0 && <p className="py-4 text-center text-neutral-500">Kayıt yok</p>}
              {admins.map((a) => {
                const key = `${a.realm}:${a.userId}`
                return (
                  <div key={key} className="py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="break-all">
                        {a.email} <span className="text-neutral-500">· {SECTOR_LABEL[a.realm] || a.realm} · {a.role}{a.tenantCode ? ` · ${a.tenantCode}` : ''}</span>
                      </span>
                      <button className={`${btn} bg-neutral-800 text-xs`} disabled={busy !== null} onClick={() => void resetLink(a.realm, a.userId)}>
                        {busy === key ? 'Üretiliyor…' : 'Sıfırlama linki'}
                      </button>
                    </div>
                    {links[key] && <p className="mt-1 break-all text-xs text-neutral-400">Panoya kopyalandı: {links[key]}</p>}
                  </div>
                )
              })}
            </div>
          </section>
          <p className="text-xs text-neutral-600">Son güncelleme: {new Date(data.generatedAt).toLocaleString('tr-TR')}</p>
        </>
      )}
    </div>
  )
}
