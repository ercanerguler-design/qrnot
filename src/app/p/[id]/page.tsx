import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { loadPublicPassport, digitalLink, passportUrl, recordPassportScan } from '@/lib/dpp/server'
import { DPP_LANG_NAMES, DPP_LANGS, isDppLang, type DppLang, type DppTexts } from '@/lib/dpp/types'
import { SITE_URL } from '@/lib/site'
import { PASSPORT_LABELS } from './labels'
import PrintButton from './PrintButton'

// Herkese açık Dijital Ürün Pasaportu. Ürün QR'ı / NFC'si / GS1 Digital Link bu sayfayı açar.

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string; k?: string }> }

async function pickLang(requested: string | undefined, available: DppLang[], fallback: DppLang): Promise<DppLang> {
  if (isDppLang(requested)) return requested
  const accept = (await headers()).get('accept-language') || ''
  for (const part of accept.split(',')) {
    const code = part.trim().slice(0, 2).toLowerCase()
    if (isDppLang(code) && (available.includes(code) || code === 'en' || code === 'tr')) return code
  }
  return fallback
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params
  const view = await loadPublicPassport(id, null)
  if (!view) return { title: 'Pasaport bulunamadı', robots: { index: false } }
  const { lang } = await searchParams
  const l = isDppLang(lang) && view.texts[lang]?.name ? lang : view.defaultLang
  const name = view.texts[l]?.name || view.texts[view.defaultLang]?.name || ''
  return {
    title: `${name} · ${PASSPORT_LABELS[l].title}`,
    description: `${view.data.brand} ${view.data.model} — ${PASSPORT_LABELS[l].title}`.trim(),
    robots: { index: false, follow: false },
    alternates: { types: { 'application/json': `${SITE_URL}/api/dpp/passport/${id}` } },
  }
}

export default async function PassportPage({ params, searchParams }: Props) {
  const { id } = await params
  const { lang: requested, k } = await searchParams
  const view = await loadPublicPassport(id, k || null)
  if (!view) notFound()

  const uiLang = await pickLang(requested, view.langs, view.defaultLang)
  const contentLang: DppLang = view.texts[uiLang]?.name ? uiLang : view.defaultLang
  const L = PASSPORT_LABELS[uiLang]
  const t = view.texts[contentLang] as DppTexts
  const d = view.data
  const rtl = uiLang === 'ar'
  const region = new Intl.DisplayNames([uiLang], { type: 'region' })
  const country = (code: string) => {
    try {
      return code ? `${flag(code)} ${region.of(code)}` : ''
    } catch {
      return code
    }
  }
  const fmt = new Intl.NumberFormat(uiLang, { maximumFractionDigits: 2 })
  const date = (iso: string) => new Date(iso).toLocaleDateString(uiLang, { year: 'numeric', month: 'long', day: 'numeric' })
  const keyParam = view.restrictedAccess && k ? `?k=${encodeURIComponent(k)}` : ''
  const langHref = (l: DppLang) => `/p/${id}?lang=${l}${view.restrictedAccess && k ? `&k=${encodeURIComponent(k)}` : ''}`

  const h = await headers()
  const ua = h.get('user-agent') || ''
  if (!/bot|crawl|spider|preview|facebookexternalhit|whatsapp/i.test(ua)) {
    after(() => recordPassportScan(view.productId, view.itemId, h.get('x-vercel-ip-country') || '', uiLang).catch(() => undefined))
  }

  const facts: Array<[string, string]> = [
    [L.brand, d.brand],
    [L.model, d.model],
    [L.gtin, d.gtin],
    [L.category, L.categories[d.category]],
    [L.origin, country(d.countryOfOrigin)],
    [L.weight, d.weightGrams !== null ? (d.weightGrams >= 1000 ? `${fmt.format(d.weightGrams / 1000)} kg` : `${fmt.format(d.weightGrams)} g`) : ''],
    [L.dimensions, d.dimensions],
  ].filter((f): f is [string, string] => Boolean(f[1]))

  const env: Array<[string, string]> = [
    [L.carbon, d.environment.carbonKg !== null ? `${fmt.format(d.environment.carbonKg)} kg CO₂e` : ''],
    [L.water, d.environment.waterLiters !== null ? `${fmt.format(d.environment.waterLiters)} L` : ''],
    [L.energy, d.environment.energyKwh !== null ? `${fmt.format(d.environment.energyKwh)} kWh` : ''],
    [L.recycledContent, d.environment.recycledContentPercent !== null ? `%${fmt.format(d.environment.recycledContentPercent)}` : ''],
    [L.recyclable, d.environment.recyclablePercent !== null ? `%${fmt.format(d.environment.recyclablePercent)}` : ''],
    [L.lifetime, d.environment.expectedLifetimeYears !== null ? `${fmt.format(d.environment.expectedLifetimeYears)} ${L.years}` : ''],
  ].filter((f): f is [string, string] => Boolean(f[1]))

  const repairFacts: Array<[string, string]> = [
    [L.warranty, d.repairability.warrantyMonths !== null ? `${fmt.format(d.repairability.warrantyMonths)} ${L.months}` : ''],
    [L.spareParts, d.repairability.sparePartsYears !== null ? `${fmt.format(d.repairability.sparePartsYears)} ${L.years}` : ''],
    [L.repairScore, d.repairability.repairScore !== null ? `${fmt.format(d.repairability.repairScore)} / 10` : ''],
  ].filter((f): f is [string, string] => Boolean(f[1]))

  const operators = [
    [L.manufacturer, d.manufacturer],
    [L.euOperator, d.euOperator],
  ].filter(([, p]) => typeof p === 'object' && p.name) as Array<[string, typeof d.manufacturer]>

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: t.name,
    description: t.description || undefined,
    brand: d.brand ? { '@type': 'Brand', name: d.brand } : undefined,
    model: d.model || undefined,
    gtin14: d.gtin || undefined,
    countryOfOrigin: d.countryOfOrigin || undefined,
    material: d.materials.map((m) => (m.percent !== null ? `${m.name} ${m.percent}%` : m.name)).join(', ') || undefined,
    manufacturer: d.manufacturer.name ? { '@type': 'Organization', name: d.manufacturer.name } : undefined,
    url: passportUrl(view.publicId),
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} lang={uiLang} className="min-h-screen bg-[#f4f6f8] text-[#0f1b2d] print:bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />

      <header className="border-b border-[#dde3ea] bg-white print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0f3d5e] text-xs font-bold text-white">DPP</span>
            <span>{L.title}</span>
          </div>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg border border-[#dde3ea] px-3 py-1.5 text-sm">
              🌐 {DPP_LANG_NAMES[uiLang]}
            </summary>
            <div className={`absolute z-10 mt-1 w-44 rounded-xl border border-[#dde3ea] bg-white p-1 shadow-lg ${rtl ? 'left-0' : 'right-0'}`}>
              {DPP_LANGS.map((l) => (
                <a key={l} href={langHref(l)} className={`block rounded-lg px-3 py-2 text-sm hover:bg-[#f0f3f6] ${l === uiLang ? 'font-semibold' : ''}`}>
                  {DPP_LANG_NAMES[l]}
                  {view.langs.includes(l) ? '' : ' ·'}
                </a>
              ))}
            </div>
          </details>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {view.status === 'archived' && <Notice tone="amber">{L.archived}</Notice>}
        {contentLang !== uiLang && (
          <Notice tone="slate">
            {L.translatedFrom} {DPP_LANG_NAMES[contentLang]}
          </Notice>
        )}

        <section className="overflow-hidden rounded-3xl border border-[#dde3ea] bg-white">
          <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr] sm:p-6">
            {view.hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/dpp/image?p=${view.publicId}`} alt={t.name} className="aspect-square w-full rounded-2xl border border-[#e7ecf1] object-contain" />
            ) : (
              <div className="grid aspect-square w-full place-items-center rounded-2xl bg-[#eef2f6] text-5xl">📦</div>
            )}
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ec] px-2.5 py-1 text-xs font-semibold text-[#1d6b45]">✓ {L.verified}</p>
              <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{t.name}</h1>
              <p className="mt-1 text-[#4a5b70]">{[d.brand, d.model].filter(Boolean).join(' · ')}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-[#dde3ea] px-2.5 py-1">{L.categories[d.category]}</span>
                {d.countryOfOrigin && <span className="rounded-full border border-[#dde3ea] px-2.5 py-1">{country(d.countryOfOrigin)}</span>}
                <span className="rounded-full border border-[#dde3ea] px-2.5 py-1">
                  {L.version} {view.version} · {date(view.publishedAt)}
                </span>
              </div>
            </div>
          </div>
          {view.item && (
            <div className="grid border-t border-[#e7ecf1] bg-[#f8fafc] text-sm sm:grid-cols-3">
              {[
                [L.serial, view.item.serial],
                [L.batch, view.item.batch || '—'],
                [L.productionDate, view.item.productionDate ? date(view.item.productionDate) : '—'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-3 border-[#e7ecf1] px-4 py-2.5 sm:block sm:py-3 [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-s sm:[&:not(:first-child)]:border-t-0"
                >
                  <p className="text-xs text-[#6b7b8f]">{label}</p>
                  <p className="font-mono font-semibold sm:mt-0.5 sm:break-all">{value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <Card title={L.about}>
          {t.description && <Prose text={t.description} />}
          <dl className={`grid gap-x-6 gap-y-3 sm:grid-cols-2 ${t.description ? 'mt-4 border-t border-[#eef2f6] pt-4' : ''}`}>
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-[#6b7b8f]">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {d.materials.length > 0 && (
          <Card title={L.materials} icon="🧵">
            <ul className="space-y-3">
              {d.materials.map((m, i) => (
                <li key={i}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{m.name}</span>
                    {m.percent !== null && <span className="font-semibold tabular-nums">%{fmt.format(m.percent)}</span>}
                  </div>
                  {m.percent !== null && (
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eef2f6]">
                      <div className="h-full rounded-full bg-[#2f7fb3]" style={{ width: `${m.percent}%` }} />
                    </div>
                  )}
                  {(m.recycledPercent || m.origin) && (
                    <p className="mt-1 text-xs text-[#6b7b8f]">
                      {m.recycledPercent ? `♻️ %${fmt.format(m.recycledPercent)} ${L.recycled}` : ''}
                      {m.recycledPercent && m.origin ? ' · ' : ''}
                      {m.origin ? `${L.materialOrigin}: ${m.origin}` : ''}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {env.length > 0 && (
          <Card title={L.environment} icon="🌱">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {env.map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#f3f8f4] p-3">
                  <p className="text-xs text-[#4f6b58]">{label}</p>
                  <p className="mt-1 text-lg font-bold text-[#1d4d33]">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {t.care && (
          <Card title={L.care} icon="🧺">
            <Prose text={t.care} />
          </Card>
        )}

        {(t.repair || repairFacts.length > 0 || d.repairability.serviceUrl) && (
          <Card title={L.repair} icon="🔧">
            {repairFacts.length > 0 && (
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {repairFacts.map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f3f6fa] p-3">
                    <p className="text-xs text-[#5b6b80]">{label}</p>
                    <p className="mt-1 text-lg font-bold">{value}</p>
                  </div>
                ))}
              </div>
            )}
            {t.repair && <Prose text={t.repair} />}
            {d.repairability.serviceUrl && (
              <a href={d.repairability.serviceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-semibold text-[#0f5f94] underline">
                {L.service} ↗
              </a>
            )}
          </Card>
        )}

        {t.endOfLife && (
          <Card title={L.endOfLife} icon="♻️">
            <Prose text={t.endOfLife} />
          </Card>
        )}

        {(t.safety || d.substancesOfConcern) && (
          <Card title={L.safety} icon="⚠️">
            {t.safety && <Prose text={t.safety} />}
            {d.substancesOfConcern && (
              <div className={t.safety ? 'mt-3 border-t border-[#eef2f6] pt-3' : ''}>
                <p className="text-xs font-semibold text-[#6b7b8f]">{L.substances}</p>
                <Prose text={d.substancesOfConcern} />
              </div>
            )}
          </Card>
        )}

        {d.compliance.length > 0 && (
          <Card title={L.compliance} icon="🏅">
            <ul className="flex flex-wrap gap-2">
              {d.compliance.map((c, i) => (
                <li key={i} className="rounded-xl border border-[#dde3ea] px-3 py-2 text-sm">
                  <span className="font-semibold">{c.name}</span>
                  {c.reference && <span className="text-[#6b7b8f]"> · {c.reference}</span>}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {view.documents.length > 0 && (
          <Card title={L.documents} icon="📄">
            <ul className="divide-y divide-[#eef2f6]">
              {view.documents.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={`/api/dpp/doc/${doc.id}${doc.restricted ? keyParam : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 py-2.5 hover:text-[#0f5f94]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{doc.title}</span>
                      <span className="text-xs text-[#6b7b8f]">
                        {L.docKinds[doc.kind]}
                        {doc.restricted ? ` · 🔒 ${L.restrictedDoc}` : ''} · {doc.contentType === 'application/pdf' ? 'PDF' : 'IMG'} · {Math.max(1, Math.round(doc.sizeBytes / 1024))} KB
                      </span>
                    </span>
                    <span aria-hidden>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card title={L.operators} icon="🏭">
          <div className="grid gap-4 sm:grid-cols-2">
            {operators.map(([label, p]) => (
              <div key={label}>
                <p className="text-xs text-[#6b7b8f]">{label}</p>
                <p className="font-semibold">{p.name}</p>
                {p.address && <p className="whitespace-pre-line text-sm text-[#4a5b70]">{p.address}</p>}
                {p.contact && <p className="text-sm text-[#4a5b70]">{p.contact}</p>}
              </div>
            ))}
            <div>
              <p className="text-xs text-[#6b7b8f]">{L.brandOwner}</p>
              <p className="font-semibold">{view.company.name}</p>
              {view.company.website && (
                <a href={view.company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0f5f94] underline">
                  {view.company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </Card>

        {view.restrictedAccess && d.restricted && (
          <section className="rounded-3xl border-2 border-dashed border-[#c98a1b] bg-[#fff8eb] p-5">
            <h2 className="font-bold">🔒 {L.restricted}</h2>
            <p className="mt-1 text-xs text-[#8a6a2f]">{L.restrictedHint}</p>
            <dl className="mt-3 space-y-3 text-sm">
              {(
                [
                  [L.suppliers, d.restricted.suppliers],
                  [L.facility, d.restricted.facility],
                  [L.notes, d.restricted.notes],
                ] as const
              )
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold text-[#8a6a2f]">{label}</dt>
                    <dd className="whitespace-pre-line">{value}</dd>
                  </div>
                ))}
            </dl>
          </section>
        )}

        <footer className="space-y-3 pb-8 pt-2 text-center text-xs text-[#6b7b8f]">
          <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
            <PrintButton label={L.print} />
            <a href={`/api/dpp/passport/${id}${keyParam}`} className="rounded-full border border-[#dde3ea] bg-white px-4 py-2 font-medium text-[#0f1b2d]">
              {L.machineReadable}
            </a>
          </div>
          <p className="break-all">
            {passportUrl(id)}
            {d.gtin ? ` · ${digitalLink(d.gtin, view.item?.serial)}` : ''}
          </p>
          <p>
            <a href={SITE_URL + '/dpp'} className="hover:underline">
              {L.poweredBy}
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}

function flag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

function Card({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid rounded-3xl border border-[#dde3ea] bg-white p-5 sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        {icon && <span aria-hidden>{icon}</span>}
        {title}
      </h2>
      {children}
    </section>
  )
}

function Prose({ text }: { text: string }) {
  return <p className="whitespace-pre-line leading-relaxed text-[#2c3b4f]">{text}</p>
}

function Notice({ tone, children }: { tone: 'amber' | 'slate'; children: React.ReactNode }) {
  const cls = tone === 'amber' ? 'border-[#f0c36d] bg-[#fff6e0] text-[#7a5410]' : 'border-[#dde3ea] bg-white text-[#4a5b70]'
  return <p className={`rounded-2xl border px-4 py-3 text-sm ${cls}`}>{children}</p>
}

