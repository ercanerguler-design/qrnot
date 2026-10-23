// Sitenin tek kaynaktan yönetilen sabitleri (alan adı, şirket ve iletişim bilgileri).

// Asıl adres www.qrnot.com: qrnot.com oraya yönlendiriyor. Arama motoruna bildirilen adres (canonical, site haritası) yönlendiren adres olmamalı.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.qrnot.com').replace(/\/$/, '').replace('://qrnot.com', '://www.qrnot.com')
export const SITE_NAME = 'QRNot'

export const COMPANY = {
  legalName: 'SCE INNOVATION LTD. ŞTİ.',
  shortName: 'SCE Innovation',
  address: 'Çetin Emeç Bulvarı 25/3, Çankaya / Ankara',
  email: 'sce@scegrup.com',
  /** Sadece müşteri desteği için */
  phone: '0850 888 1 889',
  phoneHref: 'tel:+908508881889',
  whatsapp: '905433929230',
  whatsappDisplay: '+90 543 392 92 30',
  bankName: 'Türkiye Garanti Bankası — Etlik Şubesi',
  iban: 'TR48 0006 2000 7740 0006 2930 33',
  iyzicoMerchant: 'SCE Innovation Ltd. Şti.',
}

/** QRNot'un pazaryeri mağazaları (anasayfa, footer ve yapılandırılmış veri bu listeden beslenir). */
export const MARKETPLACES = [
  {
    id: 'trendyol',
    name: 'Trendyol',
    url: 'https://www.trendyol.com/magaza/sce-innovation-m-1128695',
    color: '#f27a1a',
    store: { tr: 'SCE Innovation mağazası', en: 'SCE Innovation store' },
    desc: {
      tr: "Sesli anı kolyesi, NFC'li anahtarlık, evcil hayvan künyesi ve anı defteri masa kartı seti — Trendyol güvencesiyle sipariş et.",
      en: 'Voice memory necklaces, NFC keychains, pet ID tags and guestbook table-card sets — order with Trendyol in Turkey.',
    },
    region: { tr: 'Türkiye', en: 'Turkey' },
  },
  {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    url: 'https://www.hepsiburada.com/magaza/sce-innovation',
    color: '#ff6000',
    store: { tr: 'SCE Innovation mağazası', en: 'SCE Innovation store' },
    desc: {
      tr: 'QR ve NFC kodlu kişiye özel hediyelerimiz Hepsiburada mağazamızda: kolye, anahtarlık, çocuk acil durum etiketi ve daha fazlası.',
      en: 'Our personalised QR and NFC gifts on Hepsiburada: necklaces, keychains, child emergency tags and more — shipping within Turkey.',
    },
    region: { tr: 'Türkiye', en: 'Turkey' },
  },
  {
    id: 'etsy',
    name: 'Etsy',
    url: 'https://www.etsy.com/shop/QRNot',
    color: '#f1641e',
    store: { tr: 'QRNot mağazası', en: 'QRNot shop' },
    desc: {
      tr: "Yurt dışındaki sevdiklerin için İngilizce dijital ürünler: sesli mesaj QR'lı hediye etiketi, düğün anı defteri ve evcil hayvan QR künyesi.",
      en: 'Digital products shipped instantly worldwide: voice message QR gift tags, audio & video wedding guestbook and pet ID QR tags.',
    },
    region: { tr: 'Dünya geneli', en: 'Worldwide' },
  },
] as const

export function whatsappHref(text: string) {
  return `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`
}
