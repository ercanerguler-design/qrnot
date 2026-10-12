import { del, get, put } from '@vercel/blob'

function getBlobToken() {
  const token = String(process.env.BLOB_READ_WRITE_TOKEN || '').trim()

  if (!token) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN')
  }

  return token
}

export function putBlob(pathname: string, body: Blob | File | Buffer | string) {
  return put(pathname, body, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: getBlobToken(),
  })
}

export function deleteBlob(url: string) {
  return del(url, {
    token: getBlobToken(),
  })
}

export function getBlob(urlOrPathname: string, useCache = false) {
  return get(urlOrPathname, {
    access: 'private',
    useCache,
    token: getBlobToken(),
  })
}

/**
 * Private blob'u tarayıcıya akıtır. Range isteklerini iletir (iOS Safari video oynatımı
 * ve ileri sarma için gerekli). Range yoksa tam dosya döner.
 */
export async function streamPrivateBlob(blobUrl: string, rangeHeader: string | null) {
  const result = await get(blobUrl, {
    access: 'private',
    useCache: false,
    token: getBlobToken(),
    headers: rangeHeader ? { range: rangeHeader } : undefined,
  })

  if (!result || !result.stream) return null

  const headers = new Headers()
  for (const key of ['content-type', 'content-length', 'content-range', 'etag', 'last-modified']) {
    const value = result.headers.get(key)
    if (value) headers.set(key, value)
  }
  headers.set('accept-ranges', 'bytes')
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')

  const status = result.headers.get('content-range') ? 206 : 200
  return new Response(result.stream as BodyInit, { status, headers })
}
