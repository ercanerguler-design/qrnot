// Sitenin tek kaynaktan yönetilen sabitleri (alan adı, şirket ve iletişim bilgileri).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://qrnot.com').replace(/\/$/, '')
export const SITE_NAME = 'QRNot'

export const COMPANY = {
  legalName: 'SCE INNOVATION LTD. ŞTİ.',
  shortName: 'SCE Innovation',
  address: 'Çetin Emeç Bulvarı 25/3, Çankaya / Ankara',
  email: 'sce@scegrup.com',
  phone: '+90 0850 888 1 889',
  whatsapp: '905433929230',
  whatsappDisplay: '+90 543 392 92 30',
  bankName: 'Türkiye Garanti Bankası — Etlik Şubesi',
  iban: 'TR48 0006 2000 7740 0006 2930 33',
  iyzicoMerchant: 'SCE Innovation Ltd. Şti.',
}

export function whatsappHref(text: string) {
  return `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`
}
