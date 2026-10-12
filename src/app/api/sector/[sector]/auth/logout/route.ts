import { NextRequest, NextResponse } from 'next/server'
import { clearSectorAuthCookie, deleteSectorSession, getSectorCookieName, normalizeSector } from '@/lib/sectorPlatform'

export async function POST(req: NextRequest, { params }: { params: Promise<{ sector: string }> }) {
  try {
    const { sector: rawSector } = await params
    const sector = normalizeSector(rawSector)
    if (!sector) {
      return NextResponse.json({ error: 'Geçersiz sektör' }, { status: 400 })
    }

    const token = req.cookies.get(getSectorCookieName(sector))?.value?.trim()
    await deleteSectorSession(sector, token)
    return clearSectorAuthCookie(NextResponse.json({ ok: true }), sector)
  } catch (err) {
    console.error('[sector/auth/logout]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
