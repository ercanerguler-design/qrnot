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
  scope: 'qr' | 'gb'
  file: File
  token?: string
  pin?: string
  onProgress?: (percentage: number) => void
}) {
  const { slug, scope, file, token, pin, onProgress } = options
  const pathname = `${scope}/${slug}-${Date.now()}.${extensionOf(file)}`

  const blob = await upload(pathname, file, {
    access: 'private',
    handleUploadUrl: '/api/upload',
    clientPayload: JSON.stringify({ slug, scope, token, pin }),
    contentType: file.type || undefined,
    multipart: file.size > 8 * 1024 * 1024,
    onUploadProgress: ({ percentage }) => onProgress?.(percentage),
  })

  return blob.url
}
