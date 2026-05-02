import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

function generateSlug(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password, count = 1 } = body
    const providedPassword = String(password || '').trim()
    const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()

    if (!providedPassword || providedPassword !== configuredPassword) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const n = Math.min(Math.max(1, Number(count) || 1), 100)
    const baseUrl = String(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim()
    const created: { slug: string; qrUrl: string }[] = []

    for (let i = 0; i < n; i++) {
      let slug = generateSlug(8)
      for (let attempt = 0; attempt < 5; attempt++) {
        const existing = await sql`SELECT id FROM qr_codes WHERE slug = ${slug}`
        if (existing.length === 0) break
        slug = generateSlug(8)
      }
      await sql`INSERT INTO qr_codes (slug) VALUES (${slug})`
      created.push({ slug, qrUrl: `${baseUrl}/q/${slug}` })
    }

    return NextResponse.json({ created })
  } catch (err) {
    console.error('[qr/create]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
