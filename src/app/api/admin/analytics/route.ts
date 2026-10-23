import { NextRequest, NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'
import { sql } from '@/lib/db'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { CONVERSIONS, ensureAnalyticsSchema } from '@/lib/analytics'

// Yönetim → Ölçüm: ziyaretçi, kaynak / kampanya, ürün alanı, sayfa, tıklama ve dönüşüm tabloları.
// Ziyaretçi = gün başına tekil (çerezsiz ölçüm). Kaynak = ziyaretçinin o günkü ilk dış kaynağı.

export async function POST(req: NextRequest) {
  if (!(await consumeRateLimit(`admin-analytics:${clientIp(req.headers)}`, 300, 3600))) return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 })
  const body = await req.json().catch(() => ({}))
  if (!(await checkAdminPassword(req, body.password))) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  await ensureAnalyticsSchema()
  const days = [1, 7, 30, 90, 365].includes(Number(body.days)) ? Number(body.days) : 30
  const area = typeof body.area === 'string' && /^[a-z]{2,20}$/.test(body.area) ? body.area : ''
  const since = new Date(Date.now() + 3 * 3600_000 - (days - 1) * 86400_000).toISOString().slice(0, 10)

  const [totals, daily, sources, campaigns, areas, pages, clicks, conversions, recent, countries, devices] = await Promise.all([
    sql`
      SELECT COUNT(DISTINCT (visitor, day)) FILTER (WHERE type = 'pageview')::int AS visitors,
             COUNT(*) FILTER (WHERE type = 'pageview')::int AS pageviews,
             COUNT(*) FILTER (WHERE type = 'conversion' AND name NOT IN ('checkout_start'))::int AS conversions,
             COALESCE(SUM(value) FILTER (WHERE type = 'conversion' AND name = 'purchase' AND currency = 'TRY'), 0)::float AS revenue_try,
             COALESCE(SUM(value) FILTER (WHERE type = 'conversion' AND name = 'purchase' AND currency = 'USD'), 0)::float AS revenue_usd,
             COALESCE(SUM(value) FILTER (WHERE type = 'conversion' AND name = 'purchase' AND currency = 'EUR'), 0)::float AS revenue_eur
      FROM site_events WHERE day >= ${since} AND (${area} = '' OR area = ${area})
    `,
    sql`
      SELECT day::text AS day, COUNT(DISTINCT visitor) FILTER (WHERE type = 'pageview')::int AS visitors,
             COUNT(*) FILTER (WHERE type = 'pageview')::int AS pageviews,
             COUNT(*) FILTER (WHERE type = 'conversion' AND name <> 'checkout_start')::int AS conversions
      FROM site_events WHERE day >= ${since} AND (${area} = '' OR area = ${area})
      GROUP BY day ORDER BY day
    `,
    sql`
      WITH vs AS (
        SELECT DISTINCT ON (visitor, day) visitor, day, CASE WHEN source = 'internal' THEN 'direct' ELSE source END AS source, medium
        FROM site_events WHERE type = 'pageview' AND day >= ${since} AND (${area} = '' OR area = ${area})
        ORDER BY visitor, day, (source IN ('direct', 'internal')) ASC, created_at ASC
      ),
      conv AS (
        SELECT source, medium, name, COUNT(*)::int AS n, COALESCE(SUM(value) FILTER (WHERE name = 'purchase'), 0)::float AS revenue
        FROM site_events WHERE type = 'conversion' AND day >= ${since} AND (${area} = '' OR area = ${area})
        GROUP BY source, medium, name
      )
      SELECT k.source, k.medium,
             COALESCE((SELECT COUNT(*) FROM vs WHERE vs.source = k.source AND vs.medium = k.medium), 0)::int AS visitors,
             COALESCE((SELECT json_object_agg(name, n) FROM conv WHERE conv.source = k.source AND conv.medium = k.medium), '{}'::json) AS conversions,
             COALESCE((SELECT SUM(revenue) FROM conv WHERE conv.source = k.source AND conv.medium = k.medium), 0)::float AS revenue
      FROM (SELECT source, medium FROM vs UNION SELECT source, medium FROM conv) k
      ORDER BY visitors DESC LIMIT 40
    `,
    sql`
      WITH vs AS (
        SELECT DISTINCT ON (visitor, day) visitor, day, source, campaign
        FROM site_events WHERE type = 'pageview' AND day >= ${since} AND campaign <> ''
        ORDER BY visitor, day, created_at ASC
      ),
      conv AS (
        SELECT source, campaign, name, COUNT(*)::int AS n, COALESCE(SUM(value) FILTER (WHERE name = 'purchase'), 0)::float AS revenue
        FROM site_events WHERE type = 'conversion' AND day >= ${since} AND campaign <> '' GROUP BY source, campaign, name
      )
      SELECT k.source, k.campaign,
             COALESCE((SELECT COUNT(*) FROM vs WHERE vs.source = k.source AND vs.campaign = k.campaign), 0)::int AS visitors,
             COALESCE((SELECT json_object_agg(name, n) FROM conv WHERE conv.source = k.source AND conv.campaign = k.campaign), '{}'::json) AS conversions,
             COALESCE((SELECT SUM(revenue) FROM conv WHERE conv.source = k.source AND conv.campaign = k.campaign), 0)::float AS revenue
      FROM (SELECT source, campaign FROM vs UNION SELECT source, campaign FROM conv) k
      ORDER BY visitors DESC LIMIT 40
    `,
    sql`
      SELECT area, COUNT(DISTINCT (visitor, day)) FILTER (WHERE type = 'pageview')::int AS visitors,
             COUNT(*) FILTER (WHERE type = 'pageview')::int AS pageviews,
             COUNT(*) FILTER (WHERE type = 'conversion' AND name <> 'checkout_start')::int AS conversions
      FROM site_events WHERE day >= ${since} GROUP BY area ORDER BY visitors DESC
    `,
    sql`
      SELECT path, COUNT(*)::int AS views, COUNT(DISTINCT (visitor, day))::int AS visitors
      FROM site_events WHERE type = 'pageview' AND day >= ${since} AND (${area} = '' OR area = ${area})
      GROUP BY path ORDER BY views DESC LIMIT 30
    `,
    sql`
      SELECT name, COALESCE(props->>'host', props->>'label', '') AS label, COUNT(*)::int AS n
      FROM site_events WHERE type = 'event' AND day >= ${since} AND (${area} = '' OR area = ${area})
      GROUP BY name, label ORDER BY n DESC LIMIT 30
    `,
    sql`
      SELECT name, COUNT(*)::int AS n, COALESCE(SUM(value), 0)::float AS value
      FROM site_events WHERE type = 'conversion' AND day >= ${since} AND (${area} = '' OR area = ${area})
      GROUP BY name
    `,
    sql`
      SELECT created_at, name, source, medium, campaign, value, currency, area, props->>'landing' AS landing
      FROM site_events WHERE type = 'conversion' AND day >= ${since} AND (${area} = '' OR area = ${area})
      ORDER BY created_at DESC LIMIT 40
    `,
    sql`
      SELECT COALESCE(NULLIF(country, ''), '?') AS country, COUNT(DISTINCT (visitor, day))::int AS visitors
      FROM site_events WHERE type = 'pageview' AND day >= ${since} AND (${area} = '' OR area = ${area})
      GROUP BY 1 ORDER BY visitors DESC LIMIT 12
    `,
    sql`
      SELECT COALESCE(NULLIF(device, ''), '?') AS device, COUNT(DISTINCT (visitor, day))::int AS visitors
      FROM site_events WHERE type = 'pageview' AND day >= ${since} AND (${area} = '' OR area = ${area})
      GROUP BY 1 ORDER BY visitors DESC
    `,
  ])

  return NextResponse.json(
    { days, since, area, conversionNames: CONVERSIONS, totals: totals[0], daily, sources, campaigns, areas, pages, clicks, conversions, recent, countries, devices },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
