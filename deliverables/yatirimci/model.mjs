// QRNot yatırımcı sunumu — 36 aylık finansal model (senaryo). Çalıştır: node deliverables/yatirimci/model.mjs
// Tüm tutarlar EUR, KDV hariç. Varsayımlar aşağıda; değiştirip yeniden çalıştırınca model.json güncellenir.
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const A = {
  eurTry: 50, // varsayım: 1 € = 50 TL (güncel kurla değiştir)
  // DPP fiyatları (FIYAT-LISTESI.md, yıllık ödemede aylık karşılığı)
  plans: { baslangic: 59, buyume: 149, isletme: 349, kurumsal: 790 },
  // Yeni müşterilerin paket dağılımı
  mix: { baslangic: 0.5, buyume: 0.3, isletme: 0.15, kurumsal: 0.05 },
  discountHaircut: 0.1, // kurucu müşteri / birlik indirimleri ortalaması
  monthlyChurn: 0.02, // aylık müşteri kaybı
  addOnShare: 0.15, // veri girişi, eğitim, etiket vb. ek hizmet geliri (abonelik gelirine oran)
  pilotFee: 390,
  pilotToPaid: 0.6, // pilotların ücretli pakete geçme oranı (pilot ücreti mahsup edilir)
  dppGrossMargin: 0.85, // altyapı, yapay zekâ, destek sonrası
  // Hediye hattı (gerçek katalog fiyatları, KDV dahil TL → KDV hariç EUR)
  giftAvgPriceTry: 449,
  giftVat: 0.2,
  giftGrossMargin: 0.55, // ürün, ambalaj, kargo, pazaryeri komisyonu sonrası (varsayım)
  premiumPriceTry: 199,
  premiumAttach: 0.1, // hediye alıcılarının Premium alma oranı
  // Giderler (aylık, EUR)
  team: [
    { from: 1, role: 'Kurucu / satış', cost: 1500 },
    { from: 1, role: 'Yazılım (yarı zamanlı)', cost: 1200 },
    { from: 4, role: 'Satış / iş geliştirme', cost: 1600 },
    { from: 10, role: 'Müşteri başarısı', cost: 1300 },
    { from: 13, role: 'Yazılım geliştirici', cost: 2500 },
    { from: 16, role: 'Satış (AB pazarı)', cost: 2200 },
    { from: 25, role: 'Pazarlama uzmanı', cost: 1800 },
    { from: 25, role: 'Yazılım geliştirici 2', cost: 2500 },
  ],
  infra: [150, 400, 900], // yıl 1/2/3 aylık altyapı + yapay zekâ
  marketing: [1200, 2500, 4500], // yıl 1/2/3 aylık pazarlama (fuar, LinkedIn, içerik, seyahat)
  overhead: 450, // muhasebe, hukuk, yazılım lisansları, ofis
}

// Senaryolar: aylık yeni ücretli DPP müşterisi (yıl 1/2/3), aylık pilot, aylık hediye satışı (adet)
const SCENARIOS = {
  temkinli: { label: 'Temkinli', newPaid: [1, 3, 6], pilots: [1, 2, 3], giftUnits: [60, 150, 300] },
  baz: { label: 'Baz', newPaid: [2.5, 6, 12], pilots: [2, 4, 6], giftUnits: [100, 300, 600] },
  iyimser: { label: 'İyimser', newPaid: [5, 12, 25], pilots: [3, 6, 10], giftUnits: [200, 600, 1200] },
}

const blendedArpa = Object.entries(A.mix).reduce((s, [k, w]) => s + w * A.plans[k], 0) * (1 - A.discountHaircut)
const giftNetEur = A.giftAvgPriceTry / (1 + A.giftVat) / A.eurTry
const premiumNetEur = A.premiumPriceTry / (1 + A.giftVat) / A.eurTry

function run(sc) {
  let customers = 0
  const months = []
  for (let m = 1; m <= 36; m++) {
    const y = Math.ceil(m / 12) - 1
    const pilots = sc.pilots[y]
    customers = customers * (1 - A.monthlyChurn) + sc.newPaid[y]
    const subscription = customers * blendedArpa
    const addOns = subscription * A.addOnShare
    const pilotRev = pilots * A.pilotFee * (1 - A.pilotToPaid) // dönüşenlerin ücreti mahsup edildiği için net
    const dppRev = subscription + addOns + pilotRev
    const giftRev = sc.giftUnits[y] * giftNetEur + sc.giftUnits[y] * A.premiumAttach * premiumNetEur
    const revenue = dppRev + giftRev
    const grossProfit = dppRev * A.dppGrossMargin + giftRev * A.giftGrossMargin
    const team = A.team.filter((t) => m >= t.from).reduce((s, t) => s + t.cost, 0)
    const opex = team + A.infra[y] + A.marketing[y] + A.overhead
    months.push({ m, customers, revenue, dppRev, giftRev, grossProfit, opex, ebitda: grossProfit - opex, mrr: subscription })
  }
  const years = [0, 1, 2].map((y) => {
    const ms = months.slice(y * 12, y * 12 + 12)
    const sum = (k) => ms.reduce((s, x) => s + x[k], 0)
    const last = ms[ms.length - 1]
    return {
      year: y + 1,
      revenue: sum('revenue'),
      dppRevenue: sum('dppRev'),
      giftRevenue: sum('giftRev'),
      grossProfit: sum('grossProfit'),
      opex: sum('opex'),
      ebitda: sum('ebitda'),
      endCustomers: last.customers,
      endArr: last.mrr * 12,
    }
  })
  // Kümülatif nakit ihtiyacı (en düşük nokta) ve başabaş ayı
  let cum = 0
  let low = 0
  let breakEven = null
  for (const x of months) {
    cum += x.ebitda
    low = Math.min(low, cum)
    if (breakEven === null && x.ebitda > 0) breakEven = x.m
  }
  return { label: sc.label, years, cashNeed: -low, breakEvenMonth: breakEven, endCum: cum }
}

const results = Object.fromEntries(Object.entries(SCENARIOS).map(([k, sc]) => [k, run(sc)]))
const cac = 650 // satış odaklı edinme maliyeti varsayımı (pilot + görüşme + seyahat payı)
const unit = {
  blendedArpa,
  grossMarginPerMonth: blendedArpa * A.dppGrossMargin,
  ltv: (blendedArpa * A.dppGrossMargin) / A.monthlyChurn,
  cac,
  paybackMonths: cac / (blendedArpa * A.dppGrossMargin),
}
unit.ltvToCac = unit.ltv / cac

const out = { assumptions: A, scenarios: SCENARIOS, unit, results, giftNetEur, premiumNetEur }
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'model.json'), JSON.stringify(out, null, 2))
const f = (n) => Math.round(n).toLocaleString('tr-TR')
console.log('Karma ARPA (€/ay):', blendedArpa.toFixed(0), '| LTV:', f(unit.ltv), '| CAC:', cac, '| LTV/CAC:', unit.ltvToCac.toFixed(1), '| geri dönüş (ay):', unit.paybackMonths.toFixed(1))
for (const r of Object.values(results)) {
  console.log(`\n${r.label} — nakit ihtiyacı €${f(r.cashNeed)}, ilk kârlı ay: ${r.breakEvenMonth ?? 'yok'}`)
  for (const y of r.years) console.log(`  Y${y.year}: gelir €${f(y.revenue)} (DPP ${f(y.dppRevenue)}, hediye ${f(y.giftRevenue)}) · brüt kâr €${f(y.grossProfit)} · gider €${f(y.opex)} · FAVÖK €${f(y.ebitda)} · yıl sonu müşteri ${f(y.endCustomers)} · ARR €${f(y.endArr)}`)
}
