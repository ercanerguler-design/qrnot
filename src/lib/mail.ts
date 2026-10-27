// E-posta gönderimi: Resend (https://resend.com). RESEND_API_KEY yoksa sessizce atlanır, hiçbir akış bozulmaz.
// Gönderen adres Resend'de doğrulanmış alan adından olmalıdır (qrnot.com): MAIL_FROM, örn. "QRNot <bilgi@qrnot.com>".

export function mailEnabled() {
  return Boolean(String(process.env.RESEND_API_KEY || '').trim())
}

export async function sendMail(input: { to: string | string[]; subject: string; text: string; html?: string; replyTo?: string }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim()
  if (!apiKey) return { status: 'skipped' as const }
  const from = String(process.env.MAIL_FROM || 'QRNot <bilgi@qrnot.com>').trim()
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    })
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300)
      console.error('[mail]', res.status, detail)
      return { status: 'failed' as const, detail }
    }
    return { status: 'sent' as const }
  } catch (error) {
    console.error('[mail]', error)
    return { status: 'failed' as const, detail: error instanceof Error ? error.message : 'unknown' }
  }
}

/** Yönetici bildirimlerinin gideceği adres(ler): ADMIN_NOTIFY_EMAIL (virgülle birden fazla) ya da şirket e-postası */
export function adminEmails() {
  return String(process.env.ADMIN_NOTIFY_EMAIL || 'sce@scegrup.com')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}
