-- QRNote — NeonDB Schema
-- Neon Dashboard > SQL Editor'da bu dosyayı çalıştır

CREATE TABLE IF NOT EXISTS qr_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(12) UNIQUE NOT NULL,
  is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
  order_type  VARCHAR(16) NOT NULL DEFAULT 'individual',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  is_claimed  BOOLEAN NOT NULL DEFAULT FALSE,
  admin_token VARCHAR(64),
  recovery_code_hash VARCHAR(64),
  audio_url   TEXT,
  recording_count INTEGER NOT NULL DEFAULT 0,
  recording_limit INTEGER NOT NULL DEFAULT 3,
  video_recording_count INTEGER NOT NULL DEFAULT 0,
  video_recording_limit INTEGER NOT NULL DEFAULT 2,
  title       VARCHAR(100) NOT NULL DEFAULT '',
  play_count  INTEGER NOT NULL DEFAULT 0,
  demo_expires_at TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qr_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  media_type VARCHAR(16) NOT NULL,
  source_type VARCHAR(16) NOT NULL,
  blob_url TEXT,
  external_url TEXT,
  title VARCHAR(120) NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
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

ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS order_type VARCHAR(16) NOT NULL DEFAULT 'individual';

ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS recording_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS recording_limit INTEGER NOT NULL DEFAULT 3;

ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS video_recording_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS video_recording_limit INTEGER NOT NULL DEFAULT 2;

UPDATE qr_codes
SET order_type = 'demo'
WHERE is_demo = TRUE AND order_type <> 'demo';

CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON qr_codes(slug);
CREATE INDEX IF NOT EXISTS idx_demo_quotas_ip_address ON demo_quotas(ip_address);
CREATE INDEX IF NOT EXISTS idx_qr_media_qr_id ON qr_media(qr_id);
CREATE INDEX IF NOT EXISTS idx_qr_media_type ON qr_media(media_type);

CREATE TABLE IF NOT EXISTS hotel_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(24) UNIQUE NOT NULL,
  name VARCHAR(140) NOT NULL,
  city VARCHAR(80) NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotel_qr_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotel_tenants(id) ON DELETE CASCADE,
  slug VARCHAR(20) UNIQUE NOT NULL,
  module_type VARCHAR(24) NOT NULL DEFAULT 'world_clock',
  title VARCHAR(160) NOT NULL DEFAULT '',
  config_json TEXT NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_tenants_code ON hotel_tenants(code);
CREATE INDEX IF NOT EXISTS idx_hotel_qr_modules_hotel_id ON hotel_qr_modules(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_qr_modules_slug ON hotel_qr_modules(slug);

CREATE TABLE IF NOT EXISTS hotel_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotel_tenants(id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(24) NOT NULL DEFAULT 'hotel_admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotel_sessions (
  token_hash VARCHAR(64) PRIMARY KEY,
  hotel_user_id UUID NOT NULL REFERENCES hotel_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_users_email ON hotel_users(email);
CREATE INDEX IF NOT EXISTS idx_hotel_users_hotel_id ON hotel_users(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_sessions_user_id ON hotel_sessions(hotel_user_id);

INSERT INTO qr_media (qr_id, media_type, source_type, blob_url, title, sort_order, is_primary)
SELECT q.id, 'audio', 'blob', q.audio_url, q.title, 0, TRUE
FROM qr_codes q
WHERE q.audio_url IS NOT NULL
  AND q.audio_url <> ''
  AND NOT EXISTS (
    SELECT 1 FROM qr_media m WHERE m.qr_id = q.id
  );

-- Test verisi (isteğe bağlı, sonra silebilirsin)
-- INSERT INTO qr_codes (slug) VALUES ('test1234');
