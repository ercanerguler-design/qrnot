import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { consumeRateLimit } from '@/lib/growthSchema'
import { areaOf, deviceOf, ensureAnalyticsSchema, isBot, sourceOf, visitorOf } from '@/lib/analytics'

// Sitenin kendi ölçüm ucu: sayfa görüntülemesi ve tıklama olayları (sendBeacon ile gelir). Çerez yok, IP saklanmaz.
// Yanıt her zaman 204: ölçüm hatası ziyaretçiyi asla etkilemez.

const EVENT_NAME = /^[a-z0-9_]{2,40}$/
const NO_CONTENT = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })

export async function POST(req: NextRequest) {
  try {
    if (isBot(req.headers)) return NO_CONTENT()
    // Tarayıcı ön yüklemesi sayılmaz
    if ((req.headers.get('sec-purpose') || req.headers.get('purpose') || '').includes('prefetch')) return NO_CONTENT()
    const parsed: unknown = JSON.parse((await req.text()).slice(0, 4000))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return NO_CONTENT()
    const body = parsed as Record<string, unknown>
    // Adres site içi bir yol olmalı
    if (typeof body.u !== 'string' || !body.u.startsWith('/') || body.u.startsWith('//')) return NO_CONTENT()
    const type = body.t === 'event' ? 'event' : 'pageview'
    const name = type === 'event' ? String(body.n || '') : ''
    if (type === 'event' && !EVENT_NAME.test(name)) return NO_CONTENT()
    let url: URL
    try {
      url = new URL(String(body.u || ''), 'https://www.qrnot.com')
    } catch {
      return NO_CONTENT()
    }
    const path = url.pathname.slice(0, 300)
    // Yönetim ve firma panelleri ölçülmez
    if (/^\/(admin|dpp\/panel|api)(\/|$)/.test(path)) return NO_CONTENT()
    const visitor = visitorOf(req.headers)
    if (!(await consumeRateLimit(`t:${visitor}`, 600, 3600))) return NO_CONTENT()
    await ensureAnalyticsSchema()
    const src = sourceOf(url.searchParams, String(body.r || ''))
    // Site içi gezinti kendi kaynağını taşımaz: ziyaretçinin o günkü kaynağı geçerli kalsın diye 'internal' yazılır
    const source = src.internal ? 'internal' : src.source
    const props: Record<string, string> = {}
    if (type === 'event' && body.p && typeof body.p === 'object') {
      for (const [k, v] of Object.entries(body.p as Record<string, unknown>).slice(0, 6)) props[k.slice(0, 30)] = String(v).slice(0, 200)
    }
    await sql`
      INSERT INTO site_events (type, name, path, area, visitor, source, medium, campaign, content, referrer, country, device, lang, props)
      VALUES (${type}, ${name}, ${path}, ${areaOf(path)}, ${visitor}, ${source}, ${src.medium}, ${src.campaign}, ${src.content}, ${src.internal ? '' : src.refHost.slice(0, 200)},
              ${(req.headers.get('x-vercel-ip-country') || '').slice(0, 2)}, ${deviceOf(req.headers)}, ${String(body.l || '').slice(0, 8)}, ${JSON.stringify(props)}::jsonb)
    `
  } catch (err) {
    console.error('[analytics t]', err)
  }
  return NO_CONTENT()
}
