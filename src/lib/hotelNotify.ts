type NotifyResult = {
  status: 'sent' | 'failed' | 'skipped'
  detail?: string
}

function normalizePhoneNumber(input: string) {
  return String(input || '').replace(/[^0-9]/g, '')
}

async function sendViaWhatsappCloudApi(messageText: string, targetNumber?: string): Promise<NotifyResult> {
  const phoneNumberId = String(process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim()
  const accessToken = String(process.env.WHATSAPP_ACCESS_TOKEN || '').trim()
  const toNumber = normalizePhoneNumber(targetNumber || String(process.env.WHATSAPP_TO_NUMBER || '').trim())

  if (!phoneNumberId || !accessToken || !toNumber) {
    return { status: 'skipped', detail: 'cloud-api-env-missing' }
  }

  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'text',
      text: {
        body: messageText.slice(0, 3900),
      },
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    return { status: 'failed', detail: `cloud-api-${res.status}:${errorText.slice(0, 260)}` }
  }

  return { status: 'sent' }
}

async function sendViaWebhook(messageText: string): Promise<NotifyResult> {
  const webhookUrl = String(process.env.WHATSAPP_WEBHOOK_URL || '').trim()
  if (!webhookUrl) {
    return { status: 'skipped', detail: 'webhook-env-missing' }
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'whatsapp',
      message: messageText,
      createdAt: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    return { status: 'failed', detail: `webhook-${res.status}:${errorText.slice(0, 260)}` }
  }

  return { status: 'sent' }
}

export async function notifyHotelOpsOnWhatsApp(messageText: string, targetNumber?: string): Promise<NotifyResult> {
  const cloudResult = await sendViaWhatsappCloudApi(messageText, targetNumber)
  if (cloudResult.status !== 'skipped') {
    return cloudResult
  }

  return sendViaWebhook(messageText)
}

export function buildManualWhatsAppLink(messageText: string, targetNumber?: string) {
  const target = normalizePhoneNumber(targetNumber || String(process.env.WHATSAPP_TO_NUMBER || '').trim())
  if (!target) return null
  return `https://wa.me/${target}?text=${encodeURIComponent(messageText)}`
}
