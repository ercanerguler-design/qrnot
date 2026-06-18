'use client'

import { useEffect, useMemo, useState } from 'react'
import BackToPrevious from '@/components/BackToPrevious'
import QRDisplay from '@/components/QRDisplay'

type SectorKey = 'health' | 'factory' | 'retail' | 'logistics'

interface SectorAuthUser {
  id: string
  email: string
  role: 'platform_admin' | 'sector_admin' | 'staff'
  tenantId: string | null
  tenantCode: string | null
  isActive: boolean
}

interface TenantRow {
  id: string
  code: string
  name: string
}

interface ModuleRow {
  id: string
  tenant_id: string
  tenant_code: string
  slug: string
  module_type: string
  title: string
  config_json: string
}

interface CountRow {
  line_code: string
  product_qr: string
  scan_count: number
  last_seen: string
}

interface CountSummary {
  total_scans: number
  unique_products: number
  active_lines: number
  last_seen: string | null
}

interface TopLineRow {
  line_code: string
  scan_count: number
  unique_products: number
}

interface RecentEventRow {
  line_code: string
  scanner_id: string
  product_qr: string
  counted_at: string
}

interface CameraRow {
  id: string
  tenant_code: string
  scanner_id: string
  line_code: string
  camera_name: string
  ip_address: string
  rtsp_url: string
  is_active: boolean
  last_tested_at: string | null
  last_test_status: string
  last_test_note: string
}

interface ModuleOption {
  value: string
  label: string
  defaultTitle: string
}

function getModuleGlobalBadges(configJson: string) {
  try {
    const parsed = JSON.parse(String(configJson || '{}')) as {
      capabilities?: {
        multilingual?: { enabled?: boolean }
        analytics?: { enabled?: boolean }
        automation?: { enabled?: boolean }
        security?: { enabled?: boolean }
        aiAssistant?: { enabled?: boolean }
      }
    }

    const badges: string[] = []
    if (parsed.capabilities?.multilingual?.enabled) badges.push('Çok Dilli')
    if (parsed.capabilities?.analytics?.enabled) badges.push('Canlı Analitik')
    if (parsed.capabilities?.automation?.enabled) badges.push('Otomasyon')
    if (parsed.capabilities?.security?.enabled) badges.push('Güvenlik')
    if (parsed.capabilities?.aiAssistant?.enabled) badges.push('AI Asistan')
    return badges
  } catch {
    return []
  }
}

const SECTOR_META: Record<SectorKey, {
  accentBorder: string
  accentBg: string
  accentText: string
  accentBadgeBorder: string
  accentBadgeBg: string
  headline: string
  description: string
  capabilities: { icon: string; title: string; desc: string }[]
  proFeatures: string[]
}> = {
  health: {
    accentBorder: 'border-cyan-500/60',
    accentBg: 'bg-cyan-500/10',
    accentText: 'text-cyan-200',
    accentBadgeBorder: 'border-sky-400/50',
    accentBadgeBg: 'bg-sky-500/15',
    headline: 'Sağlık Yönetim Platformu',
    description: 'Klinik iş akışlarını dijitalleştir, hasta güvenliğini artır, personel yükünü azalt. Her modül otomatik Pro seviyede etkinleştirilmiş gelir.',
    capabilities: [
      { icon: '🏥', title: 'Hasta Akış Yönetimi', desc: 'Kabul → Triage → Servis → Taburcu süreçlerini QR ile entegre et' },
      { icon: '🔬', title: 'Tanı & Laboratuvar Entegrasyonu', desc: 'Lab ve görüntüleme sonuçlarını QR ile hastaya anında ulaştır' },
      { icon: '💊', title: 'İlaç & Cihaz Talimatları', desc: 'Kişiselleştirilmiş tedavi ve kullanım kılavuzlarını QR ile sun' },
      { icon: '🛡️', title: 'Hijyen & Uyum Denetimi', desc: 'Sterilizasyon kontrol listelerini dijital kayıt altına al' },
      { icon: '📋', title: 'Vizit & Servis Takibi', desc: 'Doktor vizit notları ve nöbet devir formlarını standartlaştır' },
      { icon: '🆘', title: 'Acil Protokol QR', desc: 'Acil durum prosedürlerine koduyla anında erişim sağla' },
    ],
    proFeatures: ['HIPAA Uyumlu Şifreleme', 'Hasta Gizliliği Katmanı', 'Çok Dilli Hasta Formları', 'Canlı Klinik Analitik', 'AI Destekli Form Asistanı', 'Otomatik Belge Arşivi'],
  },
  factory: {
    accentBorder: 'border-amber-500/60',
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-200',
    accentBadgeBorder: 'border-orange-400/50',
    accentBadgeBg: 'bg-orange-500/15',
    headline: 'Fabrika Operasyon Platformu',
    description: 'Üretim kalitesini artır, plansız duruşları önle, iş güvenliğini güçlendir. Her modül otomatik Pro seviyede etkinleştirilmiş gelir.',
    capabilities: [
      { icon: '⚙️', title: 'Makine Güvenlik QR', desc: 'LOTO prosedürleri ve güvenlik talimatlarını makine başında sun' },
      { icon: '🔧', title: 'Bakım Planlama', desc: 'Önleyici bakım görevlerini dijital iş emirleriyle yönet' },
      { icon: '✅', title: 'Kalite Kontrol', desc: 'Hat başı kalite kontrol listelerini gerçek zamanlı doldur' },
      { icon: '📦', title: 'Yürüyen Bant QR Sayımı', desc: 'Kamera tabanlı QR ürün sayımı ile hat verimliliğini ölç' },
      { icon: '🦺', title: 'İş Güvenliği Denetimi', desc: 'Saha denetim formlarını mobil cihazdan anında tamamla' },
      { icon: '🔄', title: 'Vardiya Hat Devri', desc: 'Vardiya devir teslim sürecini standartlaştır ve kayıt altına al' },
    ],
    proFeatures: ['OEE Analitik Dashboard', 'Gerçek Zamanlı Üretim Sayacı', 'Çok Dilli Operatör Talimatları', 'AI Arıza Tespiti', 'ISO 9001 Uyumlu Kayıtlama', 'Bakım Otomasyon Entegrasyonu'],
  },
  retail: {
    accentBorder: 'border-pink-500/60',
    accentBg: 'bg-pink-500/10',
    accentText: 'text-pink-200',
    accentBadgeBorder: 'border-rose-400/50',
    accentBadgeBg: 'bg-rose-500/15',
    headline: 'Perakende Yönetim Platformu',
    description: 'Mağaza operasyonunu optimize et, müşteri deneyimini zenginleştir, saha ekibini güçlendir. Her modül otomatik Pro seviyede etkinleştirilmiş gelir.',
    capabilities: [
      { icon: '🛒', title: 'Raf Denetim & Düzen', desc: 'Mağaza içi raf düzenini ve doluluk oranını QR ile denetle' },
      { icon: '📊', title: 'Stok & Sayım', desc: 'Gerçek zamanlı stok sayım formlarını saha ekibine mobil ilet' },
      { icon: '🏷️', title: 'Kampanya & Fiyat Kontrol', desc: 'Kampanya uygunluğunu ve doğru fiyatlamayı anında doğrula' },
      { icon: '📦', title: 'Yürüyen Bant QR Sayımı', desc: 'Depo bandındaki ürün geçişlerini QR ile say ve raporla' },
      { icon: '⭐', title: 'Müşteri Memnuniyeti', desc: 'Anlık müşteri geri bildirimi topla, mağaza bazlı analiz et' },
      { icon: '📱', title: 'Ürün Hikayesi QR', desc: 'Zengin ürün içeriklerini QR ile raflarda müşterilere sun' },
    ],
    proFeatures: ['Mağaza Bazlı Analitik', 'Çok Dilli Ürün Sayfaları', 'AI Raf Optimizasyon Önerisi', 'Anlık Stok Alarm Sistemi', 'Müşteri Yolculuğu Takibi', 'Kampanya ROI Raporlama'],
  },
  logistics: {
    accentBorder: 'border-cyan-500/60',
    accentBg: 'bg-lime-500/10',
    accentText: 'text-lime-200',
    accentBadgeBorder: 'border-cyan-400/50',
    accentBadgeBg: 'bg-cyan-500/15',
    headline: 'Lojistik Yönetim Platformu',
    description: 'Tedarik zincirini şeffaflaştır, teslimat güvenilirliğini artır, depo verimliliğini optimize et. Her modül otomatik Pro seviyede etkinleştirilmiş gelir.',
    capabilities: [
      { icon: '🚚', title: 'Teslimat Doğrulama', desc: 'Teslimat kanıt fotoğrafı ve imzasını QR ile dijital topla' },
      { icon: '🏭', title: 'Depo Giriş/Çıkış Yönetimi', desc: 'Ürün hareketlerini barkod/QR ile anlık kayıt altına al' },
      { icon: '🚗', title: 'Araç & Sürücü Kontrol', desc: 'Araç muayene ve sürücü hazırlık formlarını dijitalleştir' },
      { icon: '📦', title: 'Yürüyen Bant QR Sayımı', desc: 'Sevkiyat bandındaki koli geçişlerini QR ile say ve raporla' },
      { icon: '❄️', title: 'Soğuk Zincir Takibi', desc: 'Sıcaklık kritik ürünleri teslimat boyunca belge ve takip et' },
      { icon: '📄', title: 'Gümrük & Belge Doğrulama', desc: 'İhracat/ithalat belgelerini QR ile doğrula ve dijital sakla' },
    ],
    proFeatures: ['Gerçek Zamanlı Filo Takibi', 'Çok Dilli Teslimat Formları', 'AI Rota Optimizasyonu', 'Blockchain Teslimat Kanıtı', 'EDI Entegrasyon Hazırlığı', 'SLA Otomatik Alarm Sistemi'],
  },
}

const SECTOR_TONE: Record<SectorKey, {
  shell: string
  card: string
  primaryBtn: string
  focus: string
  patternA: string
  patternB: string
  iconSet: string[]
}> = {
  health: {
    shell: 'bg-gradient-to-b from-cyan-950/45 via-blue-950/25 to-neutral-950',
    card: 'border-cyan-500/30 bg-cyan-950/20',
    primaryBtn: 'bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-900/40',
    focus: 'focus:border-cyan-400',
    patternA: 'from-cyan-400/20 via-blue-400/10 to-transparent',
    patternB: 'from-emerald-300/20 via-cyan-300/10 to-transparent',
    iconSet: ['🏥', '🧪', '💉', '🧬'],
  },
  factory: {
    shell: 'bg-gradient-to-b from-amber-950/45 via-orange-950/25 to-neutral-950',
    card: 'border-amber-500/30 bg-amber-950/20',
    primaryBtn: 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/40',
    focus: 'focus:border-amber-400',
    patternA: 'from-amber-400/20 via-orange-400/10 to-transparent',
    patternB: 'from-yellow-300/20 via-amber-300/10 to-transparent',
    iconSet: ['🏭', '⚙️', '🔧', '📦'],
  },
  retail: {
    shell: 'bg-gradient-to-b from-pink-950/45 via-rose-950/25 to-neutral-950',
    card: 'border-pink-500/30 bg-pink-950/20',
    primaryBtn: 'bg-pink-600 hover:bg-pink-500 shadow-lg shadow-pink-900/40',
    focus: 'focus:border-pink-400',
    patternA: 'from-pink-400/20 via-rose-400/10 to-transparent',
    patternB: 'from-fuchsia-300/20 via-coral-300/10 to-transparent',
    iconSet: ['🛍️', '🏷️', '🛒', '💳'],
  },
  logistics: {
    shell: 'bg-gradient-to-b from-cyan-950/45 via-lime-950/20 to-neutral-950',
    card: 'border-cyan-500/30 bg-cyan-950/20',
    primaryBtn: 'bg-lime-600 hover:bg-lime-500 shadow-lg shadow-lime-900/40 text-neutral-950',
    focus: 'focus:border-cyan-400',
    patternA: 'from-cyan-400/20 via-lime-400/10 to-transparent',
    patternB: 'from-lime-300/20 via-cyan-300/10 to-transparent',
    iconSet: ['🚚', '📦', '🛰️', '🧭'],
  },
}

interface SectorAdminConsoleProps {
  sector: SectorKey
  title: string
  subtitle: string
  moduleOptions: ModuleOption[]
}

export default function SectorAdminConsole(props: SectorAdminConsoleProps) {
  const { sector, title, subtitle, moduleOptions } = props
  const meta = SECTOR_META[sector]
  const tone = SECTOR_TONE[sector]
  const bootstrapStorageKey = `qrnote_sector_bootstrap_${sector}`
  const [authUser, setAuthUser] = useState<SectorAuthUser | null>(null)
  const [bootstrapMode, setBootstrapMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bootstrapPassword, setBootstrapPassword] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [modules, setModules] = useState<ModuleRow[]>([])
  const [selectedTenantCode, setSelectedTenantCode] = useState('')

  const [newTenantName, setNewTenantName] = useState('')
  const [newTenantCode, setNewTenantCode] = useState('')

  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')

  const [newModuleType, setNewModuleType] = useState(moduleOptions[0]?.value || '')
  const [newModuleTitle, setNewModuleTitle] = useState(moduleOptions[0]?.defaultTitle || '')
  const [lastPublicUrl, setLastPublicUrl] = useState<string | null>(null)
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null)

  const [lineCode, setLineCode] = useState('BANT-01')
  const [scannerId, setScannerId] = useState('CAM-01')
  const [productQr, setProductQr] = useState('')
  const [cameraFrameId, setCameraFrameId] = useState('')
  const [confidence, setConfidence] = useState('0.95')
  const [dedupSeconds, setDedupSeconds] = useState('2')
  const [countFilterLineCode, setCountFilterLineCode] = useState('')
  const [countSinceHours, setCountSinceHours] = useState('24')
  const [countRows, setCountRows] = useState<CountRow[]>([])
  const [countSummary, setCountSummary] = useState<CountSummary | null>(null)
  const [topLines, setTopLines] = useState<TopLineRow[]>([])
  const [recentEvents, setRecentEvents] = useState<RecentEventRow[]>([])
  const [cameras, setCameras] = useState<CameraRow[]>([])
  const [newCameraName, setNewCameraName] = useState('')
  const [newCameraIp, setNewCameraIp] = useState('')
  const [newCameraRtsp, setNewCameraRtsp] = useState('')
  const [cameraSavingId, setCameraSavingId] = useState<string | null>(null)

  const selectedModuleSlug = useMemo(() => {
    const row = modules.find((item) => item.tenant_code === selectedTenantCode)
    return row?.slug || ''
  }, [modules, selectedTenantCode])

  const callAdmin = async (payload: Record<string, unknown>) => {
    const activeAdminPassword = adminPassword.trim() || bootstrapPassword.trim()
    const merged = activeAdminPassword ? { ...payload, password: activeAdminPassword } : payload

    const res = await fetch(`/api/sector/${sector}/admin`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(String(data.error || 'İşlem başarısız'))
    return data
  }

  const load = async () => {
    if (!authUser && !bootstrapPassword.trim() && !adminPassword.trim()) return
    const data = await callAdmin({ action: 'list' })
    const nextTenants = (data.tenants || []) as TenantRow[]
    const nextModules = (data.modules || []) as ModuleRow[]
    const nextCameras = (data.cameras || []) as CameraRow[]
    setTenants(nextTenants)
    setModules(nextModules)
    setCameras(nextCameras)
    if (!selectedTenantCode && nextTenants[0]?.code) {
      setSelectedTenantCode(nextTenants[0].code)
    }
  }

  useEffect(() => {
    const check = async () => {
      try {
        const savedBootstrapPassword = typeof window !== 'undefined' ? sessionStorage.getItem(bootstrapStorageKey) : null
        if (savedBootstrapPassword && !bootstrapPassword) {
          setBootstrapPassword(savedBootstrapPassword)
        }

        const res = await fetch(`/api/sector/${sector}/auth/me`, { cache: 'no-store', credentials: 'include' })
        if (!res.ok) {
          if (savedBootstrapPassword) {
            setBootstrapMode(true)
            await load()
          }
          return
        }
        const data = await res.json()
        const user = (data.user || null) as SectorAuthUser | null
        setAuthUser(user)
        if (user) {
          await load()
        }
      } catch {
        setAuthUser(null)
      }
    }

    void check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector])

  const handleLogin = async () => {
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/sector/${sector}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(String(data.error || 'Giriş başarısız'))
      setAuthUser((data.user || null) as SectorAuthUser | null)
      setEmail('')
      setPassword('')
      setSuccess('Giriş başarılı')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleBootstrapAccess = async () => {
    if (!bootstrapPassword.trim()) {
      setError('ADMIN_PASSWORD gerekli')
      return
    }
    setError(null)
    setSuccess(null)
    try {
      setBootstrapMode(true)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(bootstrapStorageKey, bootstrapPassword.trim())
      }
      await load()
      setSuccess('ADMIN_PASSWORD ile geçici yönetim açıldı')
    } catch (err) {
      setBootstrapMode(false)
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleLogout = async () => {
    await fetch(`/api/sector/${sector}/auth/logout`, { method: 'POST', credentials: 'include' })
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(bootstrapStorageKey)
    }
    setAuthUser(null)
    setBootstrapMode(false)
    setTenants([])
    setModules([])
    setCountRows([])
    setCountSummary(null)
    setTopLines([])
    setRecentEvents([])
  }

  const handleCreateTenant = async () => {
    if (!newTenantName.trim() || !newTenantCode.trim()) {
      setError('Kurum adı ve kodu gerekli')
      return
    }

    setError(null)
    setSuccess(null)
    try {
      await callAdmin({ action: 'createTenant', name: newTenantName.trim(), code: newTenantCode.trim() })
      setSuccess('Kurum kaydedildi')
      setNewTenantName('')
      setNewTenantCode('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleCreateUser = async () => {
    if (!selectedTenantCode || !newUserEmail.trim() || newUserPassword.length < 6) {
      setError('Kurum, e-posta ve en az 6 karakter şifre gerekli')
      return
    }

    setError(null)
    setSuccess(null)
    try {
      await callAdmin({ action: 'createUser', tenantCode: selectedTenantCode, email: newUserEmail.trim(), userPassword: newUserPassword, role: 'sector_admin' })
      setSuccess('Sektör admin kullanıcı oluşturuldu')
      setNewUserEmail('')
      setNewUserPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleCreateModule = async () => {
    if (!selectedTenantCode || !newModuleType || !newModuleTitle.trim()) {
      setError('Kurum, modül tipi ve başlık gerekli')
      return
    }

    setError(null)
    setSuccess(null)
    setLastPublicUrl(null)
    try {
      const data = await callAdmin({ action: 'createModule', tenantCode: selectedTenantCode, moduleType: newModuleType, title: newModuleTitle.trim() })
      setSuccess('Sektör modülü oluşturuldu')
      const publicUrl = String((data as { publicUrl?: unknown }).publicUrl || '').trim()
      setLastPublicUrl(publicUrl || null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleDeleteModule = async (moduleRow: ModuleRow) => {
    const confirmed = window.confirm(`${moduleRow.title} modulu silinsin mi? Bu islem geri alinamaz.`)
    if (!confirmed) return

    setError(null)
    setSuccess(null)
    setDeletingModuleId(moduleRow.id)
    try {
      await callAdmin({ action: 'deleteModule', tenantCode: moduleRow.tenant_code, moduleSlug: moduleRow.slug })
      setSuccess('Modul silindi')
      if (lastPublicUrl && lastPublicUrl.includes(moduleRow.slug)) {
        setLastPublicUrl(null)
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setDeletingModuleId(null)
    }
  }

  const handleRecordCount = async () => {
    if (!selectedTenantCode || !lineCode.trim() || !productQr.trim()) {
      setError('Kurum, bant kodu ve ürün QR gerekli')
      return
    }

    setError(null)
    setSuccess(null)
    try {
      const data = await callAdmin({
        action: 'recordCountEvent',
        tenantCode: selectedTenantCode,
        moduleSlug: selectedModuleSlug,
        lineCode: lineCode.trim(),
        scannerId: scannerId.trim(),
        productQr: productQr.trim(),
        cameraFrameId: cameraFrameId.trim(),
        confidence: confidence.trim(),
        dedupSeconds: dedupSeconds.trim(),
      })
      if (Boolean(data.deduped)) {
        setSuccess('Aynı frame penceresinde tekrar algılandı, mükerrer event yazılmadı')
      } else {
        setSuccess('Ürün sayım eventi işlendi')
      }
      setProductQr('')
      await handleLoadCounts()
      await handleLoadDashboard()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleLoadCounts = async () => {
    if (!selectedTenantCode) {
      setError('Kurum seç')
      return
    }

    setError(null)
    try {
      const data = await callAdmin({
        action: 'listCounts',
        tenantCode: selectedTenantCode,
        lineCode: countFilterLineCode.trim(),
        sinceHours: countSinceHours.trim(),
      })
      setCountRows((data.counts || []) as CountRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleLoadDashboard = async () => {
    if (!selectedTenantCode) {
      setError('Kurum seç')
      return
    }

    setError(null)
    try {
      const data = await callAdmin({
        action: 'countDashboard',
        tenantCode: selectedTenantCode,
        sinceHours: countSinceHours.trim(),
      })
      setCountSummary((data.summary || null) as CountSummary | null)
      setTopLines((data.topLines || []) as TopLineRow[])
      setRecentEvents((data.recentEvents || []) as RecentEventRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleCreateCamera = async () => {
    if (sector !== 'factory' && sector !== 'retail' && sector !== 'logistics') return
    if (!selectedTenantCode || !scannerId.trim() || !lineCode.trim()) {
      setError('Kamera icin kurum, scannerId ve lineCode gerekli')
      return
    }

    setError(null)
    setSuccess(null)
    try {
      await callAdmin({
        action: 'createCamera',
        tenantCode: selectedTenantCode,
        scannerId: scannerId.trim(),
        lineCode: lineCode.trim(),
        cameraName: newCameraName.trim(),
        ipAddress: newCameraIp.trim(),
        rtspUrl: newCameraRtsp.trim(),
      })
      setSuccess('Kamera kaydedildi')
      setNewCameraName('')
      setNewCameraIp('')
      setNewCameraRtsp('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleToggleCamera = async (cameraRow: CameraRow) => {
    setError(null)
    setSuccess(null)
    setCameraSavingId(cameraRow.id)
    try {
      await callAdmin({ action: 'updateCamera', cameraId: cameraRow.id, isActive: !cameraRow.is_active })
      setSuccess('Kamera durumu guncellendi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setCameraSavingId(null)
    }
  }

  const handleAssignCameraLine = async (cameraRow: CameraRow) => {
    const nextLineCode = window.prompt('Yeni hat kodu', cameraRow.line_code || 'BANT-01')
    if (!nextLineCode) return

    setError(null)
    setSuccess(null)
    setCameraSavingId(cameraRow.id)
    try {
      await callAdmin({ action: 'updateCamera', cameraId: cameraRow.id, lineCode: nextLineCode })
      setSuccess('Kamera hat eslesmesi guncellendi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setCameraSavingId(null)
    }
  }

  const handleTestCamera = async (cameraRow: CameraRow) => {
    setError(null)
    setSuccess(null)
    setCameraSavingId(cameraRow.id)
    try {
      const data = await callAdmin({ action: 'testCamera', cameraId: cameraRow.id })
      setSuccess(String(data.note || 'Kamera testi tamamlandi'))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setCameraSavingId(null)
    }
  }

  if (!authUser && !bootstrapMode) {
    return (
      <main className={`min-h-screen text-white px-4 py-10 ${tone.shell}`}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className={`rounded-3xl border p-6 space-y-3 ${tone.card}`}>
            <h1 className="text-3xl font-black tracking-tight">{title} Admin Giriş</h1>
            <p className="text-sm text-neutral-400">{subtitle}</p>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-posta" className={`w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none ${tone.focus}`} />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Şifre" className={`w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none ${tone.focus}`} />
            <button type="button" onClick={() => void handleLogin()} className={`rounded-xl px-5 py-3 font-semibold transition ${tone.primaryBtn}`}>Giriş Yap</button>
          </div>

          <div className={`rounded-3xl border p-6 space-y-3 ${tone.card}`}>
            <h2 className="text-xl font-bold">Geçici Yönetim</h2>
            <p className="text-sm text-neutral-400">ADMIN_PASSWORD ile paneli açıp ilk kurum ve admin kullanıcılarını oluşturabilirsin.</p>
            <input type="password" value={bootstrapPassword} onChange={(event) => setBootstrapPassword(event.target.value)} placeholder="ADMIN_PASSWORD" className={`w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none ${tone.focus}`} />
            <button type="button" onClick={() => void handleBootstrapAccess()} className={`rounded-xl px-5 py-3 font-semibold transition ${tone.primaryBtn}`}>ADMIN_PASSWORD ile aç</button>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen text-white px-4 py-10 ${tone.shell}`}>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className={`absolute -top-28 -left-24 h-80 w-80 rounded-full blur-3xl bg-gradient-to-br ${tone.patternA}`} />
        <div className={`absolute bottom-8 right-0 h-72 w-72 rounded-full blur-3xl bg-gradient-to-br ${tone.patternB}`} />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        <BackToPrevious fallbackHref="/" />
        <section className={`rounded-3xl border p-6 space-y-3 ${tone.card}`}>
          <h1 className="text-3xl font-black tracking-tight">{title} Yönetimi</h1>
          <p className="text-sm text-neutral-400">{subtitle}</p>
          <p className="text-sm text-neutral-300">Giriş: {authUser ? `${authUser.email} (${authUser.role})` : 'ADMIN_PASSWORD ile geçici erişim'}</p>
          <div className="max-w-md space-y-2">
            <p className="text-xs text-neutral-500">ADMIN_PASSWORD (opsiyonel)</p>
            <input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="ADMIN_PASSWORD" className={`w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none ${tone.focus}`} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => void load()} className={`rounded-xl px-5 py-3 font-semibold transition ${tone.primaryBtn}`}>Listeyi Yükle</button>
            <button type="button" onClick={() => void handleLogout()} className="rounded-xl bg-neutral-800 px-5 py-3 font-semibold hover:bg-neutral-700 transition border border-neutral-700">Çıkış</button>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
        </section>

        <section className={`rounded-3xl border ${meta.accentBorder} ${meta.accentBg} p-6 space-y-4`}>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${meta.accentText}`}>{meta.headline}</h2>
            <p className="text-sm text-neutral-400 mt-1">{meta.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tone.iconSet.map((icon, idx) => (
                <span key={`${icon}-${idx}`} className={`rounded-full border px-2.5 py-1 text-xs ${meta.accentBadgeBorder} ${meta.accentBadgeBg} ${meta.accentText}`}>
                  {icon}
                </span>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {meta.capabilities.map((cap) => (
              <div key={cap.title} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-1">
                <p className="text-base">{cap.icon} <span className={`font-semibold text-sm ${meta.accentText}`}>{cap.title}</span></p>
                <p className="text-xs text-neutral-400">{cap.desc}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-800/60 pt-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Global Pro Özellikler — Tüm Modüllerde Aktif</p>
            <div className="flex flex-wrap gap-2">
              {meta.proFeatures.map((feat) => (
                <span key={feat} className={`rounded-full border ${meta.accentBadgeBorder} ${meta.accentBadgeBg} px-3 py-1 text-xs ${meta.accentText}`}>{feat}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="text-xl font-bold">1) Kurum Oluştur</h2>
          <input value={newTenantName} onChange={(event) => setNewTenantName(event.target.value)} placeholder="Kurum adı" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500" />
          <input value={newTenantCode} onChange={(event) => setNewTenantCode(event.target.value.toUpperCase())} placeholder="Kurum kodu (örn: SCE01)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500" />
          <button type="button" onClick={() => void handleCreateTenant()} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 transition">Kurum Kaydet</button>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="text-xl font-bold">2) Sektör Admin Kullanıcısı</h2>
          <select value={selectedTenantCode} onChange={(event) => setSelectedTenantCode(event.target.value)} className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500">
            <option value="">Kurum seç</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.code}>{tenant.code} - {tenant.name}</option>
            ))}
          </select>
          <input value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} placeholder="Admin e-posta" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500" />
          <input type="password" value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} placeholder="Admin şifre" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500" />
          <button type="button" onClick={() => void handleCreateUser()} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 transition">Admin Oluştur</button>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="text-xl font-bold">3) Sektör Modülü Oluştur</h2>
          <select value={newModuleType} onChange={(event) => {
            setNewModuleType(event.target.value)
            const selected = moduleOptions.find((item) => item.value === event.target.value)
            if (selected) setNewModuleTitle(selected.defaultTitle)
          }} className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500">
            {moduleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input value={newModuleTitle} onChange={(event) => setNewModuleTitle(event.target.value)} placeholder="Modül başlığı" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
          <button type="button" onClick={() => void handleCreateModule()} className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 transition">Modül Oluştur</button>

          {lastPublicUrl ? (
            <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
              <p className="text-xs text-neutral-400">Oluşan modülün QR bağlantısı</p>
              <a href={lastPublicUrl} target="_blank" rel="noreferrer" className="block text-sm text-indigo-300 underline break-all">
                {lastPublicUrl}
              </a>
              <QRDisplay url={lastPublicUrl} size={180} />
            </div>
          ) : null}

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[240px] overflow-auto">
            <p className="text-sm font-semibold">Mevcut Modüller</p>
            {modules.length === 0 ? <p className="text-xs text-neutral-500">Kayıt bulunamadı.</p> : null}
            {modules.map((moduleRow) => (
              <div key={moduleRow.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-xs">
                <p className="text-white font-semibold">{moduleRow.tenant_code} - {moduleRow.title}</p>
                <p className="text-neutral-400">{moduleRow.module_type} ({moduleRow.slug})</p>
                <div className="mt-2 flex gap-2">
                  <a
                    href={`/${sector}/q/${moduleRow.tenant_code}/${moduleRow.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-indigo-700/70 bg-indigo-900/30 px-2 py-1 text-[10px] text-indigo-200 hover:bg-indigo-800/40"
                  >
                    QR Ac
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleDeleteModule(moduleRow)}
                    disabled={deletingModuleId === moduleRow.id}
                    className="rounded-lg border border-red-700/70 bg-red-900/30 px-2 py-1 text-[10px] text-red-200 hover:bg-red-800/40 disabled:opacity-50"
                  >
                    {deletingModuleId === moduleRow.id ? 'Siliniyor...' : 'QR Sil'}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {getModuleGlobalBadges(moduleRow.config_json).map((badge) => (
                    <span key={`${moduleRow.id}-${badge}`} className="rounded-full border border-emerald-700/60 bg-emerald-900/30 px-2 py-0.5 text-[10px] text-emerald-300">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {(['factory', 'retail', 'logistics'] as SectorKey[]).includes(sector) ? (
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="text-xl font-bold">4) Konveyor Kamera Yonetimi</h2>
          <p className="text-xs text-neutral-500">Kamera ekle, hat ile eslestir, test et, aktif/pasif yonet.</p>

          <div className="grid md:grid-cols-3 gap-3">
            <input value={newCameraName} onChange={(event) => setNewCameraName(event.target.value)} placeholder="Kamera adi (opsiyonel)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
            <input value={newCameraIp} onChange={(event) => setNewCameraIp(event.target.value)} placeholder="IP adresi (orn: 192.168.1.40)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
            <input value={newCameraRtsp} onChange={(event) => setNewCameraRtsp(event.target.value)} placeholder="RTSP URL (orn: rtsp://...)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
          </div>

          <button type="button" onClick={() => void handleCreateCamera()} className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 transition">Kamera Kaydet</button>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[280px] overflow-auto">
            <p className="text-sm font-semibold">Kayitli Kameralar</p>
            {cameras.length === 0 ? <p className="text-xs text-neutral-500">Kamera kaydi bulunamadi.</p> : null}
            {cameras.map((cameraRow) => (
              <div key={cameraRow.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs space-y-2">
                <p className="text-white font-semibold">{cameraRow.tenant_code} / {cameraRow.scanner_id} ({cameraRow.line_code})</p>
                <p className="text-neutral-400">{cameraRow.camera_name || '-'} | IP: {cameraRow.ip_address || '-'} | RTSP: {cameraRow.rtsp_url || '-'}</p>
                <p className="text-neutral-500">Test: {cameraRow.last_test_status || 'never'} {cameraRow.last_tested_at ? `(${String(cameraRow.last_tested_at)})` : ''}</p>
                {cameraRow.last_test_note ? <p className="text-neutral-500">Not: {cameraRow.last_test_note}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void handleAssignCameraLine(cameraRow)} disabled={cameraSavingId === cameraRow.id} className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-[10px] text-neutral-200 hover:bg-neutral-800 disabled:opacity-50">Hat Eslestir</button>
                  <button type="button" onClick={() => void handleTestCamera(cameraRow)} disabled={cameraSavingId === cameraRow.id} className="rounded-lg border border-indigo-700/70 bg-indigo-900/30 px-2 py-1 text-[10px] text-indigo-200 hover:bg-indigo-800/40 disabled:opacity-50">Test Et</button>
                  <button type="button" onClick={() => void handleToggleCamera(cameraRow)} disabled={cameraSavingId === cameraRow.id} className="rounded-lg border border-amber-700/70 bg-amber-900/30 px-2 py-1 text-[10px] text-amber-200 hover:bg-amber-800/40 disabled:opacity-50">{cameraRow.is_active ? 'Pasif Yap' : 'Aktif Yap'}</button>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold pt-2">5) Yürüyen Bant QR Ürün Sayımı</h2>
          <p className="text-xs text-neutral-500">Kamera/okuyucu her QR gördüğünde event yazılır; dedup penceresi ile aynı frame tekrarları engellenir.</p>
          <input value={lineCode} onChange={(event) => setLineCode(event.target.value)} placeholder="Bant kodu (örn: BANT-01)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
          <input value={scannerId} onChange={(event) => setScannerId(event.target.value)} placeholder="Kamera/okuyucu kodu (örn: CAM-01)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
          <input value={productQr} onChange={(event) => setProductQr(event.target.value)} placeholder="Okunan ürün QR" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
          <div className="grid md:grid-cols-3 gap-3">
            <input value={cameraFrameId} onChange={(event) => setCameraFrameId(event.target.value)} placeholder="Frame ID (opsiyonel)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
            <input value={confidence} onChange={(event) => setConfidence(event.target.value)} placeholder="Confidence (0-1)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
            <input value={dedupSeconds} onChange={(event) => setDedupSeconds(event.target.value)} placeholder="Dedup sn (örn: 2)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <input value={countFilterLineCode} onChange={(event) => setCountFilterLineCode(event.target.value)} placeholder="Rapor hat filtresi (opsiyonel)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
            <input value={countSinceHours} onChange={(event) => setCountSinceHours(event.target.value)} placeholder="Rapor aralığı saat (örn: 24)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => void handleRecordCount()} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 transition">Okuma Eventi Yaz</button>
            <button type="button" onClick={() => void handleLoadCounts()} className="rounded-xl bg-indigo-700 px-5 py-3 font-semibold hover:bg-indigo-600 transition">Sayım Raporunu Yükle</button>
            <button type="button" onClick={() => void handleLoadDashboard()} className="rounded-xl bg-violet-700 px-5 py-3 font-semibold hover:bg-violet-600 transition">Dashboard Yükle</button>
          </div>

          {countSummary ? (
            <div className="grid md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs">
                <p className="text-neutral-500">Toplam Okuma</p>
                <p className="text-white text-lg font-bold">{Number(countSummary.total_scans || 0)}</p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs">
                <p className="text-neutral-500">Tekil Ürün QR</p>
                <p className="text-white text-lg font-bold">{Number(countSummary.unique_products || 0)}</p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs">
                <p className="text-neutral-500">Aktif Hat</p>
                <p className="text-white text-lg font-bold">{Number(countSummary.active_lines || 0)}</p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs">
                <p className="text-neutral-500">Son Okuma</p>
                <p className="text-white text-sm font-semibold">{countSummary.last_seen ? String(countSummary.last_seen) : '-'}</p>
              </div>
            </div>
          ) : null}

          <div className="grid xl:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[280px] overflow-auto">
              <p className="text-sm font-semibold">Hat Performansı</p>
              {topLines.length === 0 ? <p className="text-xs text-neutral-500">Kayıt bulunamadı.</p> : null}
              {topLines.map((row) => (
                <div key={`top-${row.line_code}`} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
                  <p className="text-white font-semibold">Hat: {row.line_code}</p>
                  <p className="text-neutral-400">Toplam: {Number(row.scan_count || 0)} | Tekil Ürün: {Number(row.unique_products || 0)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[280px] overflow-auto">
              <p className="text-sm font-semibold">Son Okumalar</p>
              {recentEvents.length === 0 ? <p className="text-xs text-neutral-500">Kayıt bulunamadı.</p> : null}
              {recentEvents.map((row, index) => (
                <div key={`recent-${index}-${row.line_code}-${row.product_qr}`} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
                  <p className="text-white font-semibold">Hat: {row.line_code}</p>
                  <p className="text-neutral-400">Kamera: {row.scanner_id || '-'} | QR: {row.product_qr}</p>
                  <p className="text-neutral-400">Zaman: {String(row.counted_at || '')}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[320px] overflow-auto">
            <p className="text-sm font-semibold">Sayım Özeti</p>
            {countRows.length === 0 ? <p className="text-xs text-neutral-500">Kayıt bulunamadı.</p> : null}
            {countRows.map((row) => (
              <div key={`${row.line_code}-${row.product_qr}`} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
                <p className="text-white font-semibold">Hat: {row.line_code}</p>
                <p className="text-neutral-400">Ürün QR: {row.product_qr}</p>
                <p className="text-neutral-400">Toplam Okuma: {Number(row.scan_count || 0)} | Son Görülme: {String(row.last_seen || '')}</p>
              </div>
            ))}
          </div>
        </section>
        ) : null}
      </div>
    </main>
  )
}
