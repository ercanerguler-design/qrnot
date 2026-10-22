import Anthropic from '@anthropic-ai/sdk'
import { getBlob } from '@/lib/blob'
import { sql } from '@/lib/db'

// Yapay zekâ altyazı ve çeviri (Premium).
// 1) Sesi yazıya dökme: OpenAI Whisper (OPENAI_API_KEY)
// 2) Çeviri: Claude (ANTHROPIC_API_KEY). Her dil için bir kez üretilir ve media_translations'ta saklanır.
// Anahtarlar yoksa özellik kapalıdır; sitenin geri kalanı etkilenmez.

export const CAPTION_LANGS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  nl: 'Nederlands',
  ar: 'العربية',
  ru: 'Русский',
  es: 'Español',
}

const WHISPER_MAX_BYTES = 25 * 1024 * 1024

export function aiCaptionsEnabled() {
  return Boolean(String(process.env.OPENAI_API_KEY || '').trim() && String(process.env.ANTHROPIC_API_KEY || '').trim())
}

/** Blob'daki ses / video dosyasını Whisper ile yazıya döker. */
export async function transcribeBlob(blobUrl: string): Promise<{ text: string; lang: string | null }> {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim()
  if (!apiKey) throw new Error('Altyazı servisi yapılandırılmamış')

  const blob = await getBlob(blobUrl)
  if (!blob || !blob.stream) throw new Error('Dosya bulunamadı')
  const buffer = Buffer.from(await new Response(blob.stream as ReadableStream).arrayBuffer())
  if (buffer.byteLength > WHISPER_MAX_BYTES) throw new Error('Dosya altyazı için çok büyük (en fazla 25 MB)')

  const contentType = blob.headers.get('content-type') || 'audio/webm'
  const ext = (blobUrl.split('?')[0].split('.').pop() || 'webm').toLowerCase().slice(0, 5)
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(buffer)], { type: contentType }), `media.${ext}`)
  form.append('model', 'whisper-1')
  form.append('response_format', 'verbose_json')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })
  if (!res.ok) {
    console.error('[whisper]', res.status, (await res.text()).slice(0, 300))
    throw new Error('Ses yazıya dökülemedi, lütfen tekrar dene')
  }
  const data = (await res.json()) as { text?: string; language?: string }
  const languageMap: Record<string, string> = { turkish: 'tr', english: 'en', german: 'de', french: 'fr', dutch: 'nl', arabic: 'ar', russian: 'ru', spanish: 'es' }
  const lang = data.language ? languageMap[data.language.toLowerCase()] || data.language.slice(0, 12) : null
  return { text: String(data.text || '').trim(), lang }
}

let anthropic: Anthropic | null = null
function claude() {
  if (!anthropic) anthropic = new Anthropic()
  return anthropic
}

/** Metni hedef dile çevirir (Claude). Kişisel mesajın tonu korunur. */
async function translateText(text: string, targetLang: string): Promise<string> {
  const language = CAPTION_LANGS[targetLang] || targetLang
  const response = await claude().beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system:
      'You translate personal voice-message transcripts for a gift product. Translate the user text faithfully into the requested language, keeping the warm, personal tone, names and terms of endearment. Output only the translation, with no notes, quotes or preamble.',
    messages: [{ role: 'user', content: `Target language: ${language}\n\n${text}` }],
  })
  if (response.stop_reason === 'refusal') throw new Error('Çeviri yapılamadı')
  const out = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()
  if (!out) throw new Error('Çeviri yapılamadı')
  return out
}

/** Dökümü ister: orijinal dil ise döküm, değilse önbellekten ya da Claude ile çeviri. */
export async function captionFor(mediaId: string, transcript: string, transcriptLang: string | null, targetLang: string) {
  if (!transcriptLang || targetLang === transcriptLang) return transcript
  const cached = (await sql`SELECT text FROM media_translations WHERE media_id = ${mediaId} AND lang = ${targetLang}`) as Array<{ text: string }>
  if (cached[0]) return cached[0].text
  if (!aiCaptionsEnabled()) throw new Error('Çeviri servisi yapılandırılmamış')
  const text = await translateText(transcript, targetLang)
  await sql`
    INSERT INTO media_translations (media_id, lang, text) VALUES (${mediaId}, ${targetLang}, ${text})
    ON CONFLICT (media_id, lang) DO NOTHING
  `
  return text
}
