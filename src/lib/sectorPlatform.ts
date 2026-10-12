import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, normalizeEmail, verifyPassword } from '@/lib/auth'
import { ensureQrSchema, sql } from '@/lib/db'
import { findAdminRealmByEmail, realmLoginPath } from '@/lib/adminRealm'

export type SectorKey = 'health' | 'factory' | 'retail' | 'logistics'

export interface SectorAuthUser {
  id: string
  email: string
  role: 'platform_admin' | 'sector_admin' | 'staff'
  tenantId: string | null
  tenantCode: string | null
  isActive: boolean
}

const SECTOR_COOKIE_NAMES: Record<SectorKey, string> = {
  health: 'qrnote_health_auth',
  factory: 'qrnote_factory_auth',
  retail: 'qrnote_retail_auth',
  logistics: 'qrnote_logistics_auth',
}

const SESSION_TTL_DAYS = 14
let sectorAutoUpgradePromise: Promise<void> | null = null

export function normalizeSector(input: string): SectorKey | null {
  const value = String(input || '').trim().toLowerCase()
  if (value === 'health' || value === 'factory' || value === 'retail' || value === 'logistics') {
    return value
  }
  return null
}

export function getSectorCookieName(sector: SectorKey) {
  return SECTOR_COOKIE_NAMES[sector]
}

export function normalizeTenantCode(input: unknown) {
  return String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 24)
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function normalizeRole(input: unknown): SectorAuthUser['role'] | null {
  const value = String(input || '').trim().toLowerCase()
  if (value === 'platform_admin' || value === 'sector_admin' || value === 'staff') {
    return value
  }
  return null
}

function normalizeModuleSlug(input: unknown) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 24)
}

function normalizeModuleType(input: unknown) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 32)
}

function normalizeTitle(input: unknown) {
  return String(input || '').trim().slice(0, 160)
}

function normalizePositiveInt(input: unknown, fallback: number, min: number, max: number) {
  const value = Number(input)
  if (!Number.isFinite(value)) return fallback
  const intValue = Math.floor(value)
  if (intValue < min) return min
  if (intValue > max) return max
  return intValue
}

function normalizeScannerId(input: unknown) {
  return String(input || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40)
}

function normalizeLineCode(input: unknown) {
  return String(input || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40)
}

function normalizeIpAddress(input: unknown) {
  return String(input || '').trim().replace(/[^0-9.:a-zA-Z-]/g, '').slice(0, 80)
}

function normalizeRtspUrl(input: unknown) {
  return String(input || '').trim().slice(0, 400)
}

function normalizeCameraName(input: unknown) {
  return String(input || '').trim().slice(0, 120)
}

function normalizeConfidence(input: unknown) {
  const value = Number(input)
  if (!Number.isFinite(value)) return null
  if (value < 0 || value > 1) return null
  return Math.round(value * 1000) / 1000
}

function normalizeRoleForCreation(input: unknown): 'sector_admin' | 'staff' | null {
  const role = normalizeRole(input)
  if (role === 'sector_admin' || role === 'staff') return role
  return null
}

function buildModuleSlug(sector: SectorKey, moduleType: string) {
  const prefix = `${sector.slice(0, 2)}${moduleType.slice(0, 3)}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`
}

function buildGlobalModuleConfig(sector: SectorKey, moduleType: string, title: string) {
  return {
    profile: 'global-ready-v1',
    sector,
    moduleType,
    title,
    capabilities: {
      multilingual: {
        enabled: true,
        defaultLocale: 'tr',
        locales: ['tr', 'en', 'de', 'es', 'ar'],
      },
      analytics: {
        enabled: true,
        liveDashboard: true,
        anomalyAlerts: true,
      },
      automation: {
        enabled: true,
        webhookEnabled: true,
        queueRetryPolicy: 'exponential',
      },
      security: {
        enabled: true,
        piiMasking: true,
        auditTrail: true,
        roleIsolation: true,
      },
      operations: {
        enabled: true,
        slaMinutes: 30,
        incidentSeverityLevels: ['low', 'normal', 'high', 'critical'],
      },
      aiAssistant: {
        enabled: true,
        suggestions: true,
        confidenceThreshold: 0.8,
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

function parseConfigJsonObject(input: unknown) {
  try {
    const parsed = JSON.parse(String(input || '{}'))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // noop
  }
  return {}
}

function mergeConfigJsonWithGlobalProfile(existingConfigJson: unknown, sector: SectorKey, moduleType: string, title: string) {
  const base = parseConfigJsonObject(existingConfigJson)
  const profile = buildGlobalModuleConfig(sector, moduleType, title)

  return JSON.stringify({
    ...base,
    profile: profile.profile,
    sector: profile.sector,
    moduleType: profile.moduleType,
    title: String(base.title || title || profile.title),
    capabilities: {
      ...profile.capabilities,
      ...((base.capabilities && typeof base.capabilities === 'object' && !Array.isArray(base.capabilities)) ? base.capabilities as Record<string, unknown> : {}),
    },
    innovationLab: {
      ...profile.innovationLab,
      ...((base.innovationLab && typeof base.innovationLab === 'object' && !Array.isArray(base.innovationLab)) ? base.innovationLab as Record<string, unknown> : {}),
    },
  })
}

async function ensureAllSectorModulesProUpgraded() {
  if (!sectorAutoUpgradePromise) {
    sectorAutoUpgradePromise = (async () => {
      await ensureQrSchema()

      const healthRows = await sql`SELECT id, module_type, title, config_json FROM health_modules`
      for (const row of healthRows) {
        const nextConfigJson = mergeConfigJsonWithGlobalProfile(row.config_json, 'health', String(row.module_type || ''), String(row.title || ''))
        await sql`UPDATE health_modules SET config_json = ${nextConfigJson}, updated_at = NOW() WHERE id = ${String(row.id || '')}`
      }

      const factoryRows = await sql`SELECT id, module_type, title, config_json FROM factory_modules`
      for (const row of factoryRows) {
        const nextConfigJson = mergeConfigJsonWithGlobalProfile(row.config_json, 'factory', String(row.module_type || ''), String(row.title || ''))
        await sql`UPDATE factory_modules SET config_json = ${nextConfigJson}, updated_at = NOW() WHERE id = ${String(row.id || '')}`
      }

      const retailRows = await sql`SELECT id, module_type, title, config_json FROM retail_modules`
      for (const row of retailRows) {
        const nextConfigJson = mergeConfigJsonWithGlobalProfile(row.config_json, 'retail', String(row.module_type || ''), String(row.title || ''))
        await sql`UPDATE retail_modules SET config_json = ${nextConfigJson}, updated_at = NOW() WHERE id = ${String(row.id || '')}`
      }

      const logisticsRows = await sql`SELECT id, module_type, title, config_json FROM logistics_modules`
      for (const row of logisticsRows) {
        const nextConfigJson = mergeConfigJsonWithGlobalProfile(row.config_json, 'logistics', String(row.module_type || ''), String(row.title || ''))
        await sql`UPDATE logistics_modules SET config_json = ${nextConfigJson}, updated_at = NOW() WHERE id = ${String(row.id || '')}`
      }
    })()
  }

  await sectorAutoUpgradePromise
}

export function getSectorDefaultModules(sector: SectorKey) {
  if (sector === 'health') {
    return [
      { value: 'patient_info', label: 'Hasta Bilgilendirme QR', title: 'Hasta Bilgilendirme QR' },
      { value: 'clinic_navigation', label: 'Klinik Yönlendirme QR', title: 'Klinik Yönlendirme QR' },
      { value: 'device_instruction', label: 'Cihaz Kullanım Talimatı QR', title: 'Cihaz Talimat QR' },
    ]
  }
  if (sector === 'factory') {
    return [
      { value: 'safety_flow', label: 'İş Güvenliği Akışı QR', title: 'İş Güvenliği QR' },
      { value: 'device_instruction', label: 'Cihaz Talimat QR', title: 'Cihaz Talimat QR' },
      { value: 'maintenance_flow', label: 'Bakım Akışı QR', title: 'Bakım Akışı QR' },
      { value: 'conveyor_count', label: 'Bant Ürün Sayım QR', title: 'Bant Sayım QR' },
    ]
  }
  if (sector === 'retail') {
    return [
      { value: 'product_story', label: 'Ürün Hikayesi QR', title: 'Ürün Hikayesi QR' },
      { value: 'campaign_flow', label: 'Kampanya Akışı QR', title: 'Kampanya QR' },
      { value: 'customer_experience', label: 'Müşteri Deneyimi QR', title: 'Deneyim QR' },
      { value: 'conveyor_count', label: 'Bant Ürün Sayım QR', title: 'Bant Sayım QR' },
    ]
  }
  return [
    { value: 'warehouse_flow', label: 'Depo Akışı QR', title: 'Depo Akışı QR' },
    { value: 'shipment_flow', label: 'Sevkiyat Akışı QR', title: 'Sevkiyat Akışı QR' },
    { value: 'delivery_flow', label: 'Teslimat Akışı QR', title: 'Teslimat Akışı QR' },
    { value: 'conveyor_count', label: 'Bant Ürün Sayım QR', title: 'Bant Sayım QR' },
  ]
}

async function getSectorUserByEmail(sector: SectorKey, email: string) {
  await ensureQrSchema()
  const normalized = normalizeEmail(email)

  if (sector === 'health') {
    const rows = await sql`
      SELECT u.id, u.tenant_id, u.email, u.password_hash, u.role, u.is_active, t.code AS tenant_code
      FROM health_users u
      LEFT JOIN health_tenants t ON t.id = u.tenant_id
      WHERE u.email = ${normalized}
      LIMIT 1
    `
    return rows[0] || null
  }
  if (sector === 'factory') {
    const rows = await sql`
      SELECT u.id, u.tenant_id, u.email, u.password_hash, u.role, u.is_active, t.code AS tenant_code
      FROM factory_users u
      LEFT JOIN factory_tenants t ON t.id = u.tenant_id
      WHERE u.email = ${normalized}
      LIMIT 1
    `
    return rows[0] || null
  }
  if (sector === 'retail') {
    const rows = await sql`
      SELECT u.id, u.tenant_id, u.email, u.password_hash, u.role, u.is_active, t.code AS tenant_code
      FROM retail_users u
      LEFT JOIN retail_tenants t ON t.id = u.tenant_id
      WHERE u.email = ${normalized}
      LIMIT 1
    `
    return rows[0] || null
  }

  const rows = await sql`
    SELECT u.id, u.tenant_id, u.email, u.password_hash, u.role, u.is_active, t.code AS tenant_code
    FROM logistics_users u
    LEFT JOIN logistics_tenants t ON t.id = u.tenant_id
    WHERE u.email = ${normalized}
    LIMIT 1
  `
  return rows[0] || null
}

async function createSectorUserInternal(sector: SectorKey, input: {
  tenantId: string | null
  email: string
  password: string
  role: 'platform_admin' | 'sector_admin' | 'staff'
}) {
  const normalized = normalizeEmail(input.email)
  const passwordHash = hashPassword(input.password)

  if (sector === 'health') {
    const rows = await sql`
      INSERT INTO health_users (tenant_id, email, password_hash, role, is_active)
      VALUES (${input.tenantId}, ${normalized}, ${passwordHash}, ${input.role}, TRUE)
      RETURNING id
    `
    return rows[0]
  }
  if (sector === 'factory') {
    const rows = await sql`
      INSERT INTO factory_users (tenant_id, email, password_hash, role, is_active)
      VALUES (${input.tenantId}, ${normalized}, ${passwordHash}, ${input.role}, TRUE)
      RETURNING id
    `
    return rows[0]
  }
  if (sector === 'retail') {
    const rows = await sql`
      INSERT INTO retail_users (tenant_id, email, password_hash, role, is_active)
      VALUES (${input.tenantId}, ${normalized}, ${passwordHash}, ${input.role}, TRUE)
      RETURNING id
    `
    return rows[0]
  }

  const rows = await sql`
    INSERT INTO logistics_users (tenant_id, email, password_hash, role, is_active)
    VALUES (${input.tenantId}, ${normalized}, ${passwordHash}, ${input.role}, TRUE)
    RETURNING id
  `
  return rows[0]
}

function toAuthUser(row: Record<string, unknown>): SectorAuthUser {
  return {
    id: String(row.id || ''),
    email: String(row.email || ''),
    role: (normalizeRole(row.role) || 'staff') as SectorAuthUser['role'],
    tenantId: row.tenant_id ? String(row.tenant_id) : null,
    tenantCode: row.tenant_code ? String(row.tenant_code) : null,
    isActive: Boolean(row.is_active),
  }
}

export async function authenticateSectorCredentials(sector: SectorKey, email: string, password: string) {
  const row = await getSectorUserByEmail(sector, email)
  if (!row || !Boolean(row.is_active)) return null
  if (!verifyPassword(password, String(row.password_hash || ''))) return null
  return toAuthUser(row)
}

export async function createSectorSession(sector: SectorKey, userId: string) {
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  if (sector === 'health') {
    await sql`INSERT INTO health_sessions (token_hash, health_user_id, expires_at) VALUES (${tokenHash}, ${userId}, ${expiresAt})`
  } else if (sector === 'factory') {
    await sql`INSERT INTO factory_sessions (token_hash, factory_user_id, expires_at) VALUES (${tokenHash}, ${userId}, ${expiresAt})`
  } else if (sector === 'retail') {
    await sql`INSERT INTO retail_sessions (token_hash, retail_user_id, expires_at) VALUES (${tokenHash}, ${userId}, ${expiresAt})`
  } else {
    await sql`INSERT INTO logistics_sessions (token_hash, logistics_user_id, expires_at) VALUES (${tokenHash}, ${userId}, ${expiresAt})`
  }

  return token
}

export function applySectorAuthCookie(res: NextResponse, sector: SectorKey, token: string) {
  const isSecureCookie = process.env.NODE_ENV === 'production'
  res.cookies.set(getSectorCookieName(sector), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie,
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  })
  return res
}

export function clearSectorAuthCookie(res: NextResponse, sector: SectorKey) {
  const isSecureCookie = process.env.NODE_ENV === 'production'
  res.cookies.set(getSectorCookieName(sector), '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie,
    path: '/',
    maxAge: 0,
  })
  return res
}

export async function deleteSectorSession(sector: SectorKey, token: string | undefined) {
  if (!token) return
  const tokenHash = hashToken(token)

  if (sector === 'health') {
    await sql`DELETE FROM health_sessions WHERE token_hash = ${tokenHash}`
  } else if (sector === 'factory') {
    await sql`DELETE FROM factory_sessions WHERE token_hash = ${tokenHash}`
  } else if (sector === 'retail') {
    await sql`DELETE FROM retail_sessions WHERE token_hash = ${tokenHash}`
  } else {
    await sql`DELETE FROM logistics_sessions WHERE token_hash = ${tokenHash}`
  }
}

export async function getAuthenticatedSectorUser(req: NextRequest, sector: SectorKey) {
  await ensureQrSchema()
  const token = req.cookies.get(getSectorCookieName(sector))?.value?.trim()
  if (!token) return null
  const tokenHash = hashToken(token)

  let rows: Record<string, unknown>[] = []
  if (sector === 'health') {
    rows = await sql`
      SELECT u.id, u.tenant_id, u.email, u.role, u.is_active, t.code AS tenant_code
      FROM health_sessions s
      JOIN health_users u ON u.id = s.health_user_id
      LEFT JOIN health_tenants t ON t.id = u.tenant_id
      WHERE s.token_hash = ${tokenHash}
        AND s.expires_at > NOW()
        AND u.is_active = TRUE
      LIMIT 1
    `
  } else if (sector === 'factory') {
    rows = await sql`
      SELECT u.id, u.tenant_id, u.email, u.role, u.is_active, t.code AS tenant_code
      FROM factory_sessions s
      JOIN factory_users u ON u.id = s.factory_user_id
      LEFT JOIN factory_tenants t ON t.id = u.tenant_id
      WHERE s.token_hash = ${tokenHash}
        AND s.expires_at > NOW()
        AND u.is_active = TRUE
      LIMIT 1
    `
  } else if (sector === 'retail') {
    rows = await sql`
      SELECT u.id, u.tenant_id, u.email, u.role, u.is_active, t.code AS tenant_code
      FROM retail_sessions s
      JOIN retail_users u ON u.id = s.retail_user_id
      LEFT JOIN retail_tenants t ON t.id = u.tenant_id
      WHERE s.token_hash = ${tokenHash}
        AND s.expires_at > NOW()
        AND u.is_active = TRUE
      LIMIT 1
    `
  } else {
    rows = await sql`
      SELECT u.id, u.tenant_id, u.email, u.role, u.is_active, t.code AS tenant_code
      FROM logistics_sessions s
      JOIN logistics_users u ON u.id = s.logistics_user_id
      LEFT JOIN logistics_tenants t ON t.id = u.tenant_id
      WHERE s.token_hash = ${tokenHash}
        AND s.expires_at > NOW()
        AND u.is_active = TRUE
      LIMIT 1
    `
  }

  if (rows.length === 0) return null
  return toAuthUser(rows[0])
}

function isAdminAuthorized(password: string) {
  const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
  return Boolean(password && configuredPassword && password === configuredPassword)
}

function canManageSector(user: SectorAuthUser | null, tenantCode: string) {
  if (!user) return false
  if (user.role === 'platform_admin') return true
  return user.role === 'sector_admin' && Boolean(user.tenantCode && user.tenantCode === tenantCode)
}

export async function sectorAdminAction(req: NextRequest, sector: SectorKey) {
  await ensureQrSchema()
  await ensureAllSectorModulesProUpgraded()
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '').trim()
  const password = String(body.password || '').trim()
  const user = await getAuthenticatedSectorUser(req, sector)
  const bootstrapAuthorized = isAdminAuthorized(password)

  if (!user && !bootstrapAuthorized) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }

  if (action === 'list') {
    const tenantCode = user?.role === 'sector_admin' && user.tenantCode ? user.tenantCode : ''

    let tenants: Record<string, unknown>[] = []
    let modules: Record<string, unknown>[] = []
    let cameras: Record<string, unknown>[] = []

    if (sector === 'health') {
      tenants = tenantCode
        ? await sql`SELECT id, code, name, is_active, created_at FROM health_tenants WHERE code = ${tenantCode} ORDER BY created_at DESC LIMIT 200`
        : await sql`SELECT id, code, name, is_active, created_at FROM health_tenants ORDER BY created_at DESC LIMIT 200`
      modules = tenantCode
        ? await sql`SELECT m.id, m.tenant_id, m.slug, m.module_type, m.title, m.config_json, t.code AS tenant_code FROM health_modules m JOIN health_tenants t ON t.id = m.tenant_id WHERE t.code = ${tenantCode} ORDER BY m.created_at DESC LIMIT 1000`
        : await sql`SELECT m.id, m.tenant_id, m.slug, m.module_type, m.title, m.config_json, t.code AS tenant_code FROM health_modules m JOIN health_tenants t ON t.id = m.tenant_id ORDER BY m.created_at DESC LIMIT 1000`
    } else if (sector === 'factory') {
      tenants = tenantCode
        ? await sql`SELECT id, code, name, is_active, created_at FROM factory_tenants WHERE code = ${tenantCode} ORDER BY created_at DESC LIMIT 200`
        : await sql`SELECT id, code, name, is_active, created_at FROM factory_tenants ORDER BY created_at DESC LIMIT 200`
      modules = tenantCode
        ? await sql`SELECT m.id, m.tenant_id, m.slug, m.module_type, m.title, m.config_json, t.code AS tenant_code FROM factory_modules m JOIN factory_tenants t ON t.id = m.tenant_id WHERE t.code = ${tenantCode} ORDER BY m.created_at DESC LIMIT 1000`
        : await sql`SELECT m.id, m.tenant_id, m.slug, m.module_type, m.title, m.config_json, t.code AS tenant_code FROM factory_modules m JOIN factory_tenants t ON t.id = m.tenant_id ORDER BY m.created_at DESC LIMIT 1000`
      cameras = tenantCode
        ? await sql`SELECT c.id, c.scanner_id, c.line_code, c.camera_name, c.ip_address, c.rtsp_url, c.is_active, c.last_tested_at, c.last_test_status, c.last_test_note, t.code AS tenant_code FROM factory_cameras c JOIN factory_tenants t ON t.id = c.tenant_id WHERE t.code = ${tenantCode} ORDER BY c.created_at DESC LIMIT 500`
        : await sql`SELECT c.id, c.scanner_id, c.line_code, c.camera_name, c.ip_address, c.rtsp_url, c.is_active, c.last_tested_at, c.last_test_status, c.last_test_note, t.code AS tenant_code FROM factory_cameras c JOIN factory_tenants t ON t.id = c.tenant_id ORDER BY c.created_at DESC LIMIT 500`
    } else if (sector === 'retail') {
      tenants = tenantCode
        ? await sql`SELECT id, code, name, is_active, created_at FROM retail_tenants WHERE code = ${tenantCode} ORDER BY created_at DESC LIMIT 200`
        : await sql`SELECT id, code, name, is_active, created_at FROM retail_tenants ORDER BY created_at DESC LIMIT 200`
      modules = tenantCode
        ? await sql`SELECT m.id, m.tenant_id, m.slug, m.module_type, m.title, m.config_json, t.code AS tenant_code FROM retail_modules m JOIN retail_tenants t ON t.id = m.tenant_id WHERE t.code = ${tenantCode} ORDER BY m.created_at DESC LIMIT 1000`
        : await sql`SELECT m.id, m.tenant_id, m.slug, m.module_type, m.title, m.config_json, t.code AS tenant_code FROM retail_modules m JOIN retail_tenants t ON t.id = m.tenant_id ORDER BY m.created_at DESC LIMIT 1000`
      cameras = tenantCode
        ? await sql`SELECT c.id, c.scanner_id, c.line_code, c.camera_name, c.ip_address, c.rtsp_url, c.is_active, c.last_tested_at, c.last_test_status, c.last_test_note, t.code AS tenant_code FROM retail_cameras c JOIN retail_tenants t ON t.id = c.tenant_id WHERE t.code = ${tenantCode} ORDER BY c.created_at DESC LIMIT 500`
        : await sql`SELECT c.id, c.scanner_id, c.line_code, c.camera_name, c.ip_address, c.rtsp_url, c.is_active, c.last_tested_at, c.last_test_status, c.last_test_note, t.code AS tenant_code FROM retail_cameras c JOIN retail_tenants t ON t.id = c.tenant_id ORDER BY c.created_at DESC LIMIT 500`
    } else {
      tenants = tenantCode
        ? await sql`SELECT id, code, name, is_active, created_at FROM logistics_tenants WHERE code = ${tenantCode} ORDER BY created_at DESC LIMIT 200`
        : await sql`SELECT id, code, name, is_active, created_at FROM logistics_tenants ORDER BY created_at DESC LIMIT 200`
      modules = tenantCode
        ? await sql`SELECT m.id, m.tenant_id, m.slug, m.module_type, m.title, m.config_json, t.code AS tenant_code FROM logistics_modules m JOIN logistics_tenants t ON t.id = m.tenant_id WHERE t.code = ${tenantCode} ORDER BY m.created_at DESC LIMIT 1000`
        : await sql`SELECT m.id, m.tenant_id, m.slug, m.module_type, m.title, m.config_json, t.code AS tenant_code FROM logistics_modules m JOIN logistics_tenants t ON t.id = m.tenant_id ORDER BY m.created_at DESC LIMIT 1000`
      cameras = tenantCode
        ? await sql`SELECT c.id, c.scanner_id, c.line_code, c.camera_name, c.ip_address, c.rtsp_url, c.is_active, c.last_tested_at, c.last_test_status, c.last_test_note, t.code AS tenant_code FROM logistics_cameras c JOIN logistics_tenants t ON t.id = c.tenant_id WHERE t.code = ${tenantCode} ORDER BY c.created_at DESC LIMIT 500`
        : await sql`SELECT c.id, c.scanner_id, c.line_code, c.camera_name, c.ip_address, c.rtsp_url, c.is_active, c.last_tested_at, c.last_test_status, c.last_test_note, t.code AS tenant_code FROM logistics_cameras c JOIN logistics_tenants t ON t.id = c.tenant_id ORDER BY c.created_at DESC LIMIT 500`
    }

    return NextResponse.json({ tenants, modules, cameras })
  }

  if (action === 'createCamera') {
    if (sector !== 'factory' && sector !== 'retail' && sector !== 'logistics') {
      return NextResponse.json({ error: 'Kamera yonetimi bu sektorde aktif degil' }, { status: 400 })
    }

    const tenantCode = normalizeTenantCode(body.tenantCode)
    const scannerId = normalizeScannerId(body.scannerId)
    const lineCode = normalizeLineCode(body.lineCode)
    const cameraName = normalizeCameraName(body.cameraName)
    const ipAddress = normalizeIpAddress(body.ipAddress)
    const rtspUrl = normalizeRtspUrl(body.rtspUrl)

    if (!tenantCode || !scannerId || !lineCode) {
      return NextResponse.json({ error: 'tenantCode, scannerId ve lineCode gerekli' }, { status: 400 })
    }

    if (!bootstrapAuthorized) {
      if (!canManageSector(user, tenantCode)) {
        return NextResponse.json({ error: 'Bu kurum icin yetkin yok' }, { status: 403 })
      }
    }

    let tenantRows: Record<string, unknown>[] = []
    if (sector === 'factory') {
      tenantRows = await sql`SELECT id FROM factory_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    } else if (sector === 'retail') {
      tenantRows = await sql`SELECT id FROM retail_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    } else {
      tenantRows = await sql`SELECT id FROM logistics_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    }

    if (tenantRows.length === 0) {
      return NextResponse.json({ error: 'Kurum bulunamadi' }, { status: 404 })
    }

    const tenantId = String(tenantRows[0].id || '')
    let cameraRows: Record<string, unknown>[] = []
    if (sector === 'factory') {
      cameraRows = await sql`
        INSERT INTO factory_cameras (tenant_id, scanner_id, line_code, camera_name, ip_address, rtsp_url, is_active)
        VALUES (${tenantId}, ${scannerId}, ${lineCode}, ${cameraName}, ${ipAddress}, ${rtspUrl}, TRUE)
        ON CONFLICT (tenant_id, scanner_id)
        DO UPDATE SET line_code = EXCLUDED.line_code, camera_name = EXCLUDED.camera_name, ip_address = EXCLUDED.ip_address, rtsp_url = EXCLUDED.rtsp_url, is_active = TRUE, updated_at = NOW()
        RETURNING id
      `
    } else if (sector === 'retail') {
      cameraRows = await sql`
        INSERT INTO retail_cameras (tenant_id, scanner_id, line_code, camera_name, ip_address, rtsp_url, is_active)
        VALUES (${tenantId}, ${scannerId}, ${lineCode}, ${cameraName}, ${ipAddress}, ${rtspUrl}, TRUE)
        ON CONFLICT (tenant_id, scanner_id)
        DO UPDATE SET line_code = EXCLUDED.line_code, camera_name = EXCLUDED.camera_name, ip_address = EXCLUDED.ip_address, rtsp_url = EXCLUDED.rtsp_url, is_active = TRUE, updated_at = NOW()
        RETURNING id
      `
    } else {
      cameraRows = await sql`
        INSERT INTO logistics_cameras (tenant_id, scanner_id, line_code, camera_name, ip_address, rtsp_url, is_active)
        VALUES (${tenantId}, ${scannerId}, ${lineCode}, ${cameraName}, ${ipAddress}, ${rtspUrl}, TRUE)
        ON CONFLICT (tenant_id, scanner_id)
        DO UPDATE SET line_code = EXCLUDED.line_code, camera_name = EXCLUDED.camera_name, ip_address = EXCLUDED.ip_address, rtsp_url = EXCLUDED.rtsp_url, is_active = TRUE, updated_at = NOW()
        RETURNING id
      `
    }

    return NextResponse.json({ ok: true, cameraId: String(cameraRows[0]?.id || '') })
  }

  if (action === 'updateCamera') {
    if (sector !== 'factory' && sector !== 'retail' && sector !== 'logistics') {
      return NextResponse.json({ error: 'Kamera yonetimi bu sektorde aktif degil' }, { status: 400 })
    }

    const cameraId = String(body.cameraId || '').trim()
    if (!cameraId) {
      return NextResponse.json({ error: 'cameraId gerekli' }, { status: 400 })
    }

    let rows: Record<string, unknown>[] = []
    if (sector === 'factory') {
      rows = await sql`SELECT c.id, t.code AS tenant_code FROM factory_cameras c JOIN factory_tenants t ON t.id = c.tenant_id WHERE c.id = ${cameraId} LIMIT 1`
    } else if (sector === 'retail') {
      rows = await sql`SELECT c.id, t.code AS tenant_code FROM retail_cameras c JOIN retail_tenants t ON t.id = c.tenant_id WHERE c.id = ${cameraId} LIMIT 1`
    } else {
      rows = await sql`SELECT c.id, t.code AS tenant_code FROM logistics_cameras c JOIN logistics_tenants t ON t.id = c.tenant_id WHERE c.id = ${cameraId} LIMIT 1`
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Kamera bulunamadi' }, { status: 404 })
    }

    const tenantCode = String(rows[0].tenant_code || '')
    if (!bootstrapAuthorized) {
      if (!canManageSector(user, tenantCode)) {
        return NextResponse.json({ error: 'Bu kurum icin yetkin yok' }, { status: 403 })
      }
    }

    const lineCode = normalizeLineCode(body.lineCode)
    const cameraName = normalizeCameraName(body.cameraName)
    const ipAddress = normalizeIpAddress(body.ipAddress)
    const rtspUrl = normalizeRtspUrl(body.rtspUrl)
    const isActive = body.isActive === undefined ? null : Boolean(body.isActive)

    if (sector === 'factory') {
      await sql`
        UPDATE factory_cameras
        SET line_code = CASE WHEN ${lineCode} = '' THEN line_code ELSE ${lineCode} END,
            camera_name = CASE WHEN ${cameraName} = '' THEN camera_name ELSE ${cameraName} END,
            ip_address = CASE WHEN ${ipAddress} = '' THEN ip_address ELSE ${ipAddress} END,
            rtsp_url = CASE WHEN ${rtspUrl} = '' THEN rtsp_url ELSE ${rtspUrl} END,
            is_active = CASE WHEN ${isActive} IS NULL THEN is_active ELSE ${isActive} END,
            updated_at = NOW()
        WHERE id = ${cameraId}
      `
    } else if (sector === 'retail') {
      await sql`
        UPDATE retail_cameras
        SET line_code = CASE WHEN ${lineCode} = '' THEN line_code ELSE ${lineCode} END,
            camera_name = CASE WHEN ${cameraName} = '' THEN camera_name ELSE ${cameraName} END,
            ip_address = CASE WHEN ${ipAddress} = '' THEN ip_address ELSE ${ipAddress} END,
            rtsp_url = CASE WHEN ${rtspUrl} = '' THEN rtsp_url ELSE ${rtspUrl} END,
            is_active = CASE WHEN ${isActive} IS NULL THEN is_active ELSE ${isActive} END,
            updated_at = NOW()
        WHERE id = ${cameraId}
      `
    } else {
      await sql`
        UPDATE logistics_cameras
        SET line_code = CASE WHEN ${lineCode} = '' THEN line_code ELSE ${lineCode} END,
            camera_name = CASE WHEN ${cameraName} = '' THEN camera_name ELSE ${cameraName} END,
            ip_address = CASE WHEN ${ipAddress} = '' THEN ip_address ELSE ${ipAddress} END,
            rtsp_url = CASE WHEN ${rtspUrl} = '' THEN rtsp_url ELSE ${rtspUrl} END,
            is_active = CASE WHEN ${isActive} IS NULL THEN is_active ELSE ${isActive} END,
            updated_at = NOW()
        WHERE id = ${cameraId}
      `
    }

    return NextResponse.json({ ok: true })
  }

  if (action === 'testCamera') {
    if (sector !== 'factory' && sector !== 'retail' && sector !== 'logistics') {
      return NextResponse.json({ error: 'Kamera yonetimi bu sektorde aktif degil' }, { status: 400 })
    }

    const cameraId = String(body.cameraId || '').trim()
    if (!cameraId) {
      return NextResponse.json({ error: 'cameraId gerekli' }, { status: 400 })
    }

    let rows: Record<string, unknown>[] = []
    if (sector === 'factory') {
      rows = await sql`SELECT c.id, c.ip_address, c.rtsp_url, c.line_code, t.code AS tenant_code FROM factory_cameras c JOIN factory_tenants t ON t.id = c.tenant_id WHERE c.id = ${cameraId} LIMIT 1`
    } else if (sector === 'retail') {
      rows = await sql`SELECT c.id, c.ip_address, c.rtsp_url, c.line_code, t.code AS tenant_code FROM retail_cameras c JOIN retail_tenants t ON t.id = c.tenant_id WHERE c.id = ${cameraId} LIMIT 1`
    } else {
      rows = await sql`SELECT c.id, c.ip_address, c.rtsp_url, c.line_code, t.code AS tenant_code FROM logistics_cameras c JOIN logistics_tenants t ON t.id = c.tenant_id WHERE c.id = ${cameraId} LIMIT 1`
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Kamera bulunamadi' }, { status: 404 })
    }

    const tenantCode = String(rows[0].tenant_code || '')
    if (!bootstrapAuthorized) {
      if (!canManageSector(user, tenantCode)) {
        return NextResponse.json({ error: 'Bu kurum icin yetkin yok' }, { status: 403 })
      }
    }

    const ipAddress = String(rows[0].ip_address || '').trim()
    const rtspUrl = String(rows[0].rtsp_url || '').trim()
    const lineCode = String(rows[0].line_code || '').trim()
    const hasRtsp = /^rtsp:\/\//i.test(rtspUrl)
    const hasIp = ipAddress.length >= 7
    const hasLine = lineCode.length >= 2

    const status = hasRtsp && hasIp && hasLine ? 'ready' : 'config_missing'
    const note = hasRtsp && hasIp && hasLine
      ? 'Kamera endpoint konfigurasyonu tamam. Edge okuyucu serviste akisa baglayabilirsiniz.'
      : 'IP/RTSP/hat kodu eksik. Kamera testinin basarili olmasi icin bu alanlari tamamlayin.'

    if (sector === 'factory') {
      await sql`UPDATE factory_cameras SET last_tested_at = NOW(), last_test_status = ${status}, last_test_note = ${note}, updated_at = NOW() WHERE id = ${cameraId}`
    } else if (sector === 'retail') {
      await sql`UPDATE retail_cameras SET last_tested_at = NOW(), last_test_status = ${status}, last_test_note = ${note}, updated_at = NOW() WHERE id = ${cameraId}`
    } else {
      await sql`UPDATE logistics_cameras SET last_tested_at = NOW(), last_test_status = ${status}, last_test_note = ${note}, updated_at = NOW() WHERE id = ${cameraId}`
    }

    return NextResponse.json({ ok: true, status, note })
  }

  if (action === 'createTenant') {
    if (!bootstrapAuthorized && user?.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Bu işlem için platform_admin gerekli' }, { status: 403 })
    }

    const name = String(body.name || '').trim().slice(0, 140)
    const code = normalizeTenantCode(body.code)
    if (!name || code.length < 3) {
      return NextResponse.json({ error: 'Geçerli kurum adı ve kod gerekli' }, { status: 400 })
    }

    let rows: Record<string, unknown>[] = []
    if (sector === 'health') {
      rows = await sql`INSERT INTO health_tenants (name, code, is_active) VALUES (${name}, ${code}, TRUE) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW() RETURNING id, code, name`
    } else if (sector === 'factory') {
      rows = await sql`INSERT INTO factory_tenants (name, code, is_active) VALUES (${name}, ${code}, TRUE) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW() RETURNING id, code, name`
    } else if (sector === 'retail') {
      rows = await sql`INSERT INTO retail_tenants (name, code, is_active) VALUES (${name}, ${code}, TRUE) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW() RETURNING id, code, name`
    } else {
      rows = await sql`INSERT INTO logistics_tenants (name, code, is_active) VALUES (${name}, ${code}, TRUE) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW() RETURNING id, code, name`
    }

    return NextResponse.json({ tenant: rows[0] })
  }

  if (action === 'createUser') {
    if (!bootstrapAuthorized && user?.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Bu işlem için platform_admin gerekli' }, { status: 403 })
    }

    const tenantCode = normalizeTenantCode(body.tenantCode)
    const email = normalizeEmail(String(body.email || ''))
    const userPassword = String(body.userPassword || '')
    const role = normalizeRoleForCreation(body.role)

    if (!tenantCode || !email || userPassword.length < 6 || !role) {
      return NextResponse.json({ error: 'tenantCode, email, role ve en az 6 karakter şifre gerekli' }, { status: 400 })
    }

    const existing = await getSectorUserByEmail(sector, email)
    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı' }, { status: 409 })
    }

    const existingRealm = await findAdminRealmByEmail(email)
    if (existingRealm && existingRealm !== sector) {
      return NextResponse.json({ error: `Bu e-posta ${realmLoginPath(existingRealm)} panelinde kayıtlı.` }, { status: 409 })
    }

    let tenantRows: Record<string, unknown>[] = []
    if (sector === 'health') {
      tenantRows = await sql`SELECT id FROM health_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    } else if (sector === 'factory') {
      tenantRows = await sql`SELECT id FROM factory_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    } else if (sector === 'retail') {
      tenantRows = await sql`SELECT id FROM retail_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    } else {
      tenantRows = await sql`SELECT id FROM logistics_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    }

    if (tenantRows.length === 0) {
      return NextResponse.json({ error: 'Kurum bulunamadı' }, { status: 404 })
    }

    const created = await createSectorUserInternal(sector, {
      tenantId: String(tenantRows[0].id || ''),
      email,
      password: userPassword,
      role,
    })

    return NextResponse.json({ ok: true, userId: created.id })
  }

  if (action === 'createModule') {
    const tenantCode = normalizeTenantCode(body.tenantCode)
    const moduleType = normalizeModuleType(body.moduleType)
    const title = normalizeTitle(body.title)

    if (!tenantCode || !moduleType || !title) {
      return NextResponse.json({ error: 'tenantCode, moduleType ve title gerekli' }, { status: 400 })
    }

    if (!bootstrapAuthorized) {
      if (!canManageSector(user, tenantCode)) {
        return NextResponse.json({ error: 'Bu kurum için yetkin yok' }, { status: 403 })
      }
    }

    let tenantRows: Record<string, unknown>[] = []
    if (sector === 'health') {
      tenantRows = await sql`SELECT id, code FROM health_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    } else if (sector === 'factory') {
      tenantRows = await sql`SELECT id, code FROM factory_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    } else if (sector === 'retail') {
      tenantRows = await sql`SELECT id, code FROM retail_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    } else {
      tenantRows = await sql`SELECT id, code FROM logistics_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    }

    if (tenantRows.length === 0) {
      return NextResponse.json({ error: 'Kurum bulunamadı' }, { status: 404 })
    }

    let slug = buildModuleSlug(sector, moduleType)
    for (let i = 0; i < 5; i += 1) {
      let exists: Record<string, unknown>[] = []
      if (sector === 'health') {
        exists = await sql`SELECT id FROM health_modules WHERE slug = ${slug} LIMIT 1`
      } else if (sector === 'factory') {
        exists = await sql`SELECT id FROM factory_modules WHERE slug = ${slug} LIMIT 1`
      } else if (sector === 'retail') {
        exists = await sql`SELECT id FROM retail_modules WHERE slug = ${slug} LIMIT 1`
      } else {
        exists = await sql`SELECT id FROM logistics_modules WHERE slug = ${slug} LIMIT 1`
      }
      if (exists.length === 0) break
      slug = buildModuleSlug(sector, moduleType)
    }

    let moduleRows: Record<string, unknown>[] = []
    const moduleConfigJson = mergeConfigJsonWithGlobalProfile('{}', sector, moduleType, title)
    if (sector === 'health') {
      moduleRows = await sql`
        INSERT INTO health_modules (tenant_id, slug, module_type, title, config_json, is_active)
        VALUES (${String(tenantRows[0].id || '')}, ${slug}, ${moduleType}, ${title}, ${moduleConfigJson}, TRUE)
        RETURNING id, slug, module_type, title
      `
    } else if (sector === 'factory') {
      moduleRows = await sql`
        INSERT INTO factory_modules (tenant_id, slug, module_type, title, config_json, is_active)
        VALUES (${String(tenantRows[0].id || '')}, ${slug}, ${moduleType}, ${title}, ${moduleConfigJson}, TRUE)
        RETURNING id, slug, module_type, title
      `
    } else if (sector === 'retail') {
      moduleRows = await sql`
        INSERT INTO retail_modules (tenant_id, slug, module_type, title, config_json, is_active)
        VALUES (${String(tenantRows[0].id || '')}, ${slug}, ${moduleType}, ${title}, ${moduleConfigJson}, TRUE)
        RETURNING id, slug, module_type, title
      `
    } else {
      moduleRows = await sql`
        INSERT INTO logistics_modules (tenant_id, slug, module_type, title, config_json, is_active)
        VALUES (${String(tenantRows[0].id || '')}, ${slug}, ${moduleType}, ${title}, ${moduleConfigJson}, TRUE)
        RETURNING id, slug, module_type, title
      `
    }

    const baseUrl = req.nextUrl.origin
    return NextResponse.json({
      ok: true,
      module: moduleRows[0],
      publicUrl: `${baseUrl}/${sector}/q/${tenantCode}/${slug}`,
    })
  }

  if (action === 'deleteModule') {
    const tenantCode = normalizeTenantCode(body.tenantCode)
    const moduleSlug = normalizeModuleSlug(body.moduleSlug)

    if (!tenantCode || !moduleSlug) {
      return NextResponse.json({ error: 'tenantCode ve moduleSlug gerekli' }, { status: 400 })
    }

    if (!bootstrapAuthorized) {
      if (!canManageSector(user, tenantCode)) {
        return NextResponse.json({ error: 'Bu kurum için yetkin yok' }, { status: 403 })
      }
    }

    let deletedRows: Record<string, unknown>[] = []
    if (sector === 'health') {
      deletedRows = await sql`
        DELETE FROM health_modules m
        USING health_tenants t
        WHERE m.tenant_id = t.id
          AND t.code = ${tenantCode}
          AND m.slug = ${moduleSlug}
        RETURNING m.id
      `
    } else if (sector === 'factory') {
      deletedRows = await sql`
        DELETE FROM factory_modules m
        USING factory_tenants t
        WHERE m.tenant_id = t.id
          AND t.code = ${tenantCode}
          AND m.slug = ${moduleSlug}
        RETURNING m.id
      `
    } else if (sector === 'retail') {
      deletedRows = await sql`
        DELETE FROM retail_modules m
        USING retail_tenants t
        WHERE m.tenant_id = t.id
          AND t.code = ${tenantCode}
          AND m.slug = ${moduleSlug}
        RETURNING m.id
      `
    } else {
      deletedRows = await sql`
        DELETE FROM logistics_modules m
        USING logistics_tenants t
        WHERE m.tenant_id = t.id
          AND t.code = ${tenantCode}
          AND m.slug = ${moduleSlug}
        RETURNING m.id
      `
    }

    if (deletedRows.length === 0) {
      return NextResponse.json({ error: 'Silinecek modül bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  }

  if (action === 'recordCountEvent') {
    const tenantCode = normalizeTenantCode(body.tenantCode)
    const moduleSlug = normalizeModuleSlug(body.moduleSlug)
    const lineCode = String(body.lineCode || '').trim().slice(0, 40)
    const scannerId = String(body.scannerId || '').trim().slice(0, 40)
    const productQr = String(body.productQr || '').trim().slice(0, 120)
    const dedupSeconds = normalizePositiveInt(body.dedupSeconds, 2, 0, 30)
    const confidence = normalizeConfidence(body.confidence)
    const cameraFrameId = String(body.cameraFrameId || '').trim().slice(0, 80)

    if (!tenantCode || !lineCode || !productQr) {
      return NextResponse.json({ error: 'tenantCode, lineCode ve productQr gerekli' }, { status: 400 })
    }

    if (!bootstrapAuthorized) {
      if (!canManageSector(user, tenantCode)) {
        return NextResponse.json({ error: 'Bu kurum için yetkin yok' }, { status: 403 })
      }
    }

    let tenantRows: Record<string, unknown>[] = []
    if (sector === 'health') {
      tenantRows = await sql`SELECT id FROM health_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    } else if (sector === 'factory') {
      tenantRows = await sql`SELECT id FROM factory_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    } else if (sector === 'retail') {
      tenantRows = await sql`SELECT id FROM retail_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    } else {
      tenantRows = await sql`SELECT id FROM logistics_tenants WHERE code = ${tenantCode} AND is_active = TRUE LIMIT 1`
    }

    if (tenantRows.length === 0) {
      return NextResponse.json({ error: 'Kurum bulunamadı' }, { status: 404 })
    }

    const tenantId = String(tenantRows[0].id || '')
    let moduleId: string | null = null
    if (moduleSlug) {
      let moduleRows: Record<string, unknown>[] = []
      if (sector === 'health') {
        moduleRows = await sql`SELECT id FROM health_modules WHERE slug = ${moduleSlug} LIMIT 1`
      } else if (sector === 'factory') {
        moduleRows = await sql`SELECT id FROM factory_modules WHERE slug = ${moduleSlug} LIMIT 1`
      } else if (sector === 'retail') {
        moduleRows = await sql`SELECT id FROM retail_modules WHERE slug = ${moduleSlug} LIMIT 1`
      } else {
        moduleRows = await sql`SELECT id FROM logistics_modules WHERE slug = ${moduleSlug} LIMIT 1`
      }
      moduleId = moduleRows.length > 0 ? String(moduleRows[0].id || '') : null
    }

    if (dedupSeconds > 0) {
      let duplicateRows: Record<string, unknown>[] = []
      if (sector === 'health') {
        duplicateRows = await sql`
          SELECT id
          FROM health_count_events
          WHERE tenant_id = ${tenantId}
            AND line_code = ${lineCode}
            AND scanner_id = ${scannerId}
            AND product_qr = ${productQr}
            AND counted_at > NOW() - (${dedupSeconds} * INTERVAL '1 second')
          LIMIT 1
        `
      } else if (sector === 'factory') {
        duplicateRows = await sql`
          SELECT id
          FROM factory_count_events
          WHERE tenant_id = ${tenantId}
            AND line_code = ${lineCode}
            AND scanner_id = ${scannerId}
            AND product_qr = ${productQr}
            AND counted_at > NOW() - (${dedupSeconds} * INTERVAL '1 second')
          LIMIT 1
        `
      } else if (sector === 'retail') {
        duplicateRows = await sql`
          SELECT id
          FROM retail_count_events
          WHERE tenant_id = ${tenantId}
            AND line_code = ${lineCode}
            AND scanner_id = ${scannerId}
            AND product_qr = ${productQr}
            AND counted_at > NOW() - (${dedupSeconds} * INTERVAL '1 second')
          LIMIT 1
        `
      } else {
        duplicateRows = await sql`
          SELECT id
          FROM logistics_count_events
          WHERE tenant_id = ${tenantId}
            AND line_code = ${lineCode}
            AND scanner_id = ${scannerId}
            AND product_qr = ${productQr}
            AND counted_at > NOW() - (${dedupSeconds} * INTERVAL '1 second')
          LIMIT 1
        `
      }

      if (duplicateRows.length > 0) {
        return NextResponse.json({ ok: true, deduped: true, reason: 'duplicate_frame_window' })
      }
    }

    const metaJson = JSON.stringify({
      source: 'camera_qr_counter',
      confidence,
      cameraFrameId,
      dedupSeconds,
    })

    if (sector === 'health') {
      await sql`INSERT INTO health_count_events (tenant_id, module_id, line_code, scanner_id, product_qr, meta_json) VALUES (${tenantId}, ${moduleId}, ${lineCode}, ${scannerId}, ${productQr}, ${metaJson})`
    } else if (sector === 'factory') {
      await sql`INSERT INTO factory_count_events (tenant_id, module_id, line_code, scanner_id, product_qr, meta_json) VALUES (${tenantId}, ${moduleId}, ${lineCode}, ${scannerId}, ${productQr}, ${metaJson})`
    } else if (sector === 'retail') {
      await sql`INSERT INTO retail_count_events (tenant_id, module_id, line_code, scanner_id, product_qr, meta_json) VALUES (${tenantId}, ${moduleId}, ${lineCode}, ${scannerId}, ${productQr}, ${metaJson})`
    } else {
      await sql`INSERT INTO logistics_count_events (tenant_id, module_id, line_code, scanner_id, product_qr, meta_json) VALUES (${tenantId}, ${moduleId}, ${lineCode}, ${scannerId}, ${productQr}, ${metaJson})`
    }

    return NextResponse.json({ ok: true, deduped: false })
  }

  if (action === 'upgradeModulesToPro') {
    const tenantCode = normalizeTenantCode(body.tenantCode)
    if (!tenantCode) {
      return NextResponse.json({ error: 'tenantCode gerekli' }, { status: 400 })
    }

    if (!bootstrapAuthorized) {
      if (!canManageSector(user, tenantCode)) {
        return NextResponse.json({ error: 'Bu kurum için yetkin yok' }, { status: 403 })
      }
    }

    let moduleRows: Record<string, unknown>[] = []
    if (sector === 'health') {
      moduleRows = await sql`
        SELECT m.id, m.module_type, m.title, m.config_json
        FROM health_modules m
        JOIN health_tenants t ON t.id = m.tenant_id
        WHERE t.code = ${tenantCode}
      `
      for (const row of moduleRows) {
        const nextConfigJson = mergeConfigJsonWithGlobalProfile(row.config_json, sector, String(row.module_type || ''), String(row.title || ''))
        await sql`UPDATE health_modules SET config_json = ${nextConfigJson}, updated_at = NOW() WHERE id = ${String(row.id || '')}`
      }
    } else if (sector === 'factory') {
      moduleRows = await sql`
        SELECT m.id, m.module_type, m.title, m.config_json
        FROM factory_modules m
        JOIN factory_tenants t ON t.id = m.tenant_id
        WHERE t.code = ${tenantCode}
      `
      for (const row of moduleRows) {
        const nextConfigJson = mergeConfigJsonWithGlobalProfile(row.config_json, sector, String(row.module_type || ''), String(row.title || ''))
        await sql`UPDATE factory_modules SET config_json = ${nextConfigJson}, updated_at = NOW() WHERE id = ${String(row.id || '')}`
      }
    } else if (sector === 'retail') {
      moduleRows = await sql`
        SELECT m.id, m.module_type, m.title, m.config_json
        FROM retail_modules m
        JOIN retail_tenants t ON t.id = m.tenant_id
        WHERE t.code = ${tenantCode}
      `
      for (const row of moduleRows) {
        const nextConfigJson = mergeConfigJsonWithGlobalProfile(row.config_json, sector, String(row.module_type || ''), String(row.title || ''))
        await sql`UPDATE retail_modules SET config_json = ${nextConfigJson}, updated_at = NOW() WHERE id = ${String(row.id || '')}`
      }
    } else {
      moduleRows = await sql`
        SELECT m.id, m.module_type, m.title, m.config_json
        FROM logistics_modules m
        JOIN logistics_tenants t ON t.id = m.tenant_id
        WHERE t.code = ${tenantCode}
      `
      for (const row of moduleRows) {
        const nextConfigJson = mergeConfigJsonWithGlobalProfile(row.config_json, sector, String(row.module_type || ''), String(row.title || ''))
        await sql`UPDATE logistics_modules SET config_json = ${nextConfigJson}, updated_at = NOW() WHERE id = ${String(row.id || '')}`
      }
    }

    return NextResponse.json({ ok: true, updatedModules: moduleRows.length })
  }

  if (action === 'listCounts') {
    const tenantCode = normalizeTenantCode(body.tenantCode)
    const lineCodeFilter = String(body.lineCode || '').trim().slice(0, 40)
    const sinceHours = normalizePositiveInt(body.sinceHours, 24, 1, 168)
    if (!tenantCode) {
      return NextResponse.json({ error: 'tenantCode gerekli' }, { status: 400 })
    }

    if (!bootstrapAuthorized) {
      if (!canManageSector(user, tenantCode)) {
        return NextResponse.json({ error: 'Bu kurum için yetkin yok' }, { status: 403 })
      }
    }

    let rows: Record<string, unknown>[] = []
    if (sector === 'health') {
      rows = await sql`
        SELECT line_code, product_qr, COUNT(*)::int AS scan_count, MAX(counted_at) AS last_seen
        FROM health_count_events e
        JOIN health_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND (${lineCodeFilter} = '' OR e.line_code = ${lineCodeFilter})
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        GROUP BY line_code, product_qr
        ORDER BY scan_count DESC, last_seen DESC
        LIMIT 500
      `
    } else if (sector === 'factory') {
      rows = await sql`
        SELECT line_code, product_qr, COUNT(*)::int AS scan_count, MAX(counted_at) AS last_seen
        FROM factory_count_events e
        JOIN factory_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND (${lineCodeFilter} = '' OR e.line_code = ${lineCodeFilter})
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        GROUP BY line_code, product_qr
        ORDER BY scan_count DESC, last_seen DESC
        LIMIT 500
      `
    } else if (sector === 'retail') {
      rows = await sql`
        SELECT line_code, product_qr, COUNT(*)::int AS scan_count, MAX(counted_at) AS last_seen
        FROM retail_count_events e
        JOIN retail_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND (${lineCodeFilter} = '' OR e.line_code = ${lineCodeFilter})
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        GROUP BY line_code, product_qr
        ORDER BY scan_count DESC, last_seen DESC
        LIMIT 500
      `
    } else {
      rows = await sql`
        SELECT line_code, product_qr, COUNT(*)::int AS scan_count, MAX(counted_at) AS last_seen
        FROM logistics_count_events e
        JOIN logistics_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND (${lineCodeFilter} = '' OR e.line_code = ${lineCodeFilter})
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        GROUP BY line_code, product_qr
        ORDER BY scan_count DESC, last_seen DESC
        LIMIT 500
      `
    }

    return NextResponse.json({ counts: rows })
  }

  if (action === 'countDashboard') {
    const tenantCode = normalizeTenantCode(body.tenantCode)
    const sinceHours = normalizePositiveInt(body.sinceHours, 24, 1, 168)
    if (!tenantCode) {
      return NextResponse.json({ error: 'tenantCode gerekli' }, { status: 400 })
    }

    if (!bootstrapAuthorized) {
      if (!canManageSector(user, tenantCode)) {
        return NextResponse.json({ error: 'Bu kurum için yetkin yok' }, { status: 403 })
      }
    }

    let summaryRows: Record<string, unknown>[] = []
    let topLineRows: Record<string, unknown>[] = []
    let recentRows: Record<string, unknown>[] = []

    if (sector === 'health') {
      summaryRows = await sql`
        SELECT COUNT(*)::int AS total_scans,
               COUNT(DISTINCT e.product_qr)::int AS unique_products,
               COUNT(DISTINCT e.line_code)::int AS active_lines,
               MAX(e.counted_at) AS last_seen
        FROM health_count_events e
        JOIN health_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
      `
      topLineRows = await sql`
        SELECT e.line_code,
               COUNT(*)::int AS scan_count,
               COUNT(DISTINCT e.product_qr)::int AS unique_products
        FROM health_count_events e
        JOIN health_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        GROUP BY e.line_code
        ORDER BY scan_count DESC
        LIMIT 20
      `
      recentRows = await sql`
        SELECT e.line_code, e.scanner_id, e.product_qr, e.counted_at
        FROM health_count_events e
        JOIN health_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        ORDER BY e.counted_at DESC
        LIMIT 100
      `
    } else if (sector === 'factory') {
      summaryRows = await sql`
        SELECT COUNT(*)::int AS total_scans,
               COUNT(DISTINCT e.product_qr)::int AS unique_products,
               COUNT(DISTINCT e.line_code)::int AS active_lines,
               MAX(e.counted_at) AS last_seen
        FROM factory_count_events e
        JOIN factory_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
      `
      topLineRows = await sql`
        SELECT e.line_code,
               COUNT(*)::int AS scan_count,
               COUNT(DISTINCT e.product_qr)::int AS unique_products
        FROM factory_count_events e
        JOIN factory_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        GROUP BY e.line_code
        ORDER BY scan_count DESC
        LIMIT 20
      `
      recentRows = await sql`
        SELECT e.line_code, e.scanner_id, e.product_qr, e.counted_at
        FROM factory_count_events e
        JOIN factory_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        ORDER BY e.counted_at DESC
        LIMIT 100
      `
    } else if (sector === 'retail') {
      summaryRows = await sql`
        SELECT COUNT(*)::int AS total_scans,
               COUNT(DISTINCT e.product_qr)::int AS unique_products,
               COUNT(DISTINCT e.line_code)::int AS active_lines,
               MAX(e.counted_at) AS last_seen
        FROM retail_count_events e
        JOIN retail_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
      `
      topLineRows = await sql`
        SELECT e.line_code,
               COUNT(*)::int AS scan_count,
               COUNT(DISTINCT e.product_qr)::int AS unique_products
        FROM retail_count_events e
        JOIN retail_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        GROUP BY e.line_code
        ORDER BY scan_count DESC
        LIMIT 20
      `
      recentRows = await sql`
        SELECT e.line_code, e.scanner_id, e.product_qr, e.counted_at
        FROM retail_count_events e
        JOIN retail_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        ORDER BY e.counted_at DESC
        LIMIT 100
      `
    } else {
      summaryRows = await sql`
        SELECT COUNT(*)::int AS total_scans,
               COUNT(DISTINCT e.product_qr)::int AS unique_products,
               COUNT(DISTINCT e.line_code)::int AS active_lines,
               MAX(e.counted_at) AS last_seen
        FROM logistics_count_events e
        JOIN logistics_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
      `
      topLineRows = await sql`
        SELECT e.line_code,
               COUNT(*)::int AS scan_count,
               COUNT(DISTINCT e.product_qr)::int AS unique_products
        FROM logistics_count_events e
        JOIN logistics_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        GROUP BY e.line_code
        ORDER BY scan_count DESC
        LIMIT 20
      `
      recentRows = await sql`
        SELECT e.line_code, e.scanner_id, e.product_qr, e.counted_at
        FROM logistics_count_events e
        JOIN logistics_tenants t ON t.id = e.tenant_id
        WHERE t.code = ${tenantCode}
          AND e.counted_at > NOW() - (${sinceHours} * INTERVAL '1 hour')
        ORDER BY e.counted_at DESC
        LIMIT 100
      `
    }

    return NextResponse.json({
      summary: summaryRows[0] || {
        total_scans: 0,
        unique_products: 0,
        active_lines: 0,
        last_seen: null,
      },
      topLines: topLineRows,
      recentEvents: recentRows,
      sinceHours,
    })
  }

  return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 })
}

export async function createBootstrapPlatformAdminIfNeeded(sector: SectorKey, email: string, password: string, bootstrapPassword: string) {
  if (!isAdminAuthorized(bootstrapPassword)) {
    throw new Error('UNAUTHORIZED')
  }

  const existing = await getSectorUserByEmail(sector, email)
  if (existing) throw new Error('EMAIL_EXISTS')

  const created = await createSectorUserInternal(sector, {
    tenantId: null,
    email,
    password,
    role: 'platform_admin',
  })

  return String(created.id || '')
}
