'use client'

import { useEffect, useMemo, useState } from 'react'
import QRDisplay from '@/components/QRDisplay'
import BackToPrevious from '@/components/BackToPrevious'

interface EducationAuthUser {
  id: string
  email: string
  role: 'education_admin'
  hotelId: string | null
  hotelCode: string | null
  isActive: boolean
}

interface HotelRow {
  id: string
  code: string
  name: string
  city: string
  whatsapp_number: string
}

interface ModuleRow {
  id: string
  hotel_id: string
  slug: string
  module_type: string
  title: string
  config_json: string
  hotel_code: string
  hotel_name: string
}

interface EducationQuizReportRow {
  student_no: string
  student_name: string
  submission_count: number
  avg_score: number
}

interface EducationAttendanceReportRow {
  student_no: string
  student_name: string
  attendance_count: number
  late_count: number
  early_leave_count: number
}

interface EducationAnnouncementResponseRow {
  id: string
  class_code: string
  branch_code: string
  student_no: string
  student_name: string
  parent_name: string
  event_response: string
  needs_approval: boolean
  approval_status: 'pending' | 'approved' | 'rejected'
  notes: string
  created_at: string
}

interface EducationSupportTicketRow {
  id: string
  requester_name: string
  requester_role: string
  department: 'technical' | 'administrative'
  category: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'new' | 'processing' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
}

interface EducationMeetingRow {
  id: string
  student_no: string
  student_name: string
  parent_name: string
  teacher_key: string
  requested_time: string
  status: 'new' | 'processing' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
}

interface MaterialEditorItem {
  key: string
  materialType: 'pdf' | 'video' | 'homework' | 'link'
  url: string
  tr: string
  en: string
  de: string
}

type EducationModuleType =
  | 'class_attendance'
  | 'lesson_material'
  | 'homework_quiz'
  | 'announcement_event'
  | 'education_support_ticket'
  | 'parent_teacher_meeting'

const EDUCATION_MODULE_OPTIONS: Array<{ value: EducationModuleType; label: string; defaultTitle: string }> = [
  { value: 'class_attendance', label: 'Sinif Yoklama', defaultTitle: 'Sınıf Yoklama QR' },
  { value: 'lesson_material', label: 'Ders Materyali', defaultTitle: 'Ders Materyali QR' },
  { value: 'homework_quiz', label: 'Odev ve Mini Quiz', defaultTitle: 'Ödev ve Mini Quiz QR' },
  { value: 'announcement_event', label: 'Duyuru ve Etkinlik', defaultTitle: 'Duyuru ve Etkinlik QR' },
  { value: 'education_support_ticket', label: 'Egitim Destek Talebi', defaultTitle: 'Eğitim Destek Talebi QR' },
  { value: 'parent_teacher_meeting', label: 'Veli-Ogretmen Iletisimi', defaultTitle: 'Veli-Öğretmen İletişim QR' },
]

function isEducationModuleType(moduleType: string) {
  return EDUCATION_MODULE_OPTIONS.some((option) => option.value === moduleType)
}

function toSchoolMessage(message: string) {
  return message
    .replace(/hotelCode/g, 'schoolCode')
    .replace(/hotel/gi, 'okul')
    .replace(/Otel/g, 'Okul')
}

export default function EducationPage() {
  const [authUser, setAuthUser] = useState<EducationAuthUser | null>(null)
  const [bootstrapMode, setBootstrapMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [bootstrapPassword, setBootstrapPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [hotels, setHotels] = useState<HotelRow[]>([])
  const [modules, setModules] = useState<ModuleRow[]>([])
  const [selectedHotelCode, setSelectedHotelCode] = useState('')
  const [moduleType, setModuleType] = useState<EducationModuleType>('class_attendance')
  const [moduleTitle, setModuleTitle] = useState('Sınıf Yoklama QR')
  const [lastPublicUrl, setLastPublicUrl] = useState<string | null>(null)

  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [schoolCity, setSchoolCity] = useState('')
  const [schoolWhatsapp, setSchoolWhatsapp] = useState('')

  const [selectedModuleSlug, setSelectedModuleSlug] = useState('')
  const [editModuleTitle, setEditModuleTitle] = useState('')
  const [educationConfigText, setEducationConfigText] = useState('')
  const [deletingModuleSlug, setDeletingModuleSlug] = useState('')

  const [reportsLoading, setReportsLoading] = useState(false)
  const [quizReport, setQuizReport] = useState<EducationQuizReportRow[]>([])
  const [attendanceReport, setAttendanceReport] = useState<EducationAttendanceReportRow[]>([])
  const [announcementResponses, setAnnouncementResponses] = useState<EducationAnnouncementResponseRow[]>([])
  const [supportTickets, setSupportTickets] = useState<EducationSupportTicketRow[]>([])
  const [meetingRows, setMeetingRows] = useState<EducationMeetingRow[]>([])
  const [meetingNotesById, setMeetingNotesById] = useState<Record<string, string>>({})

  const [materialClassCode, setMaterialClassCode] = useState('')
  const [materialLessonName, setMaterialLessonName] = useState('')
  const [materialItems, setMaterialItems] = useState<MaterialEditorItem[]>([])

  const selectedModule = useMemo(
    () => modules.find((item) => item.slug === selectedModuleSlug) || null,
    [modules, selectedModuleSlug]
  )

  const selectedModulePublicUrl = useMemo(() => {
    if (!selectedModule || typeof window === 'undefined') return null
    return `${window.location.origin}/h/${selectedModule.hotel_code}/q/${selectedModule.slug}`
  }, [selectedModule])

  const callApi = async (payload: Record<string, unknown>) => {
    const activeAdminPassword = adminPassword.trim() || bootstrapPassword.trim()
    const scopedPayload = { scope: 'education', ...payload }
    const mergedPayload = activeAdminPassword ? { ...scopedPayload, password: activeAdminPassword } : scopedPayload
    const res = await fetch('/api/hotel/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mergedPayload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(toSchoolMessage(String(data.error || 'İşlem başarısız')))
    return data
  }

  const syncModuleEditor = (moduleItem: ModuleRow | null) => {
    setSelectedModuleSlug(moduleItem?.slug || '')
    setEditModuleTitle(moduleItem?.title || '')

    if (!moduleItem) {
      setEducationConfigText('')
      setMaterialClassCode('')
      setMaterialLessonName('')
      setMaterialItems([])
      return
    }

    try {
      setEducationConfigText(JSON.stringify(JSON.parse(String(moduleItem.config_json || '{}')), null, 2))
    } catch {
      setEducationConfigText(String(moduleItem.config_json || '{}'))
    }

    if (moduleItem.module_type !== 'lesson_material') {
      setMaterialClassCode('')
      setMaterialLessonName('')
      setMaterialItems([])
      return
    }

    let config: Record<string, unknown> = {}
    try {
      config = JSON.parse(String(moduleItem.config_json || '{}')) as Record<string, unknown>
    } catch {
      config = {}
    }

    const classCode = String((config as { classCode?: unknown }).classCode || '').trim()
    const lessonName = String((config as { lessonName?: unknown }).lessonName || '').trim()
    const itemsRaw = Array.isArray((config as { items?: unknown[] }).items) ? (config as { items: unknown[] }).items : []

    const nextItems = itemsRaw
      .map((item) => {
        const src = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : null
        if (!src) return null
        const titles = typeof src.titles === 'object' && src.titles !== null ? (src.titles as Record<string, unknown>) : {}
        const materialTypeRaw = String(src.materialType || '').trim().toLowerCase()
        const materialType = materialTypeRaw === 'video' || materialTypeRaw === 'homework' || materialTypeRaw === 'link' ? materialTypeRaw : 'pdf'
        return {
          key: String(src.key || '').trim(),
          materialType,
          url: String(src.url || '').trim(),
          tr: String(titles.tr || '').trim(),
          en: String(titles.en || '').trim(),
          de: String(titles.de || '').trim(),
        } as MaterialEditorItem
      })
      .filter((item): item is MaterialEditorItem => Boolean(item && item.key))

    setMaterialClassCode(classCode)
    setMaterialLessonName(lessonName)
    setMaterialItems(nextItems)
  }

  const load = async (activeUser?: EducationAuthUser | null) => {
    const effectiveUser = activeUser ?? authUser
    const activeAdminPassword = adminPassword.trim() || bootstrapPassword.trim()
    if (!effectiveUser && !activeAdminPassword) return

    setLoading(true)
    setError(null)
    try {
      const data = await callApi({ action: 'list' })
      const nextHotels = (data.hotels || []) as HotelRow[]
      const nextModules = ((data.modules || []) as ModuleRow[]).filter((item) => isEducationModuleType(item.module_type))

      setHotels(nextHotels)
      setModules(nextModules)

      const preferredHotelCode = effectiveUser?.role === 'education_admin' && effectiveUser.hotelCode
        ? effectiveUser.hotelCode
        : selectedHotelCode || String(nextHotels[0]?.code || '')

      if (preferredHotelCode) setSelectedHotelCode(preferredHotelCode)

      const nextModule = nextModules.find((item) => item.slug === selectedModuleSlug) || nextModules[0] || null
      syncModuleEditor(nextModule)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/education/auth/me', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const user = (data.user || null) as EducationAuthUser | null
        setAuthUser(user)
        if (user) {
          setLoading(true)
          const listRes = await fetch('/api/hotel/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list', scope: 'education' }),
          })
          const listData = await listRes.json()
          if (!listRes.ok) {
            throw new Error(listData.error || 'Liste alınamadı')
          }

          const nextHotels = (listData.hotels || []) as HotelRow[]
          const nextModules = ((listData.modules || []) as ModuleRow[]).filter((item) => isEducationModuleType(item.module_type))
          setHotels(nextHotels)
          setModules(nextModules)

          const preferredHotelCode = user.role === 'education_admin' && user.hotelCode
            ? user.hotelCode
            : String(nextHotels[0]?.code || '')

          if (preferredHotelCode) setSelectedHotelCode(preferredHotelCode)

          const nextModule = nextModules[0] || null
          syncModuleEditor(nextModule)
        }
      } catch {
        setAuthUser(null)
      } finally {
        setLoading(false)
      }
    }

    void checkAuth()
  }, [])

  const handleLogin = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/education/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Giriş başarısız')
      const user = (data.user || null) as EducationAuthUser | null
      setAuthUser(user)
      await load(user)
      setEmail('')
      setPassword('')
      setSuccess('Giriş başarılı')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/education/auth/logout', { method: 'POST' })
    setAuthUser(null)
    setBootstrapMode(false)
    setHotels([])
    setModules([])
    setSelectedHotelCode('')
    setSelectedModuleSlug('')
    setEducationConfigText('')
  }

  const handleBootstrapAccess = async () => {
    if (!bootstrapPassword.trim()) {
      setError('ADMIN_PASSWORD gerekli')
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      setBootstrapMode(true)
      await load(null)
      setSuccess('ADMIN_PASSWORD ile geçici eğitim yönetimi açıldı')
    } catch (err) {
      setBootstrapMode(false)
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEducationModule = async () => {
    if (!selectedHotelCode) {
      setError('Önce okul seç')
      return
    }

    setError(null)
    setSuccess(null)
    setLastPublicUrl(null)

    try {
      const data = await callApi({
        action: 'createEducationModuleQr',
        hotelCode: selectedHotelCode,
        moduleType,
        title: moduleTitle,
      })

      setSuccess('Eğitim modülü oluşturuldu')
      setLastPublicUrl(String(data.publicUrl || ''))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleCreateSchool = async () => {
    if (!schoolName.trim() || !schoolCode.trim()) {
      setError('Okul adı ve okul kodu gerekli')
      return
    }

    if (!authUser && !(adminPassword.trim() || bootstrapPassword.trim())) {
      setError('Bu işlem için ADMIN_PASSWORD gerekli')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const data = await callApi({
        action: 'createHotel',
        tenantKind: 'school',
        name: schoolName.trim(),
        code: schoolCode.trim(),
        city: schoolCity.trim(),
        whatsappNumber: schoolWhatsapp.trim(),
      })

      const createdCode = String(data.hotel?.code || '').trim()
      if (createdCode) {
        setSelectedHotelCode(createdCode)
      }
      setSchoolName('')
      setSchoolCode('')
      setSchoolCity('')
      setSchoolWhatsapp('')
      setSuccess('Okul oluşturuldu')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleCreateEducationUser = async () => {
    if (!selectedHotelCode || !newUserEmail.trim() || !newUserPassword.trim()) {
      setError('Okul, e-posta ve şifre gerekli')
      return
    }

    if (!authUser && !(adminPassword.trim() || bootstrapPassword.trim())) {
      setError('Bu işlem için ADMIN_PASSWORD gerekli')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      await callApi({
        action: 'createHotelUser',
        hotelCode: selectedHotelCode,
        email: newUserEmail,
        userPassword: newUserPassword,
        role: 'education_admin',
      })

      setSuccess('Eğitim admin kullanıcısı oluşturuldu')
      setNewUserEmail('')
      setNewUserPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleUpdateModuleTitle = async () => {
    if (!selectedModuleSlug || !editModuleTitle.trim()) {
      setError('Modül ve başlık gerekli')
      return
    }

    setError(null)
    setSuccess(null)
    try {
      await callApi({ action: 'updateModuleTitle', slug: selectedModuleSlug, title: editModuleTitle })
      setSuccess('Modül başlığı güncellendi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleUpdateEducationConfig = async () => {
    if (!selectedModuleSlug || !selectedModule) {
      setError('Önce eğitim modülü seç')
      return
    }

    setError(null)
    setSuccess(null)
    try {
      const parsed = JSON.parse(educationConfigText || '{}')
      await callApi({
        action: 'updateEducationModuleConfig',
        slug: selectedModuleSlug,
        moduleType: selectedModule.module_type,
        config: parsed,
      })
      setSuccess('Eğitim modül konfigürasyonu güncellendi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleDeleteModule = async () => {
    if (!selectedModuleSlug || !selectedModule) {
      setError('Silmek icin bir modul sec')
      return
    }

    const confirmed = window.confirm(`${selectedModule.title} modulu silinsin mi? Bu islem geri alinamaz.`)
    if (!confirmed) return

    setError(null)
    setSuccess(null)
    setDeletingModuleSlug(selectedModuleSlug)
    try {
      await callApi({ action: 'deleteModule', slug: selectedModuleSlug })
      setSuccess('Modul silindi')
      if (lastPublicUrl && lastPublicUrl.includes(selectedModuleSlug)) {
        setLastPublicUrl(null)
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setDeletingModuleSlug('')
    }
  }

  const handleLoadReports = async () => {
    const hotelCode = selectedHotelCode || String(hotels[0]?.code || '')
    if (!hotelCode) {
      setError('Rapor için okul seç')
      return
    }

    setReportsLoading(true)
    setError(null)
    try {
      const data = await callApi({ action: 'listEducationReports', hotelCode })
      setQuizReport((data.quizByStudent || []) as EducationQuizReportRow[])
      setAttendanceReport((data.attendanceByStudent || []) as EducationAttendanceReportRow[])
      setAnnouncementResponses((data.announcementResponses || []) as EducationAnnouncementResponseRow[])
      setSupportTickets((data.supportTickets || []) as EducationSupportTicketRow[])
      setMeetingRows((data.meetings || []) as EducationMeetingRow[])
      setSuccess('Raporlar yüklendi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rapor yüklenemedi')
    } finally {
      setReportsLoading(false)
    }
  }

  const handleUpdateAnnouncementApproval = async (responseId: string, approvalStatus: 'approved' | 'rejected' | 'pending') => {
    setError(null)
    setSuccess(null)
    try {
      await callApi({ action: 'updateEducationAnnouncementApproval', responseId, approvalStatus })
      setSuccess('Veli onay durumu güncellendi')
      await handleLoadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleUpdateSupportTicket = async (
    ticketId: string,
    status: 'new' | 'processing' | 'confirmed' | 'completed' | 'cancelled',
    department: 'technical' | 'administrative',
    priority: 'low' | 'normal' | 'high' | 'urgent'
  ) => {
    setError(null)
    setSuccess(null)
    try {
      await callApi({ action: 'updateEducationSupportTicket', ticketId, status, department, priority })
      setSuccess('Destek talebi güncellendi')
      await handleLoadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleUpdateMeeting = async (
    meetingId: string,
    status: 'new' | 'processing' | 'confirmed' | 'completed' | 'cancelled'
  ) => {
    const meetingNotes = String(meetingNotesById[meetingId] || '').trim()
    setError(null)
    setSuccess(null)
    try {
      await callApi({ action: 'updateEducationMeeting', meetingId, status, meetingNotes })
      setSuccess('Görüşme durumu/notu güncellendi')
      await handleLoadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleUpdateMaterialItem = (index: number, patch: Partial<MaterialEditorItem>) => {
    setMaterialItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const handleAddMaterialItem = () => {
    setMaterialItems((prev) => [
      ...prev,
      {
        key: `material-${Date.now()}`,
        materialType: 'pdf',
        url: '',
        tr: '',
        en: '',
        de: '',
      },
    ])
  }

  const handleSaveMaterialQuickEditor = async () => {
    if (!selectedModule || selectedModule.module_type !== 'lesson_material') {
      setError('Önce ders materyali modülü seç')
      return
    }

    const normalizedItems = materialItems
      .map((item) => ({
        key: item.key.trim(),
        materialType: item.materialType,
        url: item.url.trim(),
        titles: {
          tr: item.tr.trim(),
          en: item.en.trim(),
          de: item.de.trim(),
        },
      }))
      .filter((item) => item.key && item.url && (item.titles.tr || item.titles.en || item.titles.de))

    if (!materialClassCode.trim() || !materialLessonName.trim() || normalizedItems.length === 0) {
      setError('Sınıf kodu, ders adı ve en az bir geçerli materyal gerekli')
      return
    }

    setError(null)
    setSuccess(null)
    try {
      const config = {
        languages: ['tr', 'en', 'de'],
        classCode: materialClassCode.trim(),
        lessonName: materialLessonName.trim(),
        items: normalizedItems,
      }
      await callApi({
        action: 'updateEducationModuleConfig',
        slug: selectedModule.slug,
        moduleType: 'lesson_material',
        config,
      })
      setSuccess('Ders materyalleri hızlı editörden güncellendi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  if (!authUser && !bootstrapMode) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
            <h1 className="text-3xl font-black tracking-tight">Eğitim Admin Giriş</h1>
            <p className="text-sm text-neutral-400">Bu panel sadece education_admin hesapları içindir. Tamamen eğitim modülleri içindir.</p>

            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="E-posta"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Şifre"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => void handleLogin()}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 transition"
            >
              Giriş Yap
            </button>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
            <h2 className="text-xl font-bold">Geçici Eğitim Yönetimi</h2>
            <p className="text-sm text-neutral-400">Henüz education_admin hesabın yoksa ADMIN_PASSWORD ile paneli açıp ilk kullanıcıyı oluştur.</p>
            <input
              type="password"
              value={bootstrapPassword}
              onChange={(event) => setBootstrapPassword(event.target.value)}
              placeholder="ADMIN_PASSWORD"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => void handleBootstrapAccess()}
              className="rounded-xl bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 transition"
            >
              ADMIN_PASSWORD ile aç
            </button>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <BackToPrevious fallbackHref="/" />
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h1 className="text-3xl font-black tracking-tight">Eğitim Modülü Yönetimi</h1>
          <p className="text-sm text-neutral-400">Eğitim modülleri sadece bu sayfadan yönetilir.</p>
          <p className="text-sm text-neutral-300">
            Giriş: {authUser ? `${authUser.email} (${authUser.role})` : 'ADMIN_PASSWORD ile geçici erişim'}
          </p>

          <div className="max-w-md space-y-2">
            <p className="text-xs text-neutral-500">ADMIN_PASSWORD (opsiyonel): platform işlemleri için.</p>
            <input
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="ADMIN_PASSWORD"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 transition"
            >
              Listeyi Yükle
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-xl bg-neutral-800 px-5 py-3 font-semibold hover:bg-neutral-700 transition border border-neutral-700"
            >
              Çıkış
            </button>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
          {loading ? <p className="text-sm text-neutral-400">Yükleniyor...</p> : null}
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="text-xl font-bold">1) Okul Oluştur / Güncelle</h2>
          <p className="text-xs text-neutral-500">Okul açma işlemi için ADMIN_PASSWORD gerekli. Mevcut okul kodunu girersen bilgiler güncellenir.</p>
          <input
            value={schoolName}
            onChange={(event) => setSchoolName(event.target.value)}
            placeholder="Okul adı"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-amber-500"
          />
          <input
            value={schoolCode}
            onChange={(event) => setSchoolCode(event.target.value.toUpperCase())}
            placeholder="Okul kodu (ör: SCE01)"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-amber-500"
          />
          <input
            value={schoolCity}
            onChange={(event) => setSchoolCity(event.target.value)}
            placeholder="Şehir (opsiyonel)"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-amber-500"
          />
          <input
            value={schoolWhatsapp}
            onChange={(event) => setSchoolWhatsapp(event.target.value)}
            placeholder="WhatsApp numarası (opsiyonel)"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={() => void handleCreateSchool()}
            className="rounded-xl bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 transition"
          >
            Okul Kaydet
          </button>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="text-xl font-bold">2) Eğitim Modülü QR Oluştur</h2>
          <select
            value={selectedHotelCode}
            onChange={(event) => setSelectedHotelCode(event.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500"
          >
            <option value="">Okul seç</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.code}>Okul: {hotel.code} - {hotel.name}</option>
            ))}
          </select>

          <select
            value={moduleType}
            onChange={(event) => {
              const nextType = event.target.value as EducationModuleType
              setModuleType(nextType)
              const matched = EDUCATION_MODULE_OPTIONS.find((item) => item.value === nextType)
              setModuleTitle(matched?.defaultTitle || '')
            }}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500"
          >
            {EDUCATION_MODULE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <input
            value={moduleTitle}
            onChange={(event) => setModuleTitle(event.target.value)}
            placeholder="Modül başlığı"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500"
          />

          <button
            type="button"
            onClick={() => void handleCreateEducationModule()}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 transition"
          >
            Eğitim Modülü Oluştur
          </button>

          {lastPublicUrl ? (
            <div className="space-y-3">
              <a href={lastPublicUrl} target="_blank" rel="noreferrer" className="block text-sm text-indigo-300 underline break-all">{lastPublicUrl}</a>
              <QRDisplay url={lastPublicUrl} size={180} />
            </div>
          ) : null}

          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <h3 className="text-lg font-semibold">Eğitim Admin Kullanıcısı Oluştur</h3>
            <p className="text-xs text-neutral-500">Bu işlem için yukarıdaki ADMIN_PASSWORD alanını doldur.</p>
            <input
              value={newUserEmail}
              onChange={(event) => setNewUserEmail(event.target.value)}
              placeholder="Kullanıcı e-posta"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
            />
            <input
              type="password"
              value={newUserPassword}
              onChange={(event) => setNewUserPassword(event.target.value)}
              placeholder="Kullanıcı şifre"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => void handleCreateEducationUser()}
              className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 transition"
            >
              education_admin Oluştur
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="text-xl font-bold">3) Eğitim Modül Ayarları</h2>

          <select
            value={selectedModuleSlug}
            onChange={(event) => {
              const nextModule = modules.find((item) => item.slug === event.target.value) || null
              syncModuleEditor(nextModule)
            }}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500"
          >
            <option value="">Modül seç</option>
            {modules.map((moduleItem) => (
              <option key={moduleItem.id} value={moduleItem.slug}>
                Okul: {moduleItem.hotel_code} - {moduleItem.title} [{moduleItem.module_type}] ({moduleItem.slug})
              </option>
            ))}
          </select>

          <input
            value={editModuleTitle}
            onChange={(event) => setEditModuleTitle(event.target.value)}
            placeholder="Modül başlığı"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => void handleUpdateModuleTitle()}
            className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold hover:bg-emerald-600 transition"
          >
            Başlığı Güncelle
          </button>

          <textarea
            value={educationConfigText}
            onChange={(event) => setEducationConfigText(event.target.value)}
            rows={14}
            placeholder="Eğitim modül JSON config"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => void handleUpdateEducationConfig()}
            className="rounded-xl bg-indigo-700 px-5 py-3 font-semibold hover:bg-indigo-600 transition"
          >
            Konfigürasyonu Güncelle
          </button>

          <button
            type="button"
            onClick={() => void handleDeleteModule()}
            disabled={!selectedModuleSlug || deletingModuleSlug === selectedModuleSlug}
            className="rounded-xl bg-red-700 px-5 py-3 font-semibold hover:bg-red-600 transition disabled:opacity-60"
          >
            {deletingModuleSlug === selectedModuleSlug ? 'Siliniyor...' : 'Secili Modulu Sil'}
          </button>

          {selectedModule?.module_type === 'lesson_material' ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4 space-y-3">
              <h3 className="text-lg font-semibold">Ders Materyali Hızlı Editör</h3>
              <p className="text-xs text-neutral-500">JSON yerine öğretmen dostu hızlı düzenleme ekranı.</p>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  value={materialClassCode}
                  onChange={(event) => setMaterialClassCode(event.target.value)}
                  placeholder="Sınıf kodu"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
                />
                <input
                  value={materialLessonName}
                  onChange={(event) => setMaterialLessonName(event.target.value)}
                  placeholder="Ders adı"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-3">
                {materialItems.map((item, index) => (
                  <div key={`${item.key}-${index}`} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 space-y-2">
                    <div className="grid md:grid-cols-3 gap-2">
                      <input
                        value={item.key}
                        onChange={(event) => handleUpdateMaterialItem(index, { key: event.target.value })}
                        placeholder="Materyal anahtarı"
                        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                      <select
                        value={item.materialType}
                        onChange={(event) => handleUpdateMaterialItem(index, { materialType: event.target.value as MaterialEditorItem['materialType'] })}
                        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      >
                        <option value="pdf">pdf</option>
                        <option value="video">video</option>
                        <option value="homework">homework</option>
                        <option value="link">link</option>
                      </select>
                      <input
                        value={item.url}
                        onChange={(event) => handleUpdateMaterialItem(index, { url: event.target.value })}
                        placeholder="URL"
                        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-2">
                      <input
                        value={item.tr}
                        onChange={(event) => handleUpdateMaterialItem(index, { tr: event.target.value })}
                        placeholder="Başlık TR"
                        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                      <input
                        value={item.en}
                        onChange={(event) => handleUpdateMaterialItem(index, { en: event.target.value })}
                        placeholder="Title EN"
                        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                      <input
                        value={item.de}
                        onChange={(event) => handleUpdateMaterialItem(index, { de: event.target.value })}
                        placeholder="Titel DE"
                        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddMaterialItem}
                  className="rounded-xl bg-neutral-800 px-4 py-2 text-sm font-semibold hover:bg-neutral-700 transition border border-neutral-700"
                >
                  Materyal Ekle
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveMaterialQuickEditor()}
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600 transition"
                >
                  Hızlı Editörü Kaydet
                </button>
              </div>
            </div>
          ) : null}

          {selectedModulePublicUrl ? (
            <div className="space-y-3">
              <a href={selectedModulePublicUrl} target="_blank" rel="noreferrer" className="block text-sm text-indigo-300 underline break-all">{selectedModulePublicUrl}</a>
              <QRDisplay url={selectedModulePublicUrl} size={180} />
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">4) Eğitim Raporları</h2>
              <p className="text-xs text-neutral-500 mt-1">Quiz ve yoklama özetleri öğrenci bazında.</p>
            </div>
            <button
              type="button"
              onClick={() => void handleLoadReports()}
              className="rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-600 transition"
            >
              Raporları Yükle
            </button>
          </div>

          {reportsLoading ? <p className="text-xs text-neutral-400">Raporlar yükleniyor...</p> : null}

          <div className="grid xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[300px] overflow-auto">
              <p className="text-sm font-semibold">Quiz Sonuçları (Öğrenci)</p>
              {quizReport.length === 0 ? <p className="text-xs text-neutral-500">Kayıt bulunamadı.</p> : null}
              {quizReport.map((row) => (
                <div key={`quiz-${row.student_no}-${row.student_name}`} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
                  <p className="text-white font-semibold">{row.student_name} ({row.student_no})</p>
                  <p className="text-neutral-400">Deneme: {row.submission_count} | Ortalama: %{Number(row.avg_score || 0)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[300px] overflow-auto">
              <p className="text-sm font-semibold">Yoklama Özeti (Öğrenci)</p>
              {attendanceReport.length === 0 ? <p className="text-xs text-neutral-500">Kayıt bulunamadı.</p> : null}
              {attendanceReport.map((row) => (
                <div key={`att-${row.student_no}-${row.student_name}`} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
                  <p className="text-white font-semibold">{row.student_name} ({row.student_no})</p>
                  <p className="text-neutral-400">Yoklama: {row.attendance_count} | Geç: {row.late_count} | Erken çıkış: {row.early_leave_count}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[300px] overflow-auto">
              <p className="text-sm font-semibold">Duyuru Yanıtları ve Veli Onayı</p>
              {announcementResponses.length === 0 ? <p className="text-xs text-neutral-500">Kayıt bulunamadı.</p> : null}
              {announcementResponses.map((row) => (
                <div key={`ann-${row.id}`} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs space-y-2">
                  <p className="text-white font-semibold">{row.student_name} ({row.student_no}) - {row.class_code}/{row.branch_code}</p>
                  <p className="text-neutral-400">Veli: {row.parent_name || '-'} | Yanıt: {row.event_response} | Onay: {row.approval_status}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleUpdateAnnouncementApproval(row.id, 'approved')}
                      className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-emerald-600"
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdateAnnouncementApproval(row.id, 'rejected')}
                      className="rounded-lg bg-rose-700 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-rose-600"
                    >
                      Reddet
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdateAnnouncementApproval(row.id, 'pending')}
                      className="rounded-lg bg-neutral-700 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-neutral-600"
                    >
                      Beklemeye Al
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[300px] overflow-auto">
              <p className="text-sm font-semibold">Eğitim Destek Talepleri</p>
              {supportTickets.length === 0 ? <p className="text-xs text-neutral-500">Kayıt bulunamadı.</p> : null}
              {supportTickets.map((row) => (
                <div key={`sup-${row.id}`} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs space-y-2">
                  <p className="text-white font-semibold">{row.requester_name} ({row.requester_role})</p>
                  <p className="text-neutral-400">Departman: {row.department} | Öncelik: {row.priority} | Durum: {row.status}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void handleUpdateSupportTicket(row.id, 'processing', row.department, row.priority)} className="rounded-lg bg-indigo-700 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-indigo-600">İşleme Al</button>
                    <button type="button" onClick={() => void handleUpdateSupportTicket(row.id, 'completed', row.department, row.priority)} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-emerald-600">Tamamla</button>
                    <button type="button" onClick={() => void handleUpdateSupportTicket(row.id, 'cancelled', row.department, row.priority)} className="rounded-lg bg-rose-700 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-rose-600">İptal</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[300px] overflow-auto">
              <p className="text-sm font-semibold">Veli-Öğretmen Görüşmeleri</p>
              {meetingRows.length === 0 ? <p className="text-xs text-neutral-500">Kayıt bulunamadı.</p> : null}
              {meetingRows.map((row) => (
                <div key={`meet-${row.id}`} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs space-y-2">
                  <p className="text-white font-semibold">{row.student_name} ({row.student_no}) - {row.parent_name}</p>
                  <p className="text-neutral-400">Öğretmen: {row.teacher_key} | Zaman: {row.requested_time} | Durum: {row.status}</p>
                  <textarea
                    value={meetingNotesById[row.id] || ''}
                    onChange={(event) => setMeetingNotesById((prev) => ({ ...prev, [row.id]: event.target.value }))}
                    placeholder="Görüşme notu"
                    rows={2}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void handleUpdateMeeting(row.id, 'confirmed')} className="rounded-lg bg-indigo-700 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-indigo-600">Onayla</button>
                    <button type="button" onClick={() => void handleUpdateMeeting(row.id, 'completed')} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-emerald-600">Tamamlandı</button>
                    <button type="button" onClick={() => void handleUpdateMeeting(row.id, 'cancelled')} className="rounded-lg bg-rose-700 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-rose-600">İptal</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
