import { ensureQrSchema, sql } from '@/lib/db'
import { normalizeEmail } from '@/lib/auth'

// Kurumsal paneller: bir e-posta sadece BİR panele ait olabilir (karışıklık ve yanlış firmaya erişim riskine karşı).
export type AdminRealm = 'hotel' | 'education' | 'health' | 'factory' | 'retail' | 'logistics' | 'dpp'

export async function listAdminRealmsByEmail(emailInput: string): Promise<AdminRealm[]> {
  await ensureQrSchema()
  const email = normalizeEmail(emailInput)
  if (!email) return []

  const realms: AdminRealm[] = []

  const hotelRows = await sql`SELECT id FROM hotel_users WHERE lower(trim(email)) = ${email} LIMIT 1`
  if (hotelRows.length > 0) realms.push('hotel')

  const educationRows = await sql`SELECT id FROM education_users WHERE lower(trim(email)) = ${email} LIMIT 1`
  if (educationRows.length > 0) realms.push('education')

  const healthRows = await sql`SELECT id FROM health_users WHERE lower(trim(email)) = ${email} LIMIT 1`
  if (healthRows.length > 0) realms.push('health')

  const factoryRows = await sql`SELECT id FROM factory_users WHERE lower(trim(email)) = ${email} LIMIT 1`
  if (factoryRows.length > 0) realms.push('factory')

  const retailRows = await sql`SELECT id FROM retail_users WHERE lower(trim(email)) = ${email} LIMIT 1`
  if (retailRows.length > 0) realms.push('retail')

  const logisticsRows = await sql`SELECT id FROM logistics_users WHERE lower(trim(email)) = ${email} LIMIT 1`
  if (logisticsRows.length > 0) realms.push('logistics')

  // DPP tablosu henüz oluşmamışsa (modül hiç açılmamışsa) atla
  try {
    const dppRows = await sql`SELECT id FROM dpp_users WHERE lower(trim(email)) = ${email} LIMIT 1`
    if (dppRows.length > 0) realms.push('dpp')
  } catch {}

  return realms
}

export async function findAdminRealmByEmail(emailInput: string): Promise<AdminRealm | null> {
  const realms = await listAdminRealmsByEmail(emailInput)
  return realms[0] || null
}

export function realmLoginPath(realm: AdminRealm) {
  if (realm === 'hotel') return '/hotel'
  if (realm === 'education') return '/education'
  if (realm === 'dpp') return '/dpp/panel'
  if (realm === 'health') return '/health'
  if (realm === 'factory') return '/factory'
  if (realm === 'retail') return '/retail'
  return '/logistics'
}
