import { NextRequest, NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'
import { adminDevices, notifyAdmin, removeAdminSubscription, saveAdminSubscription } from '@/lib/adminNotify'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { pushEnabled } from '@/lib/push'

// Yönetici cihazlarını anlık bildirime kaydeder: yeni demo talebi, yeni ödeme gibi haberler telefona düşer.

export async function POST(req: NextRequest) {
  if (!(await consumeRateLimit(`admin-push:${clientIp(req.headers)}`, 120, 3600))) return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 })
  const body = await req.json().catch(() => ({}))
  if (!(await checkAdminPassword(req, body.password))) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  const action = String(body.action || '')
  try {
    if (action === 'status') return NextResponse.json({ enabled: pushEnabled(), devices: await adminDevices() })
    if (!pushEnabled()) return NextResponse.json({ error: 'Bildirim servisi (VAPID anahtarları) bu ortamda tanımlı değil' }, { status: 503 })
    if (action === 'subscribe') {
      await saveAdminSubscription(body.subscription, String(body.label || 'Cihaz'))
      return NextResponse.json({ ok: true, devices: await adminDevices() })
    }
    if (action === 'unsubscribe') {
      await removeAdminSubscription(String(body.endpoint || ''))
      return NextResponse.json({ ok: true, devices: await adminDevices() })
    }
    if (action === 'test') {
      const res = await notifyAdmin({ title: '🔔 QRNot deneme bildirimi', body: 'Bildirimler bu cihazda çalışıyor.', url: '/admin', whatsappText: 'QRNot deneme bildirimi: yönetici bildirimleri çalışıyor.' })
      return NextResponse.json(res)
    }
    return NextResponse.json({ error: 'Bilinmeyen işlem' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Sunucu hatası' }, { status: 400 })
  }
}
