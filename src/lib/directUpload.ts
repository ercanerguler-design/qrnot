import { head } from '@vercel/blob'
import { MAX_AUDIO_FILE_SIZE_BYTES } from '@/lib/audio'
import { getMaxImageFileSizeBytes, getMaxVideoFileSizeBytes, type UploadedMediaType } from '@/lib/media'

// Tarayıcıdan doğrudan Vercel Blob'a yüklenen dosyaların sunucu tarafı doğrulaması.
// Sunucu fonksiyonunun 4.5MB gövde sınırını aşmak için dosya önce Blob'a gider,
// sonra sadece URL'i claim/update rotalarına gönderilir.

// qr: QR sahibi · gb: anı defteri misafiri · rp: cevap · gp: grup hediyesi katkısı
export type UploadScope = 'qr' | 'gb' | 'rp' | 'gp'

export function uploadPrefix(scope: UploadScope, slug: string) {
  return `${scope}/${slug}-`
}

export function maxUploadBytes(orderType?: string | null) {
  return Math.max(getMaxVideoFileSizeBytes(orderType), getMaxImageFileSizeBytes(), MAX_AUDIO_FILE_SIZE_BYTES)
}

function mediaTypeFromContentType(contentType: string): UploadedMediaType | null {
  const mime = contentType.toLowerCase()
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'image'
  return null
}

export type ResolvedUpload =
  | { ok: true; url: string; mediaType: UploadedMediaType; size: number }
  | { ok: false; error: string }

export async function resolveDirectUpload(
  blobUrl: string,
  scope: UploadScope,
  slug: string,
  orderType?: string | null
): Promise<ResolvedUpload> {
  let meta: Awaited<ReturnType<typeof head>>
  try {
    meta = await head(blobUrl, { token: String(process.env.BLOB_READ_WRITE_TOKEN || '').trim() })
  } catch {
    return { ok: false, error: 'Yüklenen dosya bulunamadı. Lütfen tekrar yükle.' }
  }

  if (!meta.pathname.startsWith(uploadPrefix(scope, slug))) {
    return { ok: false, error: 'Dosya bu QR koduna ait değil.' }
  }

  const mediaType = mediaTypeFromContentType(meta.contentType || '')
  if (!mediaType) {
    return { ok: false, error: 'Sadece ses, video veya resim dosyası yükleyebilirsin' }
  }

  const limit =
    mediaType === 'video'
      ? getMaxVideoFileSizeBytes(orderType)
      : mediaType === 'image'
        ? getMaxImageFileSizeBytes()
        : MAX_AUDIO_FILE_SIZE_BYTES

  if (meta.size > limit) {
    return { ok: false, error: `Dosya ${(limit / 1024 / 1024).toFixed(0)}MB sınırını aşıyor` }
  }

  return { ok: true, url: meta.url, mediaType, size: meta.size }
}
