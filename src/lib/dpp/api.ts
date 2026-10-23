import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { consumeRateLimit } from '@/lib/growthSchema'
import { DppError, errorText, msg, type MsgKey } from './i18n'
import { requestLang } from './requestLang'
import { audit } from './safety'
import { ensureDppSchema } from './schema'
import { digitalLink, getProductBundle, passportUrl, saveProduct } from './server'
import { readData, readTextsMap, type DppLang } from './types'

// QRNot DPP yazma API'si (v1): ERP / PIM / BMS sistemlerinin pasaport verisini otomatik göndermesi için.
// Kimlik doğrulama: firma yöneticisinin panelden oluşturduğu API anahtarı (Authorization: Bearer qrn_…).
// Anahtarın kendisi saklanmaz, sadece SHA-256 özeti; ilk 12 karakteri tanıma için tutulur.

export type ApiScope = 'read' | 'write'
export interface ApiCaller {
  keyId: string
  keyName: string
  companyId: string
  scopes: ApiScope[]
}

const KEY_PREFIX = 'qrn_live_'
const hashKey = (key: string) => createHash('sha256').update(key).digest('hex')
const MAX_KEYS = 10

/** Yeni API anahtarı: değeri bir kez döner. */
export async function createApiKey(companyId: string, byEmail: string, name: string, scopes: ApiScope[]) {
  await ensureDppSchema()
  const clean = name.trim().slice(0, 80)
  if (!clean) throw new DppError('e_api_key_name')
  const count = Number(((await sql`SELECT COUNT(*)::int AS n FROM dpp_api_keys WHERE company_id = ${companyId} AND revoked_at IS NULL`) as Array<{ n: number }>)[0].n)
  if (count >= MAX_KEYS) throw new DppError('e_api_keys_max', { n: MAX_KEYS })
  const key = KEY_PREFIX + randomBytes(24).toString('base64url')
  const scopeList = scopes.includes('write') ? ['read', 'write'] : ['read']
  const rows = (await sql`
    INSERT INTO dpp_api_keys (company_id, name, prefix, key_hash, scopes, created_by)
    VALUES (${companyId}, ${clean}, ${key.slice(0, 16)}, ${hashKey(key)}, ${JSON.stringify(scopeList)}::jsonb, ${byEmail})
    RETURNING id
  `) as Array<{ id: string }>
  return { id: rows[0].id, key, prefix: key.slice(0, 16), scopes: scopeList }
}

export async function listApiKeys(companyId: string) {
  await ensureDppSchema()
  return sql`
    SELECT id, name, prefix, scopes, created_by, created_at, last_used_at, revoked_at
    FROM dpp_api_keys WHERE company_id = ${companyId} ORDER BY created_at DESC LIMIT 50
  `
}

export async function revokeApiKey(companyId: string, keyId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(keyId)) throw new DppError('e_api_key_not_found')
  const rows = (await sql`
    UPDATE dpp_api_keys SET revoked_at = NOW() WHERE id = ${keyId} AND company_id = ${companyId} AND revoked_at IS NULL RETURNING id
  `) as unknown[]
  if (!rows.length) throw new DppError('e_api_key_not_found')
}

/** API hatası: HTTP durum kodu + makine okunur kod + istenen dilde mesaj */
export class ApiError extends DppError {
  constructor(
    key: MsgKey,
    public status: number,
    params: Record<string, string | number> = {}
  ) {
    super(key, params)
  }
}

const STATUS_OF: Partial<Record<MsgKey, number>> = {
  e_product_not_found: 404,
  e_item_not_found: 404,
  e_api_key_not_found: 404,
  e_demo_expired: 403,
  e_conflict: 409,
  e_too_many: 429,
  e_limit: 402,
  e_demo_limit: 402,
}

/** Her API isteği bundan geçer: anahtar, firma durumu, yetki, istek sınırı; hatayı tek biçimde döner. */
export async function withApi(req: NextRequest, scope: ApiScope, handler: (caller: ApiCaller, lang: DppLang) => Promise<unknown>, status = 200) {
  const lang = requestLang(req)
  try {
    await ensureDppSchema()
    const auth = req.headers.get('authorization') || ''
    const key = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
    if (!key.startsWith(KEY_PREFIX)) throw new ApiError('e_api_unauthorized', 401)
    const rows = (await sql`
      SELECT k.id, k.name, k.company_id, k.scopes, c.is_active, c.panel_access, c.demo_expires_at
      FROM dpp_api_keys k JOIN dpp_companies c ON c.id = k.company_id
      WHERE k.key_hash = ${hashKey(key)} AND k.revoked_at IS NULL
    `) as Array<{ id: string; name: string; company_id: string; scopes: ApiScope[]; is_active: boolean; panel_access: boolean; demo_expires_at: string | null }>
    const row = rows[0]
    if (!row) throw new ApiError('e_api_unauthorized', 401)
    // Pasif firma, kilitli panel ya da süresi dolmuş demo: API de kapalı (yayınlanmış pasaportlar etkilenmez)
    if (!row.is_active || row.panel_access === false) throw new ApiError('e_panel_locked', 403)
    if (row.demo_expires_at && new Date(row.demo_expires_at).getTime() < Date.now()) throw new ApiError('e_demo_expired', 403)
    if (!row.scopes.includes(scope)) throw new ApiError('e_api_scope', 403)
    if (!(await consumeRateLimit(`dpp-api:${row.id}`, 1200, 3600))) throw new ApiError('e_too_many', 429)
    // Son kullanım: en fazla dakikada bir yazılır
    await sql`UPDATE dpp_api_keys SET last_used_at = NOW() WHERE id = ${row.id} AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '1 minute')`
    const result = await handler({ keyId: row.id, keyName: row.name, companyId: row.company_id, scopes: row.scopes }, lang)
    if (result instanceof NextResponse) return result
    return NextResponse.json(result, { status, headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    if (!(err instanceof DppError)) console.error('[dpp/api]', err)
    const code = err instanceof DppError ? err.key : 'e_server'
    const httpStatus = err instanceof ApiError ? err.status : err instanceof DppError ? (STATUS_OF[err.key] ?? 400) : 500
    const details = err instanceof DppError && err.list.length ? { details: err.list.map((i) => ({ code: i.key, message: msg(lang, i.key, i.params) })) } : {}
    return NextResponse.json({ error: { code, message: errorText(err, lang), ...details } }, { status: httpStatus, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function readJson(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error()
    return body as Record<string, unknown>
  } catch {
    throw new ApiError('e_api_bad_json', 400)
  }
}

export const apiActor = (caller: ApiCaller) => `api:${caller.keyName}`

export async function logApi(caller: ApiCaller, action: string, target: string | null, detail: Record<string, unknown> = {}) {
  await audit(caller.companyId, apiActor(caller), `api.${action}`, target, detail)
}

/** API'nin döndürdüğü ürün biçimi (panel paketinin sadeleştirilmiş hali) */
export async function productOut(companyId: string, id: string) {
  const b = await getProductBundle(companyId, id)
  if (!b) throw new ApiError('e_product_not_found', 404)
  const ext = ((await sql`SELECT external_id FROM dpp_products WHERE id = ${id}`) as Array<{ external_id: string | null }>)[0]?.external_id ?? null
  return {
    id: b.id,
    publicId: b.publicId,
    externalId: ext,
    status: b.status,
    version: b.version,
    revision: b.revision,
    hasUnpublishedChanges: b.version > 0 && b.hasChanges,
    defaultLang: b.defaultLang,
    texts: b.texts,
    data: b.data,
    itemCount: b.itemCount,
    passportUrl: b.passportUrl,
    digitalLink: b.digitalLink,
    updatedAt: b.updatedAt,
    publishedAt: b.publishedAt,
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v)

/** Kısmi güncelleme: metinler dil dil, veri alan alan birleştirilir; diziler (malzemeler, sertifikalar) tamamen değişir. */
export function mergeProduct(current: { texts: unknown; data: unknown; defaultLang: DppLang }, patch: Record<string, unknown>) {
  const texts = readTextsMap(current.texts) as Record<string, Record<string, unknown>>
  if (isObj(patch.texts)) for (const [lang, t] of Object.entries(patch.texts)) if (isObj(t)) texts[lang] = { ...(texts[lang] || {}), ...t }
  const data = readData(current.data) as unknown as Record<string, unknown>
  if (isObj(patch.data)) {
    for (const [k, v] of Object.entries(patch.data)) data[k] = isObj(v) && isObj(data[k]) ? { ...(data[k] as Record<string, unknown>), ...v } : v
  }
  return { defaultLang: typeof patch.defaultLang === 'string' ? patch.defaultLang : current.defaultLang, texts, data }
}

/**
 * Kısmi güncellemeyi kaydeder. İstemci revision gönderdiyse arada değişiklik olduğunda 409 döner;
 * göndermediyse güncel hali yeniden okuyup birleştirir ve birkaç kez dener (eşzamanlı ERP istekleri birbirini ezmez).
 */
export async function saveMerged(companyId: string, productId: string, body: Record<string, unknown>) {
  const explicit = body.revision !== undefined && body.revision !== null
  for (let attempt = 0; ; attempt++) {
    const cur = (await sql`SELECT texts, data, default_lang, revision FROM dpp_products WHERE id = ${productId} AND company_id = ${companyId}`) as Array<{ texts: unknown; data: unknown; default_lang: DppLang; revision: number }>
    if (!cur[0]) throw new ApiError('e_product_not_found', 404)
    const merged = mergeProduct({ texts: cur[0].texts, data: cur[0].data, defaultLang: cur[0].default_lang }, body)
    try {
      return await saveProduct(companyId, productId, { ...merged, revision: explicit ? body.revision : cur[0].revision })
    } catch (err) {
      if (explicit || attempt >= 4 || !(err instanceof DppError) || err.key !== 'e_conflict') throw err
    }
  }
}

/** ERP ürün koduyla ekle ya da güncelle (aynı istek tekrar gelirse çift kayıt oluşmaz). */
export async function upsertByExternalId(caller: ApiCaller, externalId: string, body: Record<string, unknown>) {
  const ext = externalId.trim().slice(0, 100)
  if (!ext) throw new ApiError('e_api_external_id', 400)
  const existing = (await sql`SELECT id, texts, data, default_lang, revision FROM dpp_products WHERE company_id = ${caller.companyId} AND external_id = ${ext}`) as Array<{
    id: string
    texts: unknown
    data: unknown
    default_lang: DppLang
    revision: number
  }>
  if (existing[0]) {
    const cur = existing[0]
    await saveMerged(caller.companyId, cur.id, body)
    await logApi(caller, 'product.upsert', cur.id, { externalId: ext, created: false })
    return { created: false, product: await productOut(caller.companyId, cur.id) }
  }
  const id = await saveProduct(caller.companyId, null, { defaultLang: body.defaultLang, texts: body.texts, data: body.data })
  try {
    await sql`UPDATE dpp_products SET external_id = ${ext} WHERE id = ${id}`
  } catch (err) {
    // Aynı anda iki istek: benzersizlik ihlali → ikinci kaydı geri al, diğer isteğin oluşturduğu kaydı güncelle.
    // Başka bir hatada (ya da kayıt bulunamazsa) yeniden denenmez: hata olduğu gibi döner.
    await sql`DELETE FROM dpp_products WHERE id = ${id} AND version = 0`
    const winner = (await sql`SELECT 1 FROM dpp_products WHERE company_id = ${caller.companyId} AND external_id = ${ext}`) as unknown[]
    if (!winner.length) throw err
    return upsertByExternalId(caller, ext, body)
  }
  await logApi(caller, 'product.upsert', id, { externalId: ext, created: true })
  return { created: true, product: await productOut(caller.companyId, id) }
}

/** Seri numarası (tekil ürün) çıktısı */
export function itemOut(row: Record<string, unknown>, gtin: string | null) {
  const serial = String(row.serial)
  return {
    serial,
    publicId: row.public_id,
    batch: row.batch || null,
    productionDate: row.production_day ? String(row.production_day) : null,
    passportUrl: passportUrl(String(row.public_id)),
    digitalLink: gtin ? digitalLink(gtin, serial) : null,
    status: row.dynamic && Object.keys(row.dynamic as object).length ? row.dynamic : null,
    statusUpdatedAt: row.dynamic_updated_at ?? null,
    createdAt: row.created_at,
  }
}

/** ERP ürün kodunu ayarlar; aynı kod firmada başka üründe varsa 409 */
export async function setExternalId(companyId: string, productId: string, externalId: unknown) {
  if (externalId === undefined) return
  const ext = externalId === null ? null : String(externalId).trim().slice(0, 100) || null
  try {
    await sql`UPDATE dpp_products SET external_id = ${ext} WHERE id = ${productId} AND company_id = ${companyId}`
  } catch {
    throw new ApiError('e_api_external_id_taken', 409, { id: ext || '' })
  }
}

/** Yol parametresi: Next çözmüş olabilir; bozuk % dizisinde olduğu gibi kullanılır */
export function pathParam(v: string) {
  try {
    return decodeURIComponent(v)
  } catch {
    return v
  }
}

export { digitalLink, passportUrl }
