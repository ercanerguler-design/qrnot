-- QRNote Supabase Schema
-- Supabase SQL Editor'da çalıştır

-- Tablo
CREATE TABLE IF NOT EXISTS qr_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  admin_token TEXT NOT NULL,
  audio_url TEXT,
  title TEXT DEFAULT 'Sesli Not',
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE qr_notes ENABLE ROW LEVEL SECURITY;

-- Herkese okuma izni (public play sayfası için)
CREATE POLICY "Public read" ON qr_notes
  FOR SELECT USING (true);

-- Service role tam erişim (API routes için)
CREATE POLICY "Service role full access" ON qr_notes
  FOR ALL USING (auth.role() = 'service_role');

-- Storage bucket (ses dosyaları için)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: herkese okuma
CREATE POLICY "Public audio read" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio');

-- Storage policy: yükleme (service role)
CREATE POLICY "Service audio upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'audio');

-- Storage policy: güncelleme (service role)
CREATE POLICY "Service audio update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'audio');

-- Storage policy: silme (service role)
CREATE POLICY "Service audio delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'audio');

-- play_count otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION increment_play_count(note_slug TEXT)
RETURNS VOID AS $$
  UPDATE qr_notes SET play_count = play_count + 1 WHERE slug = note_slug;
$$ LANGUAGE SQL;
