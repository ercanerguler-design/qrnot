import { resolveDigitalLink } from '@/lib/dpp/resolver'

// GS1 Digital Link: /01/{GTIN}/21/{seri} → tekil ürün pasaportu (seri bulunamazsa ürün pasaportu)
export async function GET(_req: Request, { params }: { params: Promise<{ gtin: string; serial: string }> }) {
  const { gtin, serial } = await params
  return resolveDigitalLink(gtin, decodeURIComponent(serial))
}
