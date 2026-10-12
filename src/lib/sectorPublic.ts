import { ensureQrSchema, sql } from '@/lib/db'
import type { SectorKey } from '@/lib/sectorPlatform'

export interface PublicSectorModule {
  tenantId: string
  tenantCode: string
  tenantName: string
  moduleId: string
  moduleSlug: string
  moduleType: string
  moduleTitle: string
  configJson: string
}

export async function getPublicSectorModule(sector: SectorKey, tenantCode: string, slug: string): Promise<PublicSectorModule | null> {
  await ensureQrSchema()

  const normalizedTenantCode = String(tenantCode || '').trim().toUpperCase()
  const normalizedSlug = String(slug || '').trim().toLowerCase()

  if (!normalizedTenantCode || !normalizedSlug) return null

  let rows: Record<string, unknown>[] = []
  if (sector === 'health') {
    rows = await sql`
      SELECT t.id AS tenant_id, t.code AS tenant_code, t.name AS tenant_name,
             m.id AS module_id, m.slug AS module_slug, m.module_type, m.title, m.config_json
      FROM health_modules m
      JOIN health_tenants t ON t.id = m.tenant_id
      WHERE t.code = ${normalizedTenantCode}
        AND t.is_active = TRUE
        AND m.slug = ${normalizedSlug}
        AND m.is_active = TRUE
      LIMIT 1
    `
  } else if (sector === 'factory') {
    rows = await sql`
      SELECT t.id AS tenant_id, t.code AS tenant_code, t.name AS tenant_name,
             m.id AS module_id, m.slug AS module_slug, m.module_type, m.title, m.config_json
      FROM factory_modules m
      JOIN factory_tenants t ON t.id = m.tenant_id
      WHERE t.code = ${normalizedTenantCode}
        AND t.is_active = TRUE
        AND m.slug = ${normalizedSlug}
        AND m.is_active = TRUE
      LIMIT 1
    `
  } else if (sector === 'retail') {
    rows = await sql`
      SELECT t.id AS tenant_id, t.code AS tenant_code, t.name AS tenant_name,
             m.id AS module_id, m.slug AS module_slug, m.module_type, m.title, m.config_json
      FROM retail_modules m
      JOIN retail_tenants t ON t.id = m.tenant_id
      WHERE t.code = ${normalizedTenantCode}
        AND t.is_active = TRUE
        AND m.slug = ${normalizedSlug}
        AND m.is_active = TRUE
      LIMIT 1
    `
  } else {
    rows = await sql`
      SELECT t.id AS tenant_id, t.code AS tenant_code, t.name AS tenant_name,
             m.id AS module_id, m.slug AS module_slug, m.module_type, m.title, m.config_json
      FROM logistics_modules m
      JOIN logistics_tenants t ON t.id = m.tenant_id
      WHERE t.code = ${normalizedTenantCode}
        AND t.is_active = TRUE
        AND m.slug = ${normalizedSlug}
        AND m.is_active = TRUE
      LIMIT 1
    `
  }

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    tenantId: String(row.tenant_id || ''),
    tenantCode: String(row.tenant_code || ''),
    tenantName: String(row.tenant_name || ''),
    moduleId: String(row.module_id || ''),
    moduleSlug: String(row.module_slug || ''),
    moduleType: String(row.module_type || ''),
    moduleTitle: String(row.title || ''),
    configJson: String(row.config_json || '{}'),
  }
}
