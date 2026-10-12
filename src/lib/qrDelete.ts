import { deleteBlob } from '@/lib/blob'
import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'

/**
 * QR'ı tüm medyasıyla kalıcı olarak siler: QR sesi, QR medyaları ve anı defteri misafir yüklemeleri (Blob),
 * ardından qr_codes satırı (qr_media, guestbook_entries, etsy_activations ON DELETE CASCADE ile gider).
 * Bir dosya silinemezse QR silinmez ki depoda sahipsiz dosya kalmasın; çağıran tekrar deneyebilir.
 */
export async function deleteQrWithMedia(qrId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureGrowthSchema()

  const blobRows = (await sql`
    SELECT audio_url AS url FROM qr_codes WHERE id = ${qrId} AND audio_url IS NOT NULL
    UNION
    SELECT blob_url FROM qr_media WHERE qr_id = ${qrId} AND source_type = 'blob' AND blob_url IS NOT NULL
    UNION
    SELECT blob_url FROM guestbook_entries WHERE qr_id = ${qrId} AND blob_url IS NOT NULL
  `) as Array<{ url: string }>

  const failed: string[] = []
  for (const { url } of blobRows) {
    try {
      await deleteBlob(url)
    } catch (error) {
      console.warn('[deleteQrWithMedia blob]', error)
      failed.push(url)
    }
  }
  if (failed.length > 0) {
    return { ok: false, error: 'Medya dosyaları silinemediği için QR silinmedi. Lütfen tekrar dene.' }
  }

  await sql`DELETE FROM qr_codes WHERE id = ${qrId}`
  return { ok: true }
}
