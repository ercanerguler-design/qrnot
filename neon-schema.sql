-- QRNote — NeonDB Schema
-- Neon Dashboard > SQL Editor'da bu dosyayı çalıştır

CREATE TABLE IF NOT EXISTS qr_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(12) UNIQUE NOT NULL,
  is_claimed  BOOLEAN NOT NULL DEFAULT FALSE,
  admin_token VARCHAR(64),
  audio_url   TEXT,
  title       VARCHAR(100) NOT NULL DEFAULT '',
  play_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON qr_codes(slug);

-- Test verisi (isteğe bağlı, sonra silebilirsin)
-- INSERT INTO qr_codes (slug) VALUES ('test1234');
