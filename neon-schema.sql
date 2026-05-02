-- QRNote — NeonDB Schema
-- Neon Dashboard > SQL Editor'da bu dosyayı çalıştır

CREATE TABLE IF NOT EXISTS qr_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(12) UNIQUE NOT NULL,
  is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
  is_claimed  BOOLEAN NOT NULL DEFAULT FALSE,
  admin_token VARCHAR(64),
  recovery_code_hash VARCHAR(64),
  audio_url   TEXT,
  title       VARCHAR(100) NOT NULL DEFAULT '',
  play_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demo_quotas (
  session_id VARCHAR(64) PRIMARY KEY,
  ip_address VARCHAR(64) NOT NULL,
  qr_created_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS recovery_code_hash VARCHAR(64);

ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON qr_codes(slug);
CREATE INDEX IF NOT EXISTS idx_demo_quotas_ip_address ON demo_quotas(ip_address);

-- Test verisi (isteğe bağlı, sonra silebilirsin)
-- INSERT INTO qr_codes (slug) VALUES ('test1234');
