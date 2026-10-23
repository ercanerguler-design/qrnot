'use client'

import { useCallback, useEffect, useState } from 'react'

// Ölçüm: hangi kaynaktan / kampanyadan kaç ziyaretçi geldi, hangi üründe dolaştı, ne kadarı dönüşüme geçti.
// Çerezsiz ölçüm: ziyaretçi gün başına tekil sayılır, kaynak o günkü ilk dış kaynaktır.

type Conv = Record<string, number>
interface Data {
  days: number
  since: string
  conversionNames: Record<string, string>
  totals: { visitors: number; pageviews: number; conversions: number; revenue_try: number; revenue_usd: number; revenue_eur: number }
  daily: Array<{ day: string; visitors: number; pageviews: number; conversions: number }>
  sources: Array<{ source: string; medium: string; visitors: number; conversions: Conv; revenue: number }>
  campaigns: Array<{ source: string; campaign: string; visitors: number; conversions: Conv; revenue: number }>
  areas: Array<{ area: string; visitors: number; pageviews: number; conversions: number }>
  pages: Array<{ path: string; views: number; visitors: number }>
  clicks: Array<{ name: string; label: string; n: number }>
  conversions: Array<{ name: string; n: number; value: number }>
  recent: Array<{ created_at: string; name: string; source: string; medium: string; campaign: string; value: number | null; currency: string | null; area: string; landing: string | null }>
  countries: Array<{ country: string; visitors: number }>
  devices: Array<{ device: string; visitors: number }>
}

const AREA_LABEL: Record<string, string> = {
  home: '🏠 Ana sayfa',
  shop: '🛒 Mağaza',
  nfc: '📶 NFC / katalog',
  guestbook: '📖 Anı defteri',
  dpp: '🛂 DPP',
  sector: '🏢 Sektör panelleri',
  etsy: '🧡 Etsy',
  partner: '🤝 Partnerlik',
  app: '🔳 QR kullanımı (tarama, yönetim)',
  other: 'Diğer',
}
const CLICK_LABEL: Record<string, string> = {
  whatsapp_click: '💬 WhatsApp',
  phone_click: '📞 Telefon',
  email_click: '✉️ E-posta',
  outbound_click: '↗ Dış bağlantı',
}
const n = new Intl.NumberFormat('tr-TR')
const card = 'rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5'
const th = 'px-2 py-1.5 text-left text-xs font-medium uppercase text-neutral-500'
const td = 'px-2 py-1.5'

function rate(conv: number, visitors: number) {
  return visitors ? `${((conv / visitors) * 100).toFixed(1)}%` : '—'
}
const sumConv = (c: Conv) => Object.entries(c).reduce((s, [k, v]) => (k === 'checkout_start' ? s : s + v), 0)

export function AnalyticsTab({ password }: { password: string }) {
  const [days, setDays] = useState(30)
  const [area, setArea] = useState('')
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/admin/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, days, area }) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) setError(json.error || 'Yüklenemedi')
    else setData(json)
  }, [password, days, area])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const convLabel = (k: string) => data?.conversionNames[k] || k
  const convText = (c: Conv) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${convLabel(k)}: ${v}`)
      .join(' · ') || '—'
  const maxDaily = Math.max(1, ...(data?.daily.map((d) => d.visitors) || [1]))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-neutral-400">Reklam, arama ve sosyal medyadan gelen ziyaretçiler ve dönüşümleri</p>
        <select className="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Tüm ürünler</option>
          {Object.entries(AREA_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        {[1, 7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-xl px-3 py-2 text-sm ${days === d ? 'bg-cyan-500 font-semibold text-black' : 'border border-neutral-700 hover:bg-neutral-800'}`}
          >
            {d === 1 ? 'Bugün' : `${d} gün`}
          </button>
        ))}
      </div>
      {error && <p className="rounded-2xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>}
      {!data ? (
        <p className="text-neutral-500">Yükleniyor…</p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ['Ziyaretçi', n.format(data.totals.visitors)],
              ['Sayfa görüntüleme', n.format(data.totals.pageviews)],
              ['Dönüşüm', n.format(data.totals.conversions)],
              ['Dönüşüm oranı', rate(data.totals.conversions, data.totals.visitors)],
              [
                'Ölçülen satış',
                [data.totals.revenue_try && `₺${n.format(data.totals.revenue_try)}`, data.totals.revenue_usd && `$${n.format(data.totals.revenue_usd)}`, data.totals.revenue_eur && `€${n.format(data.totals.revenue_eur)}`]
                  .filter(Boolean)
                  .join(' · ') || '—',
              ],
            ].map(([k, v]) => (
              <div key={k} className={card}>
                <p className="text-xs text-neutral-500">{k}</p>
                <p className="mt-1 text-2xl font-semibold">{v}</p>
              </div>
            ))}
          </section>

          {data.daily.length > 1 && (
            <section className={card}>
              <h3 className="font-semibold">Günlük ziyaretçi</h3>
              <div className="mt-4 flex h-32 items-end gap-1">
                {data.daily.map((d) => (
                  <div key={d.day} className="group relative flex-1" title={`${d.day}: ${d.visitors} ziyaretçi, ${d.conversions} dönüşüm`}>
                    <div className="rounded-t bg-cyan-500/70" style={{ height: `${Math.max(2, (d.visitors / maxDaily) * 120)}px` }} />
                    {d.conversions > 0 && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-emerald-400">●</div>}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-neutral-500">Yeşil nokta: o gün dönüşüm var. Sütunun üstüne gelince ayrıntı.</p>
            </section>
          )}

          <section className={card}>
            <h3 className="font-semibold">Dönüşümler</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.keys(data.conversionNames).map((k) => {
                const c = data.conversions.find((x) => x.name === k)
                return (
                  <span key={k} className={`rounded-2xl border px-3 py-2 text-sm ${c ? 'border-emerald-700 bg-emerald-500/10' : 'border-neutral-800 text-neutral-500'}`}>
                    {convLabel(k)}: <b>{c?.n || 0}</b>
                    {c && c.value > 0 ? ` · ${n.format(c.value)}` : ''}
                  </span>
                )
              })}
            </div>
          </section>

          <section className={card}>
            <h3 className="font-semibold">Kaynaklar (reklam / site / arama)</h3>
            <p className="mt-1 text-xs text-neutral-500">Reklam bağlantılarına utm_source / utm_campaign ekle; Google, Meta ve LinkedIn tıklamaları kendiliğinden tanınır.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr>
                    <th className={th}>Kaynak</th>
                    <th className={th}>Tür</th>
                    <th className={th}>Ziyaretçi</th>
                    <th className={th}>Dönüşüm</th>
                    <th className={th}>Oran</th>
                    <th className={th}>Ayrıntı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {data.sources.map((s) => (
                    <tr key={s.source + s.medium}>
                      <td className={`${td} font-medium`}>{s.source === 'direct' ? 'Doğrudan / bilinmiyor' : s.source}</td>
                      <td className={`${td} text-neutral-400`}>{s.medium || '—'}</td>
                      <td className={td}>{n.format(s.visitors)}</td>
                      <td className={td}>{sumConv(s.conversions)}</td>
                      <td className={td}>{rate(sumConv(s.conversions), s.visitors)}</td>
                      <td className={`${td} text-xs text-neutral-400`}>{convText(s.conversions)}</td>
                    </tr>
                  ))}
                  {data.sources.length === 0 && (
                    <tr>
                      <td className={`${td} text-neutral-500`} colSpan={6}>
                        Henüz veri yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={card}>
            <h3 className="font-semibold">Kampanyalar (utm_campaign)</h3>
            {data.campaigns.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">
                Henüz kampanya yok. Örnek reklam bağlantısı: <code className="text-cyan-300">https://www.qrnot.com/dpp?utm_source=linkedin&utm_medium=cpc&utm_campaign=dpp-batarya-ekim</code>
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr>
                      <th className={th}>Kampanya</th>
                      <th className={th}>Kaynak</th>
                      <th className={th}>Ziyaretçi</th>
                      <th className={th}>Dönüşüm</th>
                      <th className={th}>Ayrıntı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {data.campaigns.map((c) => (
                      <tr key={c.source + c.campaign}>
                        <td className={`${td} font-medium`}>{c.campaign}</td>
                        <td className={`${td} text-neutral-400`}>{c.source}</td>
                        <td className={td}>{n.format(c.visitors)}</td>
                        <td className={td}>{sumConv(c.conversions)}</td>
                        <td className={`${td} text-xs text-neutral-400`}>{convText(c.conversions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className={card}>
              <h3 className="font-semibold">Ürün alanları</h3>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Alan</th>
                    <th className={th}>Ziyaretçi</th>
                    <th className={th}>Görüntüleme</th>
                    <th className={th}>Dönüşüm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {data.areas.map((a) => (
                    <tr key={a.area} className="cursor-pointer hover:bg-neutral-900" onClick={() => setArea(a.area)}>
                      <td className={td}>{AREA_LABEL[a.area] || a.area}</td>
                      <td className={td}>{n.format(a.visitors)}</td>
                      <td className={td}>{n.format(a.pageviews)}</td>
                      <td className={td}>{a.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={card}>
              <h3 className="font-semibold">Tıklamalar</h3>
              <table className="mt-3 w-full text-sm">
                <tbody className="divide-y divide-neutral-900">
                  {data.clicks.map((c, i) => (
                    <tr key={i}>
                      <td className={td}>{CLICK_LABEL[c.name] || c.name}</td>
                      <td className={`${td} text-xs text-neutral-400`}>{c.label}</td>
                      <td className={`${td} text-right`}>{c.n}</td>
                    </tr>
                  ))}
                  {data.clicks.length === 0 && (
                    <tr>
                      <td className={`${td} text-neutral-500`}>Henüz tıklama yok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className={card}>
              <h3 className="font-semibold">En çok görüntülenen sayfalar</h3>
              <table className="mt-3 w-full text-sm">
                <tbody className="divide-y divide-neutral-900">
                  {data.pages.map((p) => (
                    <tr key={p.path}>
                      <td className={`${td} break-all font-mono text-xs`}>{p.path}</td>
                      <td className={`${td} text-right`}>{n.format(p.views)}</td>
                      <td className={`${td} text-right text-neutral-400`}>{n.format(p.visitors)} kişi</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-5">
              <div className={card}>
                <h3 className="font-semibold">Ülke</h3>
                <p className="mt-2 text-sm text-neutral-300">{data.countries.map((c) => `${c.country} ${c.visitors}`).join(' · ') || '—'}</p>
              </div>
              <div className={card}>
                <h3 className="font-semibold">Cihaz</h3>
                <p className="mt-2 text-sm text-neutral-300">
                  {data.devices.map((d) => `${{ mobile: '📱 Mobil', desktop: '💻 Masaüstü', tablet: 'Tablet' }[d.device] || d.device} ${d.visitors}`).join(' · ') || '—'}
                </p>
              </div>
            </div>
          </section>

          <section className={card}>
            <h3 className="font-semibold">Son dönüşümler</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <tbody className="divide-y divide-neutral-900">
                  {data.recent.map((r, i) => (
                    <tr key={i}>
                      <td className={`${td} whitespace-nowrap text-xs text-neutral-400`}>{new Date(r.created_at).toLocaleString('tr-TR')}</td>
                      <td className={td}>{convLabel(r.name)}</td>
                      <td className={td}>
                        {r.source === 'direct' ? 'Doğrudan' : r.source}
                        {r.campaign ? ` · ${r.campaign}` : ''}
                      </td>
                      <td className={`${td} font-mono text-xs text-neutral-400`}>{r.landing || ''}</td>
                      <td className={`${td} text-right`}>{r.value ? `${n.format(r.value)} ${r.currency || ''}` : ''}</td>
                    </tr>
                  ))}
                  {data.recent.length === 0 && (
                    <tr>
                      <td className={`${td} text-neutral-500`}>Bu dönemde dönüşüm yok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <p className="text-xs text-neutral-500">
            Çerezsiz ölçüm: IP saklanmaz, ziyaretçi her gün yeniden sayılır. Bu cihazdaki ziyaretlerin ölçülmemesi için yönetim paneline girmen yeterli (otomatik kapatılır). Ölçüm {data.since}
            tarihinden itibaren.
          </p>
        </>
      )}
    </div>
  )
}
