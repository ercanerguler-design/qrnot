import type { Metadata } from 'next'
import { WarmPage } from '@/components/warm/SiteChrome'
import { msg, type MsgKey } from '@/lib/dpp/i18n'
import { API_BASE } from '@/lib/dpp/openapi'
import { BATTERY_ITEM_FIELDS, fieldLabelKey, SECTOR_FIELDS, type Sector, type SectorField } from '@/lib/dpp/sectors'
import { getRequestLang } from '@/lib/i18n.server'
import type { Lang } from '@/lib/i18n'
import { pageMeta } from '@/lib/seo'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  return pageMeta((await searchParams).lang, "/dpp/api", {
    tr: { title: "DPP API — ERP, PIM ve BMS için Dijital Ürün Pasaportu API’si", description: "ERP, PIM ve BMS sistemlerinden dijital ürün pasaportu oluşturma ve güncelleme API’si: ürünler, seri numaraları, batarya durumu. OpenAPI tanımı dahil." },
    en: { title: "DPP API — Digital Product Passport API for ERP, PIM & BMS", description: "Create and update digital product passports from your ERP, PIM or BMS: products, serial numbers and battery status. OpenAPI specification included." },
  }, { image: "/dpp/opengraph-image" })
}

const BASE = API_BASE

const C = {
  tr: {
    kicker: 'Geliştiriciler için',
    title: 'DPP API',
    desc: 'Ürün verisi zaten ERP’nizde, PIM’inizde ya da batarya yönetim sisteminizde. API ile pasaportları elle girmeden oluşturun, güncelleyin, seri numaralarını ve pil durumunu otomatik gönderin.',
    authTitle: '1. Anahtar',
    auth: 'Panelde Firma → API anahtarları bölümünden bir anahtar oluşturun (sadece firma yöneticisi). Anahtar bir kez gösterilir; her istekte başlıkta gönderin. Anahtarlar okuma ya da okuma + yazma yetkili olabilir, istediğiniz an iptal edilebilir.',
    rulesTitle: 'Kurallar',
    rules: [
      'Yazdığınız her şey önce taslağa kaydedilir. Herkese açık pasaport sadece /publish çağrısıyla değişir; her yayın yeni bir sürüm olarak saklanır.',
      'Batarya durumu (sağlık %, döngü, şarj) istisnadır: yayın gerekmez, hemen pasaporta yansır.',
      'Her yazma işlemi firmanızın işlem kaydına “api:<anahtar adı>” olarak yazılır.',
      'Sınır: anahtar başına saatte 1200 istek, istek başına en fazla 2000 seri numarası. Paketinizin ürün sınırı API için de geçerlidir.',
      'externalId (ERP ürün kodunuz) ile gönderirseniz aynı istek tekrar gelse de çift kayıt oluşmaz.',
      'Hatalar her zaman { "error": { "code", "message", "details" } } biçimindedir; mesaj dili x-dpp-lang başlığıyla seçilir (tr, en, de, fr, es, nl, ar, ru).',
    ],
    endpointsTitle: '2. Uç noktalar',
    examplesTitle: '3. Örnekler',
    ex1: 'ERP kodu ile ürün oluştur ya da güncelle',
    ex2: 'Yayınla',
    ex3: 'Seri numaralarını ekle (her biri ayrı pasaport)',
    ex4: 'Tek bir pilin durumunu güncelle',
    fieldsTitle: '4. Sektör alanları',
    fieldsDesc: 'Alanlar data.sector içinde gönderilir; ürün kategorisine göre modül seçilir. “Zorunlu” alanlar eksikse yayınlama 400 döner ve eksikler error.details içinde listelenir.',
    itemFields: 'Pil durumu alanları (seri numarası başına)',
    colKey: 'Anahtar',
    colLabel: 'Alan',
    colType: 'Tür',
    colRef: 'Kaynak',
    required: 'zorunlu',
    spec: 'OpenAPI tanımı (Postman / Swagger’a aktarın)',
    note: 'Not: API, AB merkezi DPP kayıt sistemine gönderim yapmaz; bu kayıt sisteminin teknik ayrıntıları henüz yayımlanmadı.',
  },
  en: {
    kicker: 'For developers',
    title: 'DPP API',
    desc: 'Your product data already lives in your ERP, PIM or battery management system. Use the API to create and update passports without manual entry, and send serial numbers and battery status automatically.',
    authTitle: '1. Key',
    auth: 'Create a key in the panel under Company → API keys (company owner only). The key is shown once; send it in the header of every request. Keys can be read-only or read + write, and can be revoked at any time.',
    rulesTitle: 'Rules',
    rules: [
      'Everything you write is saved to the draft first. The public passport changes only when you call /publish; every publish is stored as a new version.',
      'Battery status (state of health, cycles, charge) is the exception: no publish needed, it shows on the passport immediately.',
      'Every write is recorded in your company audit log as “api:<key name>”.',
      'Limits: 1200 requests per hour per key, at most 2000 serial numbers per request. Your plan’s product limit applies to the API too.',
      'Send your ERP product code as externalId and repeating the same request never creates a duplicate.',
      'Errors are always { "error": { "code", "message", "details" } }; choose the message language with the x-dpp-lang header (tr, en, de, fr, es, nl, ar, ru).',
    ],
    endpointsTitle: '2. Endpoints',
    examplesTitle: '3. Examples',
    ex1: 'Create or update by ERP code',
    ex2: 'Publish',
    ex3: 'Add serial numbers (one passport each)',
    ex4: 'Update one battery’s status',
    fieldsTitle: '4. Sector fields',
    fieldsDesc: 'Fields go into data.sector; the module is chosen by product category. If a “required” field is missing, publish returns 400 and lists what is missing in error.details.',
    itemFields: 'Battery status fields (per serial number)',
    colKey: 'Key',
    colLabel: 'Field',
    colType: 'Type',
    colRef: 'Source',
    required: 'required',
    spec: 'OpenAPI spec (import into Postman / Swagger)',
    note: 'Note: the API does not submit to the EU central DPP registry; the technical details of that registry have not been published yet.',
  },
}

const ENDPOINTS: Array<[string, string, string, string]> = [
  ['GET', '/me', 'Firma, paket sınırı ve anahtar yetkileri (bağlantı testi)', 'Company, plan limits and key permissions (connection test)'],
  ['GET', '/products', 'Ürün listesi (?status=draft|published|archived)', 'List products (?status=draft|published|archived)'],
  ['POST', '/products', 'Yeni ürün taslağı (externalId varsa ekle-ya-da-güncelle)', 'New product draft (with externalId: create or update)'],
  ['GET', '/products/{id}', 'Ürünün tamamı (taslak hali)', 'Full product (draft state)'],
  ['PATCH', '/products/{id}', 'Kısmi güncelleme; gönderilmeyen alanlar kalır', 'Partial update; fields you omit are kept'],
  ['POST', '/products/{id}/publish', 'Taslağı yeni sürüm olarak yayınla', 'Publish the draft as a new version'],
  ['GET', '/products/{id}/items', 'Seri numaraları (?q=&limit=&offset=)', 'Serial numbers (?q=&limit=&offset=)'],
  ['POST', '/products/{id}/items', 'Seri numarası ekle: liste ya da aralık', 'Add serial numbers: a list or a range'],
  ['PUT', '/products/{id}/items', 'Batarya: çok sayıda pilin durumunu toplu güncelle', 'Battery: bulk update many batteries’ status'],
  ['PATCH', '/products/{id}/items/{serial}', 'Batarya: tek pilin durumu', 'Battery: one battery’s status'],
  ['GET', '/products/external/{externalId}', 'ERP koduyla oku', 'Read by ERP code'],
  ['PUT', '/products/external/{externalId}', 'ERP koduyla ekle-ya-da-güncelle', 'Create or update by ERP code'],
]

const EXAMPLES = {
  upsert: `curl -X PUT ${BASE}/products/external/VB-48-15AH \\
  -H "Authorization: Bearer qrn_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "defaultLang": "en",
    "texts": { "en": { "name": "E-bike battery 48V 15Ah" } },
    "data": {
      "brand": "Volta", "model": "VB-48", "category": "battery",
      "gtin": "08691234567892", "countryOfOrigin": "TR",
      "sector": { "batteryCategory": "lmt", "chemistry": "Li-ion LFP" }
    }
  }'`,
  publish: `curl -X POST ${BASE}/products/{id}/publish \\
  -H "Authorization: Bearer qrn_live_…"`,
  items: `curl -X POST ${BASE}/products/{id}/items \\
  -H "Authorization: Bearer qrn_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "serials": [
        { "serial": "VB-000101", "batch": "L2026-10", "productionDate": "2026-10-20" },
        { "serial": "VB-000102", "batch": "L2026-10", "productionDate": "2026-10-20" }
      ] }'`,
  status: `curl -X PATCH ${BASE}/products/{id}/items/VB-000101 \\
  -H "Authorization: Bearer qrn_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "stateOfHealthPct": 97, "cycles": 120, "stateOfChargePct": 80 }'`,
}

const SECTOR_TITLES: Record<Sector, [string, string]> = { battery: ['Batarya', 'Battery'], textile: ['Tekstil ve ayakkabı', 'Textile and footwear'], furniture: ['Mobilya', 'Furniture'] }

function FieldTable({ fields, sector, lang }: { fields: readonly SectorField[]; sector: Sector | 'item'; lang: Lang }) {
  const c = C[lang]
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="text-xs uppercase text-ink-2">
          <tr>
            <th className="py-2 pr-3">{c.colKey}</th>
            <th className="py-2 pr-3">{c.colLabel}</th>
            <th className="py-2 pr-3">{c.colType}</th>
            <th className="py-2">{c.colRef}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {fields.map((f) => (
            <tr key={f.key}>
              <td className="py-1.5 pr-3 font-mono text-xs">{f.key}</td>
              <td className="py-1.5 pr-3">
                {msg(lang, fieldLabelKey(sector, f.key) as MsgKey)}
                {f.required && <span className="ml-1.5 rounded bg-coral/15 px-1.5 py-0.5 text-[10px] font-semibold text-coral">{c.required}</span>}
              </td>
              <td className="py-1.5 pr-3 font-mono text-xs text-ink-2">
                {f.type === 'select' || f.type === 'multi' ? `${f.type === 'multi' ? '[' : ''}${(f.options || []).join(' | ')}${f.type === 'multi' ? ']' : ''}` : f.type === 'number' ? `number${f.unit ? ` (${f.unit})` : ''}` : 'string'}
              </td>
              <td className="py-1.5 text-xs text-ink-2">{f.ref || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const Code = ({ children }: { children: string }) => (
  <pre className="mt-2 overflow-x-auto rounded-2xl bg-[#1d1b19] p-4 text-xs leading-relaxed text-[#f4efe8]" dir="ltr">
    <code>{children}</code>
  </pre>
)

export default async function DppApiDocs({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang: Lang = await getRequestLang((await searchParams).lang)
  const c = C[lang]
  const i = lang === 'tr' ? 0 : 1
  return (
    <WarmPage lang={lang}>
      <section className="mx-auto max-w-5xl px-4 pb-20 pt-12">
        <span className="w-chip">⚙️ {c.kicker}</span>
        <h1 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">{c.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-2">{c.desc}</p>
        <p className="mt-4 font-mono text-sm" dir="ltr">
          Base URL: {BASE}
        </p>
        <a href="/api/dpp/v1/openapi.json" className="mt-2 inline-block text-sm font-semibold text-coral hover:underline">
          {c.spec} ↗
        </a>

        <h2 className="font-display mt-12 text-2xl font-semibold">{c.authTitle}</h2>
        <p className="mt-2 leading-relaxed text-ink-2">{c.auth}</p>
        <Code>{'Authorization: Bearer qrn_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}</Code>

        <h3 className="mt-8 text-lg font-semibold">{c.rulesTitle}</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed text-ink-2">
          {c.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        <h2 className="font-display mt-12 text-2xl font-semibold">{c.endpointsTitle}</h2>
        <div className="w-card mt-3 divide-y divide-black/5 p-0">
          {ENDPOINTS.map(([method, path, tr, en]) => (
            <div key={method + path} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
              <span className="w-14 font-mono text-xs font-bold text-coral">{method}</span>
              <span className="font-mono text-xs" dir="ltr">
                {path}
              </span>
              <span className="text-ink-2 sm:ml-auto">{i === 0 ? tr : en}</span>
            </div>
          ))}
        </div>

        <h2 className="font-display mt-12 text-2xl font-semibold">{c.examplesTitle}</h2>
        <h3 className="mt-4 font-semibold">{c.ex1}</h3>
        <Code>{EXAMPLES.upsert}</Code>
        <h3 className="mt-6 font-semibold">{c.ex2}</h3>
        <Code>{EXAMPLES.publish}</Code>
        <h3 className="mt-6 font-semibold">{c.ex3}</h3>
        <Code>{EXAMPLES.items}</Code>
        <h3 className="mt-6 font-semibold">{c.ex4}</h3>
        <Code>{EXAMPLES.status}</Code>

        <h2 className="font-display mt-12 text-2xl font-semibold">{c.fieldsTitle}</h2>
        <p className="mt-2 leading-relaxed text-ink-2">{c.fieldsDesc}</p>
        {(Object.keys(SECTOR_FIELDS) as Sector[]).map((s) => (
          <div key={s} className="mt-8">
            <h3 className="text-lg font-semibold">
              {SECTOR_TITLES[s][i]} <span className="font-mono text-xs text-ink-2">category: {s === 'textile' ? 'textile | footwear' : s}</span>
            </h3>
            <FieldTable fields={SECTOR_FIELDS[s]} sector={s} lang={lang} />
          </div>
        ))}
        <div className="mt-8">
          <h3 className="text-lg font-semibold">{c.itemFields}</h3>
          <FieldTable fields={BATTERY_ITEM_FIELDS} sector="item" lang={lang} />
        </div>

        <p className="mt-10 text-sm text-ink-2">{c.note}</p>
      </section>
    </WarmPage>
  )
}
