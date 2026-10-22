import type { NextRequest } from 'next/server'
import { isDppLang, type DppLang } from './types'

/** Panelin seçili dili: istemci her istekte x-dpp-lang başlığını gönderir; yoksa tarayıcı dili, o da yoksa Türkçe. */
export function requestLang(req: NextRequest): DppLang {
  const header = req.headers.get('x-dpp-lang')
  if (isDppLang(header)) return header
  for (const part of (req.headers.get('accept-language') || '').split(',')) {
    const code = part.trim().slice(0, 2).toLowerCase()
    if (isDppLang(code)) return code
  }
  return 'tr'
}
