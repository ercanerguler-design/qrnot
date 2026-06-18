import { NextRequest, NextResponse } from 'next/server'
import { normalizeSector, sectorAdminAction } from '@/lib/sectorPlatform'

export async function POST(req: NextRequest, { params }: { params: Promise<{ sector: string }> }) {
  try {
    const { sector: rawSector } = await params
    const sector = normalizeSector(rawSector)
    if (!sector) {
      return NextResponse.json({ error: 'Geçersiz sektör' }, { status: 400 })
    }

    return await sectorAdminAction(req, sector)
  } catch (err) {
    console.error('[sector/admin]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
