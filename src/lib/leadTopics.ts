// Teklif formu konuları (/teklif?konu=…): her konu kendi sorularını sorar.
// Toplu hediye ürünleri ayrı sayfadadır (/kurumsal-hediye); talepler aynı yönetim kutusuna düşer.
// Hem form (tarayıcı) hem sunucu doğrulaması bu tanımı kullanır.

type L = { tr: string; en: string }

export type LeadField =
  | { key: string; type: 'number'; label: L; max: number }
  | { key: string; type: 'select'; label: L; options: Array<{ value: string; label: L }> }
  | { key: string; type: 'text'; label: L; max: number }

export type LeadTopic = {
  icon: string
  title: L
  lead: L
  fields: LeadField[]
}

const yesNo = (yes: L, no: L, maybe?: L) => [
  { value: 'yes', label: yes },
  { value: 'no', label: no },
  ...(maybe ? [{ value: 'planned', label: maybe }] : []),
]

export const DPP_PLAN_OPTIONS = [
  { value: 'pilot', label: { tr: 'Pilot (10 ürün modeli)', en: 'Pilot (10 product models)' } },
  { value: 'baslangic', label: { tr: 'Başlangıç (50 ürün modeli)', en: 'Starter (50 product models)' } },
  { value: 'buyume', label: { tr: 'Büyüme (200 ürün modeli)', en: 'Growth (200 product models)' } },
  { value: 'isletme', label: { tr: 'İşletme (500 ürün modeli)', en: 'Business (500 product models)' } },
  { value: 'kurumsal', label: { tr: 'Kurumsal (sınırsız)', en: 'Enterprise (unlimited)' } },
  { value: 'unsure', label: { tr: 'Henüz emin değilim', en: 'Not sure yet' } },
]

export const LEAD_TOPICS = {
  dpp: {
    icon: '🛂',
    title: { tr: 'QRNot DPP teklifi', en: 'QRNot DPP quote' },
    lead: {
      tr: 'Ürün sayınızı ve sektörünüzü yazın; size uygun paketi ve AB yükümlülük takviminizi içeren teklifi gönderelim.',
      en: 'Tell us your product count and sector; we will send a quote with the right plan and your EU compliance timeline.',
    },
    fields: [
      { key: 'plan', type: 'select', label: { tr: 'İlgilendiğiniz paket', en: 'Plan you are interested in' }, options: DPP_PLAN_OPTIONS },
      { key: 'models', type: 'number', label: { tr: 'Yaklaşık ürün modeli sayısı', en: 'Approx. number of product models' }, max: 1000000 },
      {
        key: 'sector',
        type: 'select',
        label: { tr: 'Sektör', en: 'Sector' },
        options: [
          { value: 'textile', label: { tr: 'Tekstil ve hazır giyim', en: 'Textiles and apparel' } },
          { value: 'footwear', label: { tr: 'Ayakkabı', en: 'Footwear' } },
          { value: 'furniture', label: { tr: 'Mobilya', en: 'Furniture' } },
          { value: 'battery', label: { tr: 'Pil ve batarya', en: 'Batteries' } },
          { value: 'electronics', label: { tr: 'Elektronik ve beyaz eşya', en: 'Electronics and appliances' } },
          { value: 'toys', label: { tr: 'Oyuncak', en: 'Toys' } },
          { value: 'construction', label: { tr: 'Yapı malzemesi', en: 'Construction products' } },
          { value: 'metal', label: { tr: 'Demir-çelik ve metal', en: 'Iron, steel and metals' } },
          { value: 'other', label: { tr: 'Diğer', en: 'Other' } },
        ],
      },
      { key: 'eu', type: 'select', label: { tr: 'AB’ye ihracat yapıyor musunuz?', en: 'Do you export to the EU?' }, options: yesNo({ tr: 'Evet', en: 'Yes' }, { tr: 'Hayır', en: 'No' }, { tr: 'Planlıyoruz', en: 'Planned' }) },
      { key: 'erp', type: 'text', label: { tr: 'Kullandığınız ERP (isteğe bağlı)', en: 'ERP you use (optional)' }, max: 80 },
    ],
  },
  hotel: {
    icon: '🏨',
    title: { tr: 'Otel QR çözümü teklifi', en: 'Hotel QR solution quote' },
    lead: { tr: 'Oda servisi, temizlik ve teknik talepler için oda QR’ları ve canlı operasyon paneli.', en: 'Room QR codes and a live operations panel for room service, housekeeping and maintenance requests.' },
    fields: [
      { key: 'rooms', type: 'number', label: { tr: 'Oda sayısı', en: 'Number of rooms' }, max: 100000 },
      { key: 'sites', type: 'number', label: { tr: 'Otel / şube sayısı', en: 'Number of hotels' }, max: 10000 },
    ],
  },
  education: {
    icon: '🎓',
    title: { tr: 'Eğitim QR çözümü teklifi', en: 'Education QR solution quote' },
    lead: { tr: 'QR ile yoklama, ders materyali, duyuru ve destek talebi.', en: 'QR attendance, course materials, announcements and support requests.' },
    fields: [
      { key: 'students', type: 'number', label: { tr: 'Öğrenci sayısı', en: 'Number of students' }, max: 10000000 },
      { key: 'campuses', type: 'number', label: { tr: 'Okul / kampüs sayısı', en: 'Number of schools / campuses' }, max: 10000 },
    ],
  },
  health: {
    icon: '🏥',
    title: { tr: 'Sağlık QR çözümü teklifi', en: 'Healthcare QR solution quote' },
    lead: { tr: 'Hasta bilgilendirme, cihaz talimatı, hijyen denetimi ve yönlendirme.', en: 'Patient information, device instructions, hygiene audits and wayfinding.' },
    fields: [
      {
        key: 'kind',
        type: 'select',
        label: { tr: 'Kurum türü', en: 'Organisation type' },
        options: [
          { value: 'hospital', label: { tr: 'Hastane', en: 'Hospital' } },
          { value: 'clinic', label: { tr: 'Klinik / poliklinik', en: 'Clinic' } },
          { value: 'pharmacy', label: { tr: 'Eczane', en: 'Pharmacy' } },
          { value: 'other', label: { tr: 'Diğer', en: 'Other' } },
        ],
      },
      { key: 'units', type: 'number', label: { tr: 'Yatak / birim sayısı', en: 'Beds / units' }, max: 100000 },
    ],
  },
  factory: {
    icon: '🏭',
    title: { tr: 'Fabrika ve üretim QR çözümü teklifi', en: 'Manufacturing QR solution quote' },
    lead: { tr: 'Makine kılavuzu, iş güvenliği, bakım-arıza bildirimi ve bant sayımı.', en: 'Machine manuals, safety flows, maintenance reports and line counting.' },
    fields: [
      { key: 'employees', type: 'number', label: { tr: 'Çalışan sayısı', en: 'Number of employees' }, max: 1000000 },
      { key: 'machines', type: 'number', label: { tr: 'Makine / istasyon sayısı', en: 'Machines / stations' }, max: 100000 },
    ],
  },
  retail: {
    icon: '🛍️',
    title: { tr: 'Perakende QR çözümü teklifi', en: 'Retail QR solution quote' },
    lead: { tr: 'Raf etiketinde ürün hikâyesi, fiyat kontrolü, mağaza görevleri ve müşteri anketi.', en: 'Product stories on shelf labels, price checks, store tasks and customer surveys.' },
    fields: [
      { key: 'stores', type: 'number', label: { tr: 'Mağaza sayısı', en: 'Number of stores' }, max: 100000 },
      { key: 'skus', type: 'number', label: { tr: 'Ürün çeşidi (SKU) sayısı', en: 'Number of SKUs' }, max: 10000000 },
    ],
  },
  logistics: {
    icon: '🚚',
    title: { tr: 'Lojistik QR çözümü teklifi', en: 'Logistics QR solution quote' },
    lead: { tr: 'Teslimat kanıtı, hasar bildirimi, araç kontrolü ve depo sayımı.', en: 'Proof of delivery, damage reports, vehicle checks and warehouse counts.' },
    fields: [
      { key: 'vehicles', type: 'number', label: { tr: 'Araç sayısı', en: 'Number of vehicles' }, max: 100000 },
      { key: 'warehouses', type: 'number', label: { tr: 'Depo sayısı', en: 'Number of warehouses' }, max: 10000 },
    ],
  },
  partner: {
    icon: '🤝',
    title: { tr: 'Pazaryeri ortaklığı', en: 'Marketplace partnership' },
    lead: { tr: 'Sesli hediye ürünlerini mağazanızda satın; 90 günlük pilotla başlayalım.', en: 'Sell voice-message gifts in your store; start with a 90-day pilot.' },
    fields: [
      { key: 'platform', type: 'text', label: { tr: 'Platform / mağaza adı', en: 'Platform / store name' }, max: 80 },
      { key: 'orders', type: 'number', label: { tr: 'Aylık hediye kategorisi sipariş adedi (yaklaşık)', en: 'Monthly gift-category orders (approx.)' }, max: 100000000 },
    ],
  },
  business: {
    icon: '🏢',
    title: { tr: 'Kurumsal teklif', en: 'Business quote' },
    lead: { tr: 'Toplu QR / NFC üretimi, logo baskısı ya da sektörünüze özel panel için ihtiyacınızı yazın.', en: 'Tell us what you need: bulk QR / NFC production, logo printing or a sector panel.' },
    fields: [
      {
        key: 'need',
        type: 'select',
        label: { tr: 'İhtiyacınız', en: 'What you need' },
        options: [
          { value: 'bulk', label: { tr: 'Toplu QR / NFC üretimi', en: 'Bulk QR / NFC production' } },
          { value: 'panel', label: { tr: 'Sektöre özel yönetim paneli', en: 'Sector management panel' } },
          { value: 'branding', label: { tr: 'Logolu / markalı ürün', en: 'Branded products' } },
          { value: 'integration', label: { tr: 'Sipariş / sistem entegrasyonu', en: 'Order / system integration' } },
          { value: 'other', label: { tr: 'Diğer', en: 'Other' } },
        ],
      },
      { key: 'quantity', type: 'number', label: { tr: 'Tahmini adet (isteğe bağlı)', en: 'Estimated quantity (optional)' }, max: 100000000 },
    ],
  },
} satisfies Record<string, LeadTopic>

export type LeadTopicKey = keyof typeof LEAD_TOPICS
export const isLeadTopic = (value: unknown): value is LeadTopicKey => typeof value === 'string' && value in LEAD_TOPICS

/** Admin ve bildirimler için konu adı (hediye formu: gift) */
export function topicLabel(topic: string, lang: 'tr' | 'en' = 'tr') {
  if (topic === 'gift') return lang === 'en' ? '🎁 Corporate gifts' : '🎁 Kurumsal hediye'
  const t = isLeadTopic(topic) ? (LEAD_TOPICS[topic] as LeadTopic) : null
  return t ? `${t.icon} ${t.title[lang]}` : topic
}

/** Formdan gelen ek alanları konunun tanımına göre temizler */
export function cleanLeadDetails(topic: LeadTopicKey, input: unknown): Record<string, string | number> {
  const source = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const out: Record<string, string | number> = {}
  for (const field of (LEAD_TOPICS[topic] as LeadTopic).fields) {
    const raw = source[field.key]
    if (raw === undefined || raw === null || raw === '') continue
    if (field.type === 'number') {
      const n = Math.floor(Number(raw))
      if (Number.isFinite(n) && n > 0) out[field.key] = Math.min(n, field.max)
    } else if (field.type === 'select') {
      if (field.options.some((o) => o.value === raw)) out[field.key] = String(raw)
    } else {
      const s = String(raw).replace(/\s+/g, ' ').trim().slice(0, field.max)
      if (s) out[field.key] = s
    }
  }
  return out
}

/** Ek alanları okunur satırlara çevirir (bildirim, e-posta, admin) */
export function describeLeadDetails(topic: string, details: Record<string, unknown>, lang: 'tr' | 'en' = 'tr') {
  if (!isLeadTopic(topic)) return []
  return (LEAD_TOPICS[topic] as LeadTopic).fields.flatMap((field) => {
    const value = details?.[field.key]
    if (value === undefined || value === null || value === '') return []
    const shown = field.type === 'select' ? field.options.find((o) => o.value === value)?.label[lang] || String(value) : String(value)
    return [`${field.label[lang]}: ${shown}`]
  })
}
