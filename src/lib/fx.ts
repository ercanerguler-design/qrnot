import { sql } from '@/lib/db'

// TCMB günlük euro kuru (döviz satış). DPP bayi ödemelerinde euro tutarı TL'ye çevirmek için kullanılır.
// Kaynak: https://www.tcmb.gov.tr/kurlar/today.xml — hafta sonu ve tatillerde son iş gününün kurunu verir.
// Son kur veritabanında saklanır: sunucusuz ortamda bellek sık sıfırlanır, TCMB de zaman zaman yavaş cevap verir.

const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml'
const FRESH_MS = 60 * 60 * 1000 // 1 saatten eski kur yenilenir
const STALE_MS = 72 * 60 * 60 * 1000 // TCMB'ye ulaşılamazsa en fazla 3 günlük kur kullanılır

type Rate = { rate: number; date: string }
let memory: (Rate & { at: number }) | null = null
let tableReady: Promise<void> | null = null

export class FxError extends Error {}

function ensureTable() {
  if (!tableReady) {
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS fx_rates (
          code VARCHAR(8) PRIMARY KEY,
          rate NUMERIC(12,4) NOT NULL,
          rate_date VARCHAR(16) NOT NULL DEFAULT '',
          fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
    })().catch((error) => {
      tableReady = null
      throw error
    })
  }
  return tableReady
}

async function fetchTcmb(): Promise<Rate> {
  const res = await fetch(TCMB_URL, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`TCMB ${res.status}`)
  const xml = await res.text()
  const block = xml.match(/<Currency[^>]*CurrencyCode="EUR"[^>]*>([\s\S]*?)<\/Currency>/)?.[1] || ''
  const rate = Number((block.match(/<ForexSelling>([\d.,]+)<\/ForexSelling>/)?.[1] || '').replace(',', '.'))
  const date = xml.match(/Tarih="([\d.]+)"/)?.[1] || ''
  // Mantıksız değer (boş, sıfır, aşırı uç) kabul edilmez
  if (!Number.isFinite(rate) || rate < 10 || rate > 1000) throw new Error('TCMB kuru okunamadı')
  return { rate, date }
}

/** 1 EUR kaç TL (TCMB döviz satış). */
export async function getEurTryRate(): Promise<Rate> {
  if (memory && Date.now() - memory.at < FRESH_MS) return { rate: memory.rate, date: memory.date }

  let stored: (Rate & { at: number }) | null = null
  try {
    await ensureTable()
    const rows = (await sql`SELECT rate, rate_date, fetched_at FROM fx_rates WHERE code = 'EUR'`) as Array<{ rate: string; rate_date: string; fetched_at: string }>
    if (rows[0]) stored = { rate: Number(rows[0].rate), date: rows[0].rate_date, at: new Date(rows[0].fetched_at).getTime() }
  } catch (error) {
    console.error('[fx db]', error)
  }
  if (stored && Date.now() - stored.at < FRESH_MS) {
    memory = stored
    return { rate: stored.rate, date: stored.date }
  }

  try {
    const fresh = await fetchTcmb()
    memory = { ...fresh, at: Date.now() }
    await sql`
      INSERT INTO fx_rates (code, rate, rate_date, fetched_at) VALUES ('EUR', ${fresh.rate}, ${fresh.date}, NOW())
      ON CONFLICT (code) DO UPDATE SET rate = EXCLUDED.rate, rate_date = EXCLUDED.rate_date, fetched_at = NOW()
    `.catch((error) => console.error('[fx save]', error))
    return fresh
  } catch (error) {
    console.error('[fx tcmb]', error)
    const fallback = [memory, stored].filter((x): x is Rate & { at: number } => Boolean(x)).sort((a, b) => b.at - a.at)[0]
    if (fallback && Date.now() - fallback.at < STALE_MS) return { rate: fallback.rate, date: fallback.date }
    throw new FxError('Döviz kuru şu an alınamadı. Biraz sonra tekrar dene ya da havale seç.')
  }
}
