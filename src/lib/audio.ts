import { parseBuffer } from 'music-metadata'

import { getMaxAudioSeconds } from '@/lib/media'

export { getMaxAudioSeconds }
// 10 dk sıkıştırılmamış WAV ≈ 100 MB
export const MAX_AUDIO_FILE_SIZE_BYTES = 120 * 1024 * 1024

export function formatAudioDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0 && remainingSeconds === 0) {
    return `${minutes} dakika`
  }

  if (minutes > 0) {
    return `${minutes} dk ${remainingSeconds} sn`
  }

  return `${remainingSeconds} saniye`
}

export async function validateAudioFile(file: File, orderType?: string | null) {
  if (!file || file.size === 0) {
    return 'Ses dosyası gerekli'
  }

  if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    return 'Ses dosyası 120MB\'dan büyük olamaz'
  }

  const maxAudioSeconds = getMaxAudioSeconds(orderType)

  try {
    const arrayBuffer = await file.arrayBuffer()
    const metadata = await parseBuffer(new Uint8Array(arrayBuffer), {
      mimeType: file.type || undefined,
      path: file.name || undefined,
    })

    const duration = metadata.format.duration
    if (typeof duration === 'number' && duration > maxAudioSeconds + 0.25) {
      return `Ses kaydı en fazla ${formatAudioDuration(maxAudioSeconds)} olabilir`
    }
  } catch (error) {
    console.warn('[audio validation]', error)
  }

  return null
}