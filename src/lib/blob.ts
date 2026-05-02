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