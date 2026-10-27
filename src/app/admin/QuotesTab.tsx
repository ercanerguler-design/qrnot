'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatMoney, PRODUCTS } from '@/lib/commerce/catalog'
import { btn, input, type Caller } from './ShopTabs'

// Kurumsal hediye teklif talepleri: /kurumsal-hediye formundan gelir.

type Quote = {
  id: string
  company: string
  name: string
  email: string
  phone: string
  items: Record<string, number>
  total_qty: number
  est_total: number
  logo_box: boolean
  needed_by: string | null
  message: string
  lang: string
  source: string
  status: string
  admin_note: string
  created_at: string
}

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  new: '🆕 Yeni',
  contacted: '📞 Arandı',
  quoted: '📄 Teklif gönderildi',
  won: '✅ Kazanıldı',
  lost: '✖️ Kaybedildi',
}
const STATUS_TONE: Record<string, string> = {
  new: 'border-cyan-700 text-cyan-300',
  contacted: 'border-amber-700 text-amber-300',
  quoted: 'border-violet-700 text-violet-300',
  won: 'border-emerald-700 text-emerald-300',
  lost: 'border-neutral-700 text-neutral-400',
}

const productName = (id: string) => PRODUCTS.find((p) => p.id === id)?.name.tr || id
const phoneDigits = (phone: string) => {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('0') ? `9${d}` : d.length === 10 ? `90${d}` : d
}

export function QuotesTab({ call }: { call: Caller }) {
  const [status, setStatus] = useState('')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await call<{ quotes: Quote[]; counts: Array<{ status: string; count: number }> }>('quotes.list', { status })
    if (data) {
      setQuotes(data.quotes)
      setCounts(Object.fromEntries(data.counts.map((c) => [c.status, c.count])))
    }
    setLoading(false)
  }, [call, status])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const update = async (id: string, payload: Record<string, unknown>) => {
    if (await call('quotes.update', { id, ...payload })) await load()
  }
  const remove = async (quote: Quote) => {
    if (!window.confirm(`${quote.company} talebi silinsin mi?`)) return
    if (await call('quotes.delete', { id: quote.id })) await load()
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  const pipeline = quotes.filter((q) => q.status !== 'lost').reduce((s, q) => s + q.est_total, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className={`${input.replace('w-full ', '')} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tümü ({total})</option>
          {Object.entries(QUOTE_STATUS_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label} ({counts[key] || 0})
            </option>
          ))}
        </select>
        <button className={`${btn} bg-neutral-800`} onClick={() => void load()}>
          Yenile
        </button>
        <a href="/kurumsal-hediye" target="_blank" className="ml-auto text-sm text-cyan-300 hover:underline">
          Formu gör ↗
        </a>
      </div>
      <p className="text-sm text-neutral-400">
        Listede {quotes.length} talep · açık taleplerin tahmini toplamı <span className="font-semibold text-white">{formatMoney(pipeline, 'TRY')}</span> (KDV dahil)
      </p>

      {quotes.length === 0 && <p className="rounded-2xl border border-neutral-800 p-6 text-center text-neutral-500">{loading ? 'Yükleniyor…' : 'Henüz talep yok'}</p>}

      {quotes.map((quote) => (
        <details key={quote.id} className="group rounded-2xl border border-neutral-800 bg-neutral-950/60" open={quote.status === 'new'}>
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
            <span className="font-semibold">{quote.company}</span>
            <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_TONE[quote.status] || STATUS_TONE.lost}`}>{QUOTE_STATUS_LABEL[quote.status] || quote.status}</span>
            <span className="text-sm text-neutral-300">
              {quote.total_qty} adet · {formatMoney(quote.est_total, 'TRY')}
            </span>
            <span className="ml-auto text-xs text-neutral-500">{new Date(quote.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
          </summary>
          <div className="grid gap-4 border-t border-neutral-800 p-4 text-sm md:grid-cols-2">
            <div className="space-y-1.5">
              <p>
                <span className="text-neutral-500">Kişi:</span> {quote.name}
              </p>
              <p>
                <span className="text-neutral-500">Telefon:</span>{' '}
                <a className="text-cyan-300 hover:underline" href={`tel:${quote.phone}`}>
                  {quote.phone}
                </a>{' '}
                ·{' '}
                <a className="text-emerald-300 hover:underline" href={`https://wa.me/${phoneDigits(quote.phone)}`} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </p>
              <p>
                <span className="text-neutral-500">E-posta:</span>{' '}
                <a className="text-cyan-300 hover:underline" href={`mailto:${quote.email}`}>
                  {quote.email}
                </a>
              </p>
              <ul className="mt-2 space-y-0.5">
                {Object.entries(quote.items || {}).map(([id, qty]) => (
                  <li key={id}>
                    • {productName(id)}: <span className="font-semibold">{qty}</span> adet
                  </li>
                ))}
              </ul>
              {quote.logo_box && <p className="text-amber-300">🎁 Logolu kutu istiyor</p>}
              {quote.needed_by && <p>📅 Teslim: {new Date(quote.needed_by).toLocaleDateString('tr-TR')}</p>}
              {quote.message && <p className="whitespace-pre-line rounded-xl bg-neutral-900 p-3 text-neutral-300">{quote.message}</p>}
              <p className="text-xs text-neutral-500">
                Dil: {quote.lang.toUpperCase()} · Kaynak: {quote.source || '-'}
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-neutral-400">Durum</label>
              <select className={input} value={quote.status} onChange={(e) => void update(quote.id, { status: e.target.value })}>
                {Object.entries(QUOTE_STATUS_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <label className="block pt-2 text-xs text-neutral-400">Not (sadece sen görürsün)</label>
              <textarea
                className={`${input} min-h-20`}
                value={notes[quote.id] ?? quote.admin_note}
                onChange={(e) => setNotes((cur) => ({ ...cur, [quote.id]: e.target.value }))}
                placeholder="Örn. 12.11 arandı, kutu tasarımı bekleniyor"
              />
              <div className="flex gap-2">
                <button
                  className={`${btn} bg-cyan-500 text-neutral-950`}
                  disabled={(notes[quote.id] ?? quote.admin_note) === quote.admin_note}
                  onClick={() => void update(quote.id, { note: notes[quote.id] ?? quote.admin_note })}
                >
                  Notu kaydet
                </button>
                <button className={`${btn} ml-auto bg-neutral-800 text-red-300`} onClick={() => void remove(quote)}>
                  Sil
                </button>
              </div>
            </div>
          </div>
        </details>
      ))}
    </div>
  )
}
