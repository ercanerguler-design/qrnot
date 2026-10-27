import { NextRequest, NextResponse } from 'next/server'
import { createPasswordResetToken } from '@/lib/auth'
import { ensureQrSchema, sql } from '@/lib/db'
import { clientIp, consumeRateLimit, ensureGrowthSchema } from '@/lib/growthSchema'
import { sendMail } from '@/lib/mail'
import { SITE_URL } from '@/lib/site'

// "Şifremi unuttum": e-postaya 24 saat geçerli, tek kullanımlık sıfırlama linki gönderir.
// Hesap olsun olmasın aynı cevap döner (hangi e-postanın üye olduğu dışarıdan anlaşılmasın).

const TEXT = {
  tr: {
    subject: 'QRNot şifre sıfırlama',
    body: (url: string) =>
      `Merhaba,\n\nQRNot hesabın için şifre sıfırlama isteği aldık. Yeni şifreni belirlemek için bu linke tıkla (24 saat geçerli, tek kullanımlık):\n\n${url}\n\nBu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.\n\nQRNot`,
  },
  en: {
    subject: 'QRNot password reset',
    body: (url: string) =>
      `Hello,\n\nWe received a password reset request for your QRNot account. Click this link to set a new password (valid for 24 hours, single use):\n\n${url}\n\nIf you did not request this, you can ignore this email; your password will not change.\n\nQRNot`,
  },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const lang = body.lang === 'en' ? 'en' : 'tr'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return NextResponse.json({ error: lang === 'en' ? 'Enter a valid email address.' : 'Geçerli bir e-posta adresi yaz.' }, { status: 400 })
    }

    await ensureGrowthSchema()
    const ip = clientIp(req.headers)
    const okIp = await consumeRateLimit(`forgot:${ip}`, 10, 3600)
    const okEmail = await consumeRateLimit(`forgot-email:${email}`, 3, 3600)
    if (!okIp || !okEmail) {
      return NextResponse.json({ error: lang === 'en' ? 'Too many requests. Please try again later.' : 'Çok fazla istek. Lütfen biraz sonra tekrar dene.' }, { status: 429 })
    }

    await ensureQrSchema()
    const rows = (await sql`SELECT id, email FROM users WHERE lower(trim(email)) = ${email} LIMIT 1`) as Array<{ id: string; email: string }>
    const user = rows[0]
    if (user) {
      await sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id} AND used_at IS NULL`
      const token = await createPasswordResetToken(user.id)
      const url = `${SITE_URL}/reset-password/${token}`
      const result = await sendMail({ to: user.email, subject: TEXT[lang].subject, text: TEXT[lang].body(url) })
      if (result.status !== 'sent') console.error('[auth/forgot-password] mail', result.status)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/forgot-password]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
