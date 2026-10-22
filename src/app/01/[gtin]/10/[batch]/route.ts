import { resolveDigitalLink } from '@/lib/dpp/resolver'

// GS1 Digital Link: /01/{GTIN}/10/{parti} → ürün pasaportu (parti bilgisi ürün düzeyinde gösterilir)
export async function GET(_req: Request, { params }: { params: Promise<{ gtin: string }> }) {
  const { gtin } = await params
  return resolveDigitalLink(gtin, null)
}
