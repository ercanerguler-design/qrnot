import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { logApi, productOut, readJson, setExternalId, upsertByExternalId, withApi } from '@/lib/dpp/api'
import { listProducts, passportUrl, saveProduct } from '@/lib/dpp/server'
import { readTextsMap } from '@/lib/dpp/types'

// GET: ürün listesi (özet). POST: yeni ürün taslağı; externalId verilirse aynı kodlu ürün varsa güncellenir.
export async function GET(req: NextRequest) {
  return withApi(req, 'read', async (caller) => {
    const rows = await listProducts(caller.companyId)
    const status = req.nextUrl.searchParams.get('status')
    const ext = new Map(
      ((await sql`SELECT id, external_id FROM dpp_products WHERE company_id = ${caller.companyId} AND external_id IS NOT NULL`) as Array<{ id: string; external_id: string }>).map((r) => [
        r.id,
        r.external_id,
      ])
    )
    return {
      products: rows
        .filter((p) => !status || p.status === status)
        .map((p) => {
          const texts = readTextsMap(p.texts) as Record<string, { name?: string }>
          const data = (p.data || {}) as { gtin?: string; model?: string; category?: string }
          return {
            id: p.id,
            publicId: p.public_id,
            externalId: ext.get(String(p.id)) ?? null,
            name: texts[String(p.default_lang)]?.name || '',
            model: data.model || '',
            gtin: data.gtin || null,
            category: data.category || '',
            status: p.status,
            version: p.version,
            hasUnpublishedChanges: Boolean(p.has_draft_changes),
            itemCount: p.items,
            passportUrl: passportUrl(String(p.public_id)),
            updatedAt: p.updated_at,
          }
        }),
    }
  })
}

export async function POST(req: NextRequest) {
  return withApi(req, 'write', async (caller) => {
    const body = await readJson(req)
    if (typeof body.externalId === 'string' && body.externalId.trim()) {
      const res = await upsertByExternalId(caller, body.externalId, body)
      return NextResponse.json(res, { status: res.created ? 201 : 200, headers: { 'Cache-Control': 'no-store' } })
    }
    const id = await saveProduct(caller.companyId, null, { defaultLang: body.defaultLang, texts: body.texts, data: body.data })
    await setExternalId(caller.companyId, id, body.externalId)
    await logApi(caller, 'product.create', id)
    return NextResponse.json({ created: true, product: await productOut(caller.companyId, id) }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  })
}
