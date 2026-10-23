import { NextRequest } from 'next/server'
import { logApi, readJson, pathParam, withApi } from '@/lib/dpp/api'
import { updateItemDynamicBySerial } from '@/lib/dpp/server'

// Tek bir pilin durumu (sağlık %, döngü sayısı, şarj durumu, statü): BMS ya da servis yazılımı için.
// Gönderilen alanlar mevcut durumun üzerine yazılır, gönderilmeyenler kalır.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; serial: string }> }) {
  const { id, serial } = await params
  return withApi(req, 'write', async (caller) => {
    const body = await readJson(req)
    const row = await updateItemDynamicBySerial(caller.companyId, id, pathParam(serial), body.status ?? body)
    await logApi(caller, 'item.status', id, { serial: row.serial })
    return { serial: row.serial, publicId: row.public_id, status: row.dynamic, statusUpdatedAt: row.dynamic_updated_at }
  })
}
