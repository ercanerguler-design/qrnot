import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { consumeRateLimit } from '@/lib/growthSchema'
import { getDppUser } from '@/lib/dpp/auth'
import { msg } from '@/lib/dpp/i18n'
import { requestLang } from '@/lib/dpp/requestLang'
import { DPP_UPLOAD_MAX_BYTES, DPP_UPLOAD_TYPES, uploadPrefixFor } from '@/lib/dpp/server'
import { isDppLang, type DppLang } from '@/lib/dpp/types'

// DPP paneli: ürün görseli ve belgeler (PDF) tarayıcıdan doğrudan Blob'a yüklenir.
// Yükleme anahtarı sadece oturum açmış editör / yöneticiye ve kendi firma klasörüne verilir.

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody
  let lang: DppLang = requestLang(req)
  try {
    const result = await handleUpload({
      request: req,
      body,
      token: String(process.env.BLOB_READ_WRITE_TOKEN || '').trim(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        try {
          const payload = JSON.parse(clientPayload || '{}') as { lang?: unknown }
          if (isDppLang(payload.lang)) lang = payload.lang
        } catch {}
        const user = await getDppUser(req)
        if (!user || user.role === 'viewer' || user.mustChangePassword) throw new Error(msg(lang, 'e_unauthorized'))
        if (!pathname.startsWith(uploadPrefixFor(user.companyId))) throw new Error(msg(lang, 'e_bad_path'))
        if (!(await consumeRateLimit(`dpp-upload:${user.id}`, 200, 3600))) throw new Error(msg(lang, 'e_upload_rate'))
        return {
          allowedContentTypes: DPP_UPLOAD_TYPES,
          maximumSizeInBytes: DPP_UPLOAD_MAX_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
          validUntil: Date.now() + 30 * 60 * 1000,
        }
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : msg(lang, 'e_upload_start') }, { status: 400 })
  }
}
