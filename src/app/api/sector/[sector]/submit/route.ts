import { NextRequest, NextResponse } from 'next/server'
import { normalizeSector } from '@/lib/sectorPlatform'
import { getPublicSectorModule } from '@/lib/sectorPublic'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ sector: string }> }) {
  try {
    const { sector: rawSector } = await params
    const sector = normalizeSector(rawSector)
    if (!sector) return NextResponse.json({ error: 'Gecersiz sektor' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const tenantCode = String(body.tenantCode || '').trim().toUpperCase()
    const moduleSlug = String(body.moduleSlug || '').trim().toLowerCase()
    const name = String(body.name || '').trim().slice(0, 120)
    const phone = String(body.phone || '').trim().slice(0, 40)
    const rawFields = body.fields && typeof body.fields === 'object' && !Array.isArray(body.fields)
      ? body.fields as Record<string, unknown>
      : {}

    const fields: Record<string, string> = {}
    for (const [key, value] of Object.entries(rawFields)) {
      const normalizedKey = String(key || '').trim().slice(0, 64)
      if (!normalizedKey) continue
      fields[normalizedKey] = String(value || '').trim().slice(0, 2000)
    }

    if (!tenantCode || !moduleSlug || !name || Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'tenantCode, moduleSlug, name ve fields gerekli' }, { status: 400 })
    }

    const moduleInfo = await getPublicSectorModule(sector, tenantCode, moduleSlug)
    if (!moduleInfo) return NextResponse.json({ error: 'Modul bulunamadi' }, { status: 404 })

    const payloadJson = JSON.stringify(fields)

    if (sector === 'health') {
      await sql`
        INSERT INTO health_form_submissions (tenant_id, module_id, module_slug, module_type, respondent_name, respondent_phone, payload_json)
        VALUES (${moduleInfo.tenantId}, ${moduleInfo.moduleId}, ${moduleInfo.moduleSlug}, ${moduleInfo.moduleType}, ${name}, ${phone}, ${payloadJson})
      `
    } else if (sector === 'factory') {
      await sql`
        INSERT INTO factory_form_submissions (tenant_id, module_id, module_slug, module_type, respondent_name, respondent_phone, payload_json)
        VALUES (${moduleInfo.tenantId}, ${moduleInfo.moduleId}, ${moduleInfo.moduleSlug}, ${moduleInfo.moduleType}, ${name}, ${phone}, ${payloadJson})
      `
    } else if (sector === 'retail') {
      await sql`
        INSERT INTO retail_form_submissions (tenant_id, module_id, module_slug, module_type, respondent_name, respondent_phone, payload_json)
        VALUES (${moduleInfo.tenantId}, ${moduleInfo.moduleId}, ${moduleInfo.moduleSlug}, ${moduleInfo.moduleType}, ${name}, ${phone}, ${payloadJson})
      `
    } else {
      await sql`
        INSERT INTO logistics_form_submissions (tenant_id, module_id, module_slug, module_type, respondent_name, respondent_phone, payload_json)
        VALUES (${moduleInfo.tenantId}, ${moduleInfo.moduleId}, ${moduleInfo.moduleSlug}, ${moduleInfo.moduleType}, ${name}, ${phone}, ${payloadJson})
      `
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sector/submit]', err)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}
