import { NextRequest, NextResponse } from 'next/server'
import { ensureQrSchema, sql } from '@/lib/db'

type SectorKey = 'health' | 'factory' | 'retail' | 'logistics'

interface SectorOverview {
  sector: SectorKey
  tenantCount: number
  userCount: number
  moduleCount: number
  activeModuleCount: number
  formSubmissionCount: number
  countEventCount: number
}

interface SectorTopModule {
  sector: SectorKey
  tenantCode: string
  moduleSlug: string
  moduleType: string
  title: string
  submissions: number
  scans: number
}

function toInt(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.floor(parsed))
}

async function getSectorOverview(sector: SectorKey): Promise<SectorOverview> {
  if (sector === 'health') {
    const [tenantRows, userRows, moduleRows, submissionRows, countRows] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM health_tenants`,
      sql`SELECT COUNT(*)::int AS count FROM health_users`,
      sql`SELECT COUNT(*)::int AS total, COALESCE(SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END), 0)::int AS active FROM health_modules`,
      sql`SELECT COUNT(*)::int AS count FROM health_form_submissions`,
      sql`SELECT COUNT(*)::int AS count FROM health_count_events`,
    ])

    return {
      sector,
      tenantCount: toInt(tenantRows[0]?.count),
      userCount: toInt(userRows[0]?.count),
      moduleCount: toInt(moduleRows[0]?.total),
      activeModuleCount: toInt(moduleRows[0]?.active),
      formSubmissionCount: toInt(submissionRows[0]?.count),
      countEventCount: toInt(countRows[0]?.count),
    }
  }

  if (sector === 'factory') {
    const [tenantRows, userRows, moduleRows, submissionRows, countRows] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM factory_tenants`,
      sql`SELECT COUNT(*)::int AS count FROM factory_users`,
      sql`SELECT COUNT(*)::int AS total, COALESCE(SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END), 0)::int AS active FROM factory_modules`,
      sql`SELECT COUNT(*)::int AS count FROM factory_form_submissions`,
      sql`SELECT COUNT(*)::int AS count FROM factory_count_events`,
    ])

    return {
      sector,
      tenantCount: toInt(tenantRows[0]?.count),
      userCount: toInt(userRows[0]?.count),
      moduleCount: toInt(moduleRows[0]?.total),
      activeModuleCount: toInt(moduleRows[0]?.active),
      formSubmissionCount: toInt(submissionRows[0]?.count),
      countEventCount: toInt(countRows[0]?.count),
    }
  }

  if (sector === 'retail') {
    const [tenantRows, userRows, moduleRows, submissionRows, countRows] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM retail_tenants`,
      sql`SELECT COUNT(*)::int AS count FROM retail_users`,
      sql`SELECT COUNT(*)::int AS total, COALESCE(SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END), 0)::int AS active FROM retail_modules`,
      sql`SELECT COUNT(*)::int AS count FROM retail_form_submissions`,
      sql`SELECT COUNT(*)::int AS count FROM retail_count_events`,
    ])

    return {
      sector,
      tenantCount: toInt(tenantRows[0]?.count),
      userCount: toInt(userRows[0]?.count),
      moduleCount: toInt(moduleRows[0]?.total),
      activeModuleCount: toInt(moduleRows[0]?.active),
      formSubmissionCount: toInt(submissionRows[0]?.count),
      countEventCount: toInt(countRows[0]?.count),
    }
  }

  const [tenantRows, userRows, moduleRows, submissionRows, countRows] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM logistics_tenants`,
    sql`SELECT COUNT(*)::int AS count FROM logistics_users`,
    sql`SELECT COUNT(*)::int AS total, COALESCE(SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END), 0)::int AS active FROM logistics_modules`,
    sql`SELECT COUNT(*)::int AS count FROM logistics_form_submissions`,
    sql`SELECT COUNT(*)::int AS count FROM logistics_count_events`,
  ])

  return {
    sector,
    tenantCount: toInt(tenantRows[0]?.count),
    userCount: toInt(userRows[0]?.count),
    moduleCount: toInt(moduleRows[0]?.total),
    activeModuleCount: toInt(moduleRows[0]?.active),
    formSubmissionCount: toInt(submissionRows[0]?.count),
    countEventCount: toInt(countRows[0]?.count),
  }
}

async function getTopModules(sector: SectorKey): Promise<SectorTopModule[]> {
  if (sector === 'health') {
    const rows = await sql`
      SELECT
        t.code AS tenant_code,
        m.slug,
        m.module_type,
        m.title,
        COALESCE(fs.submission_count, 0)::int AS submissions,
        COALESCE(ce.scan_count, 0)::int AS scans
      FROM health_modules m
      JOIN health_tenants t ON t.id = m.tenant_id
      LEFT JOIN (
        SELECT module_id, COUNT(*)::int AS submission_count
        FROM health_form_submissions
        GROUP BY module_id
      ) fs ON fs.module_id = m.id
      LEFT JOIN (
        SELECT module_id, COUNT(*)::int AS scan_count
        FROM health_count_events
        GROUP BY module_id
      ) ce ON ce.module_id = m.id
      ORDER BY (COALESCE(fs.submission_count, 0) + COALESCE(ce.scan_count, 0)) DESC, m.created_at DESC
      LIMIT 5
    `
    return rows.map((row) => ({
      sector,
      tenantCode: String(row.tenant_code || ''),
      moduleSlug: String(row.slug || ''),
      moduleType: String(row.module_type || ''),
      title: String(row.title || ''),
      submissions: toInt(row.submissions),
      scans: toInt(row.scans),
    }))
  }

  if (sector === 'factory') {
    const rows = await sql`
      SELECT
        t.code AS tenant_code,
        m.slug,
        m.module_type,
        m.title,
        COALESCE(fs.submission_count, 0)::int AS submissions,
        COALESCE(ce.scan_count, 0)::int AS scans
      FROM factory_modules m
      JOIN factory_tenants t ON t.id = m.tenant_id
      LEFT JOIN (
        SELECT module_id, COUNT(*)::int AS submission_count
        FROM factory_form_submissions
        GROUP BY module_id
      ) fs ON fs.module_id = m.id
      LEFT JOIN (
        SELECT module_id, COUNT(*)::int AS scan_count
        FROM factory_count_events
        GROUP BY module_id
      ) ce ON ce.module_id = m.id
      ORDER BY (COALESCE(fs.submission_count, 0) + COALESCE(ce.scan_count, 0)) DESC, m.created_at DESC
      LIMIT 5
    `
    return rows.map((row) => ({
      sector,
      tenantCode: String(row.tenant_code || ''),
      moduleSlug: String(row.slug || ''),
      moduleType: String(row.module_type || ''),
      title: String(row.title || ''),
      submissions: toInt(row.submissions),
      scans: toInt(row.scans),
    }))
  }

  if (sector === 'retail') {
    const rows = await sql`
      SELECT
        t.code AS tenant_code,
        m.slug,
        m.module_type,
        m.title,
        COALESCE(fs.submission_count, 0)::int AS submissions,
        COALESCE(ce.scan_count, 0)::int AS scans
      FROM retail_modules m
      JOIN retail_tenants t ON t.id = m.tenant_id
      LEFT JOIN (
        SELECT module_id, COUNT(*)::int AS submission_count
        FROM retail_form_submissions
        GROUP BY module_id
      ) fs ON fs.module_id = m.id
      LEFT JOIN (
        SELECT module_id, COUNT(*)::int AS scan_count
        FROM retail_count_events
        GROUP BY module_id
      ) ce ON ce.module_id = m.id
      ORDER BY (COALESCE(fs.submission_count, 0) + COALESCE(ce.scan_count, 0)) DESC, m.created_at DESC
      LIMIT 5
    `
    return rows.map((row) => ({
      sector,
      tenantCode: String(row.tenant_code || ''),
      moduleSlug: String(row.slug || ''),
      moduleType: String(row.module_type || ''),
      title: String(row.title || ''),
      submissions: toInt(row.submissions),
      scans: toInt(row.scans),
    }))
  }

  const rows = await sql`
    SELECT
      t.code AS tenant_code,
      m.slug,
      m.module_type,
      m.title,
      COALESCE(fs.submission_count, 0)::int AS submissions,
      COALESCE(ce.scan_count, 0)::int AS scans
    FROM logistics_modules m
    JOIN logistics_tenants t ON t.id = m.tenant_id
    LEFT JOIN (
      SELECT module_id, COUNT(*)::int AS submission_count
      FROM logistics_form_submissions
      GROUP BY module_id
    ) fs ON fs.module_id = m.id
    LEFT JOIN (
      SELECT module_id, COUNT(*)::int AS scan_count
      FROM logistics_count_events
      GROUP BY module_id
    ) ce ON ce.module_id = m.id
    ORDER BY (COALESCE(fs.submission_count, 0) + COALESCE(ce.scan_count, 0)) DESC, m.created_at DESC
    LIMIT 5
  `

  return rows.map((row) => ({
    sector,
    tenantCode: String(row.tenant_code || ''),
    moduleSlug: String(row.slug || ''),
    moduleType: String(row.module_type || ''),
    title: String(row.title || ''),
    submissions: toInt(row.submissions),
    scans: toInt(row.scans),
  }))
}

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()

    const body = await req.json().catch(() => ({}))
    const providedPassword = String(body.password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const sectors: SectorKey[] = ['health', 'factory', 'retail', 'logistics']
    const [overviews, topModulesBySector] = await Promise.all([
      Promise.all(sectors.map((sector) => getSectorOverview(sector))),
      Promise.all(sectors.map((sector) => getTopModules(sector))),
    ])

    const hotelRows = await sql`
      SELECT
        COUNT(*)::int AS module_count,
        COALESCE(SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END), 0)::int AS active_module_count
      FROM hotel_qr_modules
    `

    const educationRows = await sql`SELECT COUNT(*)::int AS user_count FROM education_users`
    const hotelUserRows = await sql`SELECT COUNT(*)::int AS user_count FROM hotel_users`

    const qrUsageRows = await sql`
      SELECT slug, title, order_type, play_count, recording_count, video_recording_count, updated_at
      FROM qr_codes
      ORDER BY play_count DESC, updated_at DESC
      LIMIT 15
    `

    const panelAdminsRows = await sql`
      SELECT realm, user_id, email, role, tenant_code, is_active
      FROM (
        SELECT 'hotel'::text AS realm, u.id AS user_id, u.email, u.role, t.code AS tenant_code, u.is_active
        FROM hotel_users u
        LEFT JOIN hotel_tenants t ON t.id = u.hotel_id
        WHERE u.role IN ('hotel_admin', 'platform_admin')

        UNION ALL

        SELECT 'education'::text AS realm, u.id AS user_id, u.email, u.role, t.code AS tenant_code, u.is_active
        FROM education_users u
        LEFT JOIN hotel_tenants t ON t.id = u.hotel_id

        UNION ALL

        SELECT 'health'::text AS realm, u.id AS user_id, u.email, u.role, t.code AS tenant_code, u.is_active
        FROM health_users u
        LEFT JOIN health_tenants t ON t.id = u.tenant_id
        WHERE u.role IN ('sector_admin', 'platform_admin')

        UNION ALL

        SELECT 'factory'::text AS realm, u.id AS user_id, u.email, u.role, t.code AS tenant_code, u.is_active
        FROM factory_users u
        LEFT JOIN factory_tenants t ON t.id = u.tenant_id
        WHERE u.role IN ('sector_admin', 'platform_admin')

        UNION ALL

        SELECT 'retail'::text AS realm, u.id AS user_id, u.email, u.role, t.code AS tenant_code, u.is_active
        FROM retail_users u
        LEFT JOIN retail_tenants t ON t.id = u.tenant_id
        WHERE u.role IN ('sector_admin', 'platform_admin')

        UNION ALL

        SELECT 'logistics'::text AS realm, u.id AS user_id, u.email, u.role, t.code AS tenant_code, u.is_active
        FROM logistics_users u
        LEFT JOIN logistics_tenants t ON t.id = u.tenant_id
        WHERE u.role IN ('sector_admin', 'platform_admin')
      ) panel_admins
      ORDER BY realm, email
      LIMIT 1200
    `

    return NextResponse.json({
      sectorOverview: overviews,
      topModules: topModulesBySector.flat(),
      hotelOverview: {
        moduleCount: toInt(hotelRows[0]?.module_count),
        activeModuleCount: toInt(hotelRows[0]?.active_module_count),
        hotelUserCount: toInt(hotelUserRows[0]?.user_count),
        educationUserCount: toInt(educationRows[0]?.user_count),
      },
      qrUsage: qrUsageRows.map((row) => ({
        slug: String(row.slug || ''),
        title: String(row.title || ''),
        orderType: String(row.order_type || ''),
        playCount: toInt(row.play_count),
        recordingCount: toInt(row.recording_count),
        videoRecordingCount: toInt(row.video_recording_count),
        updatedAt: String(row.updated_at || ''),
      })),
      panelAdmins: panelAdminsRows.map((row) => ({
        realm: String(row.realm || ''),
        userId: String(row.user_id || ''),
        email: String(row.email || ''),
        role: String(row.role || ''),
        tenantCode: String(row.tenant_code || ''),
        isActive: Boolean(row.is_active),
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[admin/platform/overview]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
