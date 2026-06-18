import { NextRequest, NextResponse } from 'next/server'
import { deactivateAllExpiredDemoQrs, ensureQrSchema, sql } from '@/lib/db'

function csvEscape(value: unknown) {
  const text = String(value ?? '')
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export async function POST(req: NextRequest) {
  try {
    await ensureQrSchema()
    await deactivateAllExpiredDemoQrs()

    const body = await req.json().catch(() => ({}))
    const providedPassword = String(body.password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
    const exportType = String(body.exportType || '').trim()

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    if (exportType !== 'individual' && exportType !== 'corporate') {
      return NextResponse.json({ error: 'Geçersiz export tipi' }, { status: 400 })
    }

    const rows = await sql`
      SELECT q.slug, q.order_type, q.is_demo, q.is_active, q.is_claimed, q.title,
             q.play_count, q.recording_count, q.recording_limit, q.video_recording_count,
             q.video_recording_limit, q.video_max_seconds, q.created_at, q.updated_at,
             u.email AS owner_email
      FROM qr_codes q
      LEFT JOIN users u ON u.id = q.creator_user_id
      WHERE q.order_type = ${exportType}
      ORDER BY q.created_at DESC
      LIMIT 10000
    `

    const headers = [
      'slug',
      'order_type',
      'is_demo',
      'is_active',
      'is_claimed',
      'title',
      'owner_email',
      'play_count',
      'recording_count',
      'recording_limit',
      'video_recording_count',
      'video_recording_limit',
      'video_max_seconds',
      'created_at',
      'updated_at',
    ]

    const lines = [
      headers.join(','),
      ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(',')),
    ]

    const csv = `\uFEFF${lines.join('\n')}`
    const filename = `qr-list-${exportType}-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[admin/qr/export]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

