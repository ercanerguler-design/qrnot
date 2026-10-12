'use client'

// Web NFC (Android Chrome 89+) için ince sarmalayıcı. iOS Safari ve masaüstü desteklemez.

interface NdefRecordInit {
  recordType: string
  data?: string
  mediaType?: string
}

interface NdefRecord {
  recordType: string
  data?: DataView
  encoding?: string
}

interface NdefReadingEvent extends Event {
  serialNumber: string
  message: { records: NdefRecord[] }
}

interface NdefReaderLike {
  write(message: { records: NdefRecordInit[] }, options?: { overwrite?: boolean; signal?: AbortSignal }): Promise<void>
  makeReadOnly(options?: { signal?: AbortSignal }): Promise<void>
  scan(options?: { signal?: AbortSignal }): Promise<void>
  onreading: ((event: NdefReadingEvent) => void) | null
  onreadingerror: ((event: Event) => void) | null
}

type NdefReaderCtor = new () => NdefReaderLike

function getCtor(): NdefReaderCtor | null {
  if (typeof window === 'undefined') return null
  const ctor = (window as unknown as { NDEFReader?: NdefReaderCtor }).NDEFReader
  return ctor || null
}

export function isWebNfcSupported() {
  return Boolean(getCtor()) && window.isSecureContext
}

export function nfcUrlFor(origin: string, slug: string) {
  return `${origin.replace(/\/$/, '')}/n/${slug}`
}

export async function writeUrlToTag(url: string, options: { lock?: boolean; signal?: AbortSignal } = {}) {
  const Ctor = getCtor()
  if (!Ctor) throw new Error('unsupported')
  const reader = new Ctor()
  await reader.write({ records: [{ recordType: 'url', data: url }] }, { overwrite: true, signal: options.signal })
  if (options.lock) {
    await reader.makeReadOnly({ signal: options.signal })
  }
}

/** Bir sonraki dokundurulan etiketi okur; URL kaydını ve seri numarasını döner. */
export async function readNextTag(signal?: AbortSignal): Promise<{ url: string | null; serialNumber: string }> {
  const Ctor = getCtor()
  if (!Ctor) throw new Error('unsupported')
  const reader = new Ctor()
  await reader.scan({ signal })
  return new Promise((resolve, reject) => {
    reader.onreadingerror = () => reject(new Error('read-error'))
    reader.onreading = (event) => {
      const decoder = new TextDecoder()
      const record = event.message.records.find((item) => item.recordType === 'url' || item.recordType === 'absolute-url')
      resolve({ url: record?.data ? decoder.decode(record.data) : null, serialNumber: event.serialNumber })
    }
    signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
  })
}

export function describeNfcError(error: unknown, lang: 'tr' | 'en') {
  const name = error instanceof DOMException ? error.name : error instanceof Error ? error.message : ''
  const tr: Record<string, string> = {
    NotAllowedError: 'NFC izni verilmedi. Tarayıcı ayarlarından NFC iznini aç.',
    NotSupportedError: 'Bu cihaz NFC yazmayı desteklemiyor ya da NFC kapalı.',
    NotReadableError: 'Etiket okunamadı. Telefonu etikete biraz daha uzun süre tut.',
    NetworkError: 'Etiketle bağlantı koptu. Telefonu sabit tutup tekrar dene.',
    InvalidStateError: 'Etiket kilitli (salt okunur). Kilitli etiketlere yazılamaz.',
    AbortError: 'İşlem iptal edildi.',
    unsupported: 'Bu tarayıcı NFC yazmayı desteklemiyor (Android + Chrome gerekir).',
  }
  const en: Record<string, string> = {
    NotAllowedError: 'NFC permission was denied. Enable NFC permission in browser settings.',
    NotSupportedError: 'This device cannot write NFC or NFC is turned off.',
    NotReadableError: 'Could not read the tag. Hold the phone on the tag a little longer.',
    NetworkError: 'Lost connection to the tag. Hold the phone still and try again.',
    InvalidStateError: 'The tag is locked (read-only) and cannot be written.',
    AbortError: 'Cancelled.',
    unsupported: 'This browser cannot write NFC (Android + Chrome required).',
  }
  const map = lang === 'en' ? en : tr
  return map[name] || (lang === 'en' ? 'NFC write failed. Please try again.' : 'NFC yazma başarısız. Lütfen tekrar dene.')
}
