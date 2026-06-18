'use client'

import { useState } from 'react'
import QRDisplay from '@/components/QRDisplay'
import Link from 'next/link'

interface CreatedQR {
  slug: string
  qrUrl: string
}

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
  demo_expires_at: string | null
  created_at: string
  updated_at: string
}

interface PlatformSectorOverview {
  sector: 'health' | 'factory' | 'retail' | 'logistics'
  tenantCount: number
  userCount: number
  moduleCount: number
  activeModuleCount: number
  formSubmissionCount: number
  countEventCount: number
}

interface PlatformTopModule {
  sector: 'health' | 'factory' | 'retail' | 'logistics'
  tenantCode: string
  moduleSlug: string
  moduleType: string
  title: string
  submissions: number
  scans: number
}

interface PlatformOverview {
  sectorOverview: PlatformSectorOverview[]
  topModules: PlatformTopModule[]
  hotelOverview: {
    moduleCount: number
    activeModuleCount: number
    hotelUserCount: number
    educationUserCount: number
  }
  qrUsage: Array<{
    slug: string
    title: string
    orderType: string
    playCount: number
    recordingCount: number
    videoRecordingCount: number
    updatedAt: string
  }>
  panelAdmins: Array<{
    realm: 'hotel' | 'education' | 'health' | 'factory' | 'retail' | 'logistics'
    userId: string
    email: string
    role: string
    tenantCode: string
    isActive: boolean
  }>
  generatedAt: string
}

interface AdminStats {
  totalQrs: number
  demoQrs: number
  realQrs: number
  activeQrs: number
  passiveQrs: number
  claimedQrs: number
  trialQrs: number
  individualQrs: number
  corporateQrs: number
  demoSessions: number
  demoCreatedCount: number
  registeredUsers: number
  individualPrice: number
  corporateUnitPrice: number
  corporatePackagePrice: number
  corporatePackageSize: number
  individualSoldSlots: number
  corporateSoldSlots: number
  individualRevenue: number
  corporateRevenue: number
  totalRevenue: number
}

interface AdminUser {
  id: string
  email: string
  accountType: 'individual' | 'corporate'
  freeSlots: number
  paidSlots: number
  usedSlots: number
  remainingSlots: number
  createdAt: string
}

const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 })

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [count, setCount] = useState(1)
  const [orderType, setOrderType] = useState<'individual' | 'corporate'>('individual')
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [clearingMediaSlug, setClearingMediaSlug] = useState<string | null>(null)
  const [limitSavingSlug, setLimitSavingSlug] = useState<string | null>(null)
  const [creditLoadingUserId, setCreditLoadingUserId] = useState<string | null>(null)
  const [typeLoadingUserId, setTypeLoadingUserId] = useState<string | null>(null)
  const [resetLoadingUserId, setResetLoadingUserId] = useState<string | null>(null)
  const [panelResetLoadingKey, setPanelResetLoadingKey] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [platformLoading, setPlatformLoading] = useState(false)
  const [exportLoadingType, setExportLoadingType] = useState<'individual' | 'corporate' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedQR[]>([])
  const [filter, setFilter] = useState<'all' | 'demo' | 'real'>('all')
  const [orderFilter, setOrderFilter] = useState<'all' | 'trial' | 'individual' | 'corporate'>('all')
  const [items, setItems] = useState<AdminQRItem[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [creditValues, setCreditValues] = useState<Record<string, number>>({})
  const [limitValues, setLimitValues] = useState<Record<string, { recordingLimit: number; videoRecordingLimit: number; videoMaxSeconds: number | null }>>({})
  const [resetLinks, setResetLinks] = useState<Record<string, string>>({})
  const [panelResetLinks, setPanelResetLinks] = useState<Record<string, string>>({})
  const [platformOverview, setPlatformOverview] = useState<PlatformOverview | null>(null)

  const loadList = async (nextFilter = filter, nextOrderFilter = orderFilter) => {
    if (!password) return

    setListLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/qr/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, filter: nextFilter, orderType: nextOrderFilter }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Liste alınamadı')
      const nextItems: AdminQRItem[] = data.items || []
      setItems(nextItems)
      setStats(data.stats || null)
      setUsers(data.users || [])
      setLimitValues((current) => {
        const next = { ...current }
        for (const item of nextItems) {
          next[item.slug] = {
            recordingLimit: Number(item.recording_limit ?? 3),
            videoRecordingLimit: Number(item.video_recording_limit ?? 2),
            videoMaxSeconds: item.video_max_seconds === null ? null : Number(item.video_max_seconds),
          }
        }
        return next
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setListLoading(false)
    }
  }

  const handleUpdateLimits = async (slug: string) => {
    if (!password) {
      setError('Limit guncellemek icin admin sifresi gerekli')
      return
    }

    const values = limitValues[slug] || { recordingLimit: 3, videoRecordingLimit: 2, videoMaxSeconds: null }
    const recordingLimit = Math.max(1, Math.floor(Number(values.recordingLimit) || 1))
    const videoRecordingLimit = Math.max(0, Math.floor(Number(values.videoRecordingLimit) || 0))
    const videoMaxSeconds = values.videoMaxSeconds === null ? null : Math.max(1, Math.floor(Number(values.videoMaxSeconds) || 1))

    setLimitSavingSlug(slug)
    setError(null)

    try {
      const res = await fetch('/api/admin/qr/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, slug, recordingLimit, videoRecordingLimit, videoMaxSeconds }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Limit guncellenemedi')

      setLimitValues((current) => ({
        ...current,
        [slug]: {
          recordingLimit: Number(data.recordingLimit),
          videoRecordingLimit: Number(data.videoRecordingLimit),
          videoMaxSeconds: data.videoMaxSeconds === null ? null : Number(data.videoMaxSeconds),
        },
      }))
      await loadList(filter, orderFilter)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLimitSavingSlug(null)
    }
  }

  const handleAddCredits = async (userId: string) => {
    if (!password) {
      setError('Hak yüklemek için admin şifresi gerekli')
      return
    }

    const amount = Math.max(1, Number(creditValues[userId] || 0))
    setCreditLoadingUserId(userId)
    setError(null)

    try {
      const res = await fetch('/api/admin/user/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, userId, amount }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hak yüklenemedi')

      setCreditValues((current) => ({ ...current, [userId]: 1 }))
      await loadList(filter, orderFilter)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setCreditLoadingUserId(null)
    }
  }

  const handleUpdateUserType = async (userId: string, accountType: 'individual' | 'corporate') => {
    if (!password) {
      setError('Kullanıcı tipini güncellemek için admin şifresi gerekli')
      return
    }

    setTypeLoadingUserId(userId)
    setError(null)

    try {
      const res = await fetch('/api/admin/user/type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, userId, accountType }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kullanıcı tipi güncellenemedi')

      await loadList(filter, orderFilter)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setTypeLoadingUserId(null)
    }
  }

  const handleCreateResetLink = async (userId: string) => {
    if (!password) {
      setError('Reset link üretmek için admin şifresi gerekli')
      return
    }

    setResetLoadingUserId(userId)
    setError(null)

    try {
      const res = await fetch('/api/admin/user/reset-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset link oluşturulamadı')

      setResetLinks((current) => ({ ...current, [userId]: data.resetUrl }))
      await navigator.clipboard.writeText(data.resetUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setResetLoadingUserId(null)
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, count, orderType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hata oluştu')
      setCreated(data.created)
      await loadList(filter, orderFilter)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (slug: string) => {
    if (!password) {
      setError('Silme işlemi için admin şifresi gerekli')
      return
    }

    const confirmed = window.confirm(`${slug} kodunu silmek istediğine emin misin? Bu işlem geri alınamaz.`)
    if (!confirmed) return

    setDeletingSlug(slug)
    setError(null)

    try {
      const res = await fetch('/api/admin/qr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, slug }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Silme işlemi başarısız')

      setItems((current) => current.filter((item) => item.slug !== slug))
      setCreated((current) => current.filter((item) => item.slug !== slug))
      await loadList(filter, orderFilter)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setDeletingSlug(null)
    }
  }

  const handleClearMedia = async (slug: string) => {
    if (!password) {
      setError('Medya temizlemek için admin şifresi gerekli')
      return
    }

    const confirmed = window.confirm(`${slug} için ses/video/resim ve link içeriklerini temizlemek istediğine emin misin?`)
    if (!confirmed) return

    setClearingMediaSlug(slug)
    setError(null)

    try {
      const res = await fetch('/api/admin/qr/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, slug }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Medya temizleme işlemi başarısız')

      await loadList(filter, orderFilter)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setClearingMediaSlug(null)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!password) {
      setError('Kullanıcı silmek için admin şifresi gerekli')
      return
    }

    const confirmed = window.confirm(`${email} kullanıcısını ve ona bağlı QR kayıtlarını silmek istediğine emin misin? Bu işlem geri alınamaz.`)
    if (!confirmed) return

    setDeletingUserId(userId)
    setError(null)

    try {
      const res = await fetch('/api/admin/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, userId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kullanıcı silinemedi')

      await loadList(filter, orderFilter)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setDeletingUserId(null)
    }
  }

  const loadPlatformOverview = async () => {
    if (!password) {
      setError('Platform ozeti icin admin sifresi gerekli')
      return
    }

    setPlatformLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/platform/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Platform ozeti alinamadi')
      setPlatformOverview(data as PlatformOverview)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setPlatformLoading(false)
    }
  }

  const handlePrint = () => window.print()

  const handleExportQrList = async (exportType: 'individual' | 'corporate') => {
    if (!password) {
      setError('Excel listesi indirmek icin admin sifresi gerekli')
      return
    }

    setExportLoadingType(exportType)
    setError(null)

    try {
      const res = await fetch('/api/admin/qr/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, exportType }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Excel listesi indirilemedi')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-list-${exportType}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatasi')
    } finally {
      setExportLoadingType(null)
    }
  }

  const handleCreatePanelResetLink = async (realm: string, userId: string) => {
    if (!password) {
      setError('Reset link uretmek icin admin sifresi gerekli')
      return
    }

    const key = `${realm}:${userId}`
    setPanelResetLoadingKey(key)
    setError(null)

    try {
      const res = await fetch('/api/admin/sector-user/reset-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, realm, userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Panel reset link olusturulamadi')

      setPanelResetLinks((current) => ({ ...current, [key]: String(data.resetUrl || '') }))
      await navigator.clipboard.writeText(String(data.resetUrl || ''))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setPanelResetLoadingKey(null)
    }
  }

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
              <label className="block text-neutral-400 text-sm mb-2">Sipariş Tipi</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('individual')
                    setCount((current) => Math.max(1, Math.min(500, current)))
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${orderType === 'individual' ? 'bg-violet-600 text-white border-violet-500' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}
                >
                  Bireysel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('corporate')
                    setCount((current) => Math.max(100, Math.min(500, current)))
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${orderType === 'corporate' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}
                >
                  Kurumsal
                </button>
              </div>
            </div>

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
                Kaç adet? <span className="text-neutral-700">(maks. 500)</span>
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.min(500, Math.max(orderType === 'corporate' ? 100 : 1, Number(e.target.value))))}
                min={orderType === 'corporate' ? 100 : 1}
                max={500}
                className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white rounded-xl px-4 py-3 outline-none transition-colors text-sm"
              />
            </div>

            <div className="bg-neutral-800/70 border border-neutral-700 rounded-xl px-4 py-3 text-neutral-400 text-sm">
              {orderType === 'corporate'
                ? `Kurumsal siparişte minimum 100 QR gerekir. 100 QR = ${currency.format(2599)}.`
                : `Bireysel QR fiyatı ${currency.format(149)} olarak hesaplanır.`}
            </div>

            {orderType === 'corporate' && (
              <div className="bg-emerald-950/30 border border-emerald-900 rounded-xl px-4 py-3 text-emerald-200 text-sm">
                Kurumsal pakette istenirse maksimum kayıt süresi proje bazlı yükseltilebilir.
              </div>
            )}

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span>Birim fiyat</span>
                <span>{orderType === 'corporate' ? `${currency.format(25.99)} / QR` : currency.format(149)}</span>
              </div>
              <div className="flex items-center justify-between text-white font-semibold">
                <span>Tahmini toplam</span>
                <span>{orderType === 'corporate' ? currency.format(Number((count * 25.99).toFixed(2))) : currency.format(count * 149)}</span>
              </div>
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

            <button
              onClick={() => void loadList(filter, orderFilter)}
              disabled={listLoading || !password}
              className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed border border-neutral-700 text-neutral-200 font-medium py-3 rounded-xl transition-all"
            >
              {listLoading ? 'Liste yükleniyor...' : 'QR Listesini Yükle'}
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Toplam QR', value: stats.totalQrs.toString(), tone: 'text-white' },
              { label: 'Ücretsiz Deneme', value: `${stats.trialQrs} aktif slot / ${stats.demoCreatedCount} üretim`, tone: 'text-amber-300' },
              { label: 'Bireysel Satılan Hak', value: `${stats.individualSoldSlots} adet`, tone: 'text-violet-300' },
              { label: 'Kurumsal Satılan Hak', value: `${stats.corporateSoldSlots} adet`, tone: 'text-emerald-300' },
              { label: 'Bireysel Gelir', value: currency.format(stats.individualRevenue), tone: 'text-violet-300' },
              { label: 'Kurumsal Gelir', value: currency.format(stats.corporateRevenue), tone: 'text-emerald-300' },
              { label: 'Toplam Gelir', value: currency.format(stats.totalRevenue), tone: 'text-white' },
              { label: 'Kurumsal QR', value: `${stats.corporateQrs} adet`, tone: 'text-emerald-300' },
              { label: 'Bireysel QR', value: `${stats.individualQrs} adet`, tone: 'text-violet-300' },
              { label: 'Kayıtlı Kullanıcı', value: `${stats.registeredUsers} hesap`, tone: 'text-sky-300' },
            ].map((card) => (
              <div key={card.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <p className="text-neutral-500 text-xs uppercase tracking-[0.18em] mb-2">{card.label}</p>
                <p className={`text-xl font-black ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-white font-semibold">Platform Operasyon Merkezi</h2>
              <p className="text-neutral-500 text-sm">Sektorler bagimsiz calisiyor mu, hangi modul ne kadar kullaniliyor, tek ekrandan denetle.</p>
            </div>
            <button
              onClick={() => void loadPlatformOverview()}
              disabled={platformLoading || !password}
              className="rounded-xl bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 transition-all"
            >
              {platformLoading ? 'Yukleniyor...' : 'Platform Ozetini Yukle'}
            </button>
          </div>

          {platformOverview ? (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {platformOverview.sectorOverview.map((row) => (
                  <div key={row.sector} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs space-y-1">
                    <p className="text-white font-semibold uppercase">{row.sector}</p>
                    <p className="text-neutral-400">Kurum: {row.tenantCount} | Kullanici: {row.userCount}</p>
                    <p className="text-neutral-400">Modul: {row.activeModuleCount}/{row.moduleCount} aktif</p>
                    <p className="text-neutral-400">Form: {row.formSubmissionCount} | Sayim event: {row.countEventCount}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs">
                <p className="text-white font-semibold mb-1">Hotel/Education Operasyon Ozeti</p>
                <p className="text-neutral-400">Hotel modul: {platformOverview.hotelOverview.activeModuleCount}/{platformOverview.hotelOverview.moduleCount} aktif</p>
                <p className="text-neutral-400">Hotel admin/staff: {platformOverview.hotelOverview.hotelUserCount} | Education admin: {platformOverview.hotelOverview.educationUserCount}</p>
              </div>

              <div>
                <p className="text-white font-semibold mb-2">En Cok Kullanilan Sektor Modulleri</p>
                <div className="space-y-2 max-h-72 overflow-auto">
                  {platformOverview.topModules.map((module) => (
                    <div key={`${module.sector}-${module.moduleSlug}`} className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs flex items-center justify-between gap-3">
                      <p className="text-neutral-300">{module.sector} / {module.tenantCode} / {module.title || module.moduleType}</p>
                      <p className="text-neutral-500">Form: {module.submissions} | Sayim: {module.scans}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-white font-semibold mb-2">En Cok Kullanilan QR Kodlar (Ana Sistem)</p>
                <div className="space-y-2 max-h-72 overflow-auto">
                  {platformOverview.qrUsage.map((row) => (
                    <div key={`usage-${row.slug}`} className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs flex items-center justify-between gap-3">
                      <p className="text-neutral-300 font-mono">{row.slug} ({row.orderType})</p>
                      <p className="text-neutral-500">Oynatma: {row.playCount} | Ses kaydi: {row.recordingCount} | Video: {row.videoRecordingCount}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-600 mt-2">Son guncelleme: {new Date(platformOverview.generatedAt).toLocaleString('tr-TR')}</p>
              </div>

              <div>
                <p className="text-white font-semibold mb-2">Panel Admin Kullanici Reset-Link Yonetimi</p>
                <div className="space-y-2 max-h-80 overflow-auto">
                  {platformOverview.panelAdmins.map((adminItem) => {
                    const key = `${adminItem.realm}:${adminItem.userId}`
                    return (
                      <div key={key} className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-neutral-300 break-all">
                            {adminItem.email} ({adminItem.realm}/{adminItem.role}) {adminItem.tenantCode ? `- ${adminItem.tenantCode}` : ''}
                          </p>
                          <button
                            onClick={() => void handleCreatePanelResetLink(adminItem.realm, adminItem.userId)}
                            disabled={panelResetLoadingKey === key || !password}
                            className="rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-medium px-3 py-1.5 transition-all"
                          >
                            {panelResetLoadingKey === key ? 'Uretiliyor...' : 'Reset Linki Uret'}
                          </button>
                        </div>
                        {panelResetLinks[key] ? <p className="text-[11px] text-neutral-500 mt-1 break-all">Kopyalandi: {panelResetLinks[key]}</p> : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">Platform ozeti henuz yuklenmedi.</p>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-8">
          <div className="mb-5">
            <h2 className="text-white font-semibold">Kullanıcı Hak Yönetimi</h2>
            <p className="text-neutral-500 text-sm">Yeni uyelere 1 ucretsiz hak verilir. Satin alan kullanicilara buradan ek hak tanimlayabilirsin.</p>
          </div>

          {users.length === 0 ? (
            <p className="text-neutral-500 text-sm">Henüz kayıtlı kullanıcı yok.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <p className="text-white font-medium break-all">{user.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                      <span className={`px-2 py-1 rounded-full border ${user.accountType === 'corporate' ? 'border-emerald-700 bg-emerald-950/40 text-emerald-300' : 'border-violet-700 bg-violet-950/40 text-violet-300'}`}>
                        Tip: {user.accountType === 'corporate' ? 'Kurumsal' : 'Bireysel'}
                      </span>
                      <span className="px-2 py-1 rounded-full border border-violet-800 bg-violet-950/40 text-violet-300">Ücretsiz: {user.freeSlots}</span>
                      <span className="px-2 py-1 rounded-full border border-emerald-800 bg-emerald-950/40 text-emerald-300">Satın Alınmış: {user.paidSlots}</span>
                      <span className="px-2 py-1 rounded-full border border-neutral-700 bg-neutral-900 text-neutral-300">Kullanılmış: {user.usedSlots}</span>
                      <span className="px-2 py-1 rounded-full border border-sky-800 bg-sky-950/40 text-sky-300">Kalan: {user.remainingSlots}</span>
                    </div>
                  </div>
                  <div className="w-full lg:w-auto lg:min-w-[17.5rem]">
                    <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end mb-2">
                      <select
                        value={user.accountType}
                        onChange={(e) => void handleUpdateUserType(user.id, e.target.value as 'individual' | 'corporate')}
                        disabled={typeLoadingUserId === user.id || !password}
                        className="bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-sm outline-none disabled:opacity-60"
                      >
                        <option value="individual">Bireysel</option>
                        <option value="corporate">Kurumsal</option>
                      </select>
                      {typeLoadingUserId === user.id && <span className="text-xs text-blue-300">Kaydediliyor...</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end mb-2">
                      <input
                        type="number"
                        min={1}
                        value={creditValues[user.id] ?? 1}
                        onChange={(e) => setCreditValues((current) => ({ ...current, [user.id]: Math.max(1, Number(e.target.value) || 1) }))}
                        className="w-24 bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-sm outline-none"
                      />
                      <button
                        onClick={() => void handleAddCredits(user.id)}
                        disabled={creditLoadingUserId === user.id || !password}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-all"
                      >
                        {creditLoadingUserId === user.id ? 'Ekleniyor...' : 'Hak Ekle'}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                      <button
                        onClick={() => void handleCreateResetLink(user.id)}
                        disabled={resetLoadingUserId === user.id || !password}
                        className="rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition-all"
                      >
                        {resetLoadingUserId === user.id ? 'Üretiliyor...' : 'Reset Linki Üret'}
                      </button>
                      <button
                        onClick={() => void handleDeleteUser(user.id, user.email)}
                        disabled={deletingUserId === user.id || !password}
                        className="rounded-xl border border-red-900 bg-red-950/40 hover:bg-red-900/40 disabled:opacity-40 disabled:cursor-not-allowed text-red-300 text-sm font-medium px-4 py-2 transition-all"
                      >
                        {deletingUserId === user.id ? 'Siliniyor...' : 'Kullanıcıyı Sil'}
                      </button>
                    </div>
                    {resetLinks[user.id] && (
                      <div className="mt-2 text-right">
                        <p className="text-[11px] text-neutral-500 mb-1">Panoya kopyalandı</p>
                        <p className="text-[11px] text-neutral-400 break-all">{resetLinks[user.id]}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-white font-semibold">QR Listesi</h2>
              <p className="text-neutral-500 text-sm">Demo, bireysel ve kurumsal üretimleri ayrı izle.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
              <button
                onClick={() => void handleExportQrList('individual')}
                disabled={exportLoadingType !== null || !password}
                className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-3 py-2 text-xs sm:text-sm"
              >
                {exportLoadingType === 'individual' ? 'Iniyor...' : 'Bireysel Excel Listesi Indir'}
              </button>
              <button
                onClick={() => void handleExportQrList('corporate')}
                disabled={exportLoadingType !== null || !password}
                className="bg-sky-700 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-3 py-2 text-xs sm:text-sm"
              >
                {exportLoadingType === 'corporate' ? 'Iniyor...' : 'Kurumsal Excel Listesi Indir'}
              </button>
              <select
                value={filter}
                onChange={(e) => {
                  const nextFilter = e.target.value as 'all' | 'demo' | 'real'
                  setFilter(nextFilter)
                  void loadList(nextFilter, orderFilter)
                }}
                className="bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none"
              >
                <option value="all">Tümü</option>
                <option value="demo">Sadece Demo</option>
                <option value="real">Sadece Gerçek</option>
              </select>
              <select
                value={orderFilter}
                onChange={(e) => {
                  const nextOrderFilter = e.target.value as 'all' | 'trial' | 'individual' | 'corporate'
                  setOrderFilter(nextOrderFilter)
                  void loadList(filter, nextOrderFilter)
                }}
                className="bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm outline-none"
              >
                <option value="all">Tüm Sipariş Tipleri</option>
                <option value="trial">Ücretsiz Deneme</option>
                <option value="individual">Bireysel</option>
                <option value="corporate">Kurumsal</option>
              </select>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-neutral-500 text-sm">Henüz listelenecek QR yok.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.slug} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <p className="text-white font-mono text-sm">{item.slug}</p>
                      <span className={`text-[11px] px-2 py-1 rounded-full border ${item.is_demo ? 'bg-amber-950/40 text-amber-300 border-amber-800' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800'}`}>
                        {item.is_demo ? 'Demo QR' : 'Gerçek QR'}
                      </span>
                      {!item.is_demo && (
                        <span className={`text-[11px] px-2 py-1 rounded-full border ${item.order_type === 'corporate' ? 'bg-green-950/40 text-green-300 border-green-800' : item.order_type === 'trial' ? 'bg-amber-950/40 text-amber-300 border-amber-800' : 'bg-violet-950/40 text-violet-300 border-violet-800'}`}>
                          {item.order_type === 'corporate' ? 'Kurumsal' : item.order_type === 'trial' ? 'Ücretsiz Deneme' : 'Bireysel'}
                        </span>
                      )}
                      <span className={`text-[11px] px-2 py-1 rounded-full border ${item.is_active ? 'bg-blue-950/40 text-blue-300 border-blue-800' : 'bg-neutral-900 text-neutral-400 border-neutral-700'}`}>
                        {item.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                      <span className={`text-[11px] px-2 py-1 rounded-full border ${item.is_claimed ? 'bg-violet-950/40 text-violet-300 border-violet-800' : 'bg-neutral-900 text-neutral-400 border-neutral-700'}`}>
                        {item.is_claimed ? 'Sahiplenildi' : 'Boş'}
                      </span>
                    </div>
                    <p className="text-neutral-500 text-xs">{item.title || 'Başlıksız'}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                      <span className="px-2 py-1 rounded-full border border-sky-800 bg-sky-950/40 text-sky-300">
                        Oynatma: {item.play_count}
                      </span>
                      <span className="px-2 py-1 rounded-full border border-neutral-700 bg-neutral-900 text-neutral-300">
                        Kayit deneme: {item.recording_count}/{item.recording_limit}
                      </span>
                      <span className="px-2 py-1 rounded-full border border-neutral-700 bg-neutral-900 text-neutral-300">
                        Video deneme: {item.video_recording_count}/{item.video_recording_limit}
                      </span>
                    </div>
                  </div>
                  <div className="text-left lg:text-right text-xs text-neutral-500 w-full lg:w-auto lg:min-w-[18rem]">
                    <p>{new Date(item.created_at).toLocaleDateString('tr-TR')}</p>
                    {item.is_demo && item.demo_expires_at && <p>Demo bitiş: {new Date(item.demo_expires_at).toLocaleString('tr-TR')}</p>}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        min={1}
                        value={limitValues[item.slug]?.recordingLimit ?? item.recording_limit ?? 3}
                        onChange={(e) => {
                          const nextValue = Math.max(1, Number(e.target.value) || 1)
                          setLimitValues((current) => ({
                            ...current,
                            [item.slug]: {
                              recordingLimit: nextValue,
                              videoRecordingLimit: current[item.slug]?.videoRecordingLimit ?? item.video_recording_limit ?? 2,
                              videoMaxSeconds: current[item.slug]?.videoMaxSeconds ?? item.video_max_seconds ?? null,
                            },
                          }))
                        }}
                        className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="number"
                        min={0}
                        value={limitValues[item.slug]?.videoRecordingLimit ?? item.video_recording_limit ?? 2}
                        onChange={(e) => {
                          const nextValue = Math.max(0, Number(e.target.value) || 0)
                          setLimitValues((current) => ({
                            ...current,
                            [item.slug]: {
                              recordingLimit: current[item.slug]?.recordingLimit ?? item.recording_limit ?? 3,
                              videoRecordingLimit: nextValue,
                              videoMaxSeconds: current[item.slug]?.videoMaxSeconds ?? item.video_max_seconds ?? null,
                            },
                          }))
                        }}
                        className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="number"
                        min={1}
                        value={limitValues[item.slug]?.videoMaxSeconds ?? item.video_max_seconds ?? ''}
                        onChange={(e) => {
                          const rawValue = e.target.value
                          const nextValue = rawValue.trim() === '' ? null : Math.max(1, Number(rawValue) || 1)
                          setLimitValues((current) => ({
                            ...current,
                            [item.slug]: {
                              recordingLimit: current[item.slug]?.recordingLimit ?? item.recording_limit ?? 3,
                              videoRecordingLimit: current[item.slug]?.videoRecordingLimit ?? item.video_recording_limit ?? 2,
                              videoMaxSeconds: nextValue,
                            },
                          }))
                        }}
                        className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-3 py-2 text-xs outline-none"
                      />
                    </div>
                    <div className="mt-1 grid grid-cols-3 text-[10px] text-neutral-600">
                      <span>Kayit limiti</span>
                      <span className="text-center">Video limiti</span>
                      <span className="text-right">Video sure (sn)</span>
                    </div>
                    <button
                      onClick={() => void handleUpdateLimits(item.slug)}
                      disabled={limitSavingSlug === item.slug || listLoading || !password}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-blue-900 bg-blue-950/40 px-3 py-2 text-blue-300 hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {limitSavingSlug === item.slug ? 'Kaydediliyor...' : 'Limitleri Kaydet'}
                    </button>
                    <button
                      onClick={() => void handleDelete(item.slug)}
                      disabled={deletingSlug === item.slug || listLoading}
                      className="mt-3 inline-flex items-center justify-center rounded-xl border border-red-900 bg-red-950/40 px-3 py-2 text-red-300 hover:bg-red-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {deletingSlug === item.slug ? 'Siliniyor...' : 'Sil'}
                    </button>
                    <button
                      onClick={() => void handleClearMedia(item.slug)}
                      disabled={clearingMediaSlug === item.slug || listLoading}
                      className="mt-2 inline-flex items-center justify-center rounded-xl border border-amber-900 bg-amber-950/40 px-3 py-2 text-amber-300 hover:bg-amber-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {clearingMediaSlug === item.slug ? 'Temizleniyor...' : 'Medyayı Temizle'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  <button
                    onClick={() => void handleDelete(item.slug)}
                    disabled={deletingSlug === item.slug}
                    className="print:hidden rounded-xl border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300 hover:bg-red-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {deletingSlug === item.slug ? 'Siliniyor...' : 'Sil'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
