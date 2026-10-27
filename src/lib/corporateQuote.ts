import { sql } from '@/lib/db'
import { cleanQuoteItems, estimateQuote, QUOTE_MIN_QTY, type QuoteItems } from '@/lib/corporateQuoteShared'
import { cleanLeadDetails, isLeadTopic, type LeadTopicKey } from '@/lib/leadTopics'

// Kurumsal hediye teklif talepleri (/kurumsal-hediye formu). Yönetim panelinde "Kurumsal teklifler" sekmesinde izlenir.

export const QUOTE_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

let ready: Promise<void> | null = null
export function ensureQuoteSchema() {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS corporate_quotes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company VARCHAR(200) NOT NULL,
          name VARCHAR(120) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(40) NOT NULL,
          items JSONB NOT NULL DEFAULT '{}'::jsonb,
          total_qty INTEGER NOT NULL DEFAULT 0,
          est_total INTEGER NOT NULL DEFAULT 0,
          logo_box BOOLEAN NOT NULL DEFAULT FALSE,
          needed_by DATE,
          message TEXT NOT NULL DEFAULT '',
          lang VARCHAR(4) NOT NULL DEFAULT 'tr',
          source TEXT NOT NULL DEFAULT '',
          status VARCHAR(16) NOT NULL DEFAULT 'new',
          admin_note TEXT NOT NULL DEFAULT '',
          consent_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_corporate_quotes_created ON corporate_quotes(created_at DESC)`
      // Konu: gift (/kurumsal-hediye) ya da /teklif?konu=… (dpp, hotel, education…); details: konuya özel cevaplar
      await sql`ALTER TABLE corporate_quotes ADD COLUMN IF NOT EXISTS topic VARCHAR(20) NOT NULL DEFAULT 'gift'`
      await sql`ALTER TABLE corporate_quotes ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb`
    })().catch((err) => {
      ready = null
      throw err
    })
  }
  return ready
}

export class QuoteError extends Error {}

export type QuoteInput = {
  company: string
  name: string
  email: string
  phone: string
  items: QuoteItems
  logoBox: boolean
  neededBy: string | null
  message: string
  lang: 'tr' | 'en'
}

const text = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

/** Formdan gelen veriyi doğrular. Hata metni formun diline göre döner. */
export function parseQuoteInput(body: Record<string, unknown>, lang: 'tr' | 'en'): QuoteInput {
  const en = lang === 'en'
  const company = text(body.company, 200)
  const name = text(body.name, 120)
  const email = text(body.email, 255).toLowerCase()
  const phone = text(body.phone, 40)
  const message = String(body.message ?? '').trim().slice(0, 2000)
  const items = cleanQuoteItems(body.items)
  const neededRaw = text(body.neededBy, 10)
  const neededBy = /^\d{4}-\d{2}-\d{2}$/.test(neededRaw) ? neededRaw : null

  if (!company || !name) throw new QuoteError(en ? 'Please enter your company and name.' : 'Firma adını ve adını yaz.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new QuoteError(en ? 'Please enter a valid email.' : 'Geçerli bir e-posta yaz.')
  if (phone.replace(/\D/g, '').length < 10) throw new QuoteError(en ? 'Please enter a phone number.' : 'Telefon numaranı yaz.')
  if (estimateQuote(items).totalQty < QUOTE_MIN_QTY) {
    throw new QuoteError(en ? `Business orders start at ${QUOTE_MIN_QTY} pieces.` : `Kurumsal sipariş en az ${QUOTE_MIN_QTY} adettir.`)
  }
  if (body.consent !== true) throw new QuoteError(en ? 'Please accept the privacy notice.' : 'Aydınlatma metnini onayla.')

  return { company, name, email, phone, items, logoBox: body.logoBox === true, neededBy, message, lang }
}

export type LeadInput = {
  topic: LeadTopicKey
  company: string
  name: string
  email: string
  phone: string
  details: Record<string, string | number>
  message: string
  lang: 'tr' | 'en'
}

/** /teklif formu: ortak iletişim alanları + konuya özel cevaplar */
export function parseLeadInput(body: Record<string, unknown>, lang: 'tr' | 'en'): LeadInput {
  const en = lang === 'en'
  if (!isLeadTopic(body.topic)) throw new QuoteError(en ? 'Please choose a topic.' : 'Bir konu seç.')
  const topic = body.topic
  const company = text(body.company, 200)
  const name = text(body.name, 120)
  const email = text(body.email, 255).toLowerCase()
  const phone = text(body.phone, 40)
  const message = String(body.message ?? '').trim().slice(0, 2000)
  if (!company || !name) throw new QuoteError(en ? 'Please enter your company and name.' : 'Firma adını ve adını yaz.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new QuoteError(en ? 'Please enter a valid email.' : 'Geçerli bir e-posta yaz.')
  if (phone.replace(/\D/g, '').length < 10) throw new QuoteError(en ? 'Please enter a phone number.' : 'Telefon numaranı yaz.')
  if (body.consent !== true) throw new QuoteError(en ? 'Please accept the privacy notice.' : 'Aydınlatma metnini onayla.')
  return { topic, company, name, email, phone, details: cleanLeadDetails(topic, body.details), message, lang }
}

export async function saveLead(input: LeadInput, source: string) {
  await ensureQuoteSchema()
  const rows = (await sql`
    INSERT INTO corporate_quotes (topic, company, name, email, phone, details, message, lang, source, consent_at)
    VALUES (${input.topic}, ${input.company}, ${input.name}, ${input.email}, ${input.phone}, ${JSON.stringify(input.details)}::jsonb,
            ${input.message}, ${input.lang}, ${source.slice(0, 300)}, NOW())
    RETURNING id
  `) as Array<{ id: string }>
  return { id: rows[0].id }
}

export async function saveQuote(input: QuoteInput, source: string) {
  await ensureQuoteSchema()
  const estimate = estimateQuote(input.items)
  const rows = (await sql`
    INSERT INTO corporate_quotes (company, name, email, phone, items, total_qty, est_total, logo_box, needed_by, message, lang, source, consent_at)
    VALUES (${input.company}, ${input.name}, ${input.email}, ${input.phone}, ${JSON.stringify(input.items)}::jsonb, ${estimate.totalQty},
            ${estimate.total}, ${input.logoBox}, ${input.neededBy}, ${input.message}, ${input.lang}, ${source.slice(0, 300)}, NOW())
    RETURNING id
  `) as Array<{ id: string }>
  return { id: rows[0].id, estimate }
}
