import { ensureQrSchema, sql } from '@/lib/db'

// Mağaza, Etsy, anı defteri ve NFC için EK şema.
// Sadece yeni tablo / varsayılan değerli yeni kolon ekler; mevcut kayıtlara dokunmaz.
let growthSchemaPromise: Promise<void> | null = null

export function ensureGrowthSchema() {
  if (!growthSchemaPromise) {
    growthSchemaPromise = (async () => {
      await ensureQrSchema()

      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS qr_mode VARCHAR(16) NOT NULL DEFAULT 'standard'`
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS guestbook_settings JSONB`
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS nfc_scan_count INTEGER NOT NULL DEFAULT 0`
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS nfc_encoded_at TIMESTAMP WITH TIME ZONE`
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS nfc_locked BOOLEAN NOT NULL DEFAULT FALSE`
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS source_channel VARCHAR(24)`
      // Boş QR'ı (ürün, Etsy, anı defteri) sahiplenen üye. creator_user_id'den ayrı: sahiplenilen QR hesaptan silinemez.
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS owner_user_id UUID`
      await sql`CREATE INDEX IF NOT EXISTS idx_qr_codes_owner_user_id ON qr_codes(owner_user_id)`

      await sql`
        CREATE TABLE IF NOT EXISTS shop_orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_no VARCHAR(24) UNIQUE NOT NULL,
          access_key VARCHAR(48) NOT NULL,
          status VARCHAR(24) NOT NULL DEFAULT 'pending',
          provider VARCHAR(16) NOT NULL,
          provider_ref TEXT,
          currency VARCHAR(4) NOT NULL,
          subtotal INTEGER NOT NULL,
          shipping INTEGER NOT NULL DEFAULT 0,
          total INTEGER NOT NULL,
          lang VARCHAR(4) NOT NULL DEFAULT 'tr',
          user_id UUID,
          email VARCHAR(255) NOT NULL,
          full_name VARCHAR(160) NOT NULL,
          phone VARCHAR(40) NOT NULL DEFAULT '',
          address JSONB,
          items JSONB NOT NULL,
          consents JSONB,
          fulfillment JSONB,
          customer_note TEXT NOT NULL DEFAULT '',
          admin_note TEXT NOT NULL DEFAULT '',
          tracking_no VARCHAR(80) NOT NULL DEFAULT '',
          client_ip VARCHAR(64) NOT NULL DEFAULT '',
          paid_at TIMESTAMP WITH TIME ZONE,
          fulfilled_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status)`
      await sql`CREATE INDEX IF NOT EXISTS idx_shop_orders_email ON shop_orders(email)`
      await sql`CREATE INDEX IF NOT EXISTS idx_shop_orders_created ON shop_orders(created_at DESC)`

      await sql`
        CREATE TABLE IF NOT EXISTS etsy_activations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_number VARCHAR(24) NOT NULL,
          email VARCHAR(255) NOT NULL,
          qr_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
          product VARCHAR(24) NOT NULL DEFAULT 'standard',
          status VARCHAR(16) NOT NULL DEFAULT 'pending',
          client_ip VARCHAR(64) NOT NULL DEFAULT '',
          admin_note TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_etsy_activations_order ON etsy_activations(order_number)`
      await sql`CREATE INDEX IF NOT EXISTS idx_etsy_activations_status ON etsy_activations(status)`

      // Admin'in Etsy'den içe aktardığı gerçek siparişler. Aktivasyon sadece bu listedeki siparişlere açılır.
      await sql`
        CREATE TABLE IF NOT EXISTS etsy_orders (
          order_number VARCHAR(24) PRIMARY KEY,
          quantity INTEGER NOT NULL DEFAULT 1,
          buyer_name VARCHAR(160) NOT NULL DEFAULT '',
          sale_date VARCHAR(32) NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS guestbook_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          qr_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
          author_name VARCHAR(80) NOT NULL,
          message TEXT NOT NULL DEFAULT '',
          media_type VARCHAR(16),
          blob_url TEXT,
          status VARCHAR(16) NOT NULL DEFAULT 'pending',
          ip_hash VARCHAR(64) NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_guestbook_entries_qr ON guestbook_entries(qr_id, created_at DESC)`
      // Aynı misafirin (cihazın) aynı anı defterine tekrar yazmasını engellemek için
      await sql`ALTER TABLE guestbook_entries ADD COLUMN IF NOT EXISTS device_hash VARCHAR(64) NOT NULL DEFAULT ''`

      // --- Ek özellikler: zaman kapsülü, kayıp modu, grup hediyesi, cevaplar, bildirimler, altyazı, premium ---
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMP WITH TIME ZONE`
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS lost_mode BOOLEAN NOT NULL DEFAULT FALSE`
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS notify_scans BOOLEAN NOT NULL DEFAULT TRUE`
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS replies_enabled BOOLEAN NOT NULL DEFAULT TRUE`
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS group_token VARCHAR(40)`
      await sql`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS last_scan_event_at TIMESTAMP WITH TIME ZONE`
      // guestbook_entries tablosu grup mesajları ve cevaplar için de kullanılır: kind = guestbook | group | reply
      await sql`ALTER TABLE guestbook_entries ADD COLUMN IF NOT EXISTS kind VARCHAR(12) NOT NULL DEFAULT 'guestbook'`
      await sql`ALTER TABLE qr_media ADD COLUMN IF NOT EXISTS transcript TEXT`
      await sql`ALTER TABLE qr_media ADD COLUMN IF NOT EXISTS transcript_lang VARCHAR(12)`
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE`
      await sql`
        CREATE TABLE IF NOT EXISTS media_translations (
          media_id UUID NOT NULL,
          lang VARCHAR(12) NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          PRIMARY KEY (media_id, lang)
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS qr_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          qr_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
          kind VARCHAR(16) NOT NULL,
          data JSONB,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_qr_events_qr ON qr_events(qr_id, created_at DESC)`
      await sql`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          endpoint TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          keys JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id)`

      // Aynı e-posta ile ikinci hesap açılamaz: büyük/küçük harf ve baştaki/sondaki boşluk fark etmeksizin, veritabanı düzeyinde.
      // (Aynı anda gelen iki kayıt isteğinde de ikincisi reddedilir.) Tablo yoksa ya da eski veride tekrar varsa atlanır, uygulama denetimi sürer.
      const emailIndexes: Array<[string, () => Promise<unknown>]> = [
        ['users', () => sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_ci ON users (lower(trim(email)))`],
        ['hotel_users', () => sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_hotel_users_email_ci ON hotel_users (lower(trim(email)))`],
        ['education_users', () => sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_education_users_email_ci ON education_users (lower(trim(email)))`],
        ['health_users', () => sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_health_users_email_ci ON health_users (lower(trim(email)))`],
        ['factory_users', () => sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_factory_users_email_ci ON factory_users (lower(trim(email)))`],
        ['retail_users', () => sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_retail_users_email_ci ON retail_users (lower(trim(email)))`],
        ['logistics_users', () => sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_logistics_users_email_ci ON logistics_users (lower(trim(email)))`],
      ]
      for (const [table, create] of emailIndexes) {
        try {
          await create()
        } catch (err) {
          console.error(`[schema] ${table} e-posta tekillik indeksi oluşturulamadı`, err instanceof Error ? err.message : err)
        }
      }

      // Gelir tablosu: genel ayarlar (ör. sayım başlangıç tarihi) ve elle girilen satışlar (Etsy, pazaryeri, kurumsal)
      await sql`
        CREATE TABLE IF NOT EXISTS app_settings (
          key VARCHAR(64) PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS manual_sales (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sale_date DATE NOT NULL,
          channel VARCHAR(24) NOT NULL,
          kind VARCHAR(8) NOT NULL DEFAULT 'sale',
          amount INTEGER NOT NULL,
          currency VARCHAR(4) NOT NULL DEFAULT 'TRY',
          quantity INTEGER NOT NULL DEFAULT 1,
          note TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_manual_sales_date ON manual_sales(sale_date)`

      await sql`
        CREATE TABLE IF NOT EXISTS rate_limits (
          bucket VARCHAR(160) PRIMARY KEY,
          hits INTEGER NOT NULL DEFAULT 0,
          window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
    })().catch((error) => {
      growthSchemaPromise = null
      throw error
    })
  }

  return growthSchemaPromise
}

/** Basit sabit pencereli hız sınırı. true dönerse istek kabul edilir. */
export async function consumeRateLimit(bucket: string, limit: number, windowSeconds: number) {
  await ensureGrowthSchema()
  const rows = (await sql`
    INSERT INTO rate_limits (bucket, hits, window_start)
    VALUES (${bucket}, 1, NOW())
    ON CONFLICT (bucket) DO UPDATE
      SET hits = CASE
            WHEN rate_limits.window_start < NOW() - make_interval(secs => ${windowSeconds}) THEN 1
            ELSE rate_limits.hits + 1
          END,
          window_start = CASE
            WHEN rate_limits.window_start < NOW() - make_interval(secs => ${windowSeconds}) THEN NOW()
            ELSE rate_limits.window_start
          END
    RETURNING hits
  `) as Array<{ hits: number }>

  return Number(rows[0]?.hits || 0) <= limit
}

export function clientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for') || ''
  return (forwarded.split(',')[0] || headers.get('x-real-ip') || '').trim().slice(0, 64) || 'unknown'
}
