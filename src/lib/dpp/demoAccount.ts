import { isValidEmail } from '@/lib/auth'
import { sql } from '@/lib/db'
import { consumeRateLimit } from '@/lib/growthSchema'
import { createDppUser, randomKey } from './auth'
import { DppError } from './i18n'
import { audit } from './safety'
import { ensureDppSchema } from './schema'

// Demo hesabı: tüm özellikler gerçek çalışır ama sayılarla ve süreyle sınırlıdır.
// Süre dolunca firma girişe kapanır (veri silinmez); yönetici süreyi uzatabilir ya da ücretli pakete geçirebilir.

export const DEMO = {
  days: 14,
  products: 3,
  items: 100,
  supplierRequests: 3,
  users: 2,
  docsPerProduct: 5,
  translations: 10,
} as const

export async function companyPlan(companyId: string) {
  const rows = (await sql`SELECT plan, demo_expires_at FROM dpp_companies WHERE id = ${companyId}`) as Array<{ plan: string; demo_expires_at: string | null }>
  return rows[0] || null
}

export async function isDemoCompany(companyId: string) {
  return (await companyPlan(companyId))?.plan === 'demo'
}

/** Demo firmasında bir sınır aşılıyorsa kullanıcının dilinde açıklayıcı hata atar. */
export async function assertDemoLimit(companyId: string, kind: 'items' | 'suppliers' | 'users' | 'docs' | 'translate', ctx: { add?: number; productId?: string } = {}) {
  if (!(await isDemoCompany(companyId))) return
  const fail = (n: number) => {
    throw new DppError('e_demo_limit', { n })
  }
  if (kind === 'items') {
    const n = Number(((await sql`SELECT COUNT(*)::int AS n FROM dpp_items i JOIN dpp_products p ON p.id = i.product_id WHERE p.company_id = ${companyId}`) as Array<{ n: number }>)[0].n)
    if (n + (ctx.add || 0) > DEMO.items) fail(DEMO.items)
  } else if (kind === 'suppliers') {
    const n = Number(((await sql`SELECT COUNT(*)::int AS n FROM dpp_supplier_requests WHERE company_id = ${companyId}`) as Array<{ n: number }>)[0].n)
    if (n >= DEMO.supplierRequests) fail(DEMO.supplierRequests)
  } else if (kind === 'users') {
    const n = Number(((await sql`SELECT COUNT(*)::int AS n FROM dpp_users WHERE company_id = ${companyId}`) as Array<{ n: number }>)[0].n)
    if (n >= DEMO.users) fail(DEMO.users)
  } else if (kind === 'docs' && ctx.productId) {
    const n = Number(((await sql`SELECT COUNT(*)::int AS n FROM dpp_documents WHERE product_id = ${ctx.productId}`) as Array<{ n: number }>)[0].n)
    if (n >= DEMO.docsPerProduct) fail(DEMO.docsPerProduct)
  } else if (kind === 'translate') {
    if (!(await consumeRateLimit(`dpp-demo-translate:${companyId}`, DEMO.translations, DEMO.days * 86400))) fail(DEMO.translations)
  }
}

const SECTORS = ['textile', 'home_textile', 'furniture', 'footwear', 'battery', 'electronics', 'toys', 'construction', 'other'] as const

/** Herkese açık demo talebi: firma + yönetici hesabı açılır, geçici şifre bir kez döner. */
export async function createDemo(input: Record<string, unknown>, ipKey: string) {
  await ensureDppSchema()
  const s = (k: string, max: number) => String(input[k] ?? '').trim().slice(0, max)
  // Bot tuzağı: görünmeyen alan doluysa sessizce reddet
  if (s('website', 200)) throw new DppError('e_too_many')
  const company = s('company', 200)
  const name = s('name', 120)
  const email = s('email', 254).toLowerCase()
  const phone = s('phone', 40)
  if (!company || !name) throw new DppError('e_contact_required')
  if (!isValidEmail(email)) throw new DppError('e_valid_email')
  if (input.consent !== true) throw new DppError('e_declaration_required')
  // Kötüye kullanım sınırları: aynı ağdan günde 3, sistem genelinde günde 40 demo
  if (!(await consumeRateLimit(`dpp-demo:${ipKey}`, 3, 86400))) throw new DppError('e_too_many')
  if (!(await consumeRateLimit('dpp-demo:all', 40, 86400))) throw new DppError('e_too_many')

  const base = 'DEMO' + company.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  let code = base
  for (let i = 2; ((await sql`SELECT 1 FROM dpp_companies WHERE code = ${code}`) as unknown[]).length; i++) code = `${base}${i}`
  const country = s('country', 2).toUpperCase().replace(/[^A-Z]/g, '') || 'TR'
  const rows = (await sql`
    INSERT INTO dpp_companies (code, name, country, email, phone, plan, product_limit, restricted_key, admin_note, demo_expires_at)
    VALUES (${code}, ${company}, ${country}, ${email}, ${phone}, 'demo', ${DEMO.products}, ${randomKey()}, 'Web sitesinden demo talebi',
            NOW() + make_interval(days => ${DEMO.days}))
    RETURNING id, demo_expires_at
  `) as Array<{ id: string; demo_expires_at: string }>
  const companyId = rows[0].id
  let owner: { email: string; password: string }
  try {
    owner = await createDppUser(companyId, email, 'owner', name)
  } catch (err) {
    await sql`DELETE FROM dpp_companies WHERE id = ${companyId}`
    throw err
  }
  const sector = (SECTORS as readonly string[]).includes(s('sector', 30)) ? s('sector', 30) : 'other'
  await sql`
    INSERT INTO dpp_demo_requests (company_id, company_name, name, email, phone, country, sector, products_estimate, message, lang, consent_at)
    VALUES (${companyId}, ${company}, ${name}, ${email}, ${phone}, ${country}, ${sector}, ${s('products', 20)}, ${s('message', 1000)}, ${s('lang', 4) || 'tr'}, NOW())
  `
  await audit(companyId, email, 'demo.create', companyId, { company, sector, country })
  return { email: owner.email, password: owner.password, expiresAt: rows[0].demo_expires_at }
}
