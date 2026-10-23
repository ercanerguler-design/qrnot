import Anthropic from '@anthropic-ai/sdk'
import { head } from '@vercel/blob'
import { randomBytes } from 'crypto'
import { sql } from '@/lib/db'
import { SITE_URL } from '@/lib/site'
import { ensureDppSchema } from './schema'
import {
  DPP_DOC_KINDS,
  DPP_LANG_NAMES,
  DPP_TEXT_KEYS,
  isDppLang,
  publishIssues,
  readData,
  readTextsMap,
  sanitizeData,
  sanitizeTexts,
  type DppData,
  type DppDocKind,
  type DppLang,
  type DppPublicView,
  type DppTexts,
} from './types'
import { DppError } from './i18n'
import { trashBlob } from './safety'
import { assertDemoLimit } from './demoAccount'

// DPP iş kuralları: ürün kaydı, yayınlama (sürümlü), seri numarası üretimi, belgeler, çeviri ve herkese açık görünüm.

export const DPP_UPLOAD_MAX_BYTES = 25 * 1024 * 1024
export const DPP_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const uploadPrefixFor = (companyId: string) => `dpp/${companyId}/`

const ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
function randomId(length: number) {
  const bytes = randomBytes(length)
  return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('')
}

/** /p/{id} adresi ürünler ve tekil ürünler (seri no) arasında ortak: iki tabloda da benzersiz olmalı. */
async function newPublicId() {
  for (let i = 0; i < 8; i++) {
    const id = randomId(10)
    const clash = (await sql`
      SELECT 1 FROM dpp_products WHERE public_id = ${id} UNION ALL SELECT 1 FROM dpp_items WHERE public_id = ${id}
    `) as unknown[]
    if (clash.length === 0) return id
  }
  throw new DppError('e_id_failed')
}

export const passportUrl = (publicId: string) => `${SITE_URL}/p/${publicId}`
/** GS1 Digital Link biçimi: GTIN varsa ürün etiketlerinde bu adres kullanılabilir. */
export const digitalLink = (gtin: string, serial?: string) => `${SITE_URL}/01/${gtin}${serial ? `/21/${encodeURIComponent(serial)}` : ''}`

/* ───────────── Ürünler ───────────── */

export interface ProductRow {
  id: string
  public_id: string
  status: 'draft' | 'published' | 'archived'
  default_lang: string
  texts: unknown
  data: unknown
  image_url: string | null
  gtin: string | null
  version: number
  has_changes: boolean
  published: unknown
  published_at: string | null
  created_at: string
  updated_at: string
  revision: number
}

export async function listProducts(companyId: string) {
  await ensureDppSchema()
  return (await sql`
    SELECT p.id, p.public_id, p.status, p.default_lang, p.texts, p.data, p.image_url IS NOT NULL AS has_image, p.version, p.published_at, p.updated_at,
           (SELECT COUNT(*)::int FROM dpp_items i WHERE i.product_id = p.id) AS items,
           (SELECT COUNT(*)::int FROM dpp_documents d WHERE d.product_id = p.id) AS documents,
           (SELECT COUNT(*)::int FROM dpp_scans s WHERE s.product_id = p.id AND s.created_at > NOW() - INTERVAL '30 days') AS scans30,
           (p.published IS NOT NULL AND p.has_changes) AS has_draft_changes
    FROM dpp_products p
    WHERE p.company_id = ${companyId}
    ORDER BY p.updated_at DESC
    LIMIT 2000
  `) as Array<Record<string, unknown>>
}

export async function getProduct(companyId: string, productId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return null
  await ensureDppSchema()
  const rows = (await sql`SELECT * FROM dpp_products WHERE id = ${productId} AND company_id = ${companyId}`) as unknown as ProductRow[]
  return rows[0] || null
}

export async function getProductBundle(companyId: string, productId: string) {
  const product = await getProduct(companyId, productId)
  if (!product) return null
  const [documents, versions, itemCount] = await Promise.all([
    sql`SELECT id, title, kind, visibility, content_type, size_bytes, created_at FROM dpp_documents WHERE product_id = ${product.id} ORDER BY created_at`,
    sql`SELECT version, published_by, created_at FROM dpp_versions WHERE product_id = ${product.id} ORDER BY version DESC LIMIT 50`,
    sql`SELECT COUNT(*)::int AS n FROM dpp_items WHERE product_id = ${product.id}`,
  ])
  return {
    id: product.id,
    publicId: product.public_id,
    status: product.status,
    defaultLang: (isDppLang(product.default_lang) ? product.default_lang : 'tr') as DppLang,
    texts: readTextsMap(product.texts),
    data: readData(product.data),
    hasImage: Boolean(product.image_url),
    version: product.version,
    revision: Number(product.revision || 0),
    hasChanges: product.has_changes,
    publishedAt: product.published_at,
    updatedAt: product.updated_at,
    documents,
    versions,
    itemCount: Number((itemCount as Array<{ n: number }>)[0]?.n || 0),
    passportUrl: passportUrl(product.public_id),
    digitalLink: readData(product.data).gtin ? digitalLink(readData(product.data).gtin) : null,
  }
}

async function companyLimit(companyId: string) {
  const rows = (await sql`
    SELECT c.product_limit, (SELECT COUNT(*)::int FROM dpp_products p WHERE p.company_id = c.id AND p.status <> 'archived') AS used
    FROM dpp_companies c WHERE c.id = ${companyId}
  `) as Array<{ product_limit: number; used: number }>
  return rows[0] || { product_limit: 0, used: 0 }
}

/** Blob yüklemesinin bu firmaya ait ve izin verilen türde olduğunu doğrular. */
export async function verifyUpload(companyId: string, blobUrl: string, imageOnly: boolean) {
  let meta: Awaited<ReturnType<typeof head>>
  try {
    meta = await head(blobUrl, { token: String(process.env.BLOB_READ_WRITE_TOKEN || '').trim() })
  } catch {
    throw new DppError('e_upload_missing')
  }
  if (!meta.pathname.startsWith(uploadPrefixFor(companyId))) throw new DppError('e_upload_foreign')
  const type = (meta.contentType || '').toLowerCase()
  if (!DPP_UPLOAD_TYPES.includes(type) || (imageOnly && !type.startsWith('image/'))) throw new DppError(imageOnly ? 'e_img_type' : 'e_file_type')
  if (meta.size > DPP_UPLOAD_MAX_BYTES) throw new DppError('e_file_size')
  return { url: meta.url, contentType: type, size: meta.size }
}

export async function saveProduct(
  companyId: string,
  productId: string | null,
  input: { defaultLang?: unknown; texts?: unknown; data?: unknown; imageUrl?: unknown; removeImage?: unknown; revision?: unknown }
) {
  await ensureDppSchema()
  const defaultLang: DppLang = isDppLang(input.defaultLang) ? input.defaultLang : 'tr'
  const texts = readTextsMap(input.texts)
  const data = sanitizeData(input.data)
  if (!texts[defaultLang]?.name) throw new DppError('e_name_required', { lang: DPP_LANG_NAMES[defaultLang] })

  let imageUrl: string | null | undefined
  if (typeof input.imageUrl === 'string' && input.imageUrl) imageUrl = (await verifyUpload(companyId, input.imageUrl, true)).url
  else if (input.removeImage === true) imageUrl = null

  if (!productId) {
    const { product_limit, used } = await companyLimit(companyId)
    if (used >= product_limit) throw new DppError('e_limit', { n: product_limit })
    const publicId = await newPublicId()
    const rows = (await sql`
      INSERT INTO dpp_products (company_id, public_id, default_lang, texts, data, image_url, gtin)
      VALUES (${companyId}, ${publicId}, ${defaultLang}, ${JSON.stringify(texts)}::jsonb, ${JSON.stringify(data)}::jsonb, ${imageUrl ?? null}, ${data.gtin || null})
      RETURNING id
    `) as Array<{ id: string }>
    return rows[0].id
  }

  const current = await getProduct(companyId, productId)
  if (!current) throw new DppError('e_product_not_found')
  const oldImage = current.image_url
  // Panel ürünü açtığındaki revizyonu gönderir; arada başka biri (ya da çeviri / tedarikçi aktarımı) kaydettiyse üzerine yazılmaz
  const expected = input.revision === undefined || input.revision === null ? null : Number(input.revision)
  const updated = (await sql`
    UPDATE dpp_products
    SET default_lang = ${defaultLang}, texts = ${JSON.stringify(texts)}::jsonb, data = ${JSON.stringify(data)}::jsonb, gtin = ${data.gtin || null},
        image_url = ${imageUrl === undefined ? oldImage : imageUrl}, has_changes = TRUE, updated_at = NOW(), revision = revision + 1
    WHERE id = ${productId} AND company_id = ${companyId} AND (${expected}::int IS NULL OR revision = ${expected}::int)
    RETURNING id
  `) as unknown[]
  if (!updated.length) throw new DppError('e_conflict')
  // Eski görsel sadece hiçbir yayınlanmış sürümde kullanılmıyorsa silinir (yayınlanmış pasaport bozulmasın)
  if (imageUrl !== undefined && oldImage && oldImage !== imageUrl) {
    const used = (await sql`SELECT 1 FROM dpp_versions WHERE product_id = ${productId} AND snapshot->>'imageUrl' = ${oldImage} LIMIT 1`) as unknown[]
    if (used.length === 0) await trashBlob(oldImage, companyId, 'image-replaced')
  }
  return productId
}

export async function publishProduct(companyId: string, productId: string, byEmail: string) {
  const product = await getProduct(companyId, productId)
  if (!product) throw new DppError('e_product_not_found')
  const texts = readTextsMap(product.texts)
  const data = readData(product.data)
  const defaultLang = (isDppLang(product.default_lang) ? product.default_lang : 'tr') as DppLang
  const issues = publishIssues(texts, defaultLang, data)
  if (issues.length) throw new DppError('e_publish_incomplete', {}, issues)

  const version = product.version + 1
  const snapshot = { version, defaultLang, texts, data, imageUrl: product.image_url }
  await sql`INSERT INTO dpp_versions (product_id, version, snapshot, published_by) VALUES (${product.id}, ${version}, ${JSON.stringify(snapshot)}::jsonb, ${byEmail})`
  await sql`
    UPDATE dpp_products SET status = 'published', version = ${version}, published = ${JSON.stringify(snapshot)}::jsonb, published_at = NOW(), has_changes = FALSE
    WHERE id = ${product.id}
  `
  return version
}

export async function setArchived(companyId: string, productId: string, archived: boolean) {
  const product = await getProduct(companyId, productId)
  if (!product) throw new DppError('e_product_not_found')
  if (!archived) {
    const { product_limit, used } = await companyLimit(companyId)
    if (product.status === 'archived' && used >= product_limit) throw new DppError('e_limit', { n: product_limit })
  }
  const status = archived ? 'archived' : product.published ? 'published' : 'draft'
  await sql`UPDATE dpp_products SET status = ${status} WHERE id = ${product.id}`
}

/** Yayınlanmış pasaport silinmez (ürün ömrü boyunca erişilebilir kalmalı); sadece hiç yayınlanmamış taslak silinir. */
export async function deleteDraft(companyId: string, productId: string) {
  const product = await getProduct(companyId, productId)
  if (!product) throw new DppError('e_product_not_found')
  if (product.version > 0) throw new DppError('e_cannot_delete_published')
  const docs = (await sql`SELECT blob_url FROM dpp_documents WHERE product_id = ${product.id}`) as Array<{ blob_url: string }>
  // Tedarikçilerin yüklediği, ürüne aktarılmamış dosyalar (aktarılanlar zaten dpp_documents içinde)
  const supplierFiles = (await sql`
    SELECT f->>'url' AS url FROM dpp_supplier_requests r, jsonb_array_elements(COALESCE(r.response->'files', '[]'::jsonb)) f
    WHERE r.product_id = ${product.id} AND COALESCE((f->>'applied')::boolean, FALSE) = FALSE
  `) as Array<{ url: string }>
  await sql`DELETE FROM dpp_products WHERE id = ${product.id}`
  for (const url of [...docs.map((d) => d.blob_url), ...supplierFiles.map((f) => f.url), product.image_url].filter(Boolean) as string[]) await trashBlob(url, companyId, 'draft-deleted')
}

export async function duplicateProduct(companyId: string, productId: string) {
  const product = await getProduct(companyId, productId)
  if (!product) throw new DppError('e_product_not_found')
  const texts = readTextsMap(product.texts)
  for (const lang of Object.keys(texts) as DppLang[]) texts[lang] = { ...texts[lang]!, name: `${texts[lang]!.name} (kopya)`.slice(0, 200) }
  const data = { ...readData(product.data), gtin: '' }
  return saveProduct(companyId, null, { defaultLang: product.default_lang, texts, data })
}

/* ───────────── Seri numaraları (tekil ürün pasaportları) ───────────── */

const MAX_ITEMS_PER_PRODUCT = 100_000

export async function generateItems(
  companyId: string,
  productId: string,
  input: { count?: unknown; prefix?: unknown; start?: unknown; batch?: unknown; productionDate?: unknown }
) {
  const product = await getProduct(companyId, productId)
  if (!product) throw new DppError('e_product_not_found')
  const count = Math.floor(Number(input.count))
  if (!Number.isFinite(count) || count < 1 || count > 2000) throw new DppError('e_items_range')
  const prefix = String(input.prefix || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16)
  const start = Math.max(1, Math.floor(Number(input.start) || 1))
  const batch = String(input.batch || '').trim().slice(0, 40)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.productionDate || '')) ? String(input.productionDate) : null
  const existing = Number(((await sql`SELECT COUNT(*)::int AS n FROM dpp_items WHERE product_id = ${product.id}`) as Array<{ n: number }>)[0]?.n || 0)
  if (existing + count > MAX_ITEMS_PER_PRODUCT) throw new DppError('e_items_max', { n: MAX_ITEMS_PER_PRODUCT })
  await assertDemoLimit(companyId, 'items', { add: count })

  const width = Math.max(6, String(start + count - 1).length)
  const serials = Array.from({ length: count }, (_, i) => `${prefix}${String(start + i).padStart(width, '0')}`)
  const taken = new Set(
    ((await sql`SELECT serial FROM dpp_items WHERE product_id = ${product.id} AND serial = ANY(${serials})`) as Array<{ serial: string }>).map((r) => r.serial)
  )
  const fresh = serials.filter((s) => !taken.has(s))
  // Toplu ekleme: kimlikler önceden üretilip tek sorguda yazılır
  const ids: string[] = []
  const seen = new Set<string>()
  while (ids.length < fresh.length) {
    const id = randomId(10)
    if (!seen.has(id)) {
      seen.add(id)
      ids.push(id)
    }
  }
  const clashes = (await sql`
    SELECT public_id FROM dpp_items WHERE public_id = ANY(${ids}) UNION SELECT public_id FROM dpp_products WHERE public_id = ANY(${ids})
  `) as Array<{ public_id: string }>
  if (clashes.length) throw new DppError('e_id_clash')
  if (fresh.length) {
    await sql`
      INSERT INTO dpp_items (product_id, public_id, serial, batch, production_date)
      SELECT ${product.id}, unnest(${ids}::text[]), unnest(${fresh}::text[]), ${batch}, ${date}::date
      ON CONFLICT (product_id, serial) DO NOTHING
    `
  }
  return { created: fresh.length, skipped: taken.size }
}

export async function listItems(companyId: string, productId: string, opts: { q?: string; limit?: number; offset?: number }) {
  const product = await getProduct(companyId, productId)
  if (!product) throw new DppError('e_product_not_found')
  const q = String(opts.q || '').trim()
  const like = `%${q}%`
  const limit = Math.min(5000, Math.max(1, opts.limit || 200))
  const rows = await sql`
    SELECT id, public_id, serial, batch, production_date, created_at,
           (SELECT COUNT(*)::int FROM dpp_scans s WHERE s.item_id = i.id) AS scans
    FROM dpp_items i
    WHERE product_id = ${product.id} AND (${q} = '' OR serial ILIKE ${like} OR batch ILIKE ${like})
    ORDER BY created_at DESC, serial DESC
    LIMIT ${limit} OFFSET ${Math.max(0, opts.offset || 0)}
  `
  const total = Number(((await sql`SELECT COUNT(*)::int AS n FROM dpp_items WHERE product_id = ${product.id}`) as Array<{ n: number }>)[0]?.n || 0)
  return { items: rows, total }
}

export async function deleteItems(companyId: string, productId: string, itemIds: string[]) {
  const product = await getProduct(companyId, productId)
  if (!product) throw new DppError('e_product_not_found')
  const ids = itemIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 2000)
  if (!ids.length) return 0
  const rows = (await sql`DELETE FROM dpp_items WHERE product_id = ${product.id} AND id = ANY(${ids}::uuid[]) RETURNING id`) as unknown[]
  return rows.length
}

/* ───────────── Belgeler ───────────── */

export async function addDocument(companyId: string, productId: string, input: { blobUrl?: unknown; title?: unknown; kind?: unknown; visibility?: unknown }) {
  const product = await getProduct(companyId, productId)
  if (!product) throw new DppError('e_product_not_found')
  const count = Number(((await sql`SELECT COUNT(*)::int AS n FROM dpp_documents WHERE product_id = ${product.id}`) as Array<{ n: number }>)[0]?.n || 0)
  if (count >= 40) throw new DppError('e_docs_max')
  await assertDemoLimit(companyId, 'docs', { productId: product.id })
  const file = await verifyUpload(companyId, String(input.blobUrl || ''), false)
  const title = String(input.title || '').trim().slice(0, 200)
  if (!title) throw new DppError('e_doc_title_required')
  const kind = (String(input.kind) in DPP_DOC_KINDS ? String(input.kind) : 'other') as DppDocKind
  const visibility = input.visibility === 'restricted' ? 'restricted' : 'public'
  await sql`
    INSERT INTO dpp_documents (product_id, title, kind, visibility, blob_url, content_type, size_bytes)
    VALUES (${product.id}, ${title}, ${kind}, ${visibility}, ${file.url}, ${file.contentType}, ${file.size})
  `
}

export async function updateDocument(companyId: string, docId: string, input: { title?: unknown; kind?: unknown; visibility?: unknown }) {
  if (!/^[0-9a-f-]{36}$/i.test(docId)) throw new DppError('e_doc_not_found')
  const title = String(input.title || '').trim().slice(0, 200)
  if (!title) throw new DppError('e_doc_title_required')
  const kind = String(input.kind) in DPP_DOC_KINDS ? String(input.kind) : 'other'
  const visibility = input.visibility === 'restricted' ? 'restricted' : 'public'
  const rows = (await sql`
    UPDATE dpp_documents d SET title = ${title}, kind = ${kind}, visibility = ${visibility}
    FROM dpp_products p WHERE d.id = ${docId} AND p.id = d.product_id AND p.company_id = ${companyId}
    RETURNING d.id
  `) as unknown[]
  if (!rows.length) throw new DppError('e_doc_not_found')
}

export async function deleteDocument(companyId: string, docId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(docId)) throw new DppError('e_doc_not_found')
  const rows = (await sql`
    DELETE FROM dpp_documents d USING dpp_products p
    WHERE d.id = ${docId} AND p.id = d.product_id AND p.company_id = ${companyId}
    RETURNING d.blob_url
  `) as Array<{ blob_url: string }>
  if (!rows.length) throw new DppError('e_doc_not_found')
  await trashBlob(rows[0].blob_url, companyId, 'document-deleted')
}

/* ───────────── Otomatik çeviri (Claude) ───────────── */

export function translationEnabled() {
  return Boolean(String(process.env.ANTHROPIC_API_KEY || '').trim())
}

let anthropic: Anthropic | null = null
function claude() {
  if (!anthropic) {
    const workspaceId = String(process.env.ANTHROPIC_WORKSPACE_ID || '').trim()
    anthropic = new Anthropic(workspaceId ? { defaultHeaders: { 'anthropic-workspace-id': workspaceId } } : {})
  }
  return anthropic
}

async function translateTexts(source: DppTexts, materials: string[], from: DppLang, to: DppLang): Promise<DppTexts> {
  const filled: Record<string, string | string[]> = Object.fromEntries(DPP_TEXT_KEYS.filter((k) => source[k]).map((k) => [k, source[k]]))
  // Malzeme adları da çevrilir (aynı sırada dizi olarak döner)
  if (materials.some(Boolean)) filled.materialNames = materials
  if (Object.keys(filled).length === 0) return sanitizeTexts({})
  const response = await claude().beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system:
      'You translate product information for an EU Digital Product Passport. Translate every value of the JSON object from the source language to the target language accurately, using standard technical and regulatory terminology for product safety, materials, care, repair and recycling. "materialNames" is an array of material names: return an array of the same length and order. Keep brand names, model codes, numbers, units and certificate names unchanged. Return only a JSON object with exactly the same keys, with no notes or code fences.',
    messages: [{ role: 'user', content: `Source language: ${DPP_LANG_NAMES[from]}\nTarget language: ${DPP_LANG_NAMES[to]}\n\n${JSON.stringify(filled)}` }],
  })
  if (response.stop_reason === 'refusal') throw new DppError('e_translate_refused')
  const raw = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new DppError('e_translate_parse')
  }
  return sanitizeTexts(parsed)
}

/** Varsayılan dildeki metinleri seçilen dillere çevirir ve taslağa yazar (yayın için ayrıca "Yayınla" gerekir). */
export async function translateProduct(companyId: string, productId: string, targets: unknown) {
  if (!translationEnabled()) throw new DppError('e_translate_off')
  const product = await getProduct(companyId, productId)
  if (!product) throw new DppError('e_product_not_found')
  const from = (isDppLang(product.default_lang) ? product.default_lang : 'tr') as DppLang
  const texts = readTextsMap(product.texts)
  const source = texts[from]
  if (!source?.name) throw new DppError('e_fill_default_first')
  const langs = (Array.isArray(targets) ? targets : []).filter((l): l is DppLang => isDppLang(l) && l !== from).slice(0, 7)
  if (!langs.length) throw new DppError('e_choose_lang')
  await assertDemoLimit(companyId, 'translate')
  const materials = readData(product.data).materials.map((m) => m.name)
  const results = await Promise.allSettled(langs.map((lang) => translateTexts(source, materials, from, lang)))
  const done: DppLang[] = []
  const failed: DppLang[] = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      texts[langs[i]] = r.value
      done.push(langs[i])
    } else {
      console.error('[dpp translate]', langs[i], r.reason)
      failed.push(langs[i])
    }
  })
  if (!done.length) throw new DppError('e_translate_failed')
  // Çeviri sürerken ürün kaydedildiyse çeviri o kaydı ezmez
  const written = (await sql`
    UPDATE dpp_products SET texts = ${JSON.stringify(texts)}::jsonb, has_changes = TRUE, updated_at = NOW(), revision = revision + 1
    WHERE id = ${product.id} AND revision = ${Number(product.revision || 0)}
    RETURNING id
  `) as unknown[]
  if (!written.length) throw new DppError('e_conflict')
  return { done, failed }
}

/* ───────────── Herkese açık pasaport ───────────── */

interface Snapshot {
  version: number
  defaultLang: DppLang
  texts: Partial<Record<DppLang, DppTexts>>
  data: DppData
  imageUrl: string | null
}

export async function resolvePassport(publicId: string) {
  if (!/^[a-z0-9]{6,16}$/.test(publicId)) return null
  await ensureDppSchema()
  const rows = (await sql`
    SELECT p.id AS product_id, p.status, p.published, p.published_at, p.public_id AS product_public_id,
           c.name AS company_name, c.country AS company_country, c.website AS company_website, c.restricted_key, c.is_active AS company_active,
           c.plan AS company_plan, c.demo_expires_at,
           i.id AS item_id, i.serial, i.batch, i.production_date
    FROM dpp_products p
    JOIN dpp_companies c ON c.id = p.company_id
    LEFT JOIN dpp_items i ON i.public_id = ${publicId} AND i.product_id = p.id
    WHERE p.public_id = ${publicId} OR p.id = (SELECT product_id FROM dpp_items WHERE public_id = ${publicId})
    LIMIT 1
  `) as Array<Record<string, unknown>>
  const r = rows[0]
  if (!r || !r.published || r.company_active === false) return null
  // Süresi dolmuş demo firmasının pasaportları kapanır
  if (r.demo_expires_at && new Date(String(r.demo_expires_at)).getTime() < Date.now()) return null
  return r
}

export async function loadPublicPassport(publicId: string, key: string | null): Promise<(DppPublicView & { productId: string; itemId: string | null; status: string }) | null> {
  const r = await resolvePassport(publicId)
  if (!r) return null
  const snap = r.published as Snapshot
  const restrictedAccess = Boolean(key && String(r.restricted_key) === key)
  const texts = readTextsMap(snap.texts)
  const langs = (Object.keys(texts) as DppLang[]).filter((l) => texts[l]?.name)
  const data = readData(snap.data)
  const { restricted, ...open } = data
  const docs = (await sql`
    SELECT id, title, kind, visibility, content_type, size_bytes FROM dpp_documents
    WHERE product_id = ${String(r.product_id)} AND (${restrictedAccess} OR visibility = 'public')
    ORDER BY created_at
  `) as Array<{ id: string; title: string; kind: DppDocKind; visibility: string; content_type: string; size_bytes: number }>
  return {
    productId: String(r.product_id),
    itemId: r.item_id ? String(r.item_id) : null,
    status: String(r.status),
    publicId: String(r.product_public_id),
    version: snap.version,
    publishedAt: new Date(String(r.published_at)).toISOString(),
    defaultLang: isDppLang(snap.defaultLang) ? snap.defaultLang : 'tr',
    langs,
    texts,
    data: restrictedAccess ? { ...open, restricted } : open,
    hasImage: Boolean(snap.imageUrl),
    company: { name: String(r.company_name), country: String(r.company_country || ''), website: String(r.company_website || '') },
    item: r.item_id
      ? { serial: String(r.serial), batch: String(r.batch || ''), productionDate: r.production_date ? new Date(String(r.production_date)).toISOString().slice(0, 10) : null }
      : null,
    documents: docs.map((d) => ({ id: d.id, title: d.title, kind: d.kind, restricted: d.visibility === 'restricted', contentType: d.content_type, sizeBytes: d.size_bytes })),
    restrictedAccess,
    demo: r.company_plan === 'demo',
  }
}

export async function recordPassportScan(productId: string, itemId: string | null, country: string, lang: string) {
  await sql`
    INSERT INTO dpp_scans (product_id, item_id, country, lang)
    VALUES (${productId}, ${itemId}, ${country.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)}, ${lang.slice(0, 4)})
  `
}

/** Makinenin okuyabileceği biçim (JSON). Alan adları sabittir; şema sürümü "qrnot-dpp/1". */
export function passportJson(view: DppPublicView) {
  return {
    schema: 'qrnot-dpp/1',
    id: passportUrl(view.publicId),
    version: view.version,
    publishedAt: view.publishedAt,
    status: view.restrictedAccess ? 'restricted-view' : 'public-view',
    ...(view.demo ? { demo: true } : {}),
    product: {
      gtin: view.data.gtin || null,
      digitalLink: view.data.gtin ? digitalLink(view.data.gtin, view.item?.serial) : null,
      brand: view.data.brand,
      model: view.data.model,
      category: view.data.category,
      countryOfOrigin: view.data.countryOfOrigin,
      weightGrams: view.data.weightGrams,
      dimensions: view.data.dimensions,
    },
    item: view.item,
    economicOperators: { manufacturer: view.data.manufacturer, euOperator: view.data.euOperator, brandOwner: view.company },
    materials: view.data.materials,
    environment: view.data.environment,
    repairability: view.data.repairability,
    compliance: view.data.compliance,
    substancesOfConcern: view.data.substancesOfConcern,
    texts: view.texts,
    defaultLanguage: view.defaultLang,
    documents: view.documents.map((d) => ({ title: d.title, kind: d.kind, url: `${SITE_URL}/api/dpp/doc/${d.id}`, contentType: d.contentType })),
    restricted: view.restrictedAccess ? view.data.restricted : undefined,
  }
}

/* ───────────── Panel özeti ───────────── */

export async function companyOverview(companyId: string) {
  await ensureDppSchema()
  const [counts, daily, top, countries, company] = await Promise.all([
    sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'published')::int AS published,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE status = 'archived')::int AS archived,
        (SELECT COUNT(*)::int FROM dpp_items i JOIN dpp_products p2 ON p2.id = i.product_id WHERE p2.company_id = ${companyId}) AS items,
        (SELECT COUNT(*)::int FROM dpp_scans s JOIN dpp_products p3 ON p3.id = s.product_id WHERE p3.company_id = ${companyId} AND s.created_at > NOW() - INTERVAL '30 days') AS scans30
      FROM dpp_products WHERE company_id = ${companyId}
    `,
    sql`
      SELECT to_char(d, 'YYYY-MM-DD') AS day, COALESCE(x.n, 0)::int AS scans
      FROM generate_series((NOW() AT TIME ZONE 'Europe/Istanbul')::date - 29, (NOW() AT TIME ZONE 'Europe/Istanbul')::date, INTERVAL '1 day') d
      LEFT JOIN (
        SELECT (s.created_at AT TIME ZONE 'Europe/Istanbul')::date AS day, COUNT(*) AS n
        FROM dpp_scans s JOIN dpp_products p ON p.id = s.product_id
        WHERE p.company_id = ${companyId} AND s.created_at > NOW() - INTERVAL '31 days'
        GROUP BY 1
      ) x ON x.day = d::date
      ORDER BY d
    `,
    sql`
      SELECT p.id, p.texts, p.default_lang, COUNT(s.id)::int AS scans
      FROM dpp_products p JOIN dpp_scans s ON s.product_id = p.id
      WHERE p.company_id = ${companyId} AND s.created_at > NOW() - INTERVAL '30 days'
      GROUP BY p.id ORDER BY scans DESC LIMIT 5
    `,
    sql`
      SELECT s.country, COUNT(*)::int AS scans
      FROM dpp_scans s JOIN dpp_products p ON p.id = s.product_id
      WHERE p.company_id = ${companyId} AND s.created_at > NOW() - INTERVAL '30 days' AND s.country <> ''
      GROUP BY s.country ORDER BY scans DESC LIMIT 8
    `,
    sql`SELECT plan, product_limit FROM dpp_companies WHERE id = ${companyId}`,
  ])
  return {
    counts: counts[0],
    daily,
    top: (top as Array<{ id: string; texts: unknown; default_lang: string; scans: number }>).map((t) => {
      const texts = readTextsMap(t.texts)
      const lang = (isDppLang(t.default_lang) ? t.default_lang : 'tr') as DppLang
      return { id: t.id, name: texts[lang]?.name || '—', scans: t.scans }
    }),
    countries,
    plan: company[0],
  }
}
