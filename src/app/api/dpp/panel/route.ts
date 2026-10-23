import { NextRequest, NextResponse, after } from 'next/server'
import { sql } from '@/lib/db'
import { consumeRateLimit } from '@/lib/growthSchema'
import { createDppUser, getDppUser, randomKey, resetDppUserPassword, type DppSessionUser } from '@/lib/dpp/auth'
import {
  addDocument,
  companyOverview,
  deleteDocument,
  deleteDraft,
  deleteItems,
  digitalLink,
  duplicateProduct,
  generateItems,
  getProduct,
  getProductBundle,
  listItems,
  listProducts,
  passportUrl,
  publishProduct,
  saveProduct,
  setArchived,
  translateProduct,
  translationEnabled,
  updateDocument,
} from '@/lib/dpp/server'
import { DppError, errorText, msg, type MsgKey, type MsgParams } from '@/lib/dpp/i18n'
import { requestLang } from '@/lib/dpp/requestLang'
import { audit, runDailyMaintenance } from '@/lib/dpp/safety'
import {
  applySupplierResponse,
  createSupplierRequest,
  deleteSupplierRequest,
  listSupplierRequests,
  pendingSupplierResponses,
  setSupplierRequestStatus,
} from '@/lib/dpp/suppliers'
import { DPP_CATEGORIES, DPP_PLANS, emptyData, emptyTexts, readData, type DppCategory, type DppLang, type DppRole } from '@/lib/dpp/types'

// DPP firma paneli API'si. Tüm işlemler oturumdaki kullanıcının firmasıyla sınırlıdır.

/** Durum kodlu, dile çevrilebilen hata */
class HttpError extends DppError {
  constructor(
    key: MsgKey,
    public status = 400,
    params: MsgParams = {}
  ) {
    super(key, params)
  }
}

const EDITOR_ACTIONS = new Set([
  'product.save',
  'product.publish',
  'product.archive',
  'product.duplicate',
  'product.delete',
  'product.translate',
  'items.generate',
  'items.delete',
  'docs.add',
  'docs.update',
  'docs.delete',
  'products.import',
  'suppliers.create',
  'suppliers.apply',
  'suppliers.reject',
  'suppliers.reopen',
  'suppliers.delete',
])
const OWNER_ACTIONS = new Set(['company.save', 'company.rotateKey', 'users.add', 'users.update', 'users.resetPassword', 'users.remove'])

export async function POST(req: NextRequest) {
  const lang = requestLang(req)
  try {
    const user = await getDppUser(req)
    if (!user) return NextResponse.json({ error: msg(lang, 'e_session_expired') }, { status: 401 })
    if (!(await consumeRateLimit(`dpp-panel:${user.id}`, 1200, 3600))) throw new HttpError('e_too_many', 429)

    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '')
    if (user.mustChangePassword && action !== 'me') throw new HttpError('e_change_pw_first', 403)
    if (EDITOR_ACTIONS.has(action) && user.role === 'viewer') throw new HttpError('e_viewer_forbidden', 403)
    if (OWNER_ACTIONS.has(action) && user.role !== 'owner') throw new HttpError('e_owner_only', 403)

    // Silme işlemlerinde silinecek verinin kopyası işlem kaydına alınır
    const before = WRITE_ACTIONS.has(action) ? await snapshotBefore(user.companyId, action, body) : null
    const result = await handle(user, action, body, lang)
    if (WRITE_ACTIONS.has(action)) await audit(user.companyId, user.email, action, auditTarget(body, result), { request: auditBody(body), ...(before ? { before } : {}) })
    // Günlük yedek ve çöp temizliği: yanıtı bekletmeden, günde bir kez
    after(() => runDailyMaintenance().catch((e) => console.error('[dpp maintenance]', e)))
    return NextResponse.json(result)
  } catch (err) {
    if (!(err instanceof DppError)) console.error('[dpp/panel]', err)
    const status = err instanceof HttpError ? err.status : err instanceof DppError ? (err.key === 'e_conflict' ? 409 : 400) : 500
    return NextResponse.json({ error: errorText(err, lang) }, { status })
  }
}

async function handle(user: DppSessionUser, action: string, body: Record<string, unknown>, lang: DppLang) {
  const companyId = user.companyId
  const id = String(body.id || '')

  switch (action) {
    case 'overview': {
      const [overview, suppliers] = await Promise.all([companyOverview(companyId), pendingSupplierResponses(companyId)])
      return { ...overview, suppliers }
    }

    case 'products.list':
      return { products: await listProducts(companyId), translation: translationEnabled() }

    case 'product.get': {
      const bundle = await getProductBundle(companyId, id)
      if (!bundle) throw new HttpError('e_product_not_found', 404)
      return { product: bundle, translation: translationEnabled() }
    }

    case 'product.new':
      return { texts: { tr: emptyTexts() }, data: emptyData() }

    case 'product.save': {
      const savedId = await saveProduct(companyId, id || null, body)
      return { id: savedId }
    }

    case 'product.publish':
      return { version: await publishProduct(companyId, id, user.email) }

    case 'product.archive':
      await setArchived(companyId, id, body.archived === true)
      return { ok: true }

    case 'product.duplicate':
      return { id: await duplicateProduct(companyId, id) }

    case 'product.delete':
      await deleteDraft(companyId, id)
      return { ok: true }

    case 'product.translate':
      return translateProduct(companyId, id, body.langs)

    case 'items.list':
      return listItems(companyId, String(body.productId || ''), { q: String(body.q || ''), limit: Number(body.limit) || 200, offset: Number(body.offset) || 0 })

    case 'items.generate':
      return generateItems(companyId, String(body.productId || ''), body)

    case 'items.delete':
      return { deleted: await deleteItems(companyId, String(body.productId || ''), Array.isArray(body.ids) ? body.ids.map(String) : []) }

    case 'items.export': {
      const product = await getProduct(companyId, String(body.productId || ''))
      if (!product) throw new HttpError('e_product_not_found', 404)
      const gtin = readData(product.data).gtin
      const rows = (await sql`
        SELECT public_id, serial, batch, production_date FROM dpp_items WHERE product_id = ${product.id} ORDER BY serial LIMIT 100000
      `) as Array<{ public_id: string; serial: string; batch: string; production_date: string | null }>
      return {
        items: rows.map((r) => ({
          serial: r.serial,
          batch: r.batch,
          productionDate: r.production_date ? new Date(r.production_date).toISOString().slice(0, 10) : '',
          url: passportUrl(r.public_id),
          digitalLink: gtin ? digitalLink(gtin, r.serial) : '',
        })),
      }
    }

    case 'docs.add':
      await addDocument(companyId, String(body.productId || ''), body)
      return { ok: true }

    case 'docs.update':
      await updateDocument(companyId, id, body)
      return { ok: true }

    case 'docs.delete':
      await deleteDocument(companyId, id)
      return { ok: true }

    case 'suppliers.list':
      return listSupplierRequests(companyId, String(body.productId || ''))

    case 'suppliers.create': {
      if (!(await consumeRateLimit(`dpp-sr-create:${companyId}`, 100, 3600))) throw new HttpError('e_too_many', 429)
      return createSupplierRequest(companyId, user.email, body)
    }

    case 'suppliers.apply':
      await applySupplierResponse(companyId, id, body.sections)
      return { ok: true }

    case 'suppliers.reject':
    case 'suppliers.reopen':
      await setSupplierRequestStatus(companyId, id, action === 'suppliers.reject' ? 'reject' : 'reopen', body.days)
      return { ok: true }

    case 'suppliers.delete':
      await deleteSupplierRequest(companyId, id)
      return { ok: true }

    case 'products.import':
      return importProducts(companyId, body.rows, lang)

    case 'company.get': {
      const rows = (await sql`
        SELECT name, code, country, address, website, email, phone, tax_id, plan, product_limit, restricted_key, created_at,
               (SELECT COUNT(*)::int FROM dpp_products p WHERE p.company_id = c.id AND p.status <> 'archived') AS used
        FROM dpp_companies c WHERE id = ${companyId}
      `) as Array<Record<string, unknown>>
      const c = rows[0]
      return {
        company: {
          ...c,
          planLabel: DPP_PLANS[String(c.plan) as keyof typeof DPP_PLANS]?.label || String(c.plan),
          restricted_key: user.role === 'owner' ? c.restricted_key : null,
        },
      }
    }

    case 'company.save': {
      const s = (k: string, max: number) => String(body[k] ?? '').trim().slice(0, max)
      const name = s('name', 200)
      if (!name) throw new HttpError('e_company_name_required')
      const website = s('website', 300)
      if (website && !/^https?:\/\//i.test(website)) throw new HttpError('e_website_http')
      await sql`
        UPDATE dpp_companies
        SET name = ${name}, country = ${s('country', 2).toUpperCase().replace(/[^A-Z]/g, '') || 'TR'}, address = ${s('address', 600)},
            website = ${website}, email = ${s('email', 255)}, phone = ${s('phone', 40)}, tax_id = ${s('tax_id', 40)}
        WHERE id = ${companyId}
      `
      return { ok: true }
    }

    case 'company.rotateKey': {
      const key = randomKey()
      await sql`UPDATE dpp_companies SET restricted_key = ${key} WHERE id = ${companyId}`
      return { restrictedKey: key }
    }

    case 'users.list': {
      const users = await sql`
        SELECT id, email, name, role, is_active, must_change_password, last_login_at, created_at FROM dpp_users
        WHERE company_id = ${companyId} ORDER BY created_at
      `
      return { users, me: user.id }
    }

    case 'users.add': {
      const role = normalizeRole(body.role)
      const created = await createDppUser(companyId, String(body.email || ''), role, String(body.name || ''))
      return { email: created.email, password: created.password }
    }

    case 'users.update': {
      if (id === user.id) throw new HttpError('e_self_role')
      const role = normalizeRole(body.role)
      const active = body.isActive !== false
      const rows = (await sql`
        UPDATE dpp_users SET role = ${role}, is_active = ${active} WHERE id = ${id} AND company_id = ${companyId} RETURNING id
      `) as unknown[]
      if (!rows.length) throw new HttpError('e_user_not_found', 404)
      if (!active) await sql`DELETE FROM dpp_sessions WHERE user_id = ${id}`
      return { ok: true }
    }

    case 'users.resetPassword': {
      if (id === user.id) throw new HttpError('e_self_reset')
      const owns = (await sql`SELECT 1 FROM dpp_users WHERE id = ${id} AND company_id = ${companyId}`) as unknown[]
      if (!owns.length) throw new HttpError('e_user_not_found', 404)
      return { password: await resetDppUserPassword(id) }
    }

    case 'users.remove': {
      if (id === user.id) throw new HttpError('e_self_delete')
      const rows = (await sql`DELETE FROM dpp_users WHERE id = ${id} AND company_id = ${companyId} RETURNING id`) as unknown[]
      if (!rows.length) throw new HttpError('e_user_not_found', 404)
      return { ok: true }
    }

    default:
      throw new HttpError('e_invalid_action')
  }
}

const WRITE_ACTIONS = new Set([...EDITOR_ACTIONS, ...OWNER_ACTIONS])

/** İşlem kaydı için isteğin özeti: büyük metinler kısaltılır, şifre vb. alınmaz */
function auditBody(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (k === 'action' || /password/i.test(k)) continue
    if (k === 'rows' && Array.isArray(v)) out.rows = v.length
    else out[k] = v
  }
  return out
}

function auditTarget(body: Record<string, unknown>, result: unknown) {
  const r = (result && typeof result === 'object' ? result : {}) as Record<string, unknown>
  return String(body.id || body.productId || r.id || '') || null
}

/** Geri getirilebilsin diye silinmeden önceki tam kayıt */
async function snapshotBefore(companyId: string, action: string, body: Record<string, unknown>) {
  const id = String(body.id || '')
  const uuid = /^[0-9a-f-]{36}$/i.test(id)
  try {
    if (action === 'product.delete' && uuid) {
      const [product, documents] = await Promise.all([
        sql`SELECT * FROM dpp_products WHERE id = ${id} AND company_id = ${companyId}`,
        sql`SELECT d.* FROM dpp_documents d JOIN dpp_products p ON p.id = d.product_id WHERE p.id = ${id} AND p.company_id = ${companyId}`,
      ])
      return { product: product[0] || null, documents }
    }
    if (action === 'docs.delete' && uuid) {
      return (await sql`SELECT d.* FROM dpp_documents d JOIN dpp_products p ON p.id = d.product_id WHERE d.id = ${id} AND p.company_id = ${companyId}`)[0] || null
    }
    if (action === 'items.delete') {
      const ids = (Array.isArray(body.ids) ? body.ids : []).map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 5000)
      if (!ids.length) return null
      return await sql`SELECT i.* FROM dpp_items i JOIN dpp_products p ON p.id = i.product_id WHERE i.id = ANY(${ids}::uuid[]) AND p.company_id = ${companyId}`
    }
    if (action === 'users.remove' && uuid) {
      return (await sql`SELECT id, email, name, role, created_at FROM dpp_users WHERE id = ${id} AND company_id = ${companyId}`)[0] || null
    }
    if (action === 'suppliers.delete' && uuid) {
      return (await sql`SELECT * FROM dpp_supplier_requests WHERE id = ${id} AND company_id = ${companyId}`)[0] || null
    }
  } catch (err) {
    console.error('[dpp snapshot]', err)
  }
  return null
}

function normalizeRole(input: unknown): DppRole {
  return input === 'owner' || input === 'viewer' ? input : 'editor'
}

/** CSV'den toplu taslak ürün oluşturma. Her satır bağımsız; hatalı satırlar raporlanır. */
async function importProducts(companyId: string, input: unknown, lang: DppLang) {
  const rows = (Array.isArray(input) ? input : []).slice(0, 500) as Array<Record<string, unknown>>
  if (!rows.length) throw new HttpError('e_no_rows')
  let created = 0
  const errors: string[] = []
  for (const [index, row] of rows.entries()) {
    const line = index + 2
    try {
      const text = (k: string) => String(row[k] ?? '').trim()
      const category = text('category').toLowerCase()
      const materials = text('materials')
        .split(/[;|]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const m = part.match(/^(.*?)[\s:]*%?\s*(\d+(?:[.,]\d+)?)\s*%?$/)
          return m ? { name: m[1].trim(), percent: Number(m[2].replace(',', '.')), recycledPercent: null, origin: '' } : { name: part, percent: null, recycledPercent: null, origin: '' }
        })
      const data = {
        ...emptyData(),
        brand: text('brand'),
        model: text('model'),
        gtin: text('gtin'),
        category: (category in DPP_CATEGORIES ? category : 'other') as DppCategory,
        countryOfOrigin: text('country') || 'TR',
        manufacturer: { name: text('manufacturer'), address: text('manufacturer_address'), contact: '' },
        materials,
      }
      const texts = { tr: { ...emptyTexts(), name: text('name'), description: text('description'), care: text('care') } }
      await saveProduct(companyId, null, { defaultLang: 'tr', texts, data })
      created++
    } catch (err) {
      errors.push(msg(lang, 'e_row', { line, msg: errorText(err, lang) }))
      if (err instanceof DppError && err.key === 'e_limit') break
    }
  }
  return { created, errors: errors.slice(0, 50) }
}
