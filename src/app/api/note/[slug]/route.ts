import { NextResponse } from 'next/server'

// Deprecated: use /api/qr/[slug] instead
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
