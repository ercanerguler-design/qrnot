import { NextRequest, NextResponse } from 'next/server'
import { ApiError, itemOut, logApi, readJson, withApi } from '@/lib/dpp/api'
import { addItems, generateItems, getProduct, importItemDynamic, listItems } from '@/lib/dpp/server'
import { msg } from '@/lib/dpp/i18n'
import { readData } from '@/lib/dpp/types'

// Seri numaraları (her biri ayrı pasaport).
// GET ?q=&limit=&offset=  ·  POST { serials: [{ serial, batch, productionDate }] } ya da { count, prefix, start, batch, productionDate }
// PUT { rows: [{ serial, stateOfHealthPct, ... }] } → batarya durumunu toplu günceller
async function gtinOf(companyId: string, id: string) {
  const product = await getProduct(companyId, id)
  if (!product) throw new ApiError('e_product_not_found', 404)
  return readData(product.data).gtin || null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withApi(req, 'read', async (caller) => {
    const gtin = await gtinOf(caller.companyId, id)
    const sp = req.nextUrl.searchParams
    const res = await listItems(caller.companyId, id, { q: sp.get('q') || '', limit: Math.min(1000, Number(sp.get('limit')) || 200), offset: Number(sp.get('offset')) || 0 })
    return { total: res.total, items: (res.items as Array<Record<string, unknown>>).map((r) => itemOut(r, gtin)) }
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withApi(req, 'write', async (caller) => {
    await gtinOf(caller.companyId, id)
    const body = await readJson(req)
    const res = Array.isArray(body.serials) ? await addItems(caller.companyId, id, body.serials) : await generateItems(caller.companyId, id, body)
    await logApi(caller, 'items.add', id, res)
    return NextResponse.json(res, { status: res.created ? 201 : 200, headers: { 'Cache-Control': 'no-store' } })
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withApi(req, 'write', async (caller, lang) => {
    const body = await readJson(req)
    const res = await importItemDynamic(caller.companyId, id, body.rows)
    await logApi(caller, 'items.status', id, { updated: res.updated, errors: res.errors.length })
    return { updated: res.updated, errors: res.errors.map((e) => ({ code: e.key, serial: e.params.serial, message: msg(lang, e.key, e.params) })) }
  })
}
