import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

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
