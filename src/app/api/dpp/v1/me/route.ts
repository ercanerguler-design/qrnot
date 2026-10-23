import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { withApi } from '@/lib/dpp/api'

// Anahtarın bağlı olduğu firma, paket sınırı ve yetkiler: entegrasyon kurulurken bağlantı testi için.
export async function GET(req: NextRequest) {
  return withApi(req, 'read', async (caller) => {
    const rows = (await sql`
      SELECT c.name, c.plan, c.product_limit, c.demo_expires_at,
             (SELECT COUNT(*)::int FROM dpp_products p WHERE p.company_id = c.id AND p.status <> 'archived') AS used
      FROM dpp_companies c WHERE c.id = ${caller.companyId}
    `) as Array<{ name: string; plan: string; product_limit: number; demo_expires_at: string | null; used: number }>
    const c = rows[0]
    return {
      company: { name: c.name, plan: c.plan, demoExpiresAt: c.demo_expires_at },
      limits: { products: c.product_limit, productsUsed: c.used, requestsPerHour: 1200 },
      key: { name: caller.keyName, scopes: caller.scopes },
    }
  })
}
