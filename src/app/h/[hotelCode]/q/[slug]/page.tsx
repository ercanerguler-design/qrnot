import { notFound } from 'next/navigation'
import { ensureQrSchema, sql } from '@/lib/db'
import { parseMenuConfig, parseRoomServiceConfig, parseServiceTicketConfig, parseWorldClockConfig } from '@/lib/hotel'
import {
  parseAnnouncementConfig,
  parseAttendanceConfig,
  parseMaterialConfig,
  parseParentTeacherConfig,
  parseQuizConfig,
  parseSupportConfig,
} from '@/lib/education'
import HotelWorldClockClient from './HotelWorldClockClient'
import HotelMenuClient from './HotelMenuClient'
import HotelRoomServiceClient from './HotelRoomServiceClient'
import HotelServiceTicketClient from './HotelServiceTicketClient'
import HotelRoomHubClient from './HotelRoomHubClient'
import EducationAttendanceClient from './EducationAttendanceClient'
import EducationMaterialClient from './EducationMaterialClient'
import EducationQuizClient from './EducationQuizClient'
import EducationAnnouncementClient from './EducationAnnouncementClient'
import EducationSupportClient from './EducationSupportClient'
import EducationParentTeacherClient from './EducationParentTeacherClient'

interface Props {
  params: Promise<{ hotelCode: string; slug: string }>
  searchParams: Promise<{ lang?: string; room?: string; floor?: string; source?: string }>
}

function normalizeRoomNo(input: unknown) {
  return String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 20)
}

function normalizeFloorLabel(input: unknown) {
  return String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 20)
}

function normalizeSourceTag(input: unknown) {
  return String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, '')
    .slice(0, 64)
}

export default async function HotelQrModulePage({ params, searchParams }: Props) {
  await ensureQrSchema()

  const { hotelCode, slug } = await params
  const { lang, room, floor, source } = await searchParams
  const code = String(hotelCode || '').trim().toUpperCase()
  const moduleSlug = String(slug || '').trim().toLowerCase()

  const rows = await sql`
    SELECT h.name AS hotel_name, h.code AS hotel_code, m.title, m.module_type, m.config_json
    FROM hotel_qr_modules m
    JOIN hotel_tenants h ON h.id = m.hotel_id
    WHERE h.code = ${code}
      AND h.is_active = TRUE
      AND m.slug = ${moduleSlug}
      AND m.is_active = TRUE
    LIMIT 1
  `

  if (rows.length === 0) {
    notFound()
  }

  const row = rows[0]
  const moduleType = String(row.module_type || '')
  if (
    moduleType !== 'world_clock'
    && moduleType !== 'menu'
    && moduleType !== 'room_service'
    && moduleType !== 'service_ticket'
    && moduleType !== 'room_hub'
    && moduleType !== 'class_attendance'
    && moduleType !== 'lesson_material'
    && moduleType !== 'homework_quiz'
    && moduleType !== 'announcement_event'
    && moduleType !== 'education_support_ticket'
    && moduleType !== 'parent_teacher_meeting'
  ) {
    notFound()
  }

  if (moduleType === 'world_clock') {
    const cities = parseWorldClockConfig(String(row.config_json || '[]'))
    const initialNowIso = new Date().toISOString()

    return (
      <HotelWorldClockClient
        hotelName={String(row.hotel_name || '')}
        hotelCode={String(row.hotel_code || '')}
        title={String(row.title || 'Dünya Saatleri')}
        cities={cities}
        initialNowIso={initialNowIso}
      />
    )
  }

  const initialLang = String(lang || 'tr').trim().toLowerCase()
  const initialRoomNo = normalizeRoomNo(room)
  const initialFloorLabel = normalizeFloorLabel(floor)
  const initialSourceTag = normalizeSourceTag(source) || (initialRoomNo ? `${initialFloorLabel ? `F${initialFloorLabel}-` : ''}R${initialRoomNo}` : '')

  if (moduleType === 'room_hub') {
    const targetRows = await sql`
      SELECT m.slug, m.module_type, m.title
      FROM hotel_qr_modules m
      JOIN hotel_tenants h ON h.id = m.hotel_id
      WHERE h.code = ${code}
        AND h.is_active = TRUE
        AND m.is_active = TRUE
        AND m.slug <> ${moduleSlug}
        AND m.module_type IN ('room_service', 'service_ticket', 'world_clock', 'menu')
      ORDER BY m.created_at DESC
    `

    let roomServiceSlug = ''
    let serviceTicketSlug = ''
    let worldClockSlug = ''
    let menuSlug = ''

    for (const target of targetRows) {
      const type = String(target.module_type || '')
      const targetSlug = String(target.slug || '')
      if (!targetSlug) continue
      if (type === 'room_service' && !roomServiceSlug) roomServiceSlug = targetSlug
      if (type === 'service_ticket' && !serviceTicketSlug) serviceTicketSlug = targetSlug
      if (type === 'world_clock' && !worldClockSlug) worldClockSlug = targetSlug
      if (type === 'menu' && !menuSlug) menuSlug = targetSlug
    }

    return (
      <HotelRoomHubClient
        hotelName={String(row.hotel_name || '')}
        hotelCode={String(row.hotel_code || '')}
        title={String(row.title || 'Oda Asistanı')}
        initialRoomNo={initialRoomNo}
        initialFloorLabel={initialFloorLabel}
        initialSourceTag={initialSourceTag}
        roomServiceSlug={roomServiceSlug}
        serviceTicketSlug={serviceTicketSlug}
        worldClockSlug={worldClockSlug}
        menuSlug={menuSlug}
      />
    )
  }

  if (moduleType === 'menu') {
    const menu = parseMenuConfig(String(row.config_json || '{}'))

    return (
      <HotelMenuClient
        hotelName={String(row.hotel_name || '')}
        hotelCode={String(row.hotel_code || '')}
        title={String(row.title || 'Menu')}
        menu={menu}
        initialLang={initialLang}
      />
    )
  }

  if (moduleType === 'class_attendance') {
    const config = parseAttendanceConfig(String(row.config_json || '{}'))
    return (
      <EducationAttendanceClient
        hotelName={String(row.hotel_name || '')}
        hotelCode={String(row.hotel_code || '')}
        slug={moduleSlug}
        title={String(row.title || 'Sınıf Yoklama QR')}
        config={config}
        initialLang={initialLang}
      />
    )
  }

  if (moduleType === 'lesson_material') {
    const config = parseMaterialConfig(String(row.config_json || '{}'))
    return (
      <EducationMaterialClient
        hotelName={String(row.hotel_name || '')}
        hotelCode={String(row.hotel_code || '')}
        slug={moduleSlug}
        title={String(row.title || 'Ders Materyali QR')}
        config={config}
        initialLang={initialLang}
      />
    )
  }

  if (moduleType === 'homework_quiz') {
    const config = parseQuizConfig(String(row.config_json || '{}'))
    return (
      <EducationQuizClient
        hotelName={String(row.hotel_name || '')}
        hotelCode={String(row.hotel_code || '')}
        slug={moduleSlug}
        title={String(row.title || 'Ödev ve Mini Quiz')}
        config={config}
        initialLang={initialLang}
      />
    )
  }

  if (moduleType === 'announcement_event') {
    const config = parseAnnouncementConfig(String(row.config_json || '{}'))
    return (
      <EducationAnnouncementClient
        hotelName={String(row.hotel_name || '')}
        hotelCode={String(row.hotel_code || '')}
        slug={moduleSlug}
        title={String(row.title || 'Duyuru ve Etkinlik')}
        config={config}
        initialLang={initialLang}
      />
    )
  }

  if (moduleType === 'education_support_ticket') {
    const config = parseSupportConfig(String(row.config_json || '{}'))
    return (
      <EducationSupportClient
        hotelName={String(row.hotel_name || '')}
        hotelCode={String(row.hotel_code || '')}
        slug={moduleSlug}
        title={String(row.title || 'Eğitim Destek Talebi')}
        config={config}
        initialLang={initialLang}
      />
    )
  }

  if (moduleType === 'parent_teacher_meeting') {
    const config = parseParentTeacherConfig(String(row.config_json || '{}'))
    return (
      <EducationParentTeacherClient
        hotelName={String(row.hotel_name || '')}
        hotelCode={String(row.hotel_code || '')}
        slug={moduleSlug}
        title={String(row.title || 'Veli-Öğretmen İletişim')}
        config={config}
        initialLang={initialLang}
      />
    )
  }

  if (moduleType === 'room_service') {
    const config = parseRoomServiceConfig(String(row.config_json || '{}'))
    return (
      <HotelRoomServiceClient
        hotelName={String(row.hotel_name || '')}
        hotelCode={String(row.hotel_code || '')}
        slug={moduleSlug}
        title={String(row.title || 'Oda Servisi')}
        config={config}
        initialLang={initialLang}
        initialRoomNo={initialRoomNo}
        initialFloorLabel={initialFloorLabel}
        initialSourceTag={initialSourceTag}
      />
    )
  }

  const config = parseServiceTicketConfig(String(row.config_json || '{}'))

  return (
    <HotelServiceTicketClient
      hotelName={String(row.hotel_name || '')}
      hotelCode={String(row.hotel_code || '')}
      slug={moduleSlug}
      title={String(row.title || 'Servis Talebi')}
      config={config}
      initialLang={initialLang}
      initialRoomNo={initialRoomNo}
      initialFloorLabel={initialFloorLabel}
      initialSourceTag={initialSourceTag}
    />
  )
}
