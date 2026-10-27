import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { createHash } from 'crypto'
import { sql, type QRCode } from '@/lib/db'
import { clientIp, consumeRateLimit, ensureGrowthSchema } from '@/lib/growthSchema'
import { maxUploadBytes, uploadPrefix, type UploadScope } from '@/lib/directUpload'
import { readGuestbookSettings } from '@/lib/guestbook'
import { getAuthenticatedUser } from '@/lib/auth'
import { findDuplicateEntry, hashGuestDevice, readGuestDevice } from '@/lib/guestbookServer'

// Tarayıcıdan doğrudan Blob yüklemesi için kısa ömürlü yükleme anahtarı üretir.
// scope=qr → QR sahibinin medyası (sahiplenme veya sahip token'ı ile güncelleme)
// scope=gb → anı defterine misafir yüklemesi

interface UploadPayload {
  slug?: string
  scope?: UploadScope
  token?: string
  pin?: string
  groupKey?: string
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody
  const ip = clientIp(req.headers)

  try {
    const result = await handleUpload({
      request: req,
      body,
      token: String(process.env.BLOB_READ_WRITE_TOKEN || '').trim(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await ensureGrowthSchema()

        let payload: UploadPayload = {}
        try {
          payload = JSON.parse(clientPayload || '{}') as UploadPayload
        } catch {
          throw new Error('Geçersiz istek')
        }

        const slug = String(payload.slug || '').trim()
        const scope: UploadScope = payload.scope === 'gb' || payload.scope === 'rp' || payload.scope === 'gp' ? payload.scope : 'qr'
        if (!slug || !pathname.startsWith(uploadPrefix(scope, slug))) {
          throw new Error('Geçersiz dosya yolu')
        }

        const allowed = await consumeRateLimit(`upload:${ip}`, 40, 3600)
        if (!allowed) {
          throw new Error('Çok fazla yükleme denemesi. Lütfen biraz sonra tekrar dene.')
        }

        const rows = (await sql`
          SELECT id, slug, is_demo, is_active, is_claimed, admin_token, order_type, qr_mode, guestbook_settings, creator_user_id,
                 replies_enabled, group_token, unlock_at
          FROM qr_codes WHERE slug = ${slug}
        `) as unknown as Array<
          QRCode & {
            qr_mode?: string
            guestbook_settings?: unknown
            creator_user_id?: string | null
            replies_enabled?: boolean
            group_token?: string | null
            unlock_at?: string | null
          }
        >
        const qr = rows[0]
        if (!qr || qr.is_active === false) {
          throw new Error('QR kodu bulunamadı')
        }

        if (scope === 'qr') {
          if (qr.is_claimed && (!payload.token || payload.token !== qr.admin_token)) {
            throw new Error('Yetkisiz erişim')
          }
          // Sahipsiz QR'a yükleme = sahiplenme adımı: üye girişi şart. Başka hesabın oluşturduğu QR'ı da kurabilir
          // (firma/satıcı QR'ı hazırlar, alıcı kendi hesabıyla kurar).
          if (!qr.is_claimed) {
            const user = await getAuthenticatedUser(req)
            if (!user) throw new Error('Devam etmek için giriş yap')
          }
        } else if (scope === 'rp') {
          // Cevap ver: normal QR, cevaplar açık ve zaman kapsülü kilitli değil
          if (!qr.is_claimed || qr.qr_mode === 'guestbook' || qr.replies_enabled === false) throw new Error('Bu QR şu an cevap kabul etmiyor')
          if (qr.unlock_at && new Date(qr.unlock_at).getTime() > Date.now()) throw new Error('Bu QR şu an cevap kabul etmiyor')
        } else if (scope === 'gp') {
          // Grup hediyesi: geçerli davet anahtarı şart
          if (!qr.is_claimed || qr.qr_mode === 'guestbook' || !qr.group_token || payload.groupKey !== qr.group_token) {
            throw new Error('Bu davet linki geçersiz ya da kapatılmış')
          }
        } else {
          const settings = readGuestbookSettings(qr.guestbook_settings)
          if (!qr.is_claimed || qr.qr_mode !== 'guestbook' || !settings.open) {
            throw new Error('Bu anı defteri şu an yeni anı kabul etmiyor')
          }
          if (settings.pinHash) {
            const pinHash = createHash('sha256').update(String(payload.pin || '').trim()).digest('hex')
            if (pinHash !== settings.pinHash) {
              throw new Error('PIN hatalı')
            }
          }
          const device = readGuestDevice(req)
          if (device && (await findDuplicateEntry(qr.id, hashGuestDevice(device), null)).byDevice) {
            throw new Error('Bu anı defterine zaten bir anı bıraktın')
          }
        }

        return {
          allowedContentTypes: ['audio/*', 'video/*', 'image/*'],
          maximumSizeInBytes: maxUploadBytes(qr.order_type),
          addRandomSuffix: true,
          allowOverwrite: false,
          validUntil: Date.now() + 2 * 60 * 60 * 1000, // büyük videolar yavaş mobil bağlantıda uzun sürebilir
        }
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Yükleme başlatılamadı'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
