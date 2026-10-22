import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { consumeRateLimit } from '@/lib/growthSchema'
import { getDppUser } from '@/lib/dpp/auth'
import { DPP_UPLOAD_MAX_BYTES, DPP_UPLOAD_TYPES, uploadPrefixFor } from '@/lib/dpp/server'

// DPP paneli: ürün görseli ve belgeler (PDF) tarayıcıdan doğrudan Blob'a yüklenir.
// Yükleme anahtarı sadece oturum açmış editör / yöneticiye ve kendi firma klasörüne verilir.

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody
  try {
    const result = await handleUpload({
      request: req,
      body,
      token: String(process.env.BLOB_READ_WRITE_TOKEN || '').trim(),
      onBeforeGenerateToken: async (pathname) => {
        const user = await getDppUser(req)
        if (!user || user.role === 'viewer' || user.mustChangePassword) throw new Error('Yetkisiz erişim')
        if (!pathname.startsWith(uploadPrefixFor(user.companyId))) throw new Error('Geçersiz dosya yolu')
        if (!(await consumeRateLimit(`dpp-upload:${user.id}`, 200, 3600))) throw new Error('Çok fazla yükleme, biraz sonra tekrar dene')
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
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Yükleme başlatılamadı' }, { status: 400 })
  }
}
