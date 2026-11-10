import { NextRequest, NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'
import { sql } from '@/lib/db'
import { activateDppRequest, adminDealerList, DealerError, deleteDppRequest, ensureDealerSchema, listDealerDppRequests, listDealerOrders, type Dealer } from '@/lib/dealers'
import { DEALER_STATUSES, DPP_DEALER_PLANS, DPP_REQUEST_STATUSES, type DealerStatus } from '@/lib/dealersShared'
import { SITE_URL } from '@/lib/site'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { adminEmails, sendMail } from '@/lib/mail'

// Admin > Bayiler: başvurular, bayi bazında sipariş ve ödeme durumu, DPP paket talepleri. ADMIN_PASSWORD ile korunur.

export const dynamic = 'force-dynamic'

const pct = (v: unknown, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 90 ? Math.round(n * 100) / 100 : fallback
}

export async function POST(req: NextRequest) {
  try {
    if (!(await consumeRateLimit(`admin-dealers:${clientIp(req.headers)}`, 300, 3600))) return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 })
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    if (!(await checkAdminPassword(req, body.password))) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    await ensureDealerSchema()
    const action = String(body.action || '')

    if (action === 'list') {
      const status = (DEALER_STATUSES as readonly string[]).includes(String(body.status)) ? String(body.status) : null
      const dealers = await adminDealerList(status)
      const counts = await sql`SELECT status, COUNT(*)::int AS count FROM dealers GROUP BY status`
      const totals = await sql`
        SELECT
          COALESCE(SUM(total) FILTER (WHERE status IN ('paid', 'fulfilled', 'shipped', 'delivered')), 0)::bigint AS paid,
          COALESCE(SUM(total) FILTER (WHERE status IN ('pending', 'awaiting_transfer')), 0)::bigint AS unpaid,
          COUNT(*) FILTER (WHERE status NOT IN ('failed', 'cancelled'))::int AS orders
        FROM shop_orders WHERE dealer_id IS NOT NULL
      `
      return NextResponse.json({ dealers, counts, totals: totals[0] })
    }

    const id = String(body.id || '')
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Geçersiz kayıt' }, { status: 400 })

    if (action === 'detail') {
      const [orders, dpp] = await Promise.all([listDealerOrders(id), listDealerDppRequests(id)])
      return NextResponse.json({ orders, dpp })
    }

    if (action === 'update') {
      const before = ((await sql`SELECT * FROM dealers WHERE id = ${id}`) as unknown as Dealer[])[0]
      if (!before) return NextResponse.json({ error: 'Bayi bulunamadı' }, { status: 404 })
      const status = (DEALER_STATUSES as readonly string[]).includes(String(body.status)) ? (String(body.status) as DealerStatus) : before.status
      const rows = (await sql`
        UPDATE dealers SET
          status = ${status},
          discount_pct = ${pct(body.discountPct, Number(before.discount_pct))},
          dpp_discount_pct = ${pct(body.dppDiscountPct, Number(before.dpp_discount_pct))},
          admin_note = ${body.adminNote === undefined ? before.admin_note : String(body.adminNote).slice(0, 4000)},
          approved_at = CASE WHEN ${status} = 'approved' AND approved_at IS NULL THEN NOW() ELSE approved_at END,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `) as unknown as Dealer[]
      const dealer = rows[0]
      let mail = 'skipped'
      if (before.status !== 'approved' && status === 'approved') {
        const res = await sendMail({
          to: dealer.email,
          replyTo: adminEmails()[0],
          subject: 'QRNot bayilik başvurun onaylandı 🎉',
          text: [
            `Merhaba ${dealer.contact_name},`,
            '',
            `${dealer.company} artık QRNot bayisi. Hoş geldin!`,
            '',
            `• Ürünlerde bayi indirimin: %${Number(dealer.discount_pct)} (site fiyatından)`,
            `• QRNot DPP paketlerinde bayi indirimin: %${Number(dealer.dpp_discount_pct)}`,
            '• Ürün siparişlerinde en az 30 adet; ödeme kredi kartı ya da havale / EFT',
            '',
            'Bayi paneline giriş:',
            'www.qrnot.com/bayi',
            '',
            `Panele bu e-posta adresiyle (${dealer.email}) açılmış QRNot hesabınla girersin. Hesabın yoksa aynı adresle www.qrnot.com/account sayfasından açabilirsin.`,
            '',
            'Sorun olursa bu e-postayı yanıtlaman ya da WhatsApp’tan yazman yeterli: +90 543 392 92 30',
            '',
            'QRNot · SCE Innovation',
          ].join('\n'),
        }).catch(() => ({ status: 'failed' as const }))
        mail = res.status
      }
      return NextResponse.json({ ok: true, dealer, mail })
    }

    if (action === 'dpp.update') {
      const status = (DPP_REQUEST_STATUSES as readonly string[]).includes(String(body.status)) ? String(body.status) : null
      const paid = typeof body.paid === 'boolean' ? body.paid : null
      const rows = await sql`
        UPDATE dealer_dpp_requests SET
          status = COALESCE(${status}, status),
          paid = COALESCE(${paid}::boolean, paid),
          paid_at = CASE WHEN ${paid}::boolean IS TRUE AND paid_at IS NULL THEN NOW() WHEN ${paid}::boolean IS FALSE THEN NULL ELSE paid_at END,
          admin_note = COALESCE(${body.adminNote === undefined ? null : String(body.adminNote).slice(0, 2000)}, admin_note),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      if (!rows[0]) return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 })
      return NextResponse.json({ ok: true, request: rows[0] })
    }

    if (action === 'dpp.delete') {
      await deleteDppRequest(id, { admin: true })
      return NextResponse.json({ ok: true })
    }

    if (action === 'dpp.activate') {
      // Ödenmiş talep için müşterinin DPP panelini açar; giriş bilgisi müşteriye, bilgilendirme bayiye gider
      const { request, dealer, companyCode, owner } = await activateDppRequest(id)
      const plan = DPP_DEALER_PLANS.find((p) => p.id === request.plan)?.name || request.plan
      const panelUrl = `${SITE_URL}/dpp/panel`
      const until = request.period_end ? new Date(request.period_end).toLocaleDateString('tr-TR') : null
      const customerMail = await sendMail({
        to: owner.email,
        replyTo: adminEmails()[0],
        subject: 'QRNot DPP paneliniz açıldı',
        text: [
          `Merhaba${request.customer_contact ? ` ${request.customer_contact}` : ''},`,
          '',
          `${request.customer_company} için QRNot Dijital Ürün Pasaportu (DPP) paneliniz açıldı${dealer ? ` (iş ortağımız ${dealer.company} aracılığıyla)` : ''}.`,
          '',
          `Paket: ${plan}${until ? ` · ${until} tarihine kadar` : ''}`,
          `Panel: ${panelUrl}`,
          `E-posta: ${owner.email}`,
          `Geçici şifre: ${owner.password}`,
          '',
          'İlk girişte yeni şifrenizi belirlemeniz istenecek. Bu e-postayı kimseyle paylaşmayın.',
          '',
          'Sorularınız için bu e-postayı yanıtlayabilir ya da WhatsApp’tan yazabilirsiniz: +90 543 392 92 30',
          '',
          'QRNot DPP · SCE Innovation',
        ].join('\n'),
      }).catch(() => ({ status: 'failed' as const }))
      if (dealer) {
        await sendMail({
          to: dealer.email,
          replyTo: adminEmails()[0],
          subject: `Müşterinizin DPP paneli açıldı: ${request.customer_company}`,
          text: [
            `Merhaba ${dealer.contact_name},`,
            '',
            `${request.customer_company} için QRNot DPP paneli açıldı (${plan}${until ? `, ${until} tarihine kadar` : ''}).`,
            `Giriş bilgileri müşterinizin e-postasına (${owner.email}) gönderildi. Panel adresi: ${panelUrl}`,
            '',
            'Talepleriniz: www.qrnot.com/bayi',
            '',
            'QRNot · SCE Innovation',
          ].join('\n'),
        }).catch(() => null)
      }
      return NextResponse.json({ ok: true, request, companyCode, panelUrl, email: owner.email, password: owner.password, mail: customerMail.status })
    }

    return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
  } catch (err) {
    if (err instanceof DealerError) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error('[admin dealers]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
