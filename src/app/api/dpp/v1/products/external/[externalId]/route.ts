import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { ApiError, productOut, readJson, upsertByExternalId, pathParam, withApi } from '@/lib/dpp/api'

// ERP / PIM ürün koduyla çalışma: GET okur, PUT yoksa oluşturur, varsa günceller (tekrar gönderilmesi güvenli).
export async function GET(req: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
  const { externalId } = await params
  return withApi(req, 'read', async (caller) => {
    const rows = (await sql`SELECT id FROM dpp_products WHERE company_id = ${caller.companyId} AND external_id = ${pathParam(externalId).slice(0, 100)}`) as Array<{ id: string }>
    if (!rows[0]) throw new ApiError('e_product_not_found', 404)
    return productOut(caller.companyId, rows[0].id)
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ externalId: string }> }) {
  const { externalId } = await params
  return withApi(req, 'write', async (caller) => {
    const body = await readJson(req)
    const res = await upsertByExternalId(caller, pathParam(externalId), body)
    return NextResponse.json(res, { status: res.created ? 201 : 200, headers: { 'Cache-Control': 'no-store' } })
  })
}
