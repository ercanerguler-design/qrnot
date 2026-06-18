import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSectorUser, normalizeSector } from '@/lib/sectorPlatform'

export async function GET(req: NextRequest, { params }: { params: Promise<{ sector: string }> }) {
  try {
    const { sector: rawSector } = await params
    const sector = normalizeSector(rawSector)
    if (!sector) {
      return NextResponse.json({ error: 'Geçersiz sektör' }, { status: 400 })
    }

    const user = await getAuthenticatedSectorUser(req, sector)
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('[sector/auth/me]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
