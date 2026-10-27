'use client'

// Altyazı için videonun yalnızca sesini küçük bir dosya olarak hazırlar.
// Altyazı servisi (Whisper) en fazla 25 MB kabul eder; telefon videoları ise 1 GB'ı bulabilir.
// - Sitede çekilen videolar: MediaCapture kayıt sırasında sesi ayrıca kaydeder (setCaptionAudio).
// - Seçilen MP4/MOV videolar: AAC ses izi yeniden kodlanmadan kopyalanıp .m4a yapılır.
//   Dosyanın tamamı belleğe okunmaz; yalnızca başlık (moov) okunur, ses parçaları dilimlerle eklenir.

export const CAPTION_AUDIO_MAX_BYTES = 24 * 1024 * 1024

const sidecars = new WeakMap<File, File>()

export function setCaptionAudio(video: File, audio: File) {
  sidecars.set(video, audio)
}

/** Video altyazı için doğrudan gönderilemeyecek kadar büyükse ses dosyasını döndürür; yoksa null. */
export async function prepareCaptionAudio(video: File): Promise<File | null> {
  if (!video.type.startsWith('video/') || video.size <= CAPTION_AUDIO_MAX_BYTES) return null
  const recorded = sidecars.get(video)
  if (recorded) return recorded.size <= CAPTION_AUDIO_MAX_BYTES ? recorded : null
  const ext = (video.name.split('.').pop() || '').toLowerCase()
  if (!['mp4', 'mov', 'm4v'].includes(ext) && !/mp4|quicktime/.test(video.type)) return null
  try {
    return await extractMp4Audio(video)
  } catch (error) {
    console.warn('[caption audio]', error)
    return null
  }
}

// ── MP4 / MOV okuma ────────────────────────────────────────────

type Box = { type: string; start: number; header: number; end: number }

function typeAt(view: DataView, offset: number) {
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3))
}

function children(view: DataView, start: number, end: number): Box[] {
  const out: Box[] = []
  let pos = start
  while (pos + 8 <= end) {
    let size = view.getUint32(pos)
    const type = typeAt(view, pos + 4)
    let header = 8
    if (size === 1) {
      size = Number(view.getBigUint64(pos + 8))
      header = 16
    } else if (size === 0) {
      size = end - pos
    }
    if (size < header || pos + size > end) break
    out.push({ type, start: pos, header, end: pos + size })
    pos += size
  }
  return out
}

function find(view: DataView, box: Box, type: string) {
  return children(view, box.start + box.header, box.end).find((b) => b.type === type) || null
}

/** Dosyanın en üst düzeyindeki moov kutusunu bulup okur (moov sonda da olabilir). */
async function readMoov(file: File): Promise<DataView | null> {
  let pos = 0
  while (pos + 8 <= file.size) {
    const head = new DataView(await file.slice(pos, pos + 16).arrayBuffer())
    let size = head.getUint32(0)
    const type = typeAt(head, 4)
    if (size === 1) size = Number(head.getBigUint64(8))
    else if (size === 0) size = file.size - pos
    if (size < 8) return null
    if (type === 'moov') {
      if (size > 64 * 1024 * 1024) return null
      return new DataView(await file.slice(pos, pos + size).arrayBuffer())
    }
    pos += size
  }
  return null
}

function raw(view: DataView, box: Box) {
  return new Uint8Array(view.buffer, view.byteOffset + box.start, box.end - box.start)
}

// ── MP4 yazma ──────────────────────────────────────────────────

function u32(...values: number[]) {
  const out = new Uint8Array(values.length * 4)
  const view = new DataView(out.buffer)
  values.forEach((v, i) => view.setUint32(i * 4, v >>> 0))
  return out
}

function box(type: string, ...parts: Uint8Array[]) {
  const size = 8 + parts.reduce((sum, p) => sum + p.length, 0)
  const out = new Uint8Array(size)
  const view = new DataView(out.buffer)
  view.setUint32(0, size)
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i)
  let pos = 8
  for (const p of parts) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}

const MATRIX = u32(0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000)

export async function extractMp4Audio(file: File): Promise<File | null> {
  const moovView = await readMoov(file)
  if (!moovView) return null
  const moov: Box = { type: 'moov', start: 0, header: 8, end: moovView.byteLength }
  if (moovView.getUint32(0) === 1) moov.header = 16

  for (const trak of children(moovView, moov.header, moov.end).filter((b) => b.type === 'trak')) {
    const mdia = find(moovView, trak, 'mdia')
    const hdlr = mdia && find(moovView, mdia, 'hdlr')
    if (!mdia || !hdlr || typeAt(moovView, hdlr.start + hdlr.header + 8) !== 'soun') continue
    const mdhd = find(moovView, mdia, 'mdhd')
    const minf = find(moovView, mdia, 'minf')
    const stbl = minf && find(moovView, minf, 'stbl')
    if (!mdhd || !stbl) continue
    const stsd = find(moovView, stbl, 'stsd')
    const stts = find(moovView, stbl, 'stts')
    const stsz = find(moovView, stbl, 'stsz')
    const stsc = find(moovView, stbl, 'stsc')
    const stco = find(moovView, stbl, 'stco') || find(moovView, stbl, 'co64')
    if (!stsd || !stts || !stsz || !stsc || !stco) continue
    // Yalnızca AAC (mp4a): Whisper .m4a içindeki AAC'yi okur
    if (typeAt(moovView, stsd.start + stsd.header + 12) !== 'mp4a') continue

    // Örnek boyutları
    let p = stsz.start + stsz.header + 4
    const fixedSize = moovView.getUint32(p)
    const sampleCount = moovView.getUint32(p + 4)
    p += 8
    if (sampleCount === 0) continue // parçalı (fragmented) MP4
    const sizes = new Array<number>(sampleCount)
    for (let i = 0; i < sampleCount; i += 1) sizes[i] = fixedSize || moovView.getUint32(p + i * 4)

    // Parça (chunk) başlangıçları
    p = stco.start + stco.header + 4
    const chunkCount = moovView.getUint32(p)
    p += 4
    const chunkOffsets = new Array<number>(chunkCount)
    for (let i = 0; i < chunkCount; i += 1) {
      chunkOffsets[i] = stco.type === 'co64' ? Number(moovView.getBigUint64(p + i * 8)) : moovView.getUint32(p + i * 4)
    }

    // Parça başına örnek sayısı
    p = stsc.start + stsc.header + 4
    const runCount = moovView.getUint32(p)
    p += 4
    const runs: Array<{ first: number; perChunk: number }> = []
    for (let i = 0; i < runCount; i += 1) runs.push({ first: moovView.getUint32(p + i * 12), perChunk: moovView.getUint32(p + i * 12 + 4) })
    if (runs.length === 0) continue

    // Ses verisi: her parçadaki örnekler ardışıktır → dosyadan dilim olarak alınır (belleğe okunmaz)
    const parts: Blob[] = []
    let total = 0
    let sample = 0
    let run = 0
    for (let c = 0; c < chunkCount && sample < sampleCount; c += 1) {
      while (run + 1 < runs.length && runs[run + 1].first <= c + 1) run += 1
      let bytes = 0
      for (let k = 0; k < runs[run].perChunk && sample < sampleCount; k += 1, sample += 1) bytes += sizes[sample]
      if (chunkOffsets[c] + bytes > file.size) return null
      parts.push(file.slice(chunkOffsets[c], chunkOffsets[c] + bytes))
      total += bytes
    }
    if (sample !== sampleCount || total > CAPTION_AUDIO_MAX_BYTES) return null

    // Süre ve zaman ölçeği (mdhd v0/v1)
    const v = moovView.getUint8(mdhd.start + mdhd.header)
    const base = mdhd.start + mdhd.header + 4
    const timescale = moovView.getUint32(base + (v === 1 ? 16 : 8))
    const duration = v === 1 ? Number(moovView.getBigUint64(base + 20)) : moovView.getUint32(base + 12)
    const dur32 = Math.min(duration, 0xffffffff)

    const ftyp = box('ftyp', new TextEncoder().encode('M4A '), u32(0), new TextEncoder().encode('M4A mp42isom'))
    const mvhd = box('mvhd', u32(0, 0, 0, timescale, dur32, 0x00010000), new Uint8Array([0x01, 0, 0, 0]), u32(0, 0), MATRIX, u32(0, 0, 0, 0, 0, 0, 2))
    const tkhd = box('tkhd', u32(0x00000007, 0, 0, 1, 0, dur32, 0, 0), new Uint8Array([0, 0, 0, 0, 0x01, 0, 0, 0]), MATRIX, u32(0, 0))
    const smhd = box('smhd', u32(0, 0))
    const dinf = box('dinf', box('dref', u32(0, 1), box('url ', u32(1))))
    const stscOut = box('stsc', u32(0, 1, 1, sampleCount, 1))
    const build = (mdatOffset: number) =>
      box(
        'moov',
        mvhd,
        box(
          'trak',
          tkhd,
          box('mdia', raw(moovView, mdhd), raw(moovView, hdlr), box('minf', smhd, dinf, box('stbl', raw(moovView, stsd), raw(moovView, stts), stscOut, raw(moovView, stsz), box('stco', u32(0, 1, mdatOffset)))))
        )
      )
    const moovSize = build(0).length
    const moovOut = build(ftyp.length + moovSize + 8)
    const mdatHeader = u32(total + 8)
    const mdat = new Uint8Array(8)
    mdat.set(mdatHeader, 0)
    mdat.set(new TextEncoder().encode('mdat'), 4)

    const base_name = file.name.replace(/\.[^.]+$/, '') || 'video'
    return new File([ftyp, moovOut, mdat, ...parts], `${base_name}-ses.m4a`, { type: 'audio/mp4' })
  }
  return null
}
