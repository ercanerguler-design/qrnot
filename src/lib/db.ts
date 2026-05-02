import { neon } from '@neondatabase/serverless'

let sqlClient: ReturnType<typeof neon> | null = null
let qrSchemaPromise: Promise<void> | null = null

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

export function ensureQrSchema() {
  if (!qrSchemaPromise) {
    const client = getSqlClient()

    qrSchemaPromise = (async () => {
      await client`CREATE EXTENSION IF NOT EXISTS pgcrypto`
      await client`
        CREATE TABLE IF NOT EXISTS qr_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slug VARCHAR(12) UNIQUE NOT NULL,
          is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
          admin_token VARCHAR(64),
          recovery_code_hash VARCHAR(64),
          audio_url TEXT,
          title VARCHAR(100) NOT NULL DEFAULT '',
          play_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS demo_quotas (
          session_id VARCHAR(64) PRIMARY KEY,
          ip_address VARCHAR(64) NOT NULL,
          qr_created_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS recovery_code_hash VARCHAR(64)`
      await client`CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON qr_codes(slug)`
      await client`CREATE INDEX IF NOT EXISTS idx_demo_quotas_ip_address ON demo_quotas(ip_address)`
    })().catch((error) => {
      qrSchemaPromise = null
      throw error
    })
  }

  return qrSchemaPromise
}

export interface QRCode {
  id: string
  slug: string
  is_claimed: boolean
  admin_token: string | null
  recovery_code_hash?: string | null
  audio_url: string | null
  title: string
  play_count: number
  created_at: string
  updated_at: string
}
