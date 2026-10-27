'use client'

import { upload } from '@vercel/blob/client'

// Dosyayı sunucu fonksiyonundan geçirmeden doğrudan Vercel Blob'a yükler.
// Dönen URL claim/update/guestbook rotalarına `media_blob_url` olarak gönderilir.

function extensionOf(file: File) {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : ''
  if (fromName) return fromName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'
  const subtype = (file.type.split('/')[1] || 'bin').split(';')[0]
  return subtype.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'
}

export async function uploadMediaDirect(options: {
  slug: string
  scope: 'qr' | 'gb' | 'rp' | 'gp'
  file: File
  token?: string
  pin?: string
  /** grup hediyesi davet anahtarı */
  groupKey?: string
  onProgress?: (percentage: number) => void
}) {
  const { slug, scope, file, token, pin, groupKey, onProgress } = options
  const pathname = `${scope}/${slug}-${Date.now()}.${extensionOf(file)}`

  const clientPayload = JSON.stringify({ slug, scope, token, pin, groupKey })
  const multipart = file.size > 8 * 1024 * 1024

  try {
    const blob = await upload(pathname, file, {
      access: 'private',
      handleUploadUrl: '/api/upload',
      clientPayload,
      contentType: file.type || undefined,
      multipart,
      onUploadProgress: ({ percentage }) => onProgress?.(percentage),
    })
    return blob.url
  } catch (error) {
    // Yükleme izni reddedilince Blob kütüphanesi sunucunun mesajını yutar ("Failed to retrieve the client token").
    // Aynı isteği tekrar atıp gerçek nedeni (giriş gerekli, yetkisiz, limit…) kullanıcıya gösteriyoruz.
    if (error instanceof Error && /client token/i.test(error.message)) {
      const reason = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname, clientPayload, multipart } }),
      })
        .then(async (res) => (res.ok ? null : ((await res.json().catch(() => ({}))) as { error?: string }).error || null))
        .catch(() => null)
      if (reason) throw new Error(reason)
    }
    throw error
  }
}
