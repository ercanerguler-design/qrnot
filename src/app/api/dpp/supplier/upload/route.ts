import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { consumeRateLimit } from '@/lib/growthSchema'
import { errorText, msg } from '@/lib/dpp/i18n'
import { requestLang } from '@/lib/dpp/requestLang'
import { DPP_UPLOAD_MAX_BYTES, DPP_UPLOAD_TYPES } from '@/lib/dpp/server'
import { supplierUploadTarget } from '@/lib/dpp/suppliers'
import { isDppLang, type DppLang } from '@/lib/dpp/types'

// Tedarikçi belgeleri: yükleme anahtarı sadece açık bir talebin token'ı ile ve sadece o talebin klasörüne verilir.

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody
  let lang: DppLang = requestLang(req)
  try {
    const result = await handleUpload({
      request: req,
      body,
      token: String(process.env.BLOB_READ_WRITE_TOKEN || '').trim(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let token = ''
        try {
          const payload = JSON.parse(clientPayload || '{}') as { lang?: unknown; token?: unknown }
          if (isDppLang(payload.lang)) lang = payload.lang
          token = String(payload.token || '')
        } catch {}
        try {
          await supplierUploadTarget(token, pathname)
        } catch (err) {
          throw new Error(errorText(err, lang))
        }
        if (!(await consumeRateLimit(`dpp-sr-upload:${token.slice(0, 48)}`, 60, 3600))) throw new Error(msg(lang, 'e_upload_rate'))
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
