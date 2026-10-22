import { sql } from '@/lib/db'
import { ensureGrowthSchema } from '@/lib/growthSchema'

// DPP modülünün tabloları. Hediye tarafının tablolarından tamamen ayrıdır (dpp_ öneki);
// ileride ayrı bir veritabanına taşımak gerekirse sadece bu tablolar taşınır.
let dppSchemaPromise: Promise<void> | null = null

export function ensureDppSchema() {
  if (!dppSchemaPromise) {
    dppSchemaPromise = (async () => {
      await ensureGrowthSchema() // rate_limits tablosu için

      await sql`
        CREATE TABLE IF NOT EXISTS dpp_companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(24) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          country VARCHAR(2) NOT NULL DEFAULT 'TR',
          address TEXT NOT NULL DEFAULT '',
          website VARCHAR(300) NOT NULL DEFAULT '',
          email VARCHAR(255) NOT NULL DEFAULT '',
          phone VARCHAR(40) NOT NULL DEFAULT '',
          tax_id VARCHAR(40) NOT NULL DEFAULT '',
          plan VARCHAR(16) NOT NULL DEFAULT 'pilot',
          product_limit INTEGER NOT NULL DEFAULT 10,
          restricted_key VARCHAR(64) NOT NULL,
          admin_note TEXT NOT NULL DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS dpp_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES dpp_companies(id) ON DELETE CASCADE,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(120) NOT NULL DEFAULT '',
          password_hash TEXT NOT NULL,
          role VARCHAR(16) NOT NULL DEFAULT 'editor',
          must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          last_login_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      // Aynı e-posta (büyük/küçük harf fark etmeksizin) ikinci kez kayıt olamaz
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_dpp_users_email_ci ON dpp_users (lower(trim(email)))`
      await sql`
        CREATE TABLE IF NOT EXISTS dpp_sessions (
          token_hash VARCHAR(64) PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES dpp_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS dpp_products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES dpp_companies(id) ON DELETE CASCADE,
          public_id VARCHAR(16) UNIQUE NOT NULL,
          status VARCHAR(12) NOT NULL DEFAULT 'draft',
          default_lang VARCHAR(4) NOT NULL DEFAULT 'tr',
          texts JSONB NOT NULL DEFAULT '{}'::jsonb,
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          image_url TEXT,
          gtin VARCHAR(14),
          version INTEGER NOT NULL DEFAULT 0,
          has_changes BOOLEAN NOT NULL DEFAULT TRUE,
          published JSONB,
          published_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_dpp_products_company ON dpp_products(company_id, updated_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS idx_dpp_products_gtin ON dpp_products(gtin) WHERE gtin IS NOT NULL`
      await sql`
        CREATE TABLE IF NOT EXISTS dpp_versions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL REFERENCES dpp_products(id) ON DELETE CASCADE,
          version INTEGER NOT NULL,
          snapshot JSONB NOT NULL,
          published_by VARCHAR(255) NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          UNIQUE (product_id, version)
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS dpp_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL REFERENCES dpp_products(id) ON DELETE CASCADE,
          public_id VARCHAR(16) UNIQUE NOT NULL,
          serial VARCHAR(40) NOT NULL,
          batch VARCHAR(40) NOT NULL DEFAULT '',
          production_date DATE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          UNIQUE (product_id, serial)
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS dpp_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL REFERENCES dpp_products(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          kind VARCHAR(16) NOT NULL DEFAULT 'other',
          visibility VARCHAR(12) NOT NULL DEFAULT 'public',
          blob_url TEXT NOT NULL,
          content_type VARCHAR(100) NOT NULL DEFAULT '',
          size_bytes INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      // Okutma istatistiği: kişisel veri tutulmaz (IP yok), sadece ülke kodu ve dil.
      await sql`
        CREATE TABLE IF NOT EXISTS dpp_scans (
          id BIGSERIAL PRIMARY KEY,
          product_id UUID NOT NULL REFERENCES dpp_products(id) ON DELETE CASCADE,
          item_id UUID,
          country VARCHAR(2) NOT NULL DEFAULT '',
          lang VARCHAR(4) NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_dpp_scans_product ON dpp_scans(product_id, created_at DESC)`
      // Tedarikçi veri talepleri: tedarikçi tahmin edilemez token'lı linkle (giriş yapmadan) yanıt verir
      await sql`
        CREATE TABLE IF NOT EXISTS dpp_supplier_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES dpp_companies(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES dpp_products(id) ON DELETE CASCADE,
          token VARCHAR(48) UNIQUE NOT NULL,
          supplier_name VARCHAR(200) NOT NULL,
          contact VARCHAR(200) NOT NULL DEFAULT '',
          message TEXT NOT NULL DEFAULT '',
          fields JSONB NOT NULL DEFAULT '[]'::jsonb,
          lang VARCHAR(4) NOT NULL DEFAULT 'tr',
          status VARCHAR(12) NOT NULL DEFAULT 'open',
          response JSONB,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          submitted_at TIMESTAMP WITH TIME ZONE,
          created_by VARCHAR(255) NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS idx_dpp_supplier_requests_product ON dpp_supplier_requests(product_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS idx_dpp_supplier_requests_company ON dpp_supplier_requests(company_id, status)`
    })().catch((err) => {
      dppSchemaPromise = null
      throw err
    })
  }
  return dppSchemaPromise
}
