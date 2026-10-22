import { head } from '@vercel/blob'
import { randomBytes } from 'crypto'
import { deleteBlob } from '@/lib/blob'
import { sql } from '@/lib/db'
import { SITE_URL } from '@/lib/site'
import { DppError } from './i18n'
import { ensureDppSchema } from './schema'
import { DPP_UPLOAD_MAX_BYTES, DPP_UPLOAD_TYPES, getProduct, uploadPrefixFor } from './server'
import { isDppLang, readData, readTextsMap, sanitizeData, type DppData, type DppLang, type DppMaterial } from './types'

// Tedarikçi veri portalı: firma bir ürün için tahmin edilemez bir link oluşturur, tedarikçi giriş yapmadan
// malzeme / sertifika / tesis / SVHC / karbon bilgilerini ve belgelerini gönderir, firma inceleyip seçtiği
// bölümleri ürüne aktarır. Tedarikçinin yüklediği dosyalar firmanın kendi Blob klasöründe (sr/{talep}) tutulur.

export const SUPPLIER_FIELDS = ['materials', 'certificates', 'facility', 'substances', 'carbon'] as const
export type SupplierField = (typeof SUPPLIER_FIELDS)[number]
export const APPLY_SECTIONS = ['materials', 'certificates', 'facility', 'substances', 'carbon', 'files', 'notes'] as const
export type ApplySection = (typeof APPLY_SECTIONS)[number]
export type SupplierStatus = 'open' | 'submitted' | 'applied' | 'rejected' | 'expired'

const MAX_FILES = 20
const MAX_REQUESTS_PER_PRODUCT = 50

export interface SupplierFile {
  url: string
  title: string
  contentType: string
  size: number
  /** Ürün belgelerine aktarıldıysa blob artık ürüne aittir; talep silinince silinmez */
  applied?: boolean
}

export interface SupplierResponse {
  company: string
  contactName: string
  contactEmail: string
  materials: DppMaterial[]
  certificates: Array<{ name: string; reference: string; validUntil: string }>
  facility: string
  substances: string
  carbonPerKg: number | null
  carbonMethod: string
  notes: string
  files: SupplierFile[]
}

interface RequestRow {
  id: string
  company_id: string
  product_id: string
  token: string
  supplier_name: string
  contact: string
  message: string
  fields: unknown
  lang: string
  status: string
  response: SupplierResponse | null
  expires_at: string
  submitted_at: string | null
  created_by: string
  created_at: string
}

const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v)
const isToken = (v: string) => /^[A-Za-z0-9_-]{32,48}$/.test(v)
export const supplierUrl = (token: string) => `${SITE_URL}/dpp/s/${token}`
export const supplierUploadPrefix = (companyId: string, requestId: string) => `${uploadPrefixFor(companyId)}sr/${requestId}/`

function readFields(v: unknown): SupplierField[] {
  const list = Array.isArray(v) ? v : []
  return SUPPLIER_FIELDS.filter((f) => list.includes(f))
}

function statusOf(row: Pick<RequestRow, 'status' | 'expires_at'>): SupplierStatus {
  if (row.status === 'open' && new Date(row.expires_at).getTime() < Date.now()) return 'expired'
  return (['open', 'submitted', 'applied', 'rejected'].includes(row.status) ? row.status : 'open') as SupplierStatus
}

/** Tedarikçi linkten formu doldurabilir mi? (Yanıt gönderilmişse firma inceleyene kadar düzenleyebilir.) */
function supplierCanEdit(row: Pick<RequestRow, 'status' | 'expires_at'>) {
  return (row.status === 'open' || row.status === 'submitted') && new Date(row.expires_at).getTime() >= Date.now()
}

function emptyResponse(): SupplierResponse {
  return { company: '', contactName: '', contactEmail: '', materials: [], certificates: [], facility: '', substances: '', carbonPerKg: null, carbonMethod: '', notes: '', files: [] }
}

function readResponse(v: unknown): SupplierResponse | null {
  if (!v || typeof v !== 'object') return null
  return { ...emptyResponse(), ...(v as SupplierResponse) }
}

/** Yanıttaki dosyaların blob adreslerini dışarı vermeden, indirme adresleriyle döndürür */
function publicResponse(row: RequestRow, token?: string) {
  const r = readResponse(row.response)
  if (!r) return null
  return {
    ...r,
    files: r.files.map((f, i) => ({
      title: f.title,
      contentType: f.contentType,
      size: f.size,
      applied: Boolean(f.applied),
      href: `/api/dpp/supplier/file?r=${row.id}&i=${i}${token ? `&t=${token}` : ''}`,
      // Gönderimde dosyayı korumak için tedarikçiye kendi yüklediği adres geri verilir (tahmin edilemez, özel blob)
      ...(token ? { url: f.url } : {}),
    })),
  }
}

/* ───────────── Firma paneli ───────────── */

export async function listSupplierRequests(companyId: string, productId: string) {
  await ensureDppSchema()
  if (!isUuid(productId)) throw new DppError('e_product_not_found')
  const rows = (await sql`
    SELECT * FROM dpp_supplier_requests WHERE company_id = ${companyId} AND product_id = ${productId} ORDER BY created_at DESC LIMIT 100
  `) as unknown as RequestRow[]
  return {
    requests: rows.map((r) => ({
      id: r.id,
      supplierName: r.supplier_name,
      contact: r.contact,
      message: r.message,
      fields: readFields(r.fields),
      lang: r.lang,
      status: statusOf(r),
      expiresAt: r.expires_at,
      submittedAt: r.submitted_at,
      createdAt: r.created_at,
      createdBy: r.created_by,
      url: supplierUrl(r.token),
      response: publicResponse(r),
    })),
  }
}

export async function createSupplierRequest(companyId: string, byEmail: string, input: Record<string, unknown>) {
  await ensureDppSchema()
  const product = await getProduct(companyId, str(input.productId, 40))
  if (!product) throw new DppError('e_product_not_found')
  const supplierName = str(input.supplierName, 200)
  if (!supplierName) throw new DppError('e_supplier_required')
  const fields = readFields(input.fields)
  if (!fields.length) throw new DppError('e_fields_required')
  const count = Number(((await sql`SELECT COUNT(*)::int AS n FROM dpp_supplier_requests WHERE product_id = ${product.id}`) as Array<{ n: number }>)[0]?.n || 0)
  if (count >= MAX_REQUESTS_PER_PRODUCT) throw new DppError('e_requests_max')
  const days = Math.min(90, Math.max(1, Math.round(Number(input.days) || 30)))
  const lang: DppLang = isDppLang(input.lang) ? input.lang : 'tr'
  const token = randomBytes(24).toString('base64url')
  const rows = (await sql`
    INSERT INTO dpp_supplier_requests (company_id, product_id, token, supplier_name, contact, message, fields, lang, expires_at, created_by)
    VALUES (${companyId}, ${product.id}, ${token}, ${supplierName}, ${str(input.contact, 200)}, ${str(input.message, 2000)}, ${JSON.stringify(fields)}::jsonb,
            ${lang}, NOW() + make_interval(days => ${days}), ${byEmail})
    RETURNING id
  `) as Array<{ id: string }>
  return { id: rows[0].id, url: supplierUrl(token) }
}

async function ownRequest(companyId: string, requestId: string) {
  if (!isUuid(requestId)) throw new DppError('e_request_not_found')
  await ensureDppSchema()
  const rows = (await sql`SELECT * FROM dpp_supplier_requests WHERE id = ${requestId} AND company_id = ${companyId}`) as unknown as RequestRow[]
  if (!rows[0]) throw new DppError('e_request_not_found')
  return rows[0]
}

export async function setSupplierRequestStatus(companyId: string, requestId: string, action: 'reject' | 'reopen', days?: unknown) {
  const row = await ownRequest(companyId, requestId)
  if (action === 'reject') {
    await sql`UPDATE dpp_supplier_requests SET status = 'rejected', updated_at = NOW() WHERE id = ${row.id}`
    return
  }
  const d = Math.min(90, Math.max(1, Math.round(Number(days) || 14)))
  await sql`
    UPDATE dpp_supplier_requests SET status = 'open', expires_at = NOW() + make_interval(days => ${d}), updated_at = NOW() WHERE id = ${row.id}
  `
}

export async function deleteSupplierRequest(companyId: string, requestId: string) {
  const row = await ownRequest(companyId, requestId)
  await sql`DELETE FROM dpp_supplier_requests WHERE id = ${row.id}`
  await deleteFiles(readResponse(row.response)?.files.filter((f) => !f.applied) || [])
}

/** Ürün silinirken: aktarılmamış tedarikçi dosyalarını temizler (satırlar CASCADE ile silinir) */
export async function supplierFilesForProduct(productId: string) {
  await ensureDppSchema()
  const rows = (await sql`SELECT response FROM dpp_supplier_requests WHERE product_id = ${productId}`) as Array<{ response: unknown }>
  return rows.flatMap((r) => readResponse(r.response)?.files.filter((f) => !f.applied).map((f) => f.url) || [])
}

async function deleteFiles(files: SupplierFile[]) {
  for (const f of files) await deleteBlob(f.url).catch(() => undefined)
}

/** Yanıtın seçilen bölümlerini ürün taslağına aktarır. Yayınlamaz; firma kontrol edip yayınlar. */
export async function applySupplierResponse(companyId: string, requestId: string, sectionsInput: unknown) {
  const row = await ownRequest(companyId, requestId)
  const response = readResponse(row.response)
  if (!response || row.status === 'open' || row.status === 'rejected') throw new DppError('e_request_closed')
  const sections = APPLY_SECTIONS.filter((s) => Array.isArray(sectionsInput) && sectionsInput.includes(s))
  if (!sections.length) throw new DppError('e_fields_required')
  const product = await getProduct(companyId, row.product_id)
  if (!product) throw new DppError('e_product_not_found')

  const data: DppData = readData((product as unknown as { data: unknown }).data)
  const who = [response.company || row.supplier_name, response.contactName, response.contactEmail].filter(Boolean).join(' · ')
  const appendLine = (current: string, line: string) => (current.includes(line) ? current : [current.trim(), line].filter(Boolean).join('\n'))

  // Kim, neyi beyan etti: tedarikçi her aktarımda yetkili erişim bölümüne kaydedilir
  data.restricted.suppliers = appendLine(data.restricted.suppliers, who)

  if (sections.includes('materials') && response.materials.length) data.materials = response.materials.map((m) => ({ ...m, type: m.type || '' }))
  if (sections.includes('certificates')) {
    for (const c of response.certificates) {
      const reference = [c.reference, c.validUntil ? `≤ ${c.validUntil}` : ''].filter(Boolean).join(' ')
      if (!data.compliance.some((x) => x.name === c.name && x.reference === reference)) data.compliance.push({ name: c.name, reference })
    }
  }
  if (sections.includes('facility') && response.facility) data.restricted.facility = appendLine(data.restricted.facility, response.facility)
  if (sections.includes('substances') && response.substances) data.substancesOfConcern = appendLine(data.substancesOfConcern, response.substances)
  // Tedarikçinin karbon değeri malzeme başınadır (kg CO₂e / kg); ürün değerine dönüştürmek firmanın kararıdır, not olarak saklanır
  if (sections.includes('carbon') && response.carbonPerKg !== null) {
    data.restricted.notes = appendLine(data.restricted.notes, `${who}: ${response.carbonPerKg} kg CO₂e/kg${response.carbonMethod ? ` (${response.carbonMethod})` : ''}`)
  }
  if (sections.includes('notes') && response.notes) data.restricted.notes = appendLine(data.restricted.notes, `${who}: ${response.notes}`)

  const clean = sanitizeData(data)
  await sql`
    UPDATE dpp_products SET data = ${JSON.stringify(clean)}::jsonb, has_changes = TRUE, updated_at = NOW()
    WHERE id = ${product.id} AND company_id = ${companyId}
  `

  if (sections.includes('files')) {
    const count = Number(((await sql`SELECT COUNT(*)::int AS n FROM dpp_documents WHERE product_id = ${product.id}`) as Array<{ n: number }>)[0]?.n || 0)
    let room = Math.max(0, 40 - count)
    for (const f of response.files) {
      if (f.applied || room <= 0) continue
      // Tedarikçi belgeleri varsayılan olarak "yetkili erişim" ile eklenir; firma isterse herkese açar
      await sql`
        INSERT INTO dpp_documents (product_id, title, kind, visibility, blob_url, content_type, size_bytes)
        VALUES (${product.id}, ${`${f.title} — ${response.company || row.supplier_name}`.slice(0, 200)}, 'certificate', 'restricted', ${f.url}, ${f.contentType}, ${f.size})
      `
      f.applied = true
      room--
    }
  }
  await sql`
    UPDATE dpp_supplier_requests SET status = 'applied', response = ${JSON.stringify(response)}::jsonb, updated_at = NOW() WHERE id = ${row.id}
  `
}

/** Genel bakış: incelenmeyi bekleyen tedarikçi yanıtları */
export async function pendingSupplierResponses(companyId: string) {
  await ensureDppSchema()
  const rows = (await sql`
    SELECT r.id, r.product_id, r.supplier_name, r.submitted_at, p.texts, p.default_lang
    FROM dpp_supplier_requests r JOIN dpp_products p ON p.id = r.product_id
    WHERE r.company_id = ${companyId} AND r.status = 'submitted'
    ORDER BY r.submitted_at DESC LIMIT 20
  `) as Array<{ id: string; product_id: string; supplier_name: string; submitted_at: string; texts: unknown; default_lang: string }>
  return rows.map((r) => {
    const texts = readTextsMap(r.texts)
    const lang = (isDppLang(r.default_lang) ? r.default_lang : 'tr') as DppLang
    return { id: r.id, productId: r.product_id, productName: texts[lang]?.name || '—', supplierName: r.supplier_name, submittedAt: r.submitted_at }
  })
}

/* ───────────── Tedarikçi (herkese açık, token ile) ───────────── */

async function byToken(token: string) {
  if (!isToken(token)) return null
  await ensureDppSchema()
  const rows = (await sql`
    SELECT r.*, c.name AS company_name, c.is_active, p.texts, p.default_lang
    FROM dpp_supplier_requests r JOIN dpp_companies c ON c.id = r.company_id JOIN dpp_products p ON p.id = r.product_id
    WHERE r.token = ${token}
  `) as unknown as Array<RequestRow & { company_name: string; is_active: boolean; texts: unknown; default_lang: string }>
  const row = rows[0]
  if (!row || !row.is_active) return null
  return row
}

export async function loadSupplierForm(token: string) {
  const row = await byToken(token)
  if (!row) return null
  const texts = readTextsMap(row.texts)
  const lang = (isDppLang(row.default_lang) ? row.default_lang : 'tr') as DppLang
  const formLang = (isDppLang(row.lang) ? row.lang : lang) as DppLang
  return {
    companyName: row.company_name,
    // Ürün adı, çevirisi varsa formun açılış dilinde
    productName: texts[formLang]?.name || texts[lang]?.name || '—',
    supplierName: row.supplier_name,
    message: row.message,
    fields: readFields(row.fields),
    lang: (isDppLang(row.lang) ? row.lang : 'tr') as DppLang,
    canEdit: supplierCanEdit(row),
    submitted: row.status === 'submitted',
    expiresAt: row.expires_at,
    response: publicResponse(row, token),
    /** Tarayıcıdan doğrudan yükleme bu klasöre yapılır (sunucu yolu ve token'ı ayrıca doğrular) */
    uploadPrefix: supplierUploadPrefix(row.company_id, row.id),
  }
}

/** Tedarikçi yükleme anahtarı istediğinde: talep açık mı ve yol talebin klasöründe mi? */
export async function supplierUploadTarget(token: string, pathname: string) {
  const row = await byToken(token)
  if (!row || !supplierCanEdit(row)) throw new DppError('e_request_closed')
  if (!pathname.startsWith(supplierUploadPrefix(row.company_id, row.id))) throw new DppError('e_bad_path')
  return row.id
}

async function verifySupplierFile(prefix: string, url: string, title: string): Promise<SupplierFile> {
  let meta: Awaited<ReturnType<typeof head>>
  try {
    meta = await head(url, { token: String(process.env.BLOB_READ_WRITE_TOKEN || '').trim() })
  } catch {
    throw new DppError('e_upload_missing')
  }
  if (!meta.pathname.startsWith(prefix)) throw new DppError('e_upload_foreign')
  const type = (meta.contentType || '').toLowerCase()
  if (!DPP_UPLOAD_TYPES.includes(type)) throw new DppError('e_file_type')
  if (meta.size > DPP_UPLOAD_MAX_BYTES) throw new DppError('e_file_size')
  return { url: meta.url, title: title || meta.pathname.split('/').pop() || 'document', contentType: type, size: meta.size }
}

export async function submitSupplierResponse(token: string, input: Record<string, unknown>) {
  const row = await byToken(token)
  if (!row) throw new DppError('e_request_not_found')
  if (!supplierCanEdit(row)) throw new DppError('e_request_closed')
  if (input.declaration !== true) throw new DppError('e_declaration_required')
  const o = (input.response && typeof input.response === 'object' ? input.response : {}) as Record<string, unknown>
  const fields = readFields(row.fields)
  const company = str(o.company, 200)
  const contactName = str(o.contactName, 120)
  if (!company || !contactName) throw new DppError('e_contact_required')

  const response: SupplierResponse = { ...emptyResponse(), company, contactName, contactEmail: str(o.contactEmail, 255), notes: str(o.notes, 3000) }
  if (fields.includes('materials')) response.materials = sanitizeData({ materials: o.materials }).materials
  if (fields.includes('certificates')) {
    response.certificates = (Array.isArray(o.certificates) ? o.certificates : [])
      .slice(0, 30)
      .map((c) => {
        const x = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>
        const validUntil = str(x.validUntil, 10)
        return { name: str(x.name, 120), reference: str(x.reference, 200), validUntil: /^\d{4}-\d{2}-\d{2}$/.test(validUntil) ? validUntil : '' }
      })
      .filter((c) => c.name)
  }
  if (fields.includes('facility')) response.facility = str(o.facility, 1000)
  if (fields.includes('substances')) response.substances = str(o.substances, 3000)
  if (fields.includes('carbon')) {
    const n = Number(String(o.carbonPerKg ?? '').replace(',', '.'))
    response.carbonPerKg = String(o.carbonPerKg ?? '').trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 10000 ? Math.round(n * 1000) / 1000 : null
    response.carbonMethod = str(o.carbonMethod, 300)
  }

  // Dosyalar: önceki gönderimdeki dosyalar korunur, yeni yüklenenler doğrulanır, çıkarılanlar silinir
  const previous = readResponse(row.response)?.files || []
  const wanted = (Array.isArray(o.files) ? o.files : []).map((f) => (f && typeof f === 'object' ? f : {}) as Record<string, unknown>)
  if (wanted.length > MAX_FILES) throw new DppError('e_files_max')
  const prefix = supplierUploadPrefix(row.company_id, row.id)
  const files: SupplierFile[] = []
  for (const f of wanted) {
    const url = str(f.url, 1000)
    const title = str(f.title, 160)
    const kept = previous.find((p) => p.url === url)
    if (kept) files.push({ ...kept, title: title || kept.title })
    else if (url) files.push(await verifySupplierFile(prefix, url, title))
  }
  response.files = files
  await deleteFiles(previous.filter((p) => !p.applied && !files.some((f) => f.url === p.url)))

  await sql`
    UPDATE dpp_supplier_requests SET response = ${JSON.stringify(response)}::jsonb, status = 'submitted', submitted_at = NOW(), updated_at = NOW()
    WHERE id = ${row.id}
  `
}

/** Tedarikçi dosyasını indirme: firma paneli oturumu (kendi firması) ya da talebin token'ı ile */
export async function supplierFileFor(requestId: string, index: number, auth: { companyId?: string; token?: string }) {
  if (!isUuid(requestId) || !Number.isInteger(index) || index < 0) return null
  await ensureDppSchema()
  const rows = (await sql`SELECT company_id, token, response FROM dpp_supplier_requests WHERE id = ${requestId}`) as Array<{ company_id: string; token: string; response: unknown }>
  const row = rows[0]
  if (!row) return null
  const allowed = (auth.companyId && auth.companyId === row.company_id) || (auth.token && auth.token === row.token)
  if (!allowed) return null
  return readResponse(row.response)?.files[index] || null
}
