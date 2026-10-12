'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import QRDisplay from '@/components/QRDisplay'
import BackToPrevious from '@/components/BackToPrevious'
import { DEFAULT_WORLD_CLOCK_CITIES } from '@/lib/hotel'

interface HotelAuthUser {
  id: string
  email: string
  role: 'platform_admin' | 'hotel_admin' | 'education_admin' | 'staff'
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
  is_active: boolean
  created_at: string
}

interface ModuleRow {
  id: string
  hotel_id: string
  slug: string
  module_type: string
  title: string
  config_json: string
  is_active: boolean
  created_at: string
  hotel_code: string
  hotel_name: string
}

type ModuleType =
  | 'world_clock'
  | 'menu'
  | 'room_service'
  | 'service_ticket'
  | 'room_hub'
  | 'class_attendance'
  | 'lesson_material'
  | 'homework_quiz'
  | 'announcement_event'
  | 'education_support_ticket'
  | 'parent_teacher_meeting'

const EDUCATION_MODULE_TYPES: ModuleType[] = [
  'class_attendance',
  'lesson_material',
  'homework_quiz',
  'announcement_event',
  'education_support_ticket',
  'parent_teacher_meeting',
]

function isEducationModuleType(moduleType: string) {
  return EDUCATION_MODULE_TYPES.includes(moduleType as ModuleType)
}

interface HotelAnalyticsRow {
  totalOrders?: number
  openOrders?: number
  completedOrders?: number
  ordersLast24h?: number
  totalTickets?: number
  openTickets?: number
  completedTickets?: number
  ticketsLast24h?: number
}

interface RoomOrderRow {
  id: string
  room_no: string
  floor_label: string
  source_tag: string
  guest_name: string
  lang: string
  items_json: string
  notes: string
  voice_note_url: string
  status: 'new' | 'processing' | 'completed' | 'cancelled'
  whatsapp_delivery: 'pending' | 'sent' | 'failed' | 'skipped'
  created_at: string
  hotel_code: string
  module_slug: string | null
  module_title: string | null
}

interface ServiceTicketRow {
  id: string
  room_no: string
  floor_label: string
  source_tag: string
  guest_name: string
  contact_phone: string
  requested_time: string
  lang: string
  department: 'housekeeping' | 'technical' | 'concierge'
  category: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  details: string
  voice_note_url: string
  status: 'new' | 'processing' | 'completed' | 'cancelled'
  whatsapp_delivery: 'pending' | 'sent' | 'failed' | 'skipped'
  created_at: string
  hotel_code: string
  module_slug: string | null
  module_title: string | null
}

interface RoomQrRow {
  id: string
  room_no: string
  floor_label: string
  source_tag: string
  revision_count: number
  max_revisions: number
  is_locked: boolean
  module_slug: string
  module_title: string
  module_type: string
  publicUrl: string
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

function formatDateTR(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function summarizeRoomOrderItems(itemsJson: string) {
  try {
    const parsed = JSON.parse(String(itemsJson || '[]')) as Array<{ name?: string; quantity?: number }>
    if (!Array.isArray(parsed) || parsed.length === 0) return '-'
    return parsed
      .slice(0, 4)
      .map((item) => {
        const name = String(item?.name || '').trim()
        const qty = Number(item?.quantity || 1)
        if (!name) return null
        return `${name} x${qty > 0 ? qty : 1}`
      })
      .filter((line): line is string => Boolean(line))
      .join(', ')
  } catch {
    return '-'
  }
}

export default function HotelModulePage() {
  const defaultWorldClockRowsText = DEFAULT_WORLD_CLOCK_CITIES.map((row) => `${row.city}|${row.timezone}`).join('\n')

  const [authUser, setAuthUser] = useState<HotelAuthUser | null>(null)
  const [adminPassword, setAdminPassword] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bootstrapPassword, setBootstrapPassword] = useState('')
  const [bootstrapEmail, setBootstrapEmail] = useState('')
  const [bootstrapUserPassword, setBootstrapUserPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [hotels, setHotels] = useState<HotelRow[]>([])
  const [modules, setModules] = useState<ModuleRow[]>([])

  const [hotelName, setHotelName] = useState('')
  const [hotelCode, setHotelCode] = useState('')
  const [hotelCity, setHotelCity] = useState('')
  const [hotelWhatsapp, setHotelWhatsapp] = useState('')
  const [updateHotelCode, setUpdateHotelCode] = useState('')
  const [updateHotelWhatsapp, setUpdateHotelWhatsapp] = useState('')

  const [selectedHotelCode, setSelectedHotelCode] = useState('')
  const [moduleType, setModuleType] = useState<ModuleType>('world_clock')
  const [moduleTitle, setModuleTitle] = useState('Dünya Saatleri')
  const [lastPublicUrl, setLastPublicUrl] = useState<string | null>(null)
  const [selectedModuleSlug, setSelectedModuleSlug] = useState('')
  const [editModuleTitle, setEditModuleTitle] = useState('')
  const [citiesText, setCitiesText] = useState(defaultWorldClockRowsText)
  const [menuLanguagesText, setMenuLanguagesText] = useState('tr,en,de')
  const [menuRowsText, setMenuRowsText] = useState('')
  const [educationConfigText, setEducationConfigText] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'hotel_admin' | 'staff'>('hotel_admin')
  const [analyticsByHotel, setAnalyticsByHotel] = useState<Record<string, HotelAnalyticsRow>>({})
  const [roomOrders, setRoomOrders] = useState<RoomOrderRow[]>([])
  const [serviceTickets, setServiceTickets] = useState<ServiceTicketRow[]>([])
  const [operationsLoading, setOperationsLoading] = useState(false)
  const [operationHotelCode, setOperationHotelCode] = useState('')
  const [operationStatus, setOperationStatus] = useState<'all' | 'new' | 'processing' | 'completed' | 'cancelled'>('all')
  const [operationDepartment, setOperationDepartment] = useState<'all' | 'housekeeping' | 'technical' | 'concierge'>('all')
  const [operationPriority, setOperationPriority] = useState<'all' | 'low' | 'normal' | 'high' | 'urgent'>('all')
  const [voiceAlertEnabled, setVoiceAlertEnabled] = useState(true)
  const [roomQrs, setRoomQrs] = useState<RoomQrRow[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkModuleSlug, setBulkModuleSlug] = useState('')
  const [bulkTotalRooms, setBulkTotalRooms] = useState('100')
  const [bulkStartRoomNo, setBulkStartRoomNo] = useState('101')
  const [bulkRoomsPerFloor, setBulkRoomsPerFloor] = useState('20')
  const [bulkFloorStart, setBulkFloorStart] = useState('1')
  const [selectedRoomQrId, setSelectedRoomQrId] = useState('')
  const [reviseRoomNo, setReviseRoomNo] = useState('')
  const [reviseFloorLabel, setReviseFloorLabel] = useState('')
  const [roomQrPreviewUrl, setRoomQrPreviewUrl] = useState<string | null>(null)
  const [educationReportsLoading, setEducationReportsLoading] = useState(false)
  const [educationQuizReport, setEducationQuizReport] = useState<EducationQuizReportRow[]>([])
  const [educationAttendanceReport, setEducationAttendanceReport] = useState<EducationAttendanceReportRow[]>([])
  const canCreateModuleQr = Boolean(authUser && authUser.role !== 'staff')
  const isOperationsInitializedRef = useRef(false)
  const seenRoomOrderIdsRef = useRef<Set<string>>(new Set())
  const seenServiceTicketIdsRef = useRef<Set<string>>(new Set())

  const speakAlert = (message: string) => {
    if (!voiceAlertEnabled || typeof window === 'undefined' || !window.speechSynthesis) return
    const text = String(message || '').trim()
    if (!text) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  const getDepartmentLabel = (department: string) => {
    if (department === 'housekeeping') return 'housekeeping'
    if (department === 'technical') return 'teknik servis'
    if (department === 'concierge') return 'concierge'
    return 'servis'
  }

  const announceNewOperations = (nextRoomOrders: RoomOrderRow[], nextServiceTickets: ServiceTicketRow[]) => {
    if (!isOperationsInitializedRef.current) {
      seenRoomOrderIdsRef.current = new Set(nextRoomOrders.map((order) => String(order.id || '')))
      seenServiceTicketIdsRef.current = new Set(nextServiceTickets.map((ticket) => String(ticket.id || '')))
      isOperationsInitializedRef.current = true
      return
    }

    const newOrders = nextRoomOrders.filter((order) => !seenRoomOrderIdsRef.current.has(String(order.id || '')))
    const newTickets = nextServiceTickets.filter((ticket) => !seenServiceTicketIdsRef.current.has(String(ticket.id || '')))

    for (const order of newOrders) {
      const roomText = order.room_no ? `Oda ${order.room_no}` : 'Bir oda'
      speakAlert(`${roomText} için yeni sipariş alındı.`)
    }

    for (const ticket of newTickets) {
      const roomText = ticket.room_no ? `Oda ${ticket.room_no}` : 'Bir oda'
      const departmentLabel = getDepartmentLabel(String(ticket.department || ''))
      speakAlert(`${roomText} için yeni ${departmentLabel} talebi var.`)
    }

    for (const order of nextRoomOrders) {
      seenRoomOrderIdsRef.current.add(String(order.id || ''))
    }
    for (const ticket of nextServiceTickets) {
      seenServiceTicketIdsRef.current.add(String(ticket.id || ''))
    }
  }

  const groupedModules = useMemo(() => {
    const map: Record<string, ModuleRow[]> = {}
    for (const moduleItem of modules) {
      if (!map[moduleItem.hotel_code]) {
        map[moduleItem.hotel_code] = []
      }
      map[moduleItem.hotel_code].push(moduleItem)
    }
    return map
  }, [modules])

  const roomQrModules = useMemo(
    () => modules.filter((moduleItem) => moduleItem.module_type === 'room_service' || moduleItem.module_type === 'service_ticket' || moduleItem.module_type === 'room_hub'),
    [modules]
  )

  const moduleToCitiesText = (moduleItem: ModuleRow | null) => {
    if (!moduleItem) return ''

    try {
      const parsed = JSON.parse(String(moduleItem.config_json || '[]'))
      if (!Array.isArray(parsed)) return ''

      return parsed
        .map((item) => {
          const city = String(item?.city || '').trim()
          const timezone = String(item?.timezone || '').trim()
          if (!city || !timezone) return null
          return `${city}|${timezone}`
        })
        .filter((line): line is string => Boolean(line))
        .join('\n')
    } catch {
      return ''
    }
  }

  const moduleToMenuEditor = (moduleItem: ModuleRow | null) => {
    if (!moduleItem) {
      return {
        languages: 'tr,en,de',
        rows: '',
      }
    }

    try {
      const parsed = JSON.parse(String(moduleItem.config_json || '{}')) as {
        languages?: unknown
        sections?: Array<{
          key?: unknown
          names?: Record<string, unknown>
          items?: Array<{ names?: Record<string, unknown>; description?: Record<string, unknown>; price?: unknown }>
        }>
      }

      const languages = Array.isArray(parsed.languages)
        ? parsed.languages.map((lang) => String(lang || '').trim().toLowerCase()).filter(Boolean)
        : ['tr', 'en', 'de']

      const pickedLanguages = languages.length > 0 ? languages.slice(0, 3) : ['tr', 'en', 'de']
      while (pickedLanguages.length < 3) {
        pickedLanguages.push(['tr', 'en', 'de'][pickedLanguages.length])
      }

      const sections = Array.isArray(parsed.sections) ? parsed.sections : []
      const rows = sections
        .flatMap((section) => {
          const sectionKey = String(section?.key || '').trim()
          const sectionNames = typeof section?.names === 'object' && section.names ? section.names : {}
          const items = Array.isArray(section?.items) ? section.items : []

          return items.map((item) => {
            const names = typeof item?.names === 'object' && item.names ? item.names : {}
            const description = typeof item?.description === 'object' && item.description ? item.description : {}
            const first = pickedLanguages[0]
            const second = pickedLanguages[1]
            const third = pickedLanguages[2]

            return [
              sectionKey,
              String(sectionNames[first] || ''),
              String(sectionNames[second] || ''),
              String(sectionNames[third] || ''),
              String(names[first] || ''),
              String(names[second] || ''),
              String(names[third] || ''),
              String(item?.price || ''),
              String(description[first] || ''),
              String(description[second] || ''),
              String(description[third] || ''),
            ]
              .map((part) => part.replace(/\|/g, '/').trim())
              .join('|')
          })
        })
        .join('\n')

      return {
        languages: pickedLanguages.join(','),
        rows,
      }
    } catch {
      return {
        languages: 'tr,en,de',
        rows: '',
      }
    }
  }

  const moduleToEducationConfig = (moduleItem: ModuleRow | null) => {
    if (!moduleItem) return ''
    if (!EDUCATION_MODULE_TYPES.includes(moduleItem.module_type as ModuleType)) return ''
    try {
      return JSON.stringify(JSON.parse(String(moduleItem.config_json || '{}')), null, 2)
    } catch {
      return String(moduleItem.config_json || '{}')
    }
  }

  const syncModuleEditor = (moduleItem: ModuleRow | null) => {
    setSelectedModuleSlug(moduleItem?.slug || '')
    setEditModuleTitle(moduleItem?.title || '')
    const nextCitiesText = moduleToCitiesText(moduleItem)
    if (!moduleItem || moduleItem.module_type === 'world_clock') {
      setCitiesText(nextCitiesText || defaultWorldClockRowsText)
    } else {
      setCitiesText(nextCitiesText)
    }

    const menuEditor = moduleToMenuEditor(moduleItem)
    setMenuLanguagesText(menuEditor.languages)
    setMenuRowsText(menuEditor.rows)
    setEducationConfigText(moduleToEducationConfig(moduleItem))
  }

  const callApi = async (payload: Record<string, unknown>) => {
    const mergedPayload = adminPassword.trim() ? { ...payload, password: adminPassword.trim() } : payload
    const res = await fetch('/api/hotel/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mergedPayload),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'İşlem başarısız')
    }

    return data
  }

  const loadOperations = async (nextHotelCode?: string, options?: { silent?: boolean }) => {
    const hotelCodeToLoad = (nextHotelCode || operationHotelCode || selectedHotelCode || '').trim()
    if (!hotelCodeToLoad) return

    setOperationsLoading(true)

    try {
      const data = await callApi({
        action: 'listOperations',
        hotelCode: hotelCodeToLoad,
        status: operationStatus === 'all' ? '' : operationStatus,
        department: operationDepartment === 'all' ? '' : operationDepartment,
        priority: operationPriority === 'all' ? '' : operationPriority,
        limit: 120,
      })

      const nextRoomOrders = (data.roomOrders || []) as RoomOrderRow[]
      const nextServiceTickets = (data.serviceTickets || []) as ServiceTicketRow[]
      setRoomOrders(nextRoomOrders)
      setServiceTickets(nextServiceTickets)
      setOperationHotelCode(String(data.hotelCode || hotelCodeToLoad))
      announceNewOperations(nextRoomOrders, nextServiceTickets)
    } catch (err) {
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : 'Sunucu hatası')
      }
    } finally {
      setOperationsLoading(false)
    }
  }

  const parsePositiveInt = (value: string, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
  }

  const buildBulkRoomEntries = () => {
    const total = Math.min(parsePositiveInt(bulkTotalRooms, 0), 2000)
    const startRoom = parsePositiveInt(bulkStartRoomNo, 0)
    const roomsPerFloor = parsePositiveInt(bulkRoomsPerFloor, 0)
    const floorStart = parsePositiveInt(bulkFloorStart, 1)

    if (total < 1 || startRoom < 1) {
      throw new Error('Toplam oda ve baslangic oda no pozitif olmali')
    }

    const entries: Array<{ roomNo: string; floorLabel: string }> = []
    for (let index = 0; index < total; index += 1) {
      const roomNo = String(startRoom + index)
      const floorLabel = roomsPerFloor > 0 ? String(floorStart + Math.floor(index / roomsPerFloor)) : ''
      entries.push({ roomNo, floorLabel })
    }
    return entries
  }

  const loadRoomQrs = async (nextHotelCode?: string, nextSlug?: string) => {
    const fallbackHotelCode = String(hotels[0]?.code || '')
    const hotelCodeToLoad = (nextHotelCode || selectedHotelCode || fallbackHotelCode).trim()
    const modulesForHotel = roomQrModules.filter((moduleItem) => moduleItem.hotel_code === hotelCodeToLoad)
    const preferredSlug = (nextSlug || bulkModuleSlug || selectedModuleSlug || '').trim()
    const slugToLoad = preferredSlug && modulesForHotel.some((moduleItem) => moduleItem.slug === preferredSlug)
      ? preferredSlug
      : String(modulesForHotel[0]?.slug || '')

    if (!hotelCodeToLoad) {
      setError('Önce bir otel seçmelisin')
      return
    }

    if (selectedHotelCode !== hotelCodeToLoad) {
      setSelectedHotelCode(hotelCodeToLoad)
    }

    if (hotelCodeToLoad && slugToLoad && bulkModuleSlug !== slugToLoad) {
      setBulkModuleSlug(slugToLoad)
    }

    if (!slugToLoad) {
      setError('Bu otel için room_service, service_ticket veya room_hub modülü bulunamadı')
      return
    }

    setBulkLoading(true)
    try {
      const data = await callApi({
        action: 'listRoomQrs',
        hotelCode: hotelCodeToLoad,
        slug: slugToLoad || '',
        limit: 2000,
      })
      setRoomQrs((data.roomQrs || []) as RoomQrRow[])
      if (!bulkModuleSlug) setBulkModuleSlug(slugToLoad)
      if (!selectedRoomQrId && Array.isArray(data.roomQrs) && data.roomQrs.length > 0) {
        const first = data.roomQrs[0] as RoomQrRow
        setSelectedRoomQrId(first.id)
        setReviseRoomNo(first.room_no)
        setReviseFloorLabel(first.floor_label || '')
        setRoomQrPreviewUrl(first.publicUrl || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toplu QR listesi alınamadı')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkCreateRoomQrs = async () => {
    const fallbackHotelCode = String(hotels[0]?.code || '')
    const effectiveHotelCode = (selectedHotelCode || fallbackHotelCode).trim()
    const modulesForHotel = roomQrModules.filter((moduleItem) => moduleItem.hotel_code === effectiveHotelCode)
    const effectiveSlug = (bulkModuleSlug || String(modulesForHotel[0]?.slug || '')).trim()

    if (!effectiveHotelCode || !effectiveSlug) {
      setError('Otel ve modül seçmelisin')
      return
    }

    if (selectedHotelCode !== effectiveHotelCode) {
      setSelectedHotelCode(effectiveHotelCode)
    }
    if (bulkModuleSlug !== effectiveSlug) {
      setBulkModuleSlug(effectiveSlug)
    }

    setError(null)
    setSuccess(null)
    setBulkLoading(true)

    try {
      const entries = buildBulkRoomEntries()
      const data = await callApi({
        action: 'bulkCreateRoomQrs',
        hotelCode: effectiveHotelCode,
        slug: effectiveSlug,
        entries,
      })

      setSuccess(`Toplu QR tamamlandı. Yeni: ${Number(data.createdCount || 0)}, atlanan: ${Number(data.skippedCount || 0)}`)
      await loadRoomQrs(effectiveHotelCode, effectiveSlug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toplu QR oluşturma başarısız')
    } finally {
      setBulkLoading(false)
    }
  }

  const handlePickRoomQr = (qr: RoomQrRow) => {
    setSelectedRoomQrId(qr.id)
    setReviseRoomNo(qr.room_no)
    setReviseFloorLabel(qr.floor_label || '')
    setRoomQrPreviewUrl(qr.publicUrl)
  }

  const handleReviseRoomQr = async () => {
    if (!selectedRoomQrId || !reviseRoomNo.trim()) {
      setError('Düzenlemek için QR ve oda no gerekli')
      return
    }

    setError(null)
    setSuccess(null)
    setBulkLoading(true)
    try {
      const data = await callApi({
        action: 'reviseRoomQr',
        qrId: selectedRoomQrId,
        roomNo: reviseRoomNo,
        floorLabel: reviseFloorLabel,
      })
      setSuccess(`QR revizyonu kaydedildi (${Number(data.revisionCount || 0)}/${Number(data.maxRevisions || 2)})`)
      await loadRoomQrs(selectedHotelCode, bulkModuleSlug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'QR revizyonu başarısız')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleDeleteSelectedRoomQr = async () => {
    if (!selectedRoomQrId) {
      setError('Silmek için bir QR seçmelisin')
      return
    }

    setError(null)
    setSuccess(null)
    setBulkLoading(true)

    try {
      const targetHotelCode = (selectedHotelCode || String(hotels[0]?.code || '')).trim()
      const data = await callApi({
        action: 'deleteRoomQrs',
        hotelCode: targetHotelCode,
        qrIds: [selectedRoomQrId],
      })

      setSuccess(`Seçili oda QR silindi. Silinen: ${Number(data.deletedCount || 0)}`)
      setSelectedRoomQrId('')
      setReviseRoomNo('')
      setReviseFloorLabel('')
      setRoomQrPreviewUrl(null)
      await loadRoomQrs(targetHotelCode, bulkModuleSlug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'QR silme başarısız')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleDeleteModuleRoomQrs = async () => {
    const targetHotelCode = (selectedHotelCode || String(hotels[0]?.code || '')).trim()
    const targetSlug = (bulkModuleSlug || '').trim()

    if (!targetHotelCode || !targetSlug) {
      setError('Toplu silme için otel ve modül seçmelisin')
      return
    }

    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm('Bu modüldeki tüm oda QR kayıtları silinecek. Devam edilsin mi?')
    if (!confirmed) return

    setError(null)
    setSuccess(null)
    setBulkLoading(true)

    try {
      const data = await callApi({
        action: 'deleteRoomQrs',
        hotelCode: targetHotelCode,
        slug: targetSlug,
      })

      setSuccess(`Modüldeki oda QR kayıtları silindi. Silinen: ${Number(data.deletedCount || 0)}`)
      setSelectedRoomQrId('')
      setReviseRoomNo('')
      setReviseFloorLabel('')
      setRoomQrPreviewUrl(null)
      await loadRoomQrs(targetHotelCode, targetSlug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toplu QR silme başarısız')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleUpdateOperationStatus = async (
    operationType: 'room_order' | 'service_ticket',
    operationId: string,
    status: 'new' | 'processing' | 'completed' | 'cancelled'
  ) => {
    setError(null)
    setSuccess(null)
    setOperationsLoading(true)

    try {
      await callApi({ action: 'updateOperationStatus', operationType, operationId, status })
      setSuccess(`Durum güncellendi: ${status}`)
      await loadOperations()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setOperationsLoading(false)
    }
  }

  const load = async (force = false) => {
    if (!authUser && !force) return false

    setLoading(true)
    setError(null)

    try {
      const data = await callApi({ action: 'list' })
      const nextHotels = data.hotels || []
      const nextModules = Array.isArray(data.modules)
        ? (data.modules as ModuleRow[]).filter((moduleItem) => !isEducationModuleType(moduleItem.module_type))
        : []

      setHotels(nextHotels)
      setModules(nextModules)
      setAnalyticsByHotel((data.analyticsByHotel || {}) as Record<string, HotelAnalyticsRow>)

      const firstHotelCode = Array.isArray(nextHotels) && nextHotels.length > 0 ? String(nextHotels[0].code || '') : ''
      const preferredHotelCode = selectedHotelCode || firstHotelCode
      const preferredWhatsappHotelCode =
        authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : updateHotelCode || preferredHotelCode
      const preferredWhatsappHotel = Array.isArray(nextHotels)
        ? nextHotels.find((hotel: HotelRow) => String(hotel.code || '') === preferredWhatsappHotelCode)
        : null

      if (preferredWhatsappHotelCode) {
        setUpdateHotelCode(preferredWhatsappHotelCode)
      }
      if (preferredWhatsappHotel) {
        setUpdateHotelWhatsapp(String(preferredWhatsappHotel.whatsapp_number || ''))
      }

      if (!operationHotelCode && preferredHotelCode) {
        setOperationHotelCode(preferredHotelCode)
      }

      if (!selectedHotelCode && Array.isArray(nextHotels) && nextHotels.length > 0) {
        setSelectedHotelCode(String(nextHotels[0].code || ''))
      }

      if (Array.isArray(nextModules)) {
        const nextModule = nextModules.find((module: ModuleRow) => module.slug === selectedModuleSlug) || nextModules[0] || null
        syncModuleEditor(nextModule)
        const roomModuleForHotel = nextModules.find(
          (module: ModuleRow) =>
            module.hotel_code === preferredHotelCode
            && (module.module_type === 'room_service' || module.module_type === 'service_ticket' || module.module_type === 'room_hub')
        )
        if (roomModuleForHotel?.slug) {
          setBulkModuleSlug(String(roomModuleForHotel.slug))
        }
      }

      if (preferredHotelCode) {
        await loadOperations(preferredHotelCode, { silent: true })
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
      return false
    } finally {
      setLoading(false)
    }
  }

  const selectedModule = useMemo(
    () => modules.find((moduleItem) => moduleItem.slug === selectedModuleSlug) || null,
    [modules, selectedModuleSlug]
  )

  const selectedModulePublicUrl = useMemo(() => {
    if (!selectedModule || typeof window === 'undefined') return null
    return `${window.location.origin}/h/${selectedModule.hotel_code}/q/${selectedModule.slug}`
  }, [selectedModule])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/hotel/auth/me', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const user = data.user || null
        setAuthUser(user)
        if (user) {
          await load(true)
        }
      } catch {
        setAuthUser(null)
      }
    }

    void checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/hotel/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Giriş başarısız')

      const user = data.user || null
      setAuthUser(user)
      const loaded = await load(true)
      if (!loaded) return
      setEmail('')
      setPassword('')
      setSuccess('Giriş başarılı')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordModeAccess = async () => {
    if (!adminPassword.trim()) {
      setError('ADMIN_PASSWORD girmen gerekli')
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await callApi({ action: 'list' })
      setAuthUser({
        id: 'admin-password',
        email: 'admin-password-mode',
        role: 'platform_admin',
        hotelId: null,
        hotelCode: null,
        isActive: true,
      })
      const loaded = await load(true)
      if (!loaded) return
      setSuccess('ADMIN_PASSWORD ile yönetim paneli açıldı')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setError(null)
    setSuccess(null)

    try {
      await fetch('/api/hotel/auth/logout', { method: 'POST' })
    } finally {
      setAuthUser(null)
      setHotels([])
      setModules([])
      syncModuleEditor(null)
    }
  }

  const handleBootstrap = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/hotel/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bootstrapPassword,
          email: bootstrapEmail,
          password: bootstrapUserPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kurulum başarısız')
      setSuccess('Platform admin hesabı oluşturuldu. Şimdi giriş yapabilirsin.')
      setBootstrapEmail('')
      setBootstrapUserPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHotel = async () => {
    setError(null)
    setSuccess(null)

    try {
      await callApi({
        action: 'createHotel',
        name: hotelName,
        code: hotelCode,
        city: hotelCity,
        whatsappNumber: hotelWhatsapp,
      })

      setSuccess('Otel kaydı oluşturuldu/güncellendi')
      await load()
      setHotelName('')
      setHotelCode('')
      setHotelCity('')
      setHotelWhatsapp('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleUpdateHotelWhatsapp = async () => {
    const effectiveHotelCode = authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : updateHotelCode

    if (!effectiveHotelCode) {
      setError('WhatsApp güncellemek için otel seçmelisin')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      await callApi({
        action: 'updateHotelWhatsapp',
        hotelCode: effectiveHotelCode,
        whatsappNumber: updateHotelWhatsapp,
      })

      setSuccess('Otel WhatsApp numarası güncellendi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleCreateWorldClockQr = async () => {
    setError(null)
    setSuccess(null)
    setLastPublicUrl(null)

    try {
      const data = await callApi({
        action: 'createWorldClockQr',
        hotelCode: selectedHotelCode,
        title: moduleTitle,
      })

      setSuccess('Dünya saatleri QR modülü oluşturuldu')
      setLastPublicUrl(String(data.publicUrl || ''))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleCreateMenuQr = async () => {
    setError(null)
    setSuccess(null)
    setLastPublicUrl(null)

    try {
      const data = await callApi({
        action: 'createMenuQr',
        hotelCode: selectedHotelCode,
        title: moduleTitle,
      })

      setSuccess('Menü QR modülü oluşturuldu')
      setLastPublicUrl(String(data.publicUrl || ''))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleCreateModule = async () => {
    if (moduleType === 'menu') {
      await handleCreateMenuQr()
      return
    }

    if (moduleType === 'room_service') {
      setError(null)
      setSuccess(null)
      setLastPublicUrl(null)

      try {
        const data = await callApi({
          action: 'createRoomServiceQr',
          hotelCode: selectedHotelCode,
          title: moduleTitle,
        })

        setSuccess('Oda servisi QR modülü oluşturuldu')
        setLastPublicUrl(String(data.publicUrl || ''))
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sunucu hatası')
      }
      return
    }

    if (moduleType === 'service_ticket') {
      setError(null)
      setSuccess(null)
      setLastPublicUrl(null)

      try {
        const data = await callApi({
          action: 'createServiceTicketQr',
          hotelCode: selectedHotelCode,
          title: moduleTitle,
        })

        setSuccess('Servis talebi QR modülü oluşturuldu')
        setLastPublicUrl(String(data.publicUrl || ''))
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sunucu hatası')
      }
      return
    }

    if (moduleType === 'room_hub') {
      setError(null)
      setSuccess(null)
      setLastPublicUrl(null)

      try {
        const data = await callApi({
          action: 'createRoomHubQr',
          hotelCode: selectedHotelCode,
          title: moduleTitle,
        })

        setSuccess('Oda asistanı QR modülü oluşturuldu')
        setLastPublicUrl(String(data.publicUrl || ''))
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sunucu hatası')
      }
      return
    }

    if (EDUCATION_MODULE_TYPES.includes(moduleType)) {
      setError('Eğitim modülleri sadece /education sayfasından yönetilir')
      return
    }

    await handleCreateWorldClockQr()
  }

  const handleCreateHotelUser = async () => {
    setError(null)
    setSuccess(null)

    try {
      await callApi({
        action: 'createHotelUser',
        hotelCode: selectedHotelCode,
        email: newUserEmail,
        userPassword: newUserPassword,
        role: newUserRole,
      })
      setSuccess('Otel kullanıcısı oluşturuldu')
      setNewUserEmail('')
      setNewUserPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const parseCitiesInput = (value: string) => {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [city, timezone] = line.split('|').map((part) => part.trim())
        return {
          city: city || '',
          timezone: timezone || '',
        }
      })
      .filter((row) => row.city && row.timezone)
  }

  const parseMenuInput = (languagesText: string, rowsText: string) => {
    const languages = languagesText
      .split(',')
      .map((lang) => lang.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 3)

    if (languages.length < 2) {
      throw new Error('Menü için en az 2 dil gir (örn: tr,en,de)')
    }

    const lines = rowsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      throw new Error('En az bir menü satırı gir')
    }

    type AccSection = {
      key: string
      names: Record<string, string>
      items: Array<{ names: Record<string, string>; description: Record<string, string>; price: string }>
    }

    const sectionsByKey = new Map<string, AccSection>()
    const [first, second, third] = [languages[0], languages[1], languages[2] || languages[1]]

    for (const line of lines) {
      const parts = line.split('|').map((part) => part.trim())
      if (parts.length < 8) {
        throw new Error('Menü satırı formatı hatalı: sectionKey|sec1|sec2|sec3|item1|item2|item3|price|desc1|desc2|desc3')
      }

      const [rawSectionKey, sec1, sec2, sec3, item1, item2, item3, price, desc1 = '', desc2 = '', desc3 = ''] = parts
      const sectionKey = rawSectionKey
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24)

      if (!sectionKey) {
        throw new Error('sectionKey boş olamaz')
      }

      if (!item1 && !item2 && !item3) {
        throw new Error('Menü satırında ürün adı boş olamaz')
      }

      if (!sectionsByKey.has(sectionKey)) {
        sectionsByKey.set(sectionKey, {
          key: sectionKey,
          names: {
            [first]: sec1,
            [second]: sec2,
            [third]: sec3,
          },
          items: [],
        })
      }

      sectionsByKey.get(sectionKey)?.items.push({
        names: {
          [first]: item1,
          [second]: item2,
          [third]: item3,
        },
        description: {
          [first]: desc1,
          [second]: desc2,
          [third]: desc3,
        },
        price,
      })
    }

    return {
      languages,
      sections: Array.from(sectionsByKey.values()),
    }
  }

  const handleUpdateModuleTitle = async () => {
    if (!selectedModuleSlug) {
      setError('Önce bir modül seç')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      await callApi({
        action: 'updateModuleTitle',
        slug: selectedModuleSlug,
        title: editModuleTitle,
      })
      setSuccess('Modül başlığı güncellendi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleUpdateWorldClockConfig = async () => {
    if (!selectedModuleSlug) {
      setError('Önce bir modül seç')
      return
    }

    const cities = parseCitiesInput(citiesText)
    if (cities.length === 0) {
      setError('En az bir şehir satırı gir (Şehir|Timezone)')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      await callApi({
        action: 'updateWorldClockConfig',
        slug: selectedModuleSlug,
        cities,
      })
      setSuccess('Dünya saatleri menüsü güncellendi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleUpdateMenuConfig = async () => {
    if (!selectedModuleSlug) {
      setError('Önce bir modül seç')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const menu = parseMenuInput(menuLanguagesText, menuRowsText)
      await callApi({
        action: 'updateMenuConfig',
        slug: selectedModuleSlug,
        menu,
      })
      setSuccess('Menü konfigürasyonu güncellendi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleUpdateEducationConfig = async () => {
    if (!selectedModuleSlug || !selectedModule || !EDUCATION_MODULE_TYPES.includes(selectedModule.module_type as ModuleType)) {
      setError('Önce bir eğitim modülü seç')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const config = JSON.parse(educationConfigText || '{}')
      await callApi({
        action: 'updateEducationModuleConfig',
        slug: selectedModuleSlug,
        moduleType: selectedModule.module_type,
        config,
      })
      setSuccess('Eğitim modül konfigürasyonu güncellendi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleDeleteModule = async () => {
    if (!selectedModuleSlug) {
      setError('Silmek için önce modül seç')
      return
    }

    const confirmDelete = window.confirm('Bu modül silinecek. Emin misin?')
    if (!confirmDelete) return

    setError(null)
    setSuccess(null)

    try {
      await callApi({ action: 'deleteModule', slug: selectedModuleSlug })
      setSuccess('Modül silindi')
      syncModuleEditor(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleDeleteHotel = async (hotelCodeToDelete: string) => {
    const confirmDelete = window.confirm(`${hotelCodeToDelete} oteli ve tüm modülleri silinecek. Emin misin?`)
    if (!confirmDelete) return

    setError(null)
    setSuccess(null)

    try {
      await callApi({ action: 'deleteHotel', hotelCode: hotelCodeToDelete })
      setSuccess('Otel silindi')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  const handleLoadEducationReports = async () => {
    const effectiveHotelCode = (selectedHotelCode || String(hotels[0]?.code || '')).trim()
    if (!effectiveHotelCode) {
      setError('Rapor için önce otel seç')
      return
    }

    setEducationReportsLoading(true)
    setError(null)
    try {
      const data = await callApi({ action: 'listEducationReports', hotelCode: effectiveHotelCode })
      setEducationQuizReport((data.quizByStudent || []) as EducationQuizReportRow[])
      setEducationAttendanceReport((data.attendanceByStudent || []) as EducationAttendanceReportRow[])
      setSuccess('Eğitim raporları yüklendi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rapor yüklenemedi')
    } finally {
      setEducationReportsLoading(false)
    }
  }

  if (!authUser) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
            <h1 className="text-3xl font-black tracking-tight">Otel Modülü Giriş</h1>
            <p className="text-sm text-neutral-400">Bu panel sadece otel rolüne sahip kullanıcılar içindir.</p>

            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="E-posta"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Şifre"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={() => void handleLogin()}
              className="rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500 transition"
            >
              Giris Yap
            </button>

            <div className="pt-3 border-t border-neutral-800 space-y-3">
              <p className="text-xs text-neutral-500">Giriş yapamıyorsan geçici yönetim modu: ADMIN_PASSWORD ile paneli aç.</p>
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="ADMIN_PASSWORD"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => void handlePasswordModeAccess()}
                className="rounded-xl bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 transition"
              >
                ADMIN_PASSWORD ile aç
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
            <h2 className="text-xl font-bold">İlk Kurulum (Bootstrap)</h2>
            <p className="text-xs text-neutral-500">Bir kez platform admin üretmek için sistem ADMIN_PASSWORD ister.</p>
            <input
              type="password"
              value={bootstrapPassword}
              onChange={(event) => setBootstrapPassword(event.target.value)}
              placeholder="ADMIN_PASSWORD"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            />
            <input
              value={bootstrapEmail}
              onChange={(event) => setBootstrapEmail(event.target.value)}
              placeholder="Platform admin e-posta"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            />
            <input
              type="password"
              value={bootstrapUserPassword}
              onChange={(event) => setBootstrapUserPassword(event.target.value)}
              placeholder="Platform admin şifre"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={() => void handleBootstrap()}
              className="rounded-xl bg-sky-600 px-5 py-3 font-semibold hover:bg-sky-500 transition"
            >
              Platform Admin Oluştur
            </button>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
          {loading ? <p className="text-sm text-neutral-400">İşleniyor...</p> : null}
        </div>
      </main>
    )
  }

  if (authUser.role === 'education_admin') {
    return (
      <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-4 rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
          <h1 className="text-2xl font-black tracking-tight">Bu hesap eğitim paneli için tanımlı</h1>
          <p className="text-sm text-neutral-400">Eğitim modülleri otel panelinden ayrıldı. Lütfen eğitim panelini kullan.</p>
          <a href="/education" className="inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 transition">/education sayfasına git</a>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="ml-3 rounded-xl bg-neutral-800 px-5 py-3 font-semibold hover:bg-neutral-700 transition border border-neutral-700"
          >
            Çıkış
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <BackToPrevious fallbackHref="/" />
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
          <h1 className="text-3xl font-black tracking-tight">Otel Modülü Yönetimi</h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Bu ekran mevcut QRNot projesini bozmadan otel tenant yapısını yönetir. Her otelin QR modülleri sadece kendi kodu ile ayrılır.
          </p>

          <div className="mt-3 text-sm text-neutral-300">
            Giriş: {authUser.email} <span className="text-neutral-500">({authUser.role})</span>
          </div>

          <div className="mt-3 max-w-md space-y-2">
            <p className="text-xs text-neutral-500">ADMIN_PASSWORD (opsiyonel): platform işlemlerinde kullanılır.</p>
            <input
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="ADMIN_PASSWORD"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500 transition"
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

          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
          {success ? <p className="mt-3 text-sm text-emerald-400">{success}</p> : null}
          {loading ? <p className="mt-3 text-sm text-neutral-400">Yükleniyor...</p> : null}
        </div>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-xl font-bold">Operasyon Analitik Dashboard</h2>
          <p className="text-xs text-neutral-500 mt-1">Oda servisi ve housekeeping/teknik ticket akışının anlık durumu.</p>

          <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {hotels.map((hotel) => {
              const stats = analyticsByHotel[hotel.code] || {}
              return (
                <div key={`analytics-${hotel.id}`} className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <p className="text-sm font-semibold text-white">{hotel.code}</p>
                  <p className="text-xs text-neutral-500 mb-3">{hotel.name}</p>

                  <div className="space-y-1 text-xs text-neutral-300">
                    <p>Toplam Sipariş: <span className="text-white">{stats.totalOrders || 0}</span></p>
                    <p>Açık Sipariş: <span className="text-amber-300">{stats.openOrders || 0}</span></p>
                    <p>24s Sipariş: <span className="text-sky-300">{stats.ordersLast24h || 0}</span></p>
                    <p>Toplam Ticket: <span className="text-white">{stats.totalTickets || 0}</span></p>
                    <p>Açık Ticket: <span className="text-amber-300">{stats.openTickets || 0}</span></p>
                    <p>24s Ticket: <span className="text-sky-300">{stats.ticketsLast24h || 0}</span></p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div>
              <h2 className="text-xl font-bold">Operasyon Merkezi</h2>
              <p className="text-xs text-neutral-500 mt-1">Temizlik, teknik, concierge ve oda servisi taleplerini canlı yönet.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVoiceAlertEnabled((prev) => !prev)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition border ${voiceAlertEnabled ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-600' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'}`}
              >
                Sesli Uyarı: {voiceAlertEnabled ? 'Açık' : 'Kapalı'}
              </button>
              <button
                type="button"
                onClick={() => void loadOperations()}
                className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold hover:bg-sky-600 transition"
              >
                Operasyonları Yenile
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <select
              value={operationHotelCode}
              onChange={(event) => setOperationHotelCode(event.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            >
              <option value="">Otel seç</option>
              {hotels.map((hotel) => (
                <option key={`op-hotel-${hotel.id}`} value={hotel.code}>
                  {hotel.code} - {hotel.name}
                </option>
              ))}
            </select>

            <select
              value={operationStatus}
              onChange={(event) => setOperationStatus(event.target.value as typeof operationStatus)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            >
              <option value="all">Tüm durumlar</option>
              <option value="new">new</option>
              <option value="processing">processing</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>

            <select
              value={operationDepartment}
              onChange={(event) => setOperationDepartment(event.target.value as typeof operationDepartment)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            >
              <option value="all">Tüm departmanlar</option>
              <option value="housekeeping">housekeeping</option>
              <option value="technical">technical</option>
              <option value="concierge">concierge</option>
            </select>

            <select
              value={operationPriority}
              onChange={(event) => setOperationPriority(event.target.value as typeof operationPriority)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            >
              <option value="all">Tüm öncelikler</option>
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={() => void loadOperations()}
              className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-600 transition"
            >
              Filtreleri Uygula
            </button>
            {operationsLoading ? <p className="text-xs text-neutral-400 mt-2">Operasyon listesi yükleniyor...</p> : null}
          </div>

          <div className="grid xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
              <h3 className="text-base font-semibold">Oda Servisi Siparişleri</h3>
              <p className="text-xs text-neutral-500">Toplam: {roomOrders.length}</p>
              {roomOrders.length === 0 ? <p className="text-xs text-neutral-500">Sipariş bulunamadı.</p> : null}

              {roomOrders.map((order) => (
                <div key={`order-${order.id}`} className="rounded-xl border border-neutral-800 p-3 space-y-2">
                  <div className="flex flex-wrap justify-between gap-2 text-xs">
                    <p className="text-neutral-200">Oda {order.room_no} | {order.guest_name || 'Misafir'}</p>
                    <p className="text-neutral-500">{formatDateTR(order.created_at)}</p>
                  </div>
                  <p className="text-xs text-neutral-400">Kat: {order.floor_label || '-'} | QR: {order.source_tag || '-'}</p>
                  <p className="text-xs text-neutral-300">Ürünler: {summarizeRoomOrderItems(order.items_json)}</p>
                  <p className="text-xs text-neutral-400">Not: {order.notes || '-'}</p>
                  <p className="text-xs text-neutral-400">Durum: <span className="text-white">{order.status}</span> | WhatsApp: {order.whatsapp_delivery}</p>
                  {order.voice_note_url ? <audio controls src={`/api/hotel/ops/audio/room-order/${order.id}`} className="w-full h-9" /> : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleUpdateOperationStatus('room_order', order.id, 'processing')}
                      className="rounded-md border border-amber-700 px-2.5 py-1 text-[11px] text-amber-300 hover:bg-amber-900/30 transition"
                    >
                      İşleme Al
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdateOperationStatus('room_order', order.id, 'completed')}
                      className="rounded-md border border-emerald-700 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-900/30 transition"
                    >
                      Tamamla
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdateOperationStatus('room_order', order.id, 'cancelled')}
                      className="rounded-md border border-red-700 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-900/30 transition"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdateOperationStatus('room_order', order.id, 'new')}
                      className="rounded-md border border-neutral-700 px-2.5 py-1 text-[11px] text-neutral-300 hover:bg-neutral-800 transition"
                    >
                      New
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
              <h3 className="text-base font-semibold">Servis Ticketları</h3>
              <p className="text-xs text-neutral-500">Toplam: {serviceTickets.length}</p>
              {serviceTickets.length === 0 ? <p className="text-xs text-neutral-500">Ticket bulunamadı.</p> : null}

              {serviceTickets.map((ticket) => (
                <div key={`ticket-${ticket.id}`} className="rounded-xl border border-neutral-800 p-3 space-y-2">
                  <div className="flex flex-wrap justify-between gap-2 text-xs">
                    <p className="text-neutral-200">Oda {ticket.room_no} | {ticket.guest_name || 'Misafir'}</p>
                    <p className="text-neutral-500">{formatDateTR(ticket.created_at)}</p>
                  </div>
                  <p className="text-xs text-neutral-400">Kat: {ticket.floor_label || '-'} | QR: {ticket.source_tag || '-'}</p>
                  <p className="text-xs text-neutral-300">{ticket.department} / {ticket.category} / {ticket.priority}</p>
                  <p className="text-xs text-neutral-300">Detay: {ticket.details || '-'}</p>
                  <p className="text-xs text-neutral-400">İletişim: {ticket.contact_phone || '-'} | Zaman: {ticket.requested_time || '-'}</p>
                  <p className="text-xs text-neutral-400">Durum: <span className="text-white">{ticket.status}</span> | WhatsApp: {ticket.whatsapp_delivery}</p>
                  {ticket.voice_note_url ? <audio controls src={`/api/hotel/ops/audio/service-ticket/${ticket.id}`} className="w-full h-9" /> : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleUpdateOperationStatus('service_ticket', ticket.id, 'processing')}
                      className="rounded-md border border-amber-700 px-2.5 py-1 text-[11px] text-amber-300 hover:bg-amber-900/30 transition"
                    >
                      İşleme Al
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdateOperationStatus('service_ticket', ticket.id, 'completed')}
                      className="rounded-md border border-emerald-700 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-900/30 transition"
                    >
                      Tamamla
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdateOperationStatus('service_ticket', ticket.id, 'cancelled')}
                      className="rounded-md border border-red-700 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-900/30 transition"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdateOperationStatus('service_ticket', ticket.id, 'new')}
                      className="rounded-md border border-neutral-700 px-2.5 py-1 text-[11px] text-neutral-300 hover:bg-neutral-800 transition"
                    >
                      New
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {authUser.role === 'platform_admin' ? (
            <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
            <h2 className="text-xl font-bold">1) Otel Tenant Oluştur</h2>
            <input
              value={hotelName}
              onChange={(event) => setHotelName(event.target.value)}
              placeholder="Otel adı (örn: Rixos Taksim)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />
            <input
              value={hotelCode}
              onChange={(event) => setHotelCode(event.target.value.toUpperCase())}
              placeholder="Otel kodu (örn: RIXOS34)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />
            <input
              value={hotelCity}
              onChange={(event) => setHotelCity(event.target.value)}
              placeholder="Şehir"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />
            <input
              value={hotelWhatsapp}
              onChange={(event) => setHotelWhatsapp(event.target.value)}
              placeholder="WhatsApp numarası (ör: 905xxxxxxxxx)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />

            <button
              type="button"
              onClick={() => void handleCreateHotel()}
              className="rounded-xl bg-sky-600 px-5 py-3 font-semibold hover:bg-sky-500 transition"
            >
              Otel Oluştur / Güncelle
            </button>
            </section>
          ) : null}

          <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
            <h2 className="text-xl font-bold">2) Modül QR Oluştur</h2>
            {!canCreateModuleQr ? (
              <p className="text-xs rounded-lg border border-amber-700/40 bg-amber-900/20 text-amber-200 px-3 py-2">
                Bu işlem için hotel_admin veya platform_admin yetkisi gerekli.
              </p>
            ) : null}
            <select
              value={selectedHotelCode}
              onChange={(event) => setSelectedHotelCode(event.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            >
              <option value="">Otel seç</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.code}>
                  {hotel.code} - {hotel.name}
                </option>
              ))}
            </select>
            <select
              value={moduleType}
              onChange={(event) => {
                const nextType = event.target.value as ModuleType
                setModuleType(nextType)
                if (nextType === 'menu') setModuleTitle('Restoran Menüsü')
                if (nextType === 'world_clock') setModuleTitle('Dünya Saatleri')
                if (nextType === 'room_service') setModuleTitle('Oda Servisi')
                if (nextType === 'service_ticket') setModuleTitle('Servis Talebi')
                if (nextType === 'room_hub') setModuleTitle('Oda Asistanı')
              }}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            >
              <option value="world_clock">Dunya Saatleri</option>
              <option value="menu">Restoran Menusu</option>
              <option value="room_service">Oda Servisi</option>
              <option value="service_ticket">Servis Talebi</option>
              <option value="room_hub">Oda Asistani (tek oda QR)</option>
            </select>
            <input
              value={moduleTitle}
              onChange={(event) => setModuleTitle(event.target.value)}
              placeholder="Modül başlığı"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            />

            <button
              type="button"
              onClick={() => void handleCreateModule()}
              disabled={!canCreateModuleQr}
              className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 transition"
            >
              Modül QR Oluştur
            </button>

            {lastPublicUrl ? (
              <div className="space-y-3">
                <a href={lastPublicUrl} target="_blank" rel="noreferrer" className="block text-sm text-violet-300 underline break-all">
                  {lastPublicUrl}
                </a>
                <QRDisplay url={lastPublicUrl} size={180} />
              </div>
            ) : null}

            {authUser.role === 'platform_admin' ? (
              <>
                <h3 className="text-lg font-semibold pt-4">Hotel Kullanıcısı Oluştur</h3>
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
                <select
                  value={newUserRole}
                  onChange={(event) => setNewUserRole(event.target.value as 'hotel_admin' | 'staff')}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
                >
                  <option value="hotel_admin">hotel_admin</option>
                  <option value="staff">staff</option>
                </select>
                <button
                  type="button"
                  onClick={() => void handleCreateHotelUser()}
                  className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 transition"
                >
                  Hotel Kullanıcısı Oluştur
                </button>
              </>
            ) : null}
          </section>
        </div>

        <section className="hidden rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
          <h2 className="text-xl font-bold">Toplu Oda QR Üretimi ve Revizyon Limiti</h2>
          <p className="text-xs text-neutral-500">
            Otel admin tek seferde tüm oda QR&apos;larını oluşturur. Her QR kaydı en fazla 2 kez değiştirilebilir, sonra kilitlenir.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
            <select
              value={selectedHotelCode}
              onChange={(event) => {
                const nextHotelCode = event.target.value
                setSelectedHotelCode(nextHotelCode)
                const nextRoomModule = roomQrModules.find((moduleItem) => moduleItem.hotel_code === nextHotelCode)
                setBulkModuleSlug(String(nextRoomModule?.slug || ''))
              }}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            >
              <option value="">Otel seç</option>
              {hotels.map((hotel) => (
                <option key={`bulk-hotel-${hotel.id}`} value={hotel.code}>
                  {hotel.code} - {hotel.name}
                </option>
              ))}
            </select>

            <select
              value={bulkModuleSlug}
              onChange={(event) => setBulkModuleSlug(event.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            >
              <option value="">Tüm servis modülleri (listele)</option>
              {roomQrModules
                .filter((moduleItem) => !selectedHotelCode || moduleItem.hotel_code === selectedHotelCode)
                .map((moduleItem) => (
                  <option key={`bulk-module-${moduleItem.id}`} value={moduleItem.slug}>
                    {moduleItem.hotel_code} - {moduleItem.title} [{moduleItem.module_type}] ({moduleItem.slug})
                  </option>
                ))}
            </select>

            <input
              value={bulkTotalRooms}
              onChange={(event) => setBulkTotalRooms(event.target.value)}
              placeholder="Toplam oda (ör. 500)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            />
            <input
              value={bulkStartRoomNo}
              onChange={(event) => setBulkStartRoomNo(event.target.value)}
              placeholder="Başlangıç oda (ör. 101)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            />
            <input
              value={bulkRoomsPerFloor}
              onChange={(event) => setBulkRoomsPerFloor(event.target.value)}
              placeholder="Kat başı oda (ör. 20)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={bulkFloorStart}
              onChange={(event) => setBulkFloorStart(event.target.value)}
              placeholder="Başlangıç kat (ör. 1)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleBulkCreateRoomQrs()}
                disabled={bulkLoading}
                className="rounded-xl bg-sky-600 px-5 py-3 font-semibold hover:bg-sky-500 transition disabled:opacity-70"
              >
                Toplu QR Üret
              </button>
              <button
                type="button"
                onClick={() => void loadRoomQrs()}
                disabled={bulkLoading}
                className="rounded-xl bg-neutral-800 border border-neutral-700 px-5 py-3 font-semibold hover:bg-neutral-700 transition disabled:opacity-70"
              >
                QR Listesini Yükle
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteModuleRoomQrs()}
                disabled={bulkLoading || !bulkModuleSlug}
                className="rounded-xl bg-red-700 px-5 py-3 font-semibold hover:bg-red-600 transition disabled:opacity-70"
              >
                Modüldeki QR&apos;ları Sil
              </button>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[340px] overflow-auto">
              <p className="text-sm font-semibold">Oluşan Oda QR Kayıtları ({roomQrs.length})</p>
              {roomQrs.length === 0 ? <p className="text-xs text-neutral-500">Bu filtrede oda QR kaydı bulunamadı. Gerekirse &quot;Tüm servis modülleri (listele)&quot; seçip tekrar yükle.</p> : null}
              {roomQrs.map((qr) => (
                <button
                  key={qr.id}
                  type="button"
                  onClick={() => handlePickRoomQr(qr)}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition ${selectedRoomQrId === qr.id ? 'border-sky-500 bg-sky-900/20 text-sky-200' : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900'}`}
                >
                  Oda {qr.room_no} | Kat {qr.floor_label || '-'} | Revizyon {qr.revision_count}/{qr.max_revisions} {qr.is_locked ? '(kilitli)' : ''}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
              <p className="text-sm font-semibold">Seçili QR Revizyonu (max 2)</p>
              <input
                value={reviseRoomNo}
                onChange={(event) => setReviseRoomNo(event.target.value)}
                placeholder="Yeni oda no"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
              />
              <input
                value={reviseFloorLabel}
                onChange={(event) => setReviseFloorLabel(event.target.value)}
                placeholder="Yeni kat"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => void handleReviseRoomQr()}
                disabled={!selectedRoomQrId || bulkLoading}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 transition disabled:opacity-70"
              >
                QR Revizyonunu Kaydet
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteSelectedRoomQr()}
                disabled={!selectedRoomQrId || bulkLoading}
                className="rounded-xl bg-red-700 px-5 py-3 font-semibold hover:bg-red-600 transition disabled:opacity-70"
              >
                Seçili QR&apos;ı Sil
              </button>

              {roomQrPreviewUrl ? (
                <div className="space-y-2">
                  <a href={roomQrPreviewUrl} target="_blank" rel="noreferrer" className="block text-xs text-sky-300 underline break-all">
                    {roomQrPreviewUrl}
                  </a>
                  <QRDisplay url={roomQrPreviewUrl} size={170} />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="text-xl font-bold">3) Modül Ayarları (Menü / Şehirler)</h2>
          <select
            value={selectedModuleSlug}
            onChange={(event) => {
              const nextSlug = event.target.value
              const moduleItem = modules.find((item) => item.slug === nextSlug) || null
              syncModuleEditor(moduleItem)
            }}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
          >
            <option value="">Modül seç</option>
            {modules.map((moduleItem) => (
              <option key={moduleItem.id} value={moduleItem.slug}>
                {moduleItem.hotel_code} - {moduleItem.title} [{moduleItem.module_type}] ({moduleItem.slug})
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

          {selectedModule?.module_type === 'menu' ? (
            <>
              <input
                value={menuLanguagesText}
                onChange={(event) => setMenuLanguagesText(event.target.value)}
                placeholder="Diller (örnek: tr,en,de)"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
              />
              <textarea
                value={menuRowsText}
                onChange={(event) => setMenuRowsText(event.target.value)}
                rows={8}
                placeholder={'sectionKey|BölümTR|SectionEN|SektionDE|ÜrünTR|ItemEN|ArtikelDE|250 TL|AçıklamaTR|DescriptionEN|BeschreibungDE'}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
              />
              <p className="text-xs text-neutral-500">
                Her satır bir ürün: sectionKey|sec(tr)|sec(en)|sec(3)|item(tr)|item(en)|item(3)|price|desc(tr)|desc(en)|desc(3)
              </p>
              <button
                type="button"
                onClick={() => void handleUpdateMenuConfig()}
                className="rounded-xl bg-sky-700 px-5 py-3 font-semibold hover:bg-sky-600 transition"
              >
                Menüyü Güncelle
              </button>
            </>
          ) : selectedModule?.module_type === 'room_service' || selectedModule?.module_type === 'service_ticket' || selectedModule?.module_type === 'room_hub' ? (
            <p className="text-xs text-neutral-500">
              Bu modülde ayarlar varsayılan config ile çalışır. İstersen sonraki adımda item/kategori editörü de ekleyebilirim.
            </p>
          ) : selectedModule && EDUCATION_MODULE_TYPES.includes(selectedModule.module_type as ModuleType) ? (
            <>
              <textarea
                value={educationConfigText}
                onChange={(event) => setEducationConfigText(event.target.value)}
                rows={14}
                placeholder="Eğitim modül JSON config"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500 font-mono text-xs"
              />
              <p className="text-xs text-neutral-500">
                Öğretmen paneli hızlı güncelleme: JSON config kaydedildiğinde eğitim modülü anında güncellenir.
              </p>
              <button
                type="button"
                onClick={() => void handleUpdateEducationConfig()}
                className="rounded-xl bg-sky-700 px-5 py-3 font-semibold hover:bg-sky-600 transition"
              >
                Eğitim Konfigürasyonunu Güncelle
              </button>
            </>
          ) : (
            <>
              <textarea
                value={citiesText}
                onChange={(event) => setCitiesText(event.target.value)}
                rows={6}
                placeholder={'İstanbul|Europe/Istanbul\nLondon|Europe/London'}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
              />
              <p className="text-xs text-neutral-500">Her satır: Şehir|Timezone. Başlangıçta 7 ülke otomatik gelir, admin isterse yeni satır ekleyebilir.</p>
              <button
                type="button"
                onClick={() => setCitiesText(defaultWorldClockRowsText)}
                className="rounded-xl border border-sky-700 px-5 py-3 text-sm font-semibold text-sky-300 hover:bg-sky-900/30 transition"
              >
                Varsayılan 7 Şehir Satırını Yükle
              </button>
              <button
                type="button"
                onClick={() => void handleUpdateWorldClockConfig()}
                className="rounded-xl bg-sky-700 px-5 py-3 font-semibold hover:bg-sky-600 transition"
              >
                Şehirleri Güncelle
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => void handleDeleteModule()}
            className="rounded-xl bg-red-700 px-5 py-3 font-semibold hover:bg-red-600 transition"
          >
            Seçili Modülü Sil
          </button>

          {selectedModulePublicUrl ? (
            <div className="space-y-3">
              <a href={selectedModulePublicUrl} target="_blank" rel="noreferrer" className="block text-sm text-violet-300 underline break-all">
                {selectedModulePublicUrl}
              </a>
              <QRDisplay url={selectedModulePublicUrl} size={180} />
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="text-xl font-bold">Otel WhatsApp Numarası Güncelle</h2>
          <p className="text-xs text-neutral-500">Sipariş ve ticket bildirimleri bu numaraya gider.</p>

          {authUser.role === 'platform_admin' ? (
            <select
              value={updateHotelCode}
              onChange={(event) => {
                const code = event.target.value
                setUpdateHotelCode(code)
                const hotel = hotels.find((item) => item.code === code)
                setUpdateHotelWhatsapp(String(hotel?.whatsapp_number || ''))
              }}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
            >
              <option value="">Otel seç</option>
              {hotels.map((hotel) => (
                <option key={`wa-hotel-${hotel.id}`} value={hotel.code}>
                  {hotel.code} - {hotel.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={authUser.hotelCode || ''}
              readOnly
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-3 text-neutral-400"
            />
          )}

          <input
            value={updateHotelWhatsapp}
            onChange={(event) => setUpdateHotelWhatsapp(event.target.value)}
            placeholder="WhatsApp numarası (ör: 905xxxxxxxxx)"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
          />

          <button
            type="button"
            onClick={() => void handleUpdateHotelWhatsapp()}
            className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold hover:bg-emerald-600 transition"
          >
            WhatsApp Numarasını Güncelle
          </button>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-xl font-bold">Otel Listesi ve Modüller</h2>
          <div className="mt-4 space-y-4">
            {hotels.length === 0 ? (
              <p className="text-neutral-400">Henüz otel kaydı yok.</p>
            ) : (
              hotels.map((hotel) => (
                <div key={hotel.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <p className="font-semibold text-white">
                      {hotel.name} <span className="text-xs text-neutral-400">({hotel.code})</span>
                    </p>
                    {authUser.role === 'platform_admin' ? (
                      <button
                        type="button"
                        onClick={() => void handleDeleteHotel(hotel.code)}
                        className="rounded-lg border border-red-700 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/30 transition"
                      >
                        Oteli Sil
                      </button>
                    ) : null}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Şehir: {hotel.city || '-'}</p>
                  <p className="text-xs text-neutral-400 mt-1">WhatsApp: {hotel.whatsapp_number || '-'}</p>

                  <div className="mt-3 space-y-2">
                    {(groupedModules[hotel.code] || []).map((moduleItem) => (
                      <div key={moduleItem.id} className="rounded-xl border border-neutral-800 px-3 py-2 text-sm">
                        <p className="font-medium text-neutral-100">
                          {moduleItem.title}{' '}
                          <span className="text-[11px] text-neutral-500">[{moduleItem.module_type}]</span>
                        </p>
                        <p className="text-neutral-400">
                          /h/{moduleItem.hotel_code}/q/{moduleItem.slug}
                        </p>
                      </div>
                    ))}

                    {(groupedModules[hotel.code] || []).length === 0 ? (
                      <p className="text-xs text-neutral-500">Bu otel için henüz modül yok.</p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Eğitim Öğrenci Bazlı Rapor</h2>
              <p className="text-xs text-neutral-500 mt-1">Quiz performansı ve yoklama özeti öğrenci bazında listelenir.</p>
            </div>
            <button
              type="button"
              onClick={() => void handleLoadEducationReports()}
              className="rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-600 transition"
            >
              Raporları Yükle
            </button>
          </div>

          {educationReportsLoading ? <p className="text-xs text-neutral-400">Raporlar yükleniyor...</p> : null}

          <div className="grid xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[300px] overflow-auto">
              <p className="text-sm font-semibold">Quiz Sonuçları (Öğrenci)</p>
              {educationQuizReport.length === 0 ? <p className="text-xs text-neutral-500">Kayıt bulunamadı.</p> : null}
              {educationQuizReport.map((row) => (
                <div key={`quiz-${row.student_no}-${row.student_name}`} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
                  <p className="text-white font-semibold">{row.student_name} ({row.student_no})</p>
                  <p className="text-neutral-400">Deneme: {row.submission_count} | Ortalama: %{Number(row.avg_score || 0)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 max-h-[300px] overflow-auto">
              <p className="text-sm font-semibold">Yoklama Özeti (Öğrenci)</p>
              {educationAttendanceReport.length === 0 ? <p className="text-xs text-neutral-500">Kayıt bulunamadı.</p> : null}
              {educationAttendanceReport.map((row) => (
                <div key={`att-${row.student_no}-${row.student_name}`} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
                  <p className="text-white font-semibold">{row.student_name} ({row.student_no})</p>
                  <p className="text-neutral-400">Yoklama: {row.attendance_count} | Geç: {row.late_count} | Erken çıkış: {row.early_leave_count}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}


