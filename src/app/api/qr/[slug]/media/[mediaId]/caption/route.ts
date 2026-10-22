import { NextRequest, NextResponse } from 'next/server'
import { aiCaptionsEnabled, CAPTION_LANGS, captionFor, transcribeBlob } from '@/lib/captions'
import { sql } from '@/lib/db'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { isOwnerToken, isQrPremium, isTimeLocked, loadFeatureQr } from '@/lib/qrFeatures'

type MediaRow = { id: string; blob_url: string | null; media_type: string; transcript: string | null; transcript_lang: string | null }

async function loadMedia(qrId: string, mediaId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(mediaId)) return null
  const rows = (await sql`
    SELECT id, blob_url, media_type, transcript, transcript_lang FROM qr_media
    WHERE id = ${mediaId} AND qr_id = ${qrId} AND source_type = 'blob' AND media_type IN ('audio', 'video')
  `) as unknown as MediaRow[]
  return rows[0] || null
}

// İzleyici: altyazıyı ister (?lang=de). Döküm yoksa 404; çeviri ilk istekte üretilip saklanır.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; mediaId: string }> }) {
  try {
    const { slug, mediaId } = await params
    const qr = await loadFeatureQr(slug)
    if (!qr || !qr.is_claimed || qr.is_active === false) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    const owner = isOwnerToken(qr, req.nextUrl.searchParams.get('token'))
    if (isTimeLocked(qr) && !owner) return NextResponse.json({ error: 'Kilitli' }, { status: 423 })

    const media = await loadMedia(qr.id, mediaId)
    if (!media?.transcript) return NextResponse.json({ error: 'Altyazı yok' }, { status: 404 })

    const lang = String(req.nextUrl.searchParams.get('lang') || media.transcript_lang || 'tr')
    if (!CAPTION_LANGS[lang]) return NextResponse.json({ error: 'Desteklenmeyen dil' }, { status: 400 })
    // Yeni çeviri üretimi ücretli bir işlem: IP başına sınırla (önbellekteki çeviriler sınırsız)
    if (lang !== media.transcript_lang && !(await consumeRateLimit(`caption:${clientIp(req.headers)}`, 30, 3600))) {
      return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 })
    }
    const text = await captionFor(media.id, media.transcript, media.transcript_lang, lang)
    return NextResponse.json({ lang, original: media.transcript_lang, text })
  } catch (err) {
    console.error('[caption GET]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Sunucu hatası' }, { status: 500 })
  }
}

// Sahip (Premium): sesi / videoyu yazıya döker.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string; mediaId: string }> }) {
  try {
    const { slug, mediaId } = await params
    const body = await req.json().catch(() => ({}))
    const qr = await loadFeatureQr(slug)
    if (!qr || !isOwnerToken(qr, String(body.token || ''))) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    if (!(await isQrPremium(qr))) return NextResponse.json({ error: 'Altyazı Premium üyelikle kullanılabilir', premiumRequired: true }, { status: 402 })
    if (!aiCaptionsEnabled()) return NextResponse.json({ error: 'Altyazı servisi henüz aktif değil' }, { status: 503 })
    if (!(await consumeRateLimit(`transcribe:${qr.id}`, 10, 24 * 3600))) return NextResponse.json({ error: 'Bugünlük altyazı sınırına ulaşıldı' }, { status: 429 })

    const media = await loadMedia(qr.id, mediaId)
    if (!media?.blob_url) return NextResponse.json({ error: 'Ses ya da video bulunamadı' }, { status: 404 })

    const result = await transcribeBlob(media.blob_url)
    if (!result.text) return NextResponse.json({ error: 'Kayıtta konuşma algılanamadı' }, { status: 422 })
    await sql`DELETE FROM media_translations WHERE media_id = ${media.id}`
    await sql`UPDATE qr_media SET transcript = ${result.text}, transcript_lang = ${result.lang}, updated_at = NOW() WHERE id = ${media.id}`
    return NextResponse.json({ ok: true, transcript: result.text, lang: result.lang })
  } catch (err) {
    console.error('[caption POST]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Sunucu hatası' }, { status: 500 })
  }
}
