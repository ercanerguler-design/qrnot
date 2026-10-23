import { NextRequest } from 'next/server'
import { apiActor, logApi, productOut, withApi } from '@/lib/dpp/api'
import { publishProduct } from '@/lib/dpp/server'

// Taslağı yayınlar: yeni sürüm oluşur, pasaport hemen güncellenir. Eksik zorunlu alan varsa 400 + details listesi.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withApi(req, 'write', async (caller) => {
    const version = await publishProduct(caller.companyId, id, apiActor(caller))
    await logApi(caller, 'product.publish', id, { version })
    return productOut(caller.companyId, id)
  })
}
