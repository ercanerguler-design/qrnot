import { NextRequest, NextResponse } from 'next/server'
import { createHotelUser, getAuthenticatedHotelUser, getHotelUserByEmail } from '@/lib/hotelAuth'
import { createEducationUser, getAuthenticatedEducationUser, getEducationUserByEmail } from '@/lib/educationAuth'
import { findAdminRealmByEmail, realmLoginPath } from '@/lib/adminRealm'
import { ensureQrSchema, sql } from '@/lib/db'
import {
  DEFAULT_ROOM_SERVICE_CONFIG,
  DEFAULT_SERVICE_TICKET_CONFIG,
  DEFAULT_MENU_CONFIG,
  DEFAULT_WORLD_CLOCK_CITIES,
  generateModuleSlug,
  normalizeHotelCode,
  normalizeHotelRole,
  normalizeSlug,
  validateMenuConfig,
  validateWorldClockCities,
} from '@/lib/hotel'
import {
  DEFAULT_ANNOUNCEMENT_CONFIG,
  DEFAULT_ATTENDANCE_CONFIG,
  DEFAULT_MATERIAL_CONFIG,
  DEFAULT_PARENT_TEACHER_CONFIG,
  DEFAULT_QUIZ_CONFIG,
  DEFAULT_SUPPORT_CONFIG,
  type EducationModuleType,
  validateEducationConfigByType,
} from '@/lib/education'

let hotelEducationAutoUpgradePromise: Promise<void> | null = null

function isAdminAuthorized(password: string) {
  const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
  return Boolean(password && configuredPassword && password === configuredPassword)
}

function canManageHotel(userRole: string, userHotelCode: string | null, requestedHotelCode: string) {
  if (userRole === 'platform_admin') return true
  return userRole === 'hotel_admin' && Boolean(userHotelCode && userHotelCode === requestedHotelCode)
}

const EDUCATION_MODULE_TYPES = new Set([
  'class_attendance',
  'lesson_material',
  'homework_quiz',
  'announcement_event',
  'education_support_ticket',
  'parent_teacher_meeting',
])

function isEducationModuleType(moduleType: string) {
  return EDUCATION_MODULE_TYPES.has(moduleType)
}

function canManageEducation(userRole: string, userHotelCode: string | null, requestedHotelCode: string) {
  if (userRole === 'platform_admin') return true
  return userRole === 'education_admin' && Boolean(userHotelCode && userHotelCode === requestedHotelCode)
}

function canManageModuleByType(userRole: string, userHotelCode: string | null, requestedHotelCode: string, moduleType: string) {
  if (isEducationModuleType(moduleType)) {
    return canManageEducation(userRole, userHotelCode, requestedHotelCode)
  }
  return canManageHotel(userRole, userHotelCode, requestedHotelCode)
}

function normalizeWhatsappNumber(input: unknown) {
  return String(input || '').replace(/[^0-9]/g, '').slice(0, 24)
}

function normalizeOperationStatus(input: unknown) {
  const value = String(input || '').trim().toLowerCase()
  if (value === 'new' || value === 'processing' || value === 'completed' || value === 'cancelled') {
    return value
  }
  return null
}

function normalizeOperationType(input: unknown) {
  const value = String(input || '').trim().toLowerCase()
  if (value === 'room_order' || value === 'service_ticket') return value
  return null
}

function normalizeDepartment(input: unknown) {
  const value = String(input || '').trim().toLowerCase()
  if (value === 'housekeeping' || value === 'technical' || value === 'concierge') return value
  return ''
}

function normalizePriority(input: unknown) {
  const value = String(input || '').trim().toLowerCase()
  if (value === 'low' || value === 'normal' || value === 'high' || value === 'urgent') return value
  return ''
}

function normalizeAnnouncementApprovalStatus(input: unknown) {
  const value = String(input || '').trim().toLowerCase()
  if (value === 'approved' || value === 'rejected' || value === 'pending') return value
  return null
}

function normalizeEducationWorkflowStatus(input: unknown) {
  const value = String(input || '').trim().toLowerCase()
  if (value === 'new' || value === 'processing' || value === 'confirmed' || value === 'completed' || value === 'cancelled') return value
  return null
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

function normalizeTenantKind(input: unknown) {
  const value = String(input || '').trim().toLowerCase()
  return value === 'school' ? 'school' : 'hotel'
}

function withGlobalCapabilities(scope: 'hotel' | 'education', moduleType: string, baseConfig: unknown) {
  const normalizedBase = typeof baseConfig === 'object' && baseConfig !== null
    ? (baseConfig as Record<string, unknown>)
    : { value: baseConfig }

  return {
    ...normalizedBase,
    globalCapabilities: {
      profile: 'global-ready-v1',
      scope,
      moduleType,
      multilingual: {
        enabled: true,
        locales: ['tr', 'en', 'de', 'es', 'ar'],
      },
      analytics: {
        enabled: true,
        liveDashboard: true,
      },
      automation: {
        enabled: true,
        webhookEnabled: true,
      },
      security: {
        enabled: true,
        piiMasking: true,
        auditTrail: true,
      },
      aiAssistant: {
        enabled: true,
        suggestions: true,
      },
    },
    innovationLab: {
      digitalTwinOps: {
        enabled: true,
        realtimeSimulation: true,
      },
      autonomousDecisionLoops: {
        enabled: true,
        humanApprovalFallback: true,
      },
      predictiveFlowIntelligence: {
        enabled: true,
        horizonHours: 72,
      },
      trustLedgerAudit: {
        enabled: true,
        immutableSnapshots: true,
      },
      voiceCopilot: {
        enabled: true,
        commandLanguages: ['tr', 'en', 'de'],
      },
      carbonAwareMode: {
        enabled: true,
        optimizeForLowEmissionWindows: true,
      },
    },
  }
}

function mergeConfigWithGlobalCapabilities(scope: 'hotel' | 'education', moduleType: string, existingConfigJson: unknown) {
  let parsedConfig: unknown = {}
  try {
    parsedConfig = JSON.parse(String(existingConfigJson || '{}'))
  } catch {
    parsedConfig = {}
  }

  return withGlobalCapabilities(scope, moduleType, parsedConfig)
}

async function ensureAllHotelEducationModulesProUpgraded() {
  if (!hotelEducationAutoUpgradePromise) {
    hotelEducationAutoUpgradePromise = (async () => {
      await ensureQrSchema()

      const rows = await sql`
        SELECT m.id, m.module_type, m.config_json, h.tenant_kind
        FROM hotel_qr_modules m
        JOIN hotel_tenants h ON h.id = m.hotel_id
      `

      for (const row of rows) {
        const moduleType = String(row.module_type || '')
        const tenantKind = String(row.tenant_kind || '').trim().toLowerCase()
        const scope: 'hotel' | 'education' = tenantKind === 'school' || isEducationModuleType(moduleType) ? 'education' : 'hotel'
        const nextConfig = mergeConfigWithGlobalCapabilities(scope, moduleType, row.config_json)

        await sql`
          UPDATE hotel_qr_modules
          SET config_json = ${JSON.stringify(nextConfig)}, updated_at = NOW()
          WHERE id = ${String(row.id || '')}
        `
      }
    })()
  }

  await hotelEducationAutoUpgradePromise
}

async function createHotel(name: string, code: string, city: string, whatsappNumber: string, tenantKind: 'hotel' | 'school') {
  const rows = await sql`
    INSERT INTO hotel_tenants (name, code, city, tenant_kind, whatsapp_number, is_active)
    VALUES (${name}, ${code}, ${city}, ${tenantKind}, ${whatsappNumber}, TRUE)
    ON CONFLICT (code)
    DO UPDATE SET
      name = EXCLUDED.name,
      city = EXCLUDED.city,
      tenant_kind = EXCLUDED.tenant_kind,
      whatsapp_number = EXCLUDED.whatsapp_number,
      updated_at = NOW()
    RETURNING id, name, code, city, tenant_kind, whatsapp_number, is_active, created_at, updated_at
  `

  return rows[0]
}

async function createWorldClockQr(hotelCode: string, title: string) {
  const hotels = await sql`
    SELECT id, code, name
    FROM hotel_tenants
    WHERE code = ${hotelCode}
      AND is_active = TRUE
    LIMIT 1
  `

  if (hotels.length === 0) {
    throw new Error('HOTEL_NOT_FOUND')
  }

  const hotel = hotels[0]
  let slug = generateModuleSlug('wc')
  let isUnique = false

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const exists = await sql`SELECT id FROM hotel_qr_modules WHERE slug = ${slug} LIMIT 1`
    if (exists.length === 0) {
      isUnique = true
      break
    }
    slug = generateModuleSlug('wc')
  }

  if (!isUnique) {
    throw new Error('SLUG_COLLISION')
  }

  const configJson = JSON.stringify(withGlobalCapabilities('hotel', 'world_clock', { cities: DEFAULT_WORLD_CLOCK_CITIES }))
  const rows = await sql`
    INSERT INTO hotel_qr_modules (hotel_id, slug, module_type, title, config_json, is_active)
    VALUES (${hotel.id}, ${slug}, 'world_clock', ${title}, ${configJson}, TRUE)
    RETURNING id, hotel_id, slug, module_type, title, config_json, is_active, created_at, updated_at
  `

  return {
    hotel,
    module: rows[0],
  }
}

async function createMenuQr(hotelCode: string, title: string) {
  const hotels = await sql`
    SELECT id, code, name
    FROM hotel_tenants
    WHERE code = ${hotelCode}
      AND is_active = TRUE
    LIMIT 1
  `

  if (hotels.length === 0) {
    throw new Error('HOTEL_NOT_FOUND')
  }

  const hotel = hotels[0]
  let slug = generateModuleSlug('menu')
  let isUnique = false

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const exists = await sql`SELECT id FROM hotel_qr_modules WHERE slug = ${slug} LIMIT 1`
    if (exists.length === 0) {
      isUnique = true
      break
    }
    slug = generateModuleSlug('menu')
  }

  if (!isUnique) {
    throw new Error('SLUG_COLLISION')
  }

  const configJson = JSON.stringify(withGlobalCapabilities('hotel', 'menu', DEFAULT_MENU_CONFIG))
  const rows = await sql`
    INSERT INTO hotel_qr_modules (hotel_id, slug, module_type, title, config_json, is_active)
    VALUES (${hotel.id}, ${slug}, 'menu', ${title}, ${configJson}, TRUE)
    RETURNING id, hotel_id, slug, module_type, title, config_json, is_active, created_at, updated_at
  `

  return {
    hotel,
    module: rows[0],
  }
}

async function createRoomServiceQr(hotelCode: string, title: string) {
  const hotels = await sql`
    SELECT id, code, name
    FROM hotel_tenants
    WHERE code = ${hotelCode}
      AND is_active = TRUE
    LIMIT 1
  `

  if (hotels.length === 0) {
    throw new Error('HOTEL_NOT_FOUND')
  }

  const hotel = hotels[0]
  let slug = generateModuleSlug('rs')
  let isUnique = false

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const exists = await sql`SELECT id FROM hotel_qr_modules WHERE slug = ${slug} LIMIT 1`
    if (exists.length === 0) {
      isUnique = true
      break
    }
    slug = generateModuleSlug('rs')
  }

  if (!isUnique) {
    throw new Error('SLUG_COLLISION')
  }

  const configJson = JSON.stringify(withGlobalCapabilities('hotel', 'room_service', DEFAULT_ROOM_SERVICE_CONFIG))
  const rows = await sql`
    INSERT INTO hotel_qr_modules (hotel_id, slug, module_type, title, config_json, is_active)
    VALUES (${hotel.id}, ${slug}, 'room_service', ${title}, ${configJson}, TRUE)
    RETURNING id, hotel_id, slug, module_type, title, config_json, is_active, created_at, updated_at
  `

  return {
    hotel,
    module: rows[0],
  }
}

async function createServiceTicketQr(hotelCode: string, title: string) {
  const hotels = await sql`
    SELECT id, code, name
    FROM hotel_tenants
    WHERE code = ${hotelCode}
      AND is_active = TRUE
    LIMIT 1
  `

  if (hotels.length === 0) {
    throw new Error('HOTEL_NOT_FOUND')
  }

  const hotel = hotels[0]
  let slug = generateModuleSlug('st')
  let isUnique = false

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const exists = await sql`SELECT id FROM hotel_qr_modules WHERE slug = ${slug} LIMIT 1`
    if (exists.length === 0) {
      isUnique = true
      break
    }
    slug = generateModuleSlug('st')
  }

  if (!isUnique) {
    throw new Error('SLUG_COLLISION')
  }

  const configJson = JSON.stringify(withGlobalCapabilities('hotel', 'service_ticket', DEFAULT_SERVICE_TICKET_CONFIG))
  const rows = await sql`
    INSERT INTO hotel_qr_modules (hotel_id, slug, module_type, title, config_json, is_active)
    VALUES (${hotel.id}, ${slug}, 'service_ticket', ${title}, ${configJson}, TRUE)
    RETURNING id, hotel_id, slug, module_type, title, config_json, is_active, created_at, updated_at
  `

  return {
    hotel,
    module: rows[0],
  }
}

async function createRoomHubQr(hotelCode: string, title: string) {
  const hotels = await sql`
    SELECT id, code, name
    FROM hotel_tenants
    WHERE code = ${hotelCode}
      AND is_active = TRUE
    LIMIT 1
  `

  if (hotels.length === 0) {
    throw new Error('HOTEL_NOT_FOUND')
  }

  const hotel = hotels[0]
  let slug = generateModuleSlug('hub')
  let isUnique = false

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const exists = await sql`SELECT id FROM hotel_qr_modules WHERE slug = ${slug} LIMIT 1`
    if (exists.length === 0) {
      isUnique = true
      break
    }
    slug = generateModuleSlug('hub')
  }

  if (!isUnique) {
    throw new Error('SLUG_COLLISION')
  }

  const configJson = JSON.stringify(withGlobalCapabilities('hotel', 'room_hub', { layout: 'room_hub_v1' }))
  const rows = await sql`
    INSERT INTO hotel_qr_modules (hotel_id, slug, module_type, title, config_json, is_active)
    VALUES (${hotel.id}, ${slug}, 'room_hub', ${title}, ${configJson}, TRUE)
    RETURNING id, hotel_id, slug, module_type, title, config_json, is_active, created_at, updated_at
  `

  return {
    hotel,
    module: rows[0],
  }
}

const EDUCATION_MODULE_DEFAULTS: Record<EducationModuleType, { prefix: string; defaultTitle: string; config: unknown }> = {
  class_attendance: { prefix: 'att', defaultTitle: 'Sınıf Yoklama QR', config: DEFAULT_ATTENDANCE_CONFIG },
  lesson_material: { prefix: 'mat', defaultTitle: 'Ders Materyali QR', config: DEFAULT_MATERIAL_CONFIG },
  homework_quiz: { prefix: 'quiz', defaultTitle: 'Ödev ve Mini Quiz QR', config: DEFAULT_QUIZ_CONFIG },
  announcement_event: { prefix: 'ann', defaultTitle: 'Duyuru ve Etkinlik QR', config: DEFAULT_ANNOUNCEMENT_CONFIG },
  education_support_ticket: { prefix: 'eds', defaultTitle: 'Eğitim Destek Talebi QR', config: DEFAULT_SUPPORT_CONFIG },
  parent_teacher_meeting: { prefix: 'ptm', defaultTitle: 'Veli-Öğretmen İletişim QR', config: DEFAULT_PARENT_TEACHER_CONFIG },
}

function normalizeEducationModuleType(input: unknown): EducationModuleType | null {
  const value = String(input || '').trim().toLowerCase()
  if (
    value === 'class_attendance'
    || value === 'lesson_material'
    || value === 'homework_quiz'
    || value === 'announcement_event'
    || value === 'education_support_ticket'
    || value === 'parent_teacher_meeting'
  ) {
    return value
  }
  return null
}

async function createEducationModuleQr(hotelCode: string, moduleType: EducationModuleType, title: string) {
  const hotels = await sql`
    SELECT id, code, name
    FROM hotel_tenants
    WHERE code = ${hotelCode}
      AND is_active = TRUE
      AND tenant_kind = 'school'
    LIMIT 1
  `

  if (hotels.length === 0) {
    throw new Error('SCHOOL_NOT_FOUND')
  }

  const hotel = hotels[0]
  const meta = EDUCATION_MODULE_DEFAULTS[moduleType]
  let slug = generateModuleSlug(meta.prefix)
  let isUnique = false

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const exists = await sql`SELECT id FROM hotel_qr_modules WHERE slug = ${slug} LIMIT 1`
    if (exists.length === 0) {
      isUnique = true
      break
    }
    slug = generateModuleSlug(meta.prefix)
  }

  if (!isUnique) {
    throw new Error('SLUG_COLLISION')
  }

  const configJson = JSON.stringify(withGlobalCapabilities('education', moduleType, meta.config))
  const rows = await sql`
    INSERT INTO hotel_qr_modules (hotel_id, slug, module_type, title, config_json, is_active)
    VALUES (${hotel.id}, ${slug}, ${moduleType}, ${title}, ${configJson}, TRUE)
    RETURNING id, hotel_id, slug, module_type, title, config_json, is_active, created_at, updated_at
  `

  return {
    hotel,
    module: rows[0],
  }
}

async function resolveModuleTarget(slug: string) {
  const targetRows = await sql`
    SELECT m.id, m.module_type, h.code AS hotel_code
    FROM hotel_qr_modules m
    JOIN hotel_tenants h ON h.id = m.hotel_id
    WHERE m.slug = ${slug}
    LIMIT 1
  `

  if (targetRows.length === 0) return null
  return {
    moduleId: String(targetRows[0].id || ''),
    hotelCode: String(targetRows[0].hotel_code || ''),
    moduleType: String(targetRows[0].module_type || ''),
  }
}

async function resolveModuleByHotelAndSlug(hotelCode: string, slug: string) {
  const rows = await sql`
    SELECT m.id, m.slug, m.module_type, m.title, h.id AS hotel_id, h.code AS hotel_code
    FROM hotel_qr_modules m
    JOIN hotel_tenants h ON h.id = m.hotel_id
    WHERE h.code = ${hotelCode}
      AND m.slug = ${slug}
      AND h.is_active = TRUE
      AND m.is_active = TRUE
    LIMIT 1
  `

  if (rows.length === 0) return null
  return rows[0]
}

async function listHotelsAndModules() {
  const hotels = await sql`
    SELECT id, code, name, city, whatsapp_number, is_active, created_at, updated_at
    FROM hotel_tenants
    ORDER BY hotel_tenants.created_at DESC
    LIMIT 1000
  `

  const modules = await sql`
    SELECT m.id, m.hotel_id, m.slug, m.module_type, m.title, m.config_json, m.is_active, m.created_at, h.code AS hotel_code, h.name AS hotel_name
    FROM hotel_qr_modules m
    JOIN hotel_tenants h ON h.id = m.hotel_id
    ORDER BY m.created_at DESC
    LIMIT 5000
  `

  const orderStatsRows = await sql`
    SELECT h.code AS hotel_code,
           COUNT(*)::int AS total_orders,
           COUNT(*) FILTER (WHERE status = 'new')::int AS open_orders,
           COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_orders,
          COUNT(*) FILTER (WHERE o.created_at >= NOW() - INTERVAL '24 hours')::int AS orders_last_24h
    FROM hotel_room_orders o
    JOIN hotel_tenants h ON h.id = o.hotel_id
    GROUP BY h.code
  `

  const ticketStatsRows = await sql`
    SELECT h.code AS hotel_code,
           COUNT(*)::int AS total_tickets,
           COUNT(*) FILTER (WHERE status = 'new')::int AS open_tickets,
           COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_tickets,
          COUNT(*) FILTER (WHERE t.created_at >= NOW() - INTERVAL '24 hours')::int AS tickets_last_24h
    FROM hotel_service_tickets t
    JOIN hotel_tenants h ON h.id = t.hotel_id
    GROUP BY h.code
  `

  const analyticsByHotel: Record<string, Record<string, number>> = {}
  for (const row of orderStatsRows) {
    const code = String(row.hotel_code || '')
    if (!analyticsByHotel[code]) analyticsByHotel[code] = {}
    analyticsByHotel[code].totalOrders = Number(row.total_orders || 0)
    analyticsByHotel[code].openOrders = Number(row.open_orders || 0)
    analyticsByHotel[code].completedOrders = Number(row.completed_orders || 0)
    analyticsByHotel[code].ordersLast24h = Number(row.orders_last_24h || 0)
  }
  for (const row of ticketStatsRows) {
    const code = String(row.hotel_code || '')
    if (!analyticsByHotel[code]) analyticsByHotel[code] = {}
    analyticsByHotel[code].totalTickets = Number(row.total_tickets || 0)
    analyticsByHotel[code].openTickets = Number(row.open_tickets || 0)
    analyticsByHotel[code].completedTickets = Number(row.completed_tickets || 0)
    analyticsByHotel[code].ticketsLast24h = Number(row.tickets_last_24h || 0)
  }

  return { hotels, modules, analyticsByHotel }
}

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()
    await ensureAllHotelEducationModulesProUpgraded()

    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '').trim()
    const scope = String(body.scope || '').trim().toLowerCase() === 'education' ? 'education' : 'hotel'
    const password = String(body.password || '').trim()
    const hotelAuthUser = await getAuthenticatedHotelUser(req)
    const educationAuthUser = await getAuthenticatedEducationUser(req)
    const authUser = scope === 'education' ? educationAuthUser : hotelAuthUser
    const bootstrapAuthorized = isAdminAuthorized(password)

    if (!authUser && !bootstrapAuthorized) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    if (!bootstrapAuthorized && authUser) {
      if (scope === 'education' && authUser.role !== 'education_admin') {
        return NextResponse.json({ error: 'Bu işlem sadece eğitim modülü kullanıcısına açık' }, { status: 403 })
      }
      if (scope === 'hotel' && authUser.role === 'education_admin') {
        return NextResponse.json({ error: 'Bu işlem sadece otel modülü kullanıcısına açık' }, { status: 403 })
      }
    }

    if (action === 'list') {
      if (authUser?.role === 'staff') {
        return NextResponse.json({ error: 'Bu işlem için yetkin yok' }, { status: 403 })
      }

      if (authUser?.role === 'hotel_admin' && authUser.hotelCode) {
        const hotels = await sql`
          SELECT id, code, name, city, tenant_kind, whatsapp_number, is_active, created_at, updated_at
          FROM hotel_tenants
          WHERE code = ${authUser.hotelCode}
            AND tenant_kind = 'hotel'
          LIMIT 1
        `
        const modules = await sql`
          SELECT m.id, m.hotel_id, m.slug, m.module_type, m.title, m.config_json, m.is_active, m.created_at, h.code AS hotel_code, h.name AS hotel_name
          FROM hotel_qr_modules m
          JOIN hotel_tenants h ON h.id = m.hotel_id
          WHERE h.code = ${authUser.hotelCode}
            AND m.module_type NOT IN ('class_attendance', 'lesson_material', 'homework_quiz', 'announcement_event', 'education_support_ticket', 'parent_teacher_meeting')
          ORDER BY m.created_at DESC
          LIMIT 5000
        `

        const orderStatsRows = await sql`
          SELECT h.code AS hotel_code,
                 COUNT(*)::int AS total_orders,
                 COUNT(*) FILTER (WHERE status = 'new')::int AS open_orders,
                 COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_orders,
                 COUNT(*) FILTER (WHERE o.created_at >= NOW() - INTERVAL '24 hours')::int AS orders_last_24h
          FROM hotel_room_orders o
          JOIN hotel_tenants h ON h.id = o.hotel_id
          WHERE h.code = ${authUser.hotelCode}
          GROUP BY h.code
        `

        const ticketStatsRows = await sql`
          SELECT h.code AS hotel_code,
                 COUNT(*)::int AS total_tickets,
                 COUNT(*) FILTER (WHERE status = 'new')::int AS open_tickets,
                 COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_tickets,
                 COUNT(*) FILTER (WHERE t.created_at >= NOW() - INTERVAL '24 hours')::int AS tickets_last_24h
          FROM hotel_service_tickets t
          JOIN hotel_tenants h ON h.id = t.hotel_id
          WHERE h.code = ${authUser.hotelCode}
          GROUP BY h.code
        `

        const analyticsByHotel: Record<string, Record<string, number>> = {}
        for (const row of orderStatsRows) {
          const code = String(row.hotel_code || '')
          analyticsByHotel[code] = {
            totalOrders: Number(row.total_orders || 0),
            openOrders: Number(row.open_orders || 0),
            completedOrders: Number(row.completed_orders || 0),
            ordersLast24h: Number(row.orders_last_24h || 0),
          }
        }
        for (const row of ticketStatsRows) {
          const code = String(row.hotel_code || '')
          analyticsByHotel[code] = {
            ...(analyticsByHotel[code] || {}),
            totalTickets: Number(row.total_tickets || 0),
            openTickets: Number(row.open_tickets || 0),
            completedTickets: Number(row.completed_tickets || 0),
            ticketsLast24h: Number(row.tickets_last_24h || 0),
          }
        }

        return NextResponse.json({ hotels, modules, analyticsByHotel })
      }

      if (authUser?.role === 'education_admin' && authUser.hotelCode) {
        const hotels = await sql`
          SELECT id, code, name, city, tenant_kind, whatsapp_number, is_active, created_at, updated_at
          FROM hotel_tenants
          WHERE code = ${authUser.hotelCode}
            AND tenant_kind = 'school'
          LIMIT 1
        `
        const modules = await sql`
          SELECT m.id, m.hotel_id, m.slug, m.module_type, m.title, m.config_json, m.is_active, m.created_at, h.code AS hotel_code, h.name AS hotel_name
          FROM hotel_qr_modules m
          JOIN hotel_tenants h ON h.id = m.hotel_id
          WHERE h.code = ${authUser.hotelCode}
            AND h.tenant_kind = 'school'
            AND m.module_type IN ('class_attendance', 'lesson_material', 'homework_quiz', 'announcement_event', 'education_support_ticket', 'parent_teacher_meeting')
          ORDER BY m.created_at DESC
          LIMIT 5000
        `

        return NextResponse.json({ hotels, modules, analyticsByHotel: {} })
      }

      if (scope === 'education') {
        const hotels = await sql`
          SELECT id, code, name, city, tenant_kind, whatsapp_number, is_active, created_at, updated_at
          FROM hotel_tenants
          WHERE tenant_kind = 'school'
          ORDER BY hotel_tenants.created_at DESC
          LIMIT 1000
        `

        const modules = await sql`
          SELECT m.id, m.hotel_id, m.slug, m.module_type, m.title, m.config_json, m.is_active, m.created_at, h.code AS hotel_code, h.name AS hotel_name
          FROM hotel_qr_modules m
          JOIN hotel_tenants h ON h.id = m.hotel_id
          WHERE h.tenant_kind = 'school'
            AND m.module_type IN ('class_attendance', 'lesson_material', 'homework_quiz', 'announcement_event', 'education_support_ticket', 'parent_teacher_meeting')
          ORDER BY m.created_at DESC
          LIMIT 5000
        `

        return NextResponse.json({ hotels, modules, analyticsByHotel: {} })
      }

      const data = await listHotelsAndModules()
      return NextResponse.json(data)
    }

    if (action === 'createHotel') {
      if (!bootstrapAuthorized && authUser?.role !== 'platform_admin') {
        return NextResponse.json({ error: 'Bu işlem için platform_admin gerekli' }, { status: 403 })
      }

      const name = String(body.name || '').trim().slice(0, 140)
      const code = normalizeHotelCode(body.code)
      const city = String(body.city || '').trim().slice(0, 80)
      const whatsappNumber = normalizeWhatsappNumber(body.whatsappNumber)
      const tenantKind = normalizeTenantKind(body.tenantKind || (scope === 'education' ? 'school' : 'hotel'))

      if (!name || code.length < 3) {
        return NextResponse.json({ error: tenantKind === 'school' ? 'Okul adı ve geçerli kod gerekli' : 'Otel adı ve geçerli kod gerekli' }, { status: 400 })
      }

      const hotel = await createHotel(name, code, city, whatsappNumber, tenantKind)
      return NextResponse.json({ hotel })
    }

    if (action === 'updateHotelWhatsapp') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode
      const whatsappNumber = normalizeWhatsappNumber(body.whatsappNumber)

      if (!hotelCode) {
        return NextResponse.json({ error: 'Geçerli hotelCode gerekli' }, { status: 400 })
      }

      if (!whatsappNumber) {
        return NextResponse.json({ error: 'WhatsApp numarası gerekli' }, { status: 400 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu otel için yetkin yok' }, { status: 403 })
        }
      }

      const rows = await sql`
        UPDATE hotel_tenants
        SET whatsapp_number = ${whatsappNumber}, updated_at = NOW()
        WHERE code = ${hotelCode}
          AND is_active = TRUE
        RETURNING id, code, name, city, whatsapp_number, is_active, created_at, updated_at
      `

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Otel bulunamadı' }, { status: 404 })
      }

      return NextResponse.json({ ok: true, hotel: rows[0] })
    }

    if (action === 'createHotelUser') {
      if (!bootstrapAuthorized && authUser?.role !== 'platform_admin') {
        return NextResponse.json({ error: 'Bu işlem için platform_admin gerekli' }, { status: 403 })
      }

      const hotelCode = normalizeHotelCode(body.hotelCode)
      const email = String(body.email || '').trim().toLowerCase()
      const rawRole = normalizeHotelRole(body.role)
      const role = rawRole === 'hotel_admin' || rawRole === 'education_admin' || rawRole === 'staff' ? rawRole : null
      const newPassword = String(body.userPassword || '')

      if (!hotelCode || !email || !role || newPassword.length < 6) {
        return NextResponse.json({ error: 'hotelCode, email, role ve en az 6 karakter şifre gerekli' }, { status: 400 })
      }

      if (scope === 'education' && role !== 'education_admin') {
        return NextResponse.json({ error: 'Eğitim kapsamı sadece education_admin oluşturabilir' }, { status: 400 })
      }

      if (scope === 'hotel' && role === 'education_admin') {
        return NextResponse.json({ error: 'Otel kapsamı education_admin oluşturamaz' }, { status: 400 })
      }

      if (role === 'education_admin') {
        const existingEducationUser = await getEducationUserByEmail(email)
        if (existingEducationUser) {
          return NextResponse.json({ error: 'Bu e-posta eğitim modülünde zaten kayıtlı' }, { status: 409 })
        }
      } else {
        const existingHotelUser = await getHotelUserByEmail(email)
        if (existingHotelUser) {
          return NextResponse.json({ error: 'Bu e-posta otel modülünde zaten kayıtlı' }, { status: 409 })
        }
      }

      const existingRealm = await findAdminRealmByEmail(email)
      const targetRealm = role === 'education_admin' ? 'education' : 'hotel'
      if (existingRealm && existingRealm !== targetRealm) {
        return NextResponse.json({ error: `Bu e-posta ${realmLoginPath(existingRealm)} panelinde kayıtlı.` }, { status: 409 })
      }

      const hotels = await sql`
        SELECT id, code
        FROM hotel_tenants
        WHERE code = ${hotelCode}
          AND is_active = TRUE
          AND tenant_kind = ${role === 'education_admin' ? 'school' : 'hotel'}
        LIMIT 1
      `

      if (hotels.length === 0) {
        return NextResponse.json({ error: role === 'education_admin' ? 'Okul bulunamadı' : 'Otel bulunamadı' }, { status: 404 })
      }

      const user = role === 'education_admin'
        ? await createEducationUser({
          email,
          password: newPassword,
          hotelId: String(hotels[0].id),
        })
        : await createHotelUser({
          email,
          password: newPassword,
          role,
          hotelId: String(hotels[0].id),
        })

      return NextResponse.json({ ok: true, userId: user.id })
    }

    if (action === 'createWorldClockQr') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode
      const rawTitle = String(body.title || '').trim()
      const title = rawTitle ? rawTitle.slice(0, 160) : 'Dünya Saatleri'

      if (!hotelCode) {
        return NextResponse.json({ error: 'Geçerli hotelCode gerekli' }, { status: 400 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu otel için yetkin yok' }, { status: 403 })
        }
      }

      const created = await createWorldClockQr(hotelCode, title)
      const baseUrl = req.nextUrl.origin

      return NextResponse.json({
        ...created,
        publicUrl: `${baseUrl}/h/${created.hotel.code}/q/${created.module.slug}`,
      })
    }

    if (action === 'createMenuQr') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode
      const rawTitle = String(body.title || '').trim()
      const title = rawTitle ? rawTitle.slice(0, 160) : 'Menu'

      if (!hotelCode) {
        return NextResponse.json({ error: 'Geçerli hotelCode gerekli' }, { status: 400 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu otel için yetkin yok' }, { status: 403 })
        }
      }

      const created = await createMenuQr(hotelCode, title)
      const baseUrl = req.nextUrl.origin

      return NextResponse.json({
        ...created,
        publicUrl: `${baseUrl}/h/${created.hotel.code}/q/${created.module.slug}`,
      })
    }

    if (action === 'createRoomServiceQr') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode
      const rawTitle = String(body.title || '').trim()
      const title = rawTitle ? rawTitle.slice(0, 160) : 'Oda Servisi'

      if (!hotelCode) {
        return NextResponse.json({ error: 'Geçerli hotelCode gerekli' }, { status: 400 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu otel için yetkin yok' }, { status: 403 })
        }
      }

      const created = await createRoomServiceQr(hotelCode, title)
      const baseUrl = req.nextUrl.origin
      return NextResponse.json({
        ...created,
        publicUrl: `${baseUrl}/h/${created.hotel.code}/q/${created.module.slug}`,
      })
    }

    if (action === 'createServiceTicketQr') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode
      const rawTitle = String(body.title || '').trim()
      const title = rawTitle ? rawTitle.slice(0, 160) : 'Servis Talebi'

      if (!hotelCode) {
        return NextResponse.json({ error: 'Geçerli hotelCode gerekli' }, { status: 400 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu otel için yetkin yok' }, { status: 403 })
        }
      }

      const created = await createServiceTicketQr(hotelCode, title)
      const baseUrl = req.nextUrl.origin
      return NextResponse.json({
        ...created,
        publicUrl: `${baseUrl}/h/${created.hotel.code}/q/${created.module.slug}`,
      })
    }

    if (action === 'createRoomHubQr') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode
      const rawTitle = String(body.title || '').trim()
      const title = rawTitle ? rawTitle.slice(0, 160) : 'Oda Asistanı'

      if (!hotelCode) {
        return NextResponse.json({ error: 'Geçerli hotelCode gerekli' }, { status: 400 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu otel için yetkin yok' }, { status: 403 })
        }
      }

      const created = await createRoomHubQr(hotelCode, title)
      const baseUrl = req.nextUrl.origin
      return NextResponse.json({
        ...created,
        publicUrl: `${baseUrl}/h/${created.hotel.code}/q/${created.module.slug}`,
      })
    }

    if (action === 'createEducationModuleQr') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.role === 'education_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode
      const moduleType = normalizeEducationModuleType(body.moduleType)
      if (!hotelCode || !moduleType) {
        return NextResponse.json({ error: 'Geçerli okul kodu ve moduleType gerekli' }, { status: 400 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageEducation(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu okul için yetkin yok' }, { status: 403 })
        }
      }

      const rawTitle = String(body.title || '').trim()
      const title = rawTitle ? rawTitle.slice(0, 160) : EDUCATION_MODULE_DEFAULTS[moduleType].defaultTitle
      const created = await createEducationModuleQr(hotelCode, moduleType, title)
      const baseUrl = req.nextUrl.origin
      return NextResponse.json({
        ...created,
        publicUrl: `${baseUrl}/h/${created.hotel.code}/q/${created.module.slug}`,
      })
    }

    if (action === 'upgradeModulesToPro') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.hotelCode ? authUser.hotelCode : requestedHotelCode

      if (!hotelCode) {
        return NextResponse.json({ error: scope === 'education' ? 'Geçerli okul kodu gerekli' : 'Geçerli hotelCode gerekli' }, { status: 400 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser) {
          return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
        }
        if (scope === 'education') {
          if (!canManageEducation(authUser.role, authUser.hotelCode, hotelCode)) {
            return NextResponse.json({ error: 'Bu okul için yetkin yok' }, { status: 403 })
          }
        } else {
          if (!canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
            return NextResponse.json({ error: 'Bu otel için yetkin yok' }, { status: 403 })
          }
        }
      }

      const moduleRows = scope === 'education'
        ? await sql`
          SELECT m.id, m.module_type, m.config_json
          FROM hotel_qr_modules m
          JOIN hotel_tenants h ON h.id = m.hotel_id
          WHERE h.code = ${hotelCode}
            AND h.tenant_kind = 'school'
            AND m.module_type IN ('class_attendance', 'lesson_material', 'homework_quiz', 'announcement_event', 'education_support_ticket', 'parent_teacher_meeting')
        `
        : await sql`
          SELECT m.id, m.module_type, m.config_json
          FROM hotel_qr_modules m
          JOIN hotel_tenants h ON h.id = m.hotel_id
          WHERE h.code = ${hotelCode}
            AND h.tenant_kind = 'hotel'
            AND m.module_type NOT IN ('class_attendance', 'lesson_material', 'homework_quiz', 'announcement_event', 'education_support_ticket', 'parent_teacher_meeting')
        `

      for (const row of moduleRows) {
        const nextConfig = mergeConfigWithGlobalCapabilities(scope, String(row.module_type || ''), row.config_json)
        await sql`
          UPDATE hotel_qr_modules
          SET config_json = ${JSON.stringify(nextConfig)}, updated_at = NOW()
          WHERE id = ${String(row.id || '')}
        `
      }

      return NextResponse.json({ ok: true, updatedModules: moduleRows.length })
    }

    if (action === 'updateModuleTitle') {
      const slug = normalizeSlug(body.slug)
      const title = String(body.title || '').trim().slice(0, 160)

      if (!slug || !title) {
        return NextResponse.json({ error: 'Slug ve başlık gerekli' }, { status: 400 })
      }

      const target = await resolveModuleTarget(slug)
      if (!target) {
        return NextResponse.json({ error: 'Modül bulunamadı' }, { status: 404 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageModuleByType(authUser.role, authUser.hotelCode, target.hotelCode, target.moduleType)) {
          return NextResponse.json({ error: 'Bu modül için yetkin yok' }, { status: 403 })
        }
      }

      await sql`
        UPDATE hotel_qr_modules
        SET title = ${title}, updated_at = NOW()
        WHERE slug = ${slug}
      `

      return NextResponse.json({ ok: true })
    }

    if (action === 'bulkCreateRoomQrs') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode
      const slug = normalizeSlug(body.slug)
      const entries = Array.isArray(body.entries) ? body.entries : []

      if (!hotelCode || !slug) {
        return NextResponse.json({ error: 'hotelCode ve slug gerekli' }, { status: 400 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu otel için yetkin yok' }, { status: 403 })
        }
      }

      const moduleRow = await resolveModuleByHotelAndSlug(hotelCode, slug)
      if (!moduleRow) {
        return NextResponse.json({ error: 'Modül bulunamadı' }, { status: 404 })
      }

      const moduleType = String(moduleRow.module_type || '')
      if (moduleType !== 'room_service' && moduleType !== 'service_ticket' && moduleType !== 'room_hub') {
        return NextResponse.json({ error: 'Toplu oda QR sadece room_service, service_ticket veya room_hub modüllerinde açık' }, { status: 400 })
      }

      const existingRows = await sql`
        SELECT COUNT(*)::int AS total
        FROM hotel_room_qr_codes
        WHERE hotel_id = ${String(moduleRow.hotel_id || '')}
          AND module_id = ${String(moduleRow.id || '')}
      `
      const existingCount = Number(existingRows[0]?.total || 0)

      // Monetization guard: hotel admins can perform one initial bulk allocation only.
      if (!bootstrapAuthorized && authUser?.role === 'hotel_admin' && existingCount > 0) {
        return NextResponse.json({ error: 'Bu modül için toplu QR zaten oluşturuldu. Ek oluşturma için platform_admin onayı gerekli.' }, { status: 409 })
      }

      const normalizedEntries = entries
        .map((item: unknown) => {
          const roomNo = normalizeRoomNo((item as { roomNo?: unknown })?.roomNo)
          const floorLabel = normalizeFloorLabel((item as { floorLabel?: unknown })?.floorLabel)
          if (!roomNo) return null
          const sourceTag = normalizeSourceTag((item as { sourceTag?: unknown })?.sourceTag) || `${floorLabel ? `F${floorLabel}-` : ''}R${roomNo}`
          return { roomNo, floorLabel, sourceTag }
        })
        .filter((item: unknown): item is { roomNo: string; floorLabel: string; sourceTag: string } => Boolean(item))

      if (normalizedEntries.length === 0) {
        return NextResponse.json({ error: 'En az bir geçerli oda satırı gerekli' }, { status: 400 })
      }
      if (normalizedEntries.length > 2000) {
        return NextResponse.json({ error: 'Tek seferde en fazla 2000 oda oluşturabilirsin' }, { status: 400 })
      }

      const uniqueMap = new Map<string, { roomNo: string; floorLabel: string; sourceTag: string }>()
      for (const entry of normalizedEntries) {
        uniqueMap.set(entry.roomNo, entry)
      }
      const uniqueEntries = Array.from(uniqueMap.values())

      const created: Array<{ id: string; room_no: string; floor_label: string; source_tag: string; revision_count: number; max_revisions: number }> = []
      const skippedRooms: string[] = []

      for (const entry of uniqueEntries) {
        const rows = await sql`
          INSERT INTO hotel_room_qr_codes (hotel_id, module_id, room_no, floor_label, source_tag, revision_count, max_revisions, is_locked)
          VALUES (
            ${String(moduleRow.hotel_id || '')},
            ${String(moduleRow.id || '')},
            ${entry.roomNo},
            ${entry.floorLabel},
            ${entry.sourceTag},
            0,
            2,
            FALSE
          )
          ON CONFLICT (hotel_id, module_id, room_no) DO NOTHING
          RETURNING id, room_no, floor_label, source_tag, revision_count, max_revisions
        `

        if (rows.length > 0) {
          created.push({
            id: String(rows[0].id || ''),
            room_no: String(rows[0].room_no || ''),
            floor_label: String(rows[0].floor_label || ''),
            source_tag: String(rows[0].source_tag || ''),
            revision_count: Number(rows[0].revision_count || 0),
            max_revisions: Number(rows[0].max_revisions || 2),
          })
        } else {
          skippedRooms.push(entry.roomNo)
        }
      }

      const baseUrl = req.nextUrl.origin
      const preview = created.slice(0, 200).map((row) => ({
        ...row,
        publicUrl: `${baseUrl}/h/${hotelCode}/q/${slug}?room=${encodeURIComponent(row.room_no)}${row.floor_label ? `&floor=${encodeURIComponent(row.floor_label)}` : ''}&source=${encodeURIComponent(row.source_tag)}`,
      }))

      return NextResponse.json({
        ok: true,
        createdCount: created.length,
        skippedCount: skippedRooms.length,
        skippedRooms,
        maxRevisionPolicy: 2,
        preview,
      })
    }

    if (action === 'listRoomQrs') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode
      const slug = normalizeSlug(body.slug)
      const safeLimit = Number.isFinite(Number(body.limit)) ? Math.max(50, Math.min(Number(body.limit), 3000)) : 1000

      if (!hotelCode) {
        return NextResponse.json({ error: 'hotelCode gerekli' }, { status: 400 })
      }

      const whereSlug = slug ? sql`AND m.slug = ${slug}` : sql``
      const rows = await sql`
        SELECT q.id, q.room_no, q.floor_label, q.source_tag, q.revision_count, q.max_revisions, q.is_locked, q.created_at,
               h.code AS hotel_code, m.slug, m.title, m.module_type
        FROM hotel_room_qr_codes q
        JOIN hotel_tenants h ON h.id = q.hotel_id
        JOIN hotel_qr_modules m ON m.id = q.module_id
        WHERE h.code = ${hotelCode}
        ${whereSlug}
        ORDER BY
          CASE WHEN q.room_no ~ '^[0-9]+$' THEN 0 ELSE 1 END ASC,
          CASE WHEN q.room_no ~ '^[0-9]+$' THEN q.room_no::int ELSE NULL END ASC,
          q.room_no ASC
        LIMIT ${safeLimit}
      `

      const baseUrl = req.nextUrl.origin
      const roomQrs = rows.map((row) => {
        const roomNo = String(row.room_no || '')
        const floorLabel = String(row.floor_label || '')
        const sourceTag = String(row.source_tag || '')
        const moduleSlug = String(row.slug || '')
        const url = `${baseUrl}/h/${hotelCode}/q/${moduleSlug}?room=${encodeURIComponent(roomNo)}${floorLabel ? `&floor=${encodeURIComponent(floorLabel)}` : ''}&source=${encodeURIComponent(sourceTag)}`
        return {
          id: String(row.id || ''),
          room_no: roomNo,
          floor_label: floorLabel,
          source_tag: sourceTag,
          revision_count: Number(row.revision_count || 0),
          max_revisions: Number(row.max_revisions || 2),
          is_locked: Boolean(row.is_locked),
          module_slug: moduleSlug,
          module_title: String(row.title || ''),
          module_type: String(row.module_type || ''),
          publicUrl: url,
        }
      })

      return NextResponse.json({ roomQrs, hotelCode })
    }

    if (action === 'reviseRoomQr') {
      const qrId = String(body.qrId || '').trim()
      const roomNo = normalizeRoomNo(body.roomNo)
      const floorLabel = normalizeFloorLabel(body.floorLabel)
      const sourceTag = normalizeSourceTag(body.sourceTag) || `${floorLabel ? `F${floorLabel}-` : ''}R${roomNo}`

      if (!qrId || !roomNo) {
        return NextResponse.json({ error: 'qrId ve roomNo gerekli' }, { status: 400 })
      }

      const rows = await sql`
        SELECT q.id, q.hotel_id, q.module_id, q.room_no, q.revision_count, q.max_revisions, q.is_locked, h.code AS hotel_code
        FROM hotel_room_qr_codes q
        JOIN hotel_tenants h ON h.id = q.hotel_id
        WHERE q.id = ${qrId}
        LIMIT 1
      `

      if (rows.length === 0) {
        return NextResponse.json({ error: 'QR kaydı bulunamadı' }, { status: 404 })
      }

      const row = rows[0]
      const hotelCode = String(row.hotel_code || '')
      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu QR kaydı için yetkin yok' }, { status: 403 })
        }
      }

      const revisionCount = Number(row.revision_count || 0)
      const maxRevisions = Number(row.max_revisions || 2)
      const isLocked = Boolean(row.is_locked)
      if (isLocked || revisionCount >= maxRevisions) {
        return NextResponse.json({ error: `Bu QR için değişiklik limiti doldu (max ${maxRevisions})` }, { status: 409 })
      }

      try {
        const nextRevision = revisionCount + 1
        const nextLocked = nextRevision >= maxRevisions
        await sql`
          UPDATE hotel_room_qr_codes
          SET room_no = ${roomNo},
              floor_label = ${floorLabel},
              source_tag = ${sourceTag},
              revision_count = ${nextRevision},
              is_locked = ${nextLocked},
              updated_at = NOW()
          WHERE id = ${qrId}
        `
      } catch {
        return NextResponse.json({ error: 'Aynı oda numarası için QR kaydı zaten var' }, { status: 409 })
      }

      return NextResponse.json({ ok: true, revisionCount: revisionCount + 1, maxRevisions })
    }

    if (action === 'deleteRoomQrs') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode
      const slug = normalizeSlug(body.slug)
      const qrIds = Array.isArray(body.qrIds)
        ? body.qrIds.map((id: unknown) => String(id || '').trim()).filter(Boolean)
        : []

      if (!hotelCode) {
        return NextResponse.json({ error: 'hotelCode gerekli' }, { status: 400 })
      }

      if (!slug && qrIds.length === 0) {
        return NextResponse.json({ error: 'Silme için slug veya qrIds gerekli' }, { status: 400 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu otel için yetkin yok' }, { status: 403 })
        }
      }

      if (qrIds.length > 0) {
        const rows = await sql`
          DELETE FROM hotel_room_qr_codes q
          USING hotel_tenants h
          WHERE q.hotel_id = h.id
            AND h.code = ${hotelCode}
            AND q.id = ANY(${qrIds}::uuid[])
          RETURNING q.id
        `

        return NextResponse.json({ ok: true, deletedCount: rows.length })
      }

      const moduleRow = await resolveModuleByHotelAndSlug(hotelCode, slug)
      if (!moduleRow) {
        return NextResponse.json({ error: 'Modül bulunamadı' }, { status: 404 })
      }

      const rows = await sql`
        DELETE FROM hotel_room_qr_codes
        WHERE hotel_id = ${String(moduleRow.hotel_id || '')}
          AND module_id = ${String(moduleRow.id || '')}
        RETURNING id
      `

      return NextResponse.json({ ok: true, deletedCount: rows.length })
    }

    if (action === 'updateWorldClockConfig') {
      const slug = normalizeSlug(body.slug)
      const cities = validateWorldClockCities(body.cities)

      if (!slug || !cities) {
        return NextResponse.json({ error: 'Geçerli slug ve şehir listesi gerekli' }, { status: 400 })
      }

      const target = await resolveModuleTarget(slug)
      if (!target) {
        return NextResponse.json({ error: 'Modül bulunamadı' }, { status: 404 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, target.hotelCode)) {
          return NextResponse.json({ error: 'Bu modül için yetkin yok' }, { status: 403 })
        }
      }

      await sql`
        UPDATE hotel_qr_modules
        SET config_json = ${JSON.stringify(cities)}, updated_at = NOW()
        WHERE slug = ${slug}
      `

      return NextResponse.json({ ok: true })
    }

    if (action === 'updateMenuConfig') {
      const slug = normalizeSlug(body.slug)
      const menuConfig = validateMenuConfig(body.menu)

      if (!slug || !menuConfig) {
        return NextResponse.json({ error: 'Geçerli slug ve menü gerekli' }, { status: 400 })
      }

      const target = await resolveModuleTarget(slug)
      if (!target) {
        return NextResponse.json({ error: 'Modül bulunamadı' }, { status: 404 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, target.hotelCode)) {
          return NextResponse.json({ error: 'Bu modül için yetkin yok' }, { status: 403 })
        }
      }

      await sql`
        UPDATE hotel_qr_modules
        SET config_json = ${JSON.stringify(menuConfig)}, updated_at = NOW()
        WHERE slug = ${slug}
          AND module_type = 'menu'
      `

      return NextResponse.json({ ok: true })
    }

    if (action === 'updateEducationModuleConfig') {
      const slug = normalizeSlug(body.slug)
      const moduleType = normalizeEducationModuleType(body.moduleType)
      const config = moduleType ? validateEducationConfigByType(moduleType, body.config) : null

      if (!slug || !moduleType || !config) {
        return NextResponse.json({ error: 'Geçerli slug, moduleType ve config gerekli' }, { status: 400 })
      }

      const target = await resolveModuleTarget(slug)
      if (!target) {
        return NextResponse.json({ error: 'Modül bulunamadı' }, { status: 404 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageEducation(authUser.role, authUser.hotelCode, target.hotelCode)) {
          return NextResponse.json({ error: 'Bu modül için yetkin yok' }, { status: 403 })
        }
      }

      await sql`
        UPDATE hotel_qr_modules
        SET config_json = ${JSON.stringify(config)}, updated_at = NOW()
        WHERE slug = ${slug}
          AND module_type = ${moduleType}
      `

      return NextResponse.json({ ok: true })
    }

    if (action === 'deleteModule') {
      const slug = normalizeSlug(body.slug)
      if (!slug) {
        return NextResponse.json({ error: 'Geçerli slug gerekli' }, { status: 400 })
      }

      const target = await resolveModuleTarget(slug)
      if (!target) {
        return NextResponse.json({ error: 'Modül bulunamadı' }, { status: 404 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageModuleByType(authUser.role, authUser.hotelCode, target.hotelCode, target.moduleType)) {
          return NextResponse.json({ error: 'Bu modül için yetkin yok' }, { status: 403 })
        }
      }

      await sql`DELETE FROM hotel_qr_modules WHERE id = ${target.moduleId}`
      return NextResponse.json({ ok: true })
    }

    if (action === 'deleteHotel') {
      if (!bootstrapAuthorized && authUser?.role !== 'platform_admin') {
        return NextResponse.json({ error: 'Bu işlem için platform_admin gerekli' }, { status: 403 })
      }

      const hotelCode = normalizeHotelCode(body.hotelCode)
      if (!hotelCode) {
        return NextResponse.json({ error: 'Geçerli hotelCode gerekli' }, { status: 400 })
      }

      const hotelRows = await sql`
        SELECT id FROM hotel_tenants
        WHERE code = ${hotelCode}
        LIMIT 1
      `

      if (hotelRows.length === 0) {
        return NextResponse.json({ error: 'Otel bulunamadı' }, { status: 404 })
      }

      await sql`DELETE FROM hotel_tenants WHERE id = ${hotelRows[0].id}`
      return NextResponse.json({ ok: true })
    }

    if (action === 'listOperations') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const statusFilter = normalizeOperationStatus(body.status) || ''
      const departmentFilter = normalizeDepartment(body.department)
      const priorityFilter = normalizePriority(body.priority)
      const safeLimit = Number.isFinite(Number(body.limit)) ? Math.max(20, Math.min(Number(body.limit), 400)) : 120

      const hotelCode = authUser?.role === 'hotel_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode
      if (!hotelCode) {
        return NextResponse.json({ error: 'Geçerli hotelCode gerekli' }, { status: 400 })
      }

      const roomOrders = await sql`
        SELECT o.id, o.room_no, o.floor_label, o.source_tag, o.guest_name, o.lang, o.items_json, o.notes, o.voice_note_url, o.status, o.whatsapp_delivery, o.created_at,
               h.code AS hotel_code, m.slug AS module_slug, m.title AS module_title
        FROM hotel_room_orders o
        JOIN hotel_tenants h ON h.id = o.hotel_id
        LEFT JOIN hotel_qr_modules m ON m.id = o.module_id
        WHERE h.code = ${hotelCode}
          AND (${statusFilter} = '' OR o.status = ${statusFilter})
        ORDER BY o.created_at DESC
        LIMIT ${safeLimit}
      `

      const serviceTickets = await sql`
        SELECT t.id, t.room_no, t.floor_label, t.source_tag, t.guest_name, t.contact_phone, t.requested_time, t.lang, t.department, t.category, t.priority,
           t.details, t.voice_note_url, t.status, t.whatsapp_delivery, t.created_at,
               h.code AS hotel_code, m.slug AS module_slug, m.title AS module_title
        FROM hotel_service_tickets t
        JOIN hotel_tenants h ON h.id = t.hotel_id
        LEFT JOIN hotel_qr_modules m ON m.id = t.module_id
        WHERE h.code = ${hotelCode}
          AND (${statusFilter} = '' OR t.status = ${statusFilter})
          AND (${departmentFilter} = '' OR t.department = ${departmentFilter})
          AND (${priorityFilter} = '' OR t.priority = ${priorityFilter})
        ORDER BY t.created_at DESC
        LIMIT ${safeLimit}
      `

      return NextResponse.json({ roomOrders, serviceTickets, hotelCode })
    }

    if (action === 'updateOperationStatus') {
      const operationType = normalizeOperationType(body.operationType)
      const operationId = String(body.operationId || '').trim()
      const nextStatus = normalizeOperationStatus(body.status)

      if (!operationType || !operationId || !nextStatus) {
        return NextResponse.json({ error: 'operationType, operationId ve geçerli status gerekli' }, { status: 400 })
      }

      if (operationType === 'room_order') {
        const rows = await sql`
          SELECT o.id, h.code AS hotel_code
          FROM hotel_room_orders o
          JOIN hotel_tenants h ON h.id = o.hotel_id
          WHERE o.id = ${operationId}
          LIMIT 1
        `

        if (rows.length === 0) {
          return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
        }

        const hotelCode = String(rows[0].hotel_code || '')
        if (!bootstrapAuthorized) {
          if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
            return NextResponse.json({ error: 'Bu kayıt için yetkin yok' }, { status: 403 })
          }
        }

        await sql`
          UPDATE hotel_room_orders
          SET status = ${nextStatus}, updated_at = NOW()
          WHERE id = ${operationId}
        `

        return NextResponse.json({ ok: true })
      }

      const rows = await sql`
        SELECT t.id, h.code AS hotel_code
        FROM hotel_service_tickets t
        JOIN hotel_tenants h ON h.id = t.hotel_id
        WHERE t.id = ${operationId}
        LIMIT 1
      `

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Ticket bulunamadı' }, { status: 404 })
      }

      const hotelCode = String(rows[0].hotel_code || '')
      if (!bootstrapAuthorized) {
        if (!authUser || !canManageHotel(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu kayıt için yetkin yok' }, { status: 403 })
        }
      }

      await sql`
        UPDATE hotel_service_tickets
        SET status = ${nextStatus}, updated_at = NOW()
        WHERE id = ${operationId}
      `

      return NextResponse.json({ ok: true })
    }

    if (action === 'listEducationReports') {
      const requestedHotelCode = normalizeHotelCode(body.hotelCode)
      const hotelCode = authUser?.role === 'education_admin' && authUser.hotelCode ? authUser.hotelCode : requestedHotelCode

      if (!hotelCode) {
        return NextResponse.json({ error: 'Geçerli okul kodu gerekli' }, { status: 400 })
      }

      if (!bootstrapAuthorized) {
        if (!authUser || !canManageEducation(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu okul için yetkin yok' }, { status: 403 })
        }
      }

      const quizByStudent = await sql`
        SELECT student_no, student_name,
               COUNT(*)::int AS submission_count,
               COALESCE(ROUND(AVG(CASE WHEN total_questions > 0 THEN (score::numeric / total_questions::numeric) * 100 ELSE 0 END), 2), 0) AS avg_score
        FROM education_quiz_submissions q
        JOIN hotel_tenants h ON h.id = q.hotel_id
        WHERE h.code = ${hotelCode}
          AND h.tenant_kind = 'school'
        GROUP BY student_no, student_name
        ORDER BY submission_count DESC, avg_score DESC
        LIMIT 500
      `

      const attendanceByStudent = await sql`
        SELECT student_no, student_name,
               COUNT(*)::int AS attendance_count,
               COUNT(*) FILTER (WHERE entry_status = 'late')::int AS late_count,
               COUNT(*) FILTER (WHERE entry_status = 'early_leave')::int AS early_leave_count
        FROM education_attendance_logs a
        JOIN hotel_tenants h ON h.id = a.hotel_id
        WHERE h.code = ${hotelCode}
          AND h.tenant_kind = 'school'
        GROUP BY student_no, student_name
        ORDER BY attendance_count DESC, student_name ASC
        LIMIT 500
      `

      const supportTickets = await sql`
        SELECT s.id, s.requester_name, s.requester_role, s.department, s.category, s.priority, s.status, s.created_at
        FROM education_support_tickets s
        JOIN hotel_tenants h ON h.id = s.hotel_id
        WHERE h.code = ${hotelCode}
          AND h.tenant_kind = 'school'
        ORDER BY s.created_at DESC
        LIMIT 300
      `

      const meetings = await sql`
        SELECT m.id, m.student_no, m.student_name, m.parent_name, m.teacher_key, m.requested_time, m.status, m.created_at
        FROM education_parent_teacher_meetings m
        JOIN hotel_tenants h ON h.id = m.hotel_id
        WHERE h.code = ${hotelCode}
          AND h.tenant_kind = 'school'
        ORDER BY m.created_at DESC
        LIMIT 300
      `

      const announcementResponses = await sql`
        SELECT a.id, a.class_code, a.branch_code, a.student_no, a.student_name, a.parent_name, a.event_response,
               a.needs_approval, a.approval_status, a.notes, a.created_at
        FROM education_announcement_responses a
        JOIN hotel_tenants h ON h.id = a.hotel_id
        WHERE h.code = ${hotelCode}
          AND h.tenant_kind = 'school'
        ORDER BY a.created_at DESC
        LIMIT 300
      `

      return NextResponse.json({ hotelCode, quizByStudent, attendanceByStudent, supportTickets, meetings, announcementResponses })
    }

    if (action === 'updateEducationAnnouncementApproval') {
      const responseId = String(body.responseId || '').trim()
      const approvalStatus = normalizeAnnouncementApprovalStatus(body.approvalStatus)

      if (!responseId || !approvalStatus) {
        return NextResponse.json({ error: 'responseId ve approvalStatus gerekli' }, { status: 400 })
      }

      const targetRows = await sql`
        SELECT a.id, h.code AS hotel_code
        FROM education_announcement_responses a
        JOIN hotel_tenants h ON h.id = a.hotel_id
        WHERE a.id = ${responseId}
          AND h.tenant_kind = 'school'
        LIMIT 1
      `

      if (targetRows.length === 0) {
        return NextResponse.json({ error: 'Duyuru yanıtı bulunamadı' }, { status: 404 })
      }

      const hotelCode = String(targetRows[0].hotel_code || '')
      if (!bootstrapAuthorized) {
        if (!authUser || !canManageEducation(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu okul için yetkin yok' }, { status: 403 })
        }
      }

      await sql`
        UPDATE education_announcement_responses
        SET approval_status = ${approvalStatus}
        WHERE id = ${responseId}
      `

      return NextResponse.json({ ok: true })
    }

    if (action === 'updateEducationMeeting') {
      const meetingId = String(body.meetingId || '').trim()
      const status = normalizeEducationWorkflowStatus(body.status)
      const meetingNotes = String(body.meetingNotes || '').trim().slice(0, 1200)

      if (!meetingId || !status) {
        return NextResponse.json({ error: 'meetingId ve status gerekli' }, { status: 400 })
      }

      const targetRows = await sql`
        SELECT m.id, h.code AS hotel_code
        FROM education_parent_teacher_meetings m
        JOIN hotel_tenants h ON h.id = m.hotel_id
        WHERE m.id = ${meetingId}
          AND h.tenant_kind = 'school'
        LIMIT 1
      `

      if (targetRows.length === 0) {
        return NextResponse.json({ error: 'Görüşme kaydı bulunamadı' }, { status: 404 })
      }

      const hotelCode = String(targetRows[0].hotel_code || '')
      if (!bootstrapAuthorized) {
        if (!authUser || !canManageEducation(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu okul için yetkin yok' }, { status: 403 })
        }
      }

      await sql`
        UPDATE education_parent_teacher_meetings
        SET status = ${status},
            meeting_notes = ${meetingNotes},
            updated_at = NOW()
        WHERE id = ${meetingId}
      `

      return NextResponse.json({ ok: true })
    }

    if (action === 'updateEducationSupportTicket') {
      const ticketId = String(body.ticketId || '').trim()
      const status = normalizeEducationWorkflowStatus(body.status)
      const priority = normalizePriority(body.priority) || 'normal'
      const departmentRaw = String(body.department || '').trim().toLowerCase()
      const department = departmentRaw === 'technical' || departmentRaw === 'administrative' ? departmentRaw : null

      if (!ticketId || !status || !department) {
        return NextResponse.json({ error: 'ticketId, status, department gerekli' }, { status: 400 })
      }

      const targetRows = await sql`
        SELECT s.id, h.code AS hotel_code
        FROM education_support_tickets s
        JOIN hotel_tenants h ON h.id = s.hotel_id
        WHERE s.id = ${ticketId}
          AND h.tenant_kind = 'school'
        LIMIT 1
      `

      if (targetRows.length === 0) {
        return NextResponse.json({ error: 'Destek kaydı bulunamadı' }, { status: 404 })
      }

      const hotelCode = String(targetRows[0].hotel_code || '')
      if (!bootstrapAuthorized) {
        if (!authUser || !canManageEducation(authUser.role, authUser.hotelCode, hotelCode)) {
          return NextResponse.json({ error: 'Bu okul için yetkin yok' }, { status: 403 })
        }
      }

      await sql`
        UPDATE education_support_tickets
        SET status = ${status},
            priority = ${priority},
            department = ${department},
            updated_at = NOW()
        WHERE id = ${ticketId}
      `

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 })
  } catch (err) {
    console.error('[hotel/admin]', err)
    if (err instanceof Error && err.message === 'SCHOOL_NOT_FOUND') {
      return NextResponse.json({ error: 'Okul bulunamadı' }, { status: 404 })
    }
    if (err instanceof Error && err.message === 'HOTEL_NOT_FOUND') {
      return NextResponse.json({ error: 'Otel bulunamadı' }, { status: 404 })
    }
    if (err instanceof Error && err.message === 'SLUG_COLLISION') {
      return NextResponse.json({ error: 'Modül slug üretilemedi, tekrar dene' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
