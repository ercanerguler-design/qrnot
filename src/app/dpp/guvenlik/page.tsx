import type { Metadata } from 'next'
import Link from 'next/link'
import { WarmPage } from '@/components/warm/SiteChrome'
import { getRequestLang } from '@/lib/i18n.server'
import { withLang, type Lang } from '@/lib/i18n'
import { whatsappHref } from '@/lib/site'

// DPP güvenlik ve veri işleme sayfası. Buradaki her bilgi koddaki gerçek uygulamaya ya da altyapı sağlayıcısının
// yayımladığı belgeye dayanır. Sahip olmadığımız sertifikalar ima edilmez; değişiklikte bu sayfa da güncellenmeli.

export const metadata: Metadata = {
  title: 'DPP güvenlik ve veri işleme — QRNot',
  description: 'QRNot Dijital Ürün Pasaportu: verilerin nerede saklandığı, şifreleme, erişim kontrolü, alt işleyenler, KVKK / GDPR ve veri işleme sözleşmesi.',
  alternates: { canonical: '/dpp/guvenlik', languages: { 'tr-TR': '/dpp/guvenlik', 'en-US': '/dpp/guvenlik?lang=en' } },
}

type Row = [string, string]
type Section = { title: string; rows: Row[] }

const C: Record<Lang, { kicker: string; title: string; intro: string; updated: string; sections: Section[]; subTitle: string; subHead: [string, string, string]; subs: Array<[string, string, string]>; dpaTitle: string; dpaText: string; dpaCta: string; dpaMsg: string; honestTitle: string; honest: string; back: string }> = {
  tr: {
    kicker: 'QRNot DPP · Güvenlik',
    title: 'Verileriniz nerede, nasıl korunuyor?',
    intro: 'Kurumsal müşterilerimizin bilgi güvenliği ve KVKK / GDPR ekiplerinin sorduğu soruların açık cevapları. Bir sorunuz burada yoksa bize yazın.',
    updated: 'Son güncelleme: Ekim 2026',
    sections: [
      {
        title: 'Barındırma ve konum',
        rows: [
          ['Uygulama', 'Vercel bulut altyapısı. Sunucu işlemleri ABD bölgesinde çalışır; statik içerik küresel CDN üzerinden sunulur.'],
          ['Veritabanı', 'Neon (PostgreSQL), AWS us-east-1 (ABD, Virginia) bölgesi.'],
          ['Dosyalar', 'Ürün görselleri ve belgeler Vercel Blob’da özel (private) erişimle saklanır. Dosyalar doğrudan açılamaz; her istek yetki kontrolünden geçen sunucumuz üzerinden verilir.'],
          ['AB bölgesi', 'Verilerin AB’de (Frankfurt) tutulmasını şart koşan müşteriler için bölge taşıma talebi değerlendirilir; lütfen teklif aşamasında belirtin.'],
        ],
      },
      {
        title: 'Şifreleme',
        rows: [
          ['Aktarım sırasında', 'Tüm trafik HTTPS (TLS) ile şifrelenir; tarayıcılara HSTS ile yalnızca HTTPS kullanmaları bildirilir.'],
          ['Depolamada', 'Veritabanı sağlayıcımız Neon, depolanan veriyi AES-256 ile şifrelediğini belirtmektedir (Neon güvenlik belgeleri).'],
          ['Şifreler', 'Kullanıcı şifreleri düz metin olarak tutulmaz; tuzlanmış scrypt özeti saklanır.'],
          ['Oturumlar', 'Oturum anahtarları veritabanında yalnızca SHA-256 özeti olarak tutulur; çerez httpOnly ve secure’dur, 14 günde sona erer.'],
        ],
      },
      {
        title: 'Erişim kontrolü',
        rows: [
          ['Firma ayrımı', 'Her sorgu oturumdaki kullanıcının firmasıyla sınırlıdır; bir firma başka bir firmanın ürününü, belgesini ya da tedarikçi talebini göremez.'],
          ['Roller', 'Yönetici, editör ve izleyici. Kullanıcı ekleme, şifre sıfırlama ve firma ayarları sadece yönetici rolündedir.'],
          ['Giriş koruması', 'Art arda hatalı girişlerde hesap geçici olarak kilitlenir; panel ve yükleme işlemleri istek sınırlarıyla korunur.'],
          ['Yetkili erişim anahtarı', 'Tedarikçi, tesis ve notlar gibi hassas pasaport alanları sadece denetim ve geri dönüşüm için paylaştığınız anahtarla görünür. Anahtarı panelden istediğiniz an yenileyebilirsiniz; eski anahtar hemen geçersiz olur.'],
          ['Tedarikçi linkleri', 'Tahmin edilemez, süreli linklerdir. Tedarikçi sadece kendi talebini görür ve firmanın onayı olmadan ürüne hiçbir şey aktarılmaz.'],
        ],
      },
      {
        title: 'Hangi veriyi işliyoruz?',
        rows: [
          ['Ürün verisi', 'Panelde girdiğiniz ürün, malzeme, uygunluk ve çevre bilgileri ile belgeler. Bu veriler kişisel veri içermek zorunda değildir.'],
          ['Kullanıcı verisi', 'Panel kullanıcılarının adı, e-posta adresi, rolü ve son giriş zamanı.'],
          ['Pasaport okutmaları', 'Okutan kişinin IP adresi saklanmaz. Sadece ülke kodu, dil ve zaman istatistik için tutulur.'],
          ['Tedarikçi yanıtları', 'Tedarikçinin firma adı, yetkili adı ve isteğe bağlı e-postası ile gönderdiği bilgi ve belgeler.'],
        ],
      },
      {
        title: 'Saklama, dışa aktarma ve silme',
        rows: [
          ['Yayınlanmış pasaportlar', 'Ürün ömrü boyunca erişilebilir kalması gerektiği için silinmez, arşivlenir. Her yayın değiştirilemez bir sürüm olarak saklanır.'],
          ['Taslaklar', 'Hiç yayınlanmamış ürünler ve belgeleri panelden kalıcı olarak silinebilir.'],
          ['Dışa aktarma', 'Her pasaport makine okunur JSON olarak, seri numaraları CSV olarak alınabilir. Sözleşme sonunda tüm veriler talep üzerine toplu olarak teslim edilir.'],
          ['Sözleşme sonu', 'Yayınlanmış pasaportların erişilebilir kalma süresi ve sonrasında silme, veri işleme sözleşmesinde birlikte belirlenir.'],
        ],
      },
    ],
    subTitle: 'Alt işleyenler',
    subHead: ['Sağlayıcı', 'Amaç', 'Konum'],
    subs: [
      ['Vercel Inc.', 'Uygulama barındırma, dosya depolama (Blob)', 'ABD'],
      ['Neon Inc.', 'Veritabanı (AWS üzerinde)', 'ABD (us-east-1)'],
      ['Anthropic PBC', 'Otomatik çeviri — sadece çeviri istediğinizde ürün metinleri gönderilir', 'ABD'],
    ],
    dpaTitle: 'Veri işleme sözleşmesi (KVKK / GDPR)',
    dpaText: 'Kurumsal müşterilerimizle KVKK’ya ve GDPR Madde 28’e göre veri işleme sözleşmesi imzalıyoruz. Verilerin ABD’de işlenmesi yurt dışına aktarım sayıldığından, sözleşme KVKK’nın standart sözleşme ve GDPR’ın Standart Sözleşme Maddeleri (SCC) yaklaşımını içerir.',
    dpaCta: 'Veri işleme sözleşmesini iste',
    dpaMsg: 'Merhaba, QRNot DPP için veri işleme sözleşmesini (KVKK/GDPR) almak istiyorum.',
    honestTitle: 'Açık olalım',
    honest: 'QRNot’un kendisinin ISO 27001 ya da SOC 2 sertifikası yoktur. Altyapı sağlayıcılarımızın kendi sertifika ve uyum belgeleri kendi sitelerinde yayımlanmaktadır. Güvenlik soru formlarınızı doldurmaktan memnuniyet duyarız.',
    back: '← Dijital Ürün Pasaportu',
  },
  en: {
    kicker: 'QRNot DPP · Security',
    title: 'Where is your data, and how is it protected?',
    intro: 'Straight answers to the questions our corporate customers’ information security and GDPR teams ask. If yours is not here, write to us.',
    updated: 'Last updated: October 2026',
    sections: [
      {
        title: 'Hosting and location',
        rows: [
          ['Application', 'Vercel cloud infrastructure. Server functions run in a US region; static content is served via a global CDN.'],
          ['Database', 'Neon (PostgreSQL) in the AWS us-east-1 region (Virginia, USA).'],
          ['Files', 'Product images and documents are stored in Vercel Blob with private access. Files cannot be opened directly; every request is served through our server after an authorisation check.'],
          ['EU region', 'For customers who require data to be kept in the EU (Frankfurt), a region move can be arranged; please mention it when requesting a quote.'],
        ],
      },
      {
        title: 'Encryption',
        rows: [
          ['In transit', 'All traffic is encrypted with HTTPS (TLS); HSTS tells browsers to use HTTPS only.'],
          ['At rest', 'Our database provider Neon states that stored data is encrypted with AES-256 (Neon security documentation).'],
          ['Passwords', 'User passwords are never stored in plain text; a salted scrypt hash is stored.'],
          ['Sessions', 'Session tokens are stored only as SHA-256 hashes; the cookie is httpOnly and secure and expires after 14 days.'],
        ],
      },
      {
        title: 'Access control',
        rows: [
          ['Company isolation', 'Every query is scoped to the signed-in user’s company; no company can see another company’s products, documents or supplier requests.'],
          ['Roles', 'Owner, editor and viewer. Adding users, resetting passwords and company settings are owner-only.'],
          ['Login protection', 'Repeated failed logins temporarily lock the account; panel and upload operations are rate-limited.'],
          ['Authorised-access key', 'Sensitive passport fields such as suppliers, facility and notes are visible only with the key you share with authorities and recyclers. You can rotate the key at any time in the panel; the old key stops working immediately.'],
          ['Supplier links', 'Unguessable, time-limited links. A supplier sees only their own request, and nothing is copied into a product without the company’s approval.'],
        ],
      },
      {
        title: 'What data do we process?',
        rows: [
          ['Product data', 'The product, material, compliance and environmental information and documents you enter. This data does not need to contain personal data.'],
          ['User data', 'Name, email address, role and last login time of panel users.'],
          ['Passport scans', 'The IP address of the person scanning is not stored. Only country code, language and time are kept for statistics.'],
          ['Supplier responses', 'The supplier’s company name, contact name and optional email, and the information and documents they submit.'],
        ],
      },
      {
        title: 'Retention, export and deletion',
        rows: [
          ['Published passports', 'Not deleted but archived, as they must stay available for the product’s lifetime. Each publication is stored as an immutable version.'],
          ['Drafts', 'Never-published products and their documents can be deleted permanently from the panel.'],
          ['Export', 'Each passport is available as machine-readable JSON and serial numbers as CSV. At the end of the contract, all data is handed over in bulk on request.'],
          ['End of contract', 'How long published passports remain available and when they are deleted is agreed in the data processing agreement.'],
        ],
      },
    ],
    subTitle: 'Subprocessors',
    subHead: ['Provider', 'Purpose', 'Location'],
    subs: [
      ['Vercel Inc.', 'Application hosting, file storage (Blob)', 'USA'],
      ['Neon Inc.', 'Database (on AWS)', 'USA (us-east-1)'],
      ['Anthropic PBC', 'Automatic translation — product texts are sent only when you request a translation', 'USA'],
    ],
    dpaTitle: 'Data processing agreement (GDPR / KVKK)',
    dpaText: 'We sign a data processing agreement with corporate customers under GDPR Article 28 and Turkish KVKK. Because data is processed in the USA, which is an international transfer, the agreement follows the Standard Contractual Clauses (SCC) approach.',
    dpaCta: 'Request the data processing agreement',
    dpaMsg: 'Hello, I would like the data processing agreement (GDPR/KVKK) for QRNot DPP.',
    honestTitle: 'To be clear',
    honest: 'QRNot itself does not hold ISO 27001 or SOC 2 certification. Our infrastructure providers publish their own certifications and compliance documents on their websites. We are happy to complete your security questionnaires.',
    back: '← Digital Product Passport',
  },
}

export default async function DppSecurityPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang: Lang = await getRequestLang((await searchParams).lang)
  const c = C[lang]
  return (
    <WarmPage lang={lang}>
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-12 lg:pt-16">
        <Link href={withLang('/dpp', lang)} className="text-sm text-ink-2 hover:underline">
          {c.back}
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-coral-2">{c.kicker}</p>
        <h1 className="font-display mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{c.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">{c.intro}</p>
        <p className="mt-2 text-xs text-muted">{c.updated}</p>
      </section>

      <section className="mx-auto max-w-4xl space-y-6 px-4 pb-12">
        {c.sections.map((s) => (
          <div key={s.title} className="w-card p-6">
            <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
            <dl className="mt-4 divide-y divide-line">
              {s.rows.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
                  <dt className="font-semibold">{k}</dt>
                  <dd className="text-sm leading-relaxed text-ink-2">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        <div className="w-card overflow-x-auto p-6">
          <h2 className="font-display text-2xl font-semibold">{c.subTitle}</h2>
          <table className="mt-4 w-full min-w-[32rem] text-start text-sm">
            <thead>
              <tr className="border-b border-line text-ink-2">
                {c.subHead.map((h) => (
                  <th key={h} className="py-2 pe-4 text-start font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.subs.map(([name, purpose, where]) => (
                <tr key={name} className="border-b border-line last:border-0">
                  <td className="py-2.5 pe-4 font-semibold">{name}</td>
                  <td className="py-2.5 pe-4 text-ink-2">{purpose}</td>
                  <td className="py-2.5 text-ink-2">{where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-3xl border border-line bg-paper p-6">
          <h2 className="font-display text-2xl font-semibold">{c.dpaTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">{c.dpaText}</p>
          <a href={whatsappHref(c.dpaMsg)} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-dark mt-5 inline-flex px-6 py-3">
            {c.dpaCta}
          </a>
        </div>

        <div className="w-card-soft p-6">
          <h2 className="font-semibold">{c.honestTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{c.honest}</p>
        </div>
      </section>
    </WarmPage>
  )
}
