import { NextRequest, NextResponse } from 'next/server'
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
import { DPP_CATEGORIES, DPP_PLANS, emptyData, emptyTexts, readData, type DppCategory, type DppRole } from '@/lib/dpp/types'

// DPP firma paneli API'si. Tüm işlemler oturumdaki kullanıcının firmasıyla sınırlıdır.

class HttpError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message)
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
])
const OWNER_ACTIONS = new Set(['company.save', 'company.rotateKey', 'users.add', 'users.update', 'users.resetPassword', 'users.remove'])

export async function POST(req: NextRequest) {
  try {
    const user = await getDppUser(req)
    if (!user) return NextResponse.json({ error: 'Oturum sona erdi, tekrar giriş yap' }, { status: 401 })
    if (!(await consumeRateLimit(`dpp-panel:${user.id}`, 1200, 3600))) throw new HttpError('Çok fazla istek, biraz bekle', 429)

    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '')
    if (user.mustChangePassword && action !== 'me') throw new HttpError('Devam etmek için önce şifreni değiştir', 403)
    if (EDITOR_ACTIONS.has(action) && user.role === 'viewer') throw new HttpError('Bu işlem için yetkin yok (izleyici)', 403)
    if (OWNER_ACTIONS.has(action) && user.role !== 'owner') throw new HttpError('Bu işlemi sadece firma yöneticisi yapabilir', 403)

    return NextResponse.json(await handle(user, action, body))
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status })
    const message = err instanceof Error ? err.message : 'Sunucu hatası'
    console.error('[dpp/panel]', err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

async function handle(user: DppSessionUser, action: string, body: Record<string, unknown>) {
  const companyId = user.companyId
  const id = String(body.id || '')

  switch (action) {
    case 'overview':
      return companyOverview(companyId)

    case 'products.list':
      return { products: await listProducts(companyId), translation: translationEnabled() }

    case 'product.get': {
      const bundle = await getProductBundle(companyId, id)
      if (!bundle) throw new HttpError('Ürün bulunamadı', 404)
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
      if (!product) throw new HttpError('Ürün bulunamadı', 404)
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

    case 'products.import':
      return importProducts(companyId, body.rows)

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
      if (!name) throw new HttpError('Firma adı zorunlu')
      const website = s('website', 300)
      if (website && !/^https?:\/\//i.test(website)) throw new HttpError('Web sitesi http:// ya da https:// ile başlamalı')
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
      if (id === user.id) throw new HttpError('Kendi rolünü ya da durumunu değiştiremezsin')
      const role = normalizeRole(body.role)
      const active = body.isActive !== false
      const rows = (await sql`
        UPDATE dpp_users SET role = ${role}, is_active = ${active} WHERE id = ${id} AND company_id = ${companyId} RETURNING id
      `) as unknown[]
      if (!rows.length) throw new HttpError('Kullanıcı bulunamadı', 404)
      if (!active) await sql`DELETE FROM dpp_sessions WHERE user_id = ${id}`
      return { ok: true }
    }

    case 'users.resetPassword': {
      if (id === user.id) throw new HttpError('Kendi şifreni "Hesabım" bölümünden değiştir')
      const owns = (await sql`SELECT 1 FROM dpp_users WHERE id = ${id} AND company_id = ${companyId}`) as unknown[]
      if (!owns.length) throw new HttpError('Kullanıcı bulunamadı', 404)
      return { password: await resetDppUserPassword(id) }
    }

    case 'users.remove': {
      if (id === user.id) throw new HttpError('Kendini silemezsin')
      const rows = (await sql`DELETE FROM dpp_users WHERE id = ${id} AND company_id = ${companyId} RETURNING id`) as unknown[]
      if (!rows.length) throw new HttpError('Kullanıcı bulunamadı', 404)
      return { ok: true }
    }

    default:
      throw new HttpError('Geçersiz işlem')
  }
}

function normalizeRole(input: unknown): DppRole {
  return input === 'owner' || input === 'viewer' ? input : 'editor'
}

/** CSV'den toplu taslak ürün oluşturma. Her satır bağımsız; hatalı satırlar raporlanır. */
async function importProducts(companyId: string, input: unknown) {
  const rows = (Array.isArray(input) ? input : []).slice(0, 500) as Array<Record<string, unknown>>
  if (!rows.length) throw new HttpError('İçe aktarılacak satır yok')
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
      errors.push(`Satır ${line}: ${err instanceof Error ? err.message : 'hata'}`)
      if (err instanceof Error && err.message.includes('ürün sınırına')) break
    }
  }
  return { created, errors: errors.slice(0, 50) }
}
