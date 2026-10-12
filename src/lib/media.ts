import { parseBuffer } from 'music-metadata'

const DEFAULT_MAX_VIDEO_SECONDS = 120
const DEFAULT_MAX_VIDEO_SECONDS_CORPORATE = 600
const DEFAULT_MAX_VIDEO_FILE_SIZE_MB = 80
const DEFAULT_MAX_VIDEO_FILE_SIZE_MB_CORPORATE = 250
const DEFAULT_MAX_IMAGE_FILE_SIZE_MB = 15

function parsePositiveInteger(raw: string | undefined, fallback: number) {
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }

  return Math.floor(value)
}

export function getMaxVideoSeconds(orderType?: string | null, overrideSeconds?: number | null) {
  if (typeof overrideSeconds === 'number' && Number.isFinite(overrideSeconds) && overrideSeconds > 0) {
    return Math.floor(overrideSeconds)
  }

  const isCorporate = orderType === 'corporate'
  const fallback = isCorporate ? DEFAULT_MAX_VIDEO_SECONDS_CORPORATE : DEFAULT_MAX_VIDEO_SECONDS
  const envKey = isCorporate ? process.env.MAX_VIDEO_SECONDS_CORPORATE : process.env.MAX_VIDEO_SECONDS

  return parsePositiveInteger(envKey || process.env.NEXT_PUBLIC_MAX_VIDEO_SECONDS, fallback)
}

export function getMaxVideoFileSizeBytes(orderType?: string | null) {
  const isCorporate = orderType === 'corporate'
  const fallbackMb = isCorporate ? DEFAULT_MAX_VIDEO_FILE_SIZE_MB_CORPORATE : DEFAULT_MAX_VIDEO_FILE_SIZE_MB
  const envKey = isCorporate ? process.env.MAX_VIDEO_FILE_SIZE_MB_CORPORATE : process.env.MAX_VIDEO_FILE_SIZE_MB
  const mb = parsePositiveInteger(envKey, fallbackMb)
  return mb * 1024 * 1024
}

export function getMaxImageFileSizeBytes() {
  const mb = parsePositiveInteger(process.env.MAX_IMAGE_FILE_SIZE_MB, DEFAULT_MAX_IMAGE_FILE_SIZE_MB)
  return mb * 1024 * 1024
}

export type UploadedMediaType = 'audio' | 'video' | 'image'

export function detectUploadedMediaType(file: File): UploadedMediaType | null {
  const mime = (file.type || '').toLowerCase()
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'image'

  const lowerName = (file.name || '').toLowerCase()
  const audioExts = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm']
  const videoExts = ['.mp4', '.mov', '.m4v', '.webm', '.mkv']
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']

  if (audioExts.some((ext) => lowerName.endsWith(ext))) return 'audio'
  if (videoExts.some((ext) => lowerName.endsWith(ext))) return 'video'
  if (imageExts.some((ext) => lowerName.endsWith(ext))) return 'image'

  return null
}

export function validateImageFile(file: File) {
  if (!file || file.size === 0) {
    return 'Resim dosyasi gerekli'
  }

  const mime = (file.type || '').toLowerCase()
  if (mime && !mime.startsWith('image/')) {
    return 'Lutfen gecerli bir resim dosyasi sec'
  }

  const maxSize = getMaxImageFileSizeBytes()
  if (file.size > maxSize) {
    return `Resim dosyasi ${(maxSize / 1024 / 1024).toFixed(0)}MB'dan buyuk olamaz`
  }

  return null
}

export async function validateVideoFile(file: File, orderType?: string | null, overrideSeconds?: number | null) {
  if (!file || file.size === 0) {
    return 'Video dosyasi gerekli'
  }

  const maxSize = getMaxVideoFileSizeBytes(orderType)
  if (file.size > maxSize) {
    return `Video dosyasi ${(maxSize / 1024 / 1024).toFixed(0)}MB'dan buyuk olamaz`
  }

  const maxSeconds = getMaxVideoSeconds(orderType, overrideSeconds)

  try {
    const arrayBuffer = await file.arrayBuffer()
    const metadata = await parseBuffer(new Uint8Array(arrayBuffer), {
      mimeType: file.type || undefined,
      path: file.name || undefined,
    })

    const duration = metadata.format.duration
    if (typeof duration === 'number' && duration > maxSeconds + 0.25) {
      const minutes = Math.floor(maxSeconds / 60)
      const seconds = maxSeconds % 60
      const maxText = minutes > 0 ? `${minutes} dk ${seconds} sn` : `${seconds} saniye`
      return `Video kaydi en fazla ${maxText} olabilir`
    }
  } catch (error) {
    console.warn('[video validation]', error)
  }

  return null
}

function isHttpUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function hostOf(url: string) {
  return new URL(url).hostname.toLowerCase()
}

export function normalizeOptionalUrl(raw: string | null) {
  const value = (raw || '').trim()
  return value.length > 0 ? value : null
}

export function validateYouTubeUrl(url: string | null) {
  if (!url) return null
  if (!isHttpUrl(url)) return 'YouTube baglantisi gecerli bir URL olmali'

  const host = hostOf(url)
  const allowedHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']
  if (!allowedHosts.includes(host)) {
    return 'Sadece YouTube baglantisi girebilirsin'
  }

  return null
}

export function validateSpotifyUrl(url: string | null) {
  if (!url) return null
  if (!isHttpUrl(url)) return 'Spotify baglantisi gecerli bir URL olmali'

  const host = hostOf(url)
  const allowedHosts = ['open.spotify.com']
  if (!allowedHosts.includes(host)) {
    return 'Sadece Spotify baglantisi girebilirsin'
  }

  return null
}

export function validateExternalUrl(url: string | null) {
  if (!url) return null
  if (!isHttpUrl(url)) return 'Baglanti gecerli bir URL olmali'
  return null
}

export function youtubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (host.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/')[2]
        return id ? `https://www.youtube.com/embed/${id}` : null
      }

      const id = parsed.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
  } catch {
    return null
  }

  return null
}

export function spotifyEmbedUrl(url: string) {
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null

    const [type, id] = parts
    const allowedTypes = new Set(['playlist', 'track', 'album', 'episode', 'show'])
    if (!allowedTypes.has(type) || !id) return null

    return `https://open.spotify.com/embed/${type}/${id}`
  } catch {
    return null
  }
}
