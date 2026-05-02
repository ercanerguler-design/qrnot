import { sql } from '@/lib/db'

function generateSlug(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function createBlankQRCodes(count: number, baseUrl: string) {
  const created: { slug: string; qrUrl: string }[] = []

  for (let index = 0; index < count; index += 1) {
    let slug = generateSlug(8)

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await sql`SELECT id FROM qr_codes WHERE slug = ${slug}`
      if (existing.length === 0) break
      slug = generateSlug(8)
    }

    await sql`INSERT INTO qr_codes (slug) VALUES (${slug})`
    created.push({ slug, qrUrl: `${baseUrl}/q/${slug}` })
  }

  return created
}