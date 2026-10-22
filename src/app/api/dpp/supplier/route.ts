import { NextRequest, NextResponse } from 'next/server'
import { consumeRateLimit } from '@/lib/growthSchema'
import { DppError, errorText, msg } from '@/lib/dpp/i18n'
import { requestLang } from '@/lib/dpp/requestLang'
import { loadSupplierForm, submitSupplierResponse } from '@/lib/dpp/suppliers'

// Tedarikçi formu API'si (giriş yok; erişim tahmin edilemez token ile). Sadece talebin kendi verisi okunur/yazılır.

export async function GET(req: NextRequest) {
  const lang = requestLang(req)
  const token = req.nextUrl.searchParams.get('t') || ''
  if (!(await consumeRateLimit(`dpp-sr-get:${token.slice(0, 48)}`, 300, 3600))) return NextResponse.json({ error: msg(lang, 'e_too_many') }, { status: 429 })
  const form = await loadSupplierForm(token)
  if (!form) return NextResponse.json({ error: msg(lang, 'e_request_not_found') }, { status: 404 })
  return NextResponse.json({ form }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const lang = requestLang(req)
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const token = String(body.token || '')
    if (!(await consumeRateLimit(`dpp-sr-post:${token.slice(0, 48)}`, 30, 3600))) return NextResponse.json({ error: msg(lang, 'e_too_many') }, { status: 429 })
    await submitSupplierResponse(token, body)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (!(err instanceof DppError)) console.error('[dpp/supplier]', err)
    return NextResponse.json({ error: errorText(err, lang) }, { status: err instanceof DppError ? 400 : 500 })
  }
}
