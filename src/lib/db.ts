import { neon } from '@neondatabase/serverless'

let sqlClient: ReturnType<typeof neon> | null = null

function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured.')
  }

  if (!sqlClient) {
    sqlClient = neon(databaseUrl)
  }

  return sqlClient
}

export const sql = (strings: TemplateStringsArray, ...params: unknown[]) =>
  getSqlClient()(strings, ...params) as Promise<Record<string, any>[]>

export interface QRCode {
  id: string
  slug: string
  is_claimed: boolean
  admin_token: string | null
  audio_url: string | null
  title: string
  play_count: number
  created_at: string
  updated_at: string
}
