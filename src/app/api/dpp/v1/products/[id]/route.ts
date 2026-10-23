import { NextRequest } from 'next/server'
import { ApiError, logApi, productOut, readJson, saveMerged, setExternalId, withApi } from '@/lib/dpp/api'
import { getProduct } from '@/lib/dpp/server'

// GET: ürünün tamamı (taslak hali). PATCH: kısmi güncelleme; gönderilmeyen alanlar olduğu gibi kalır.
// Yayınlanmış pasaport, /publish çağrılana kadar değişmez.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withApi(req, 'read', async (caller) => productOut(caller.companyId, id))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withApi(req, 'write', async (caller) => {
    const body = await readJson(req)
    if (!(await getProduct(caller.companyId, id))) throw new ApiError('e_product_not_found', 404)
    // revision gönderilirse ondan beri başka bir değişiklik olduysa 409 döner
    await saveMerged(caller.companyId, id, body)
    await setExternalId(caller.companyId, id, body.externalId)
    await logApi(caller, 'product.update', id, { fields: Object.keys(body) })
    return productOut(caller.companyId, id)
  })
}
