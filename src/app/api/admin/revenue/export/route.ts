import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { checkAdminPassword } from '@/lib/adminAuth'
import {
  allOrders,
  manualSales,
  paidOrders,
  resolveRevenueRange,
  REVENUE_CHANNEL_LABEL,
  revenueSummary,
  type OrderDetailRow,
} from '@/lib/revenue'

// Gelir tablosunun Excel (.xlsx) dışa aktarımı: Özet, Satışlar (gelir sayılanlar), Tüm siparişler (iptal / ödenmeyen dahil).

export const dynamic = 'force-dynamic'

const STATUS_TR: Record<string, string> = {
  pending: 'Ödeme bekliyor',
  awaiting_transfer: 'Havale bekleniyor',
  paid: 'Ödendi',
  fulfilled: 'Teslim edildi (dijital)',
  shipped: 'Kargoda',
  delivered: 'Teslim edildi',
  failed: 'Ödeme başarısız',
  cancelled: 'İptal',
  refunded: 'İade',
}
const PROVIDER_TR: Record<string, string> = { iyzico: 'Kart (iyzico)', stripe: 'Kart (Stripe)', transfer: 'Havale / EFT', mock: 'Test' }
const MONEY_FORMAT = '#,##0.00'

const money = (kurus: number) => Math.round(Number(kurus)) / 100
const trDate = (value: string | null) => (value ? new Date(value).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '')
const dayTr = (iso: string) => iso.split('-').reverse().join('.')
const itemsText = (o: OrderDetailRow) =>
  (Array.isArray(o.items) ? o.items : []).map((i) => `${i.quantity}× ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ''}`).join(', ')
const itemsCount = (o: OrderDetailRow) => (Array.isArray(o.items) ? o.items : []).reduce((sum, i) => sum + Number(i.quantity || 0), 0)
const isRefunded = (status: string) => status === 'refunded' || status === 'cancelled'

function styleSheet(sheet: ExcelJS.Worksheet, moneyColumns: string[]) {
  const header = sheet.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2440' } }
  header.alignment = { vertical: 'middle' }
  header.height = 22
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  if (sheet.rowCount > 1) sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } }
  for (const key of moneyColumns) sheet.getColumn(key).numFmt = MONEY_FORMAT
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    if (!(await checkAdminPassword(req, body.password))) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { startDate, from, to } = await resolveRevenueRange(body.from, body.to)
    const [summary, paid, all, manual] = await Promise.all([revenueSummary(from, to), paidOrders(from, to), allOrders(from, to), manualSales(from, to)])

    const wb = new ExcelJS.Workbook()
    wb.creator = 'QRNot'
    wb.created = new Date()

    // 1) Özet
    const ozet = wb.addWorksheet('Özet')
    ozet.columns = [
      { header: 'Kanal', key: 'channel', width: 22 },
      { header: 'Para birimi', key: 'currency', width: 12 },
      { header: 'Satış adedi', key: 'orders', width: 12 },
      { header: 'Brüt satış', key: 'gross', width: 16 },
      { header: 'İade / iptal', key: 'refunds', width: 16 },
      { header: 'Net satış', key: 'net', width: 16 },
    ]
    for (const r of summary) {
      ozet.addRow({ channel: REVENUE_CHANNEL_LABEL[r.channel] || r.channel, currency: r.currency, orders: r.orders, gross: money(r.gross), refunds: -money(r.refunds), net: money(r.net) })
    }
    for (const currency of ['TRY', 'USD']) {
      const list = summary.filter((r) => r.currency === currency)
      if (list.length === 0) continue
      const row = ozet.addRow({
        channel: 'TOPLAM',
        currency,
        orders: list.reduce((s, r) => s + r.orders, 0),
        gross: money(list.reduce((s, r) => s + r.gross, 0)),
        refunds: -money(list.reduce((s, r) => s + r.refunds, 0)),
        net: money(list.reduce((s, r) => s + r.net, 0)),
      })
      row.font = { bold: true }
    }
    styleSheet(ozet, ['gross', 'refunds', 'net'])
    ozet.addRow([])
    ozet.addRow([`Dönem: ${from === '1970-01-01' ? 'başlangıç' : dayTr(from)} – ${to === '9999-12-31' ? 'bugün' : dayTr(to)}`])
    ozet.addRow([`Sayım başlangıcı: ${startDate ? dayTr(startDate) : 'ayarlanmadı (tüm kayıtlar)'}`])
    ozet.addRow(['Site satışları ödeme tarihine ve ödendiği andaki tutara göre sayılır. Tutarlar KDV dahil, alıcının ödediği toplamdır.'])

    // 2) Satışlar (gelir sayılanlar)
    const satis = wb.addWorksheet('Satışlar')
    satis.columns = [
      { header: 'Tarih', key: 'date', width: 20 },
      { header: 'Kanal', key: 'channel', width: 18 },
      { header: 'Sipariş / kayıt', key: 'ref', width: 20 },
      { header: 'Müşteri', key: 'customer', width: 24 },
      { header: 'E-posta', key: 'email', width: 28 },
      { header: 'Ürünler', key: 'items', width: 48 },
      { header: 'Adet', key: 'qty', width: 8 },
      { header: 'Ödeme', key: 'provider', width: 16 },
      { header: 'Durum', key: 'status', width: 22 },
      { header: 'Para birimi', key: 'currency', width: 12 },
      { header: 'Brüt', key: 'gross', width: 14 },
      { header: 'İade / iptal', key: 'refund', width: 14 },
      { header: 'Net', key: 'net', width: 14 },
      { header: 'Not', key: 'note', width: 30 },
    ]
    for (const o of paid) {
      const refund = isRefunded(o.status) ? money(o.total) : 0
      satis.addRow({
        date: trDate(o.paid_at),
        channel: REVENUE_CHANNEL_LABEL.site,
        ref: o.order_no,
        customer: o.full_name,
        email: o.email,
        items: itemsText(o),
        qty: itemsCount(o),
        provider: PROVIDER_TR[o.provider] || o.provider,
        status: STATUS_TR[o.status] || o.status,
        currency: o.currency,
        gross: money(o.total),
        refund: refund ? -refund : 0,
        net: money(o.total) - refund,
      })
    }
    for (const m of manual) {
      const isRefund = m.kind === 'refund'
      satis.addRow({
        date: dayTr(m.sale_date),
        channel: REVENUE_CHANNEL_LABEL[m.channel] || m.channel,
        ref: 'Elle giriş',
        qty: m.quantity,
        status: isRefund ? 'İade' : 'Satış',
        currency: m.currency,
        gross: isRefund ? 0 : money(m.amount),
        refund: isRefund ? -money(m.amount) : 0,
        net: isRefund ? -money(m.amount) : money(m.amount),
        note: m.note,
      })
    }
    styleSheet(satis, ['gross', 'refund', 'net'])

    // 3) Tüm siparişler (iptal ve ödenmeyenler dahil)
    const tum = wb.addWorksheet('Tüm siparişler')
    tum.columns = [
      { header: 'Oluşturma', key: 'created', width: 20 },
      { header: 'Ödeme', key: 'paid', width: 20 },
      { header: 'Sipariş no', key: 'ref', width: 20 },
      { header: 'Durum', key: 'status', width: 22 },
      { header: 'Müşteri', key: 'customer', width: 24 },
      { header: 'E-posta', key: 'email', width: 28 },
      { header: 'Ürünler', key: 'items', width: 48 },
      { header: 'Ödeme yöntemi', key: 'provider', width: 16 },
      { header: 'Para birimi', key: 'currency', width: 12 },
      { header: 'Tutar', key: 'total', width: 14 },
    ]
    for (const o of all) {
      tum.addRow({
        created: trDate(o.created_at),
        paid: trDate(o.paid_at),
        ref: o.order_no,
        status: STATUS_TR[o.status] || o.status,
        customer: o.full_name,
        email: o.email,
        items: itemsText(o),
        provider: PROVIDER_TR[o.provider] || o.provider,
        currency: o.currency,
        total: money(o.total),
      })
    }
    styleSheet(tum, ['total'])

    const buffer = await wb.xlsx.writeBuffer()
    const filename = `qrnot-satislar-${from === '1970-01-01' ? 'baslangic' : from}_${to === '9999-12-31' ? new Date().toISOString().slice(0, 10) : to}.xlsx`
    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[admin/revenue/export]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
