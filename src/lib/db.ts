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
  getSqlClient()(strings, ...params) as Promise<Record<string, unknown>[]>

export function ensureQrSchema() {
  if (!qrSchemaPromise) {
    const client = getSqlClient()

    qrSchemaPromise = (async () => {
      await client`CREATE EXTENSION IF NOT EXISTS pgcrypto`
      await client`
        CREATE TABLE IF NOT EXISTS qr_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slug VARCHAR(12) UNIQUE NOT NULL,
          is_demo BOOLEAN NOT NULL DEFAULT FALSE,
          order_type VARCHAR(16) NOT NULL DEFAULT 'individual',
          creator_user_id UUID,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
          admin_token VARCHAR(64),
          recovery_code_hash VARCHAR(64),
          audio_url TEXT,
          recording_count INTEGER NOT NULL DEFAULT 0,
          recording_limit INTEGER NOT NULL DEFAULT 3,
          video_recording_count INTEGER NOT NULL DEFAULT 0,
          video_recording_limit INTEGER NOT NULL DEFAULT 2,
          title VARCHAR(100) NOT NULL DEFAULT '',
          play_count INTEGER NOT NULL DEFAULT 0,
          demo_expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE`
      await client`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS order_type VARCHAR(16) NOT NULL DEFAULT 'individual'`
      await client`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS creator_user_id UUID`
      await client`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`
      await client`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMP WITH TIME ZONE`
      await client`UPDATE qr_codes SET order_type = 'demo' WHERE is_demo = TRUE AND order_type <> 'demo'`
      await client`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          account_type VARCHAR(16) NOT NULL DEFAULT 'individual',
          free_slots INTEGER NOT NULL DEFAULT 1,
          paid_slots INTEGER NOT NULL DEFAULT 0,
          used_slots INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(16) NOT NULL DEFAULT 'individual'`
      await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS free_slots INTEGER NOT NULL DEFAULT 1`
      await client`ALTER TABLE users ALTER COLUMN free_slots SET DEFAULT 1`
      await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS paid_slots INTEGER NOT NULL DEFAULT 0`
      await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS used_slots INTEGER NOT NULL DEFAULT 0`
      await client`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS recording_count INTEGER NOT NULL DEFAULT 0`
      await client`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS recording_limit INTEGER NOT NULL DEFAULT 3`
      await client`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS video_recording_count INTEGER NOT NULL DEFAULT 0`
      await client`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS video_recording_limit INTEGER NOT NULL DEFAULT 2`
      await client`ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS video_max_seconds INTEGER`
      await client`
        CREATE TABLE IF NOT EXISTS user_sessions (
          token_hash VARCHAR(64) PRIMARY KEY,
          user_id UUID NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          token_hash VARCHAR(64) PRIMARY KEY,
          user_id UUID NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS panel_password_reset_tokens (
          token_hash VARCHAR(64) PRIMARY KEY,
          realm VARCHAR(24) NOT NULL,
          user_id UUID NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
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
      await client`
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
        )
      `
      await client`CREATE INDEX IF NOT EXISTS idx_qr_media_qr_id ON qr_media(qr_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_qr_media_type ON qr_media(media_type)`
      await client`
        INSERT INTO qr_media (qr_id, media_type, source_type, blob_url, title, sort_order, is_primary)
        SELECT q.id, 'audio', 'blob', q.audio_url, q.title, 0, TRUE
        FROM qr_codes q
        WHERE q.audio_url IS NOT NULL
          AND q.audio_url <> ''
          AND NOT EXISTS (
            SELECT 1 FROM qr_media m WHERE m.qr_id = q.id
          )
      `
      await client`CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON qr_codes(slug)`
      await client`CREATE INDEX IF NOT EXISTS idx_qr_codes_creator_user_id ON qr_codes(creator_user_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
      await client`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_panel_password_reset_tokens_realm ON panel_password_reset_tokens(realm)`
      await client`CREATE INDEX IF NOT EXISTS idx_panel_password_reset_tokens_user_id ON panel_password_reset_tokens(user_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_demo_quotas_ip_address ON demo_quotas(ip_address)`
      await client`
        CREATE TABLE IF NOT EXISTS hotel_tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(24) UNIQUE NOT NULL,
          name VARCHAR(140) NOT NULL,
          city VARCHAR(80) NOT NULL DEFAULT '',
          tenant_kind VARCHAR(16) NOT NULL DEFAULT 'hotel',
          whatsapp_number VARCHAR(24) NOT NULL DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`ALTER TABLE hotel_tenants ADD COLUMN IF NOT EXISTS tenant_kind VARCHAR(16) NOT NULL DEFAULT 'hotel'`
      await client`ALTER TABLE hotel_tenants ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(24) NOT NULL DEFAULT ''`
      await client`
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
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS hotel_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          hotel_id UUID REFERENCES hotel_tenants(id) ON DELETE SET NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(24) NOT NULL DEFAULT 'hotel_admin',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS hotel_sessions (
          token_hash VARCHAR(64) PRIMARY KEY,
          hotel_user_id UUID NOT NULL REFERENCES hotel_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS education_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          hotel_id UUID REFERENCES hotel_tenants(id) ON DELETE SET NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(24) NOT NULL DEFAULT 'education_admin',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS education_sessions (
          token_hash VARCHAR(64) PRIMARY KEY,
          education_user_id UUID NOT NULL REFERENCES education_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_tenants_code ON hotel_tenants(code)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_qr_modules_hotel_id ON hotel_qr_modules(hotel_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_qr_modules_slug ON hotel_qr_modules(slug)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_users_email ON hotel_users(email)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_users_hotel_id ON hotel_users(hotel_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_sessions_user_id ON hotel_sessions(hotel_user_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_education_users_email ON education_users(email)`
      await client`CREATE INDEX IF NOT EXISTS idx_education_users_hotel_id ON education_users(hotel_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_education_sessions_user_id ON education_sessions(education_user_id)`
      await client`
        INSERT INTO education_users (hotel_id, email, password_hash, role, is_active, created_at, updated_at)
        SELECT hu.hotel_id, hu.email, hu.password_hash, 'education_admin', hu.is_active, hu.created_at, hu.updated_at
        FROM hotel_users hu
        WHERE hu.role = 'education_admin'
          AND NOT EXISTS (
            SELECT 1 FROM education_users eu WHERE eu.email = hu.email
          )
      `
      await client`DELETE FROM hotel_users WHERE role = 'education_admin'`
      await client`
        CREATE TABLE IF NOT EXISTS hotel_room_orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          hotel_id UUID NOT NULL REFERENCES hotel_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES hotel_qr_modules(id) ON DELETE SET NULL,
          room_no VARCHAR(20) NOT NULL,
          floor_label VARCHAR(20) NOT NULL DEFAULT '',
          source_tag VARCHAR(64) NOT NULL DEFAULT '',
          guest_name VARCHAR(120) NOT NULL DEFAULT '',
          lang VARCHAR(8) NOT NULL DEFAULT 'tr',
          items_json TEXT NOT NULL DEFAULT '[]',
          notes TEXT NOT NULL DEFAULT '',
          voice_note_url TEXT NOT NULL DEFAULT '',
          status VARCHAR(24) NOT NULL DEFAULT 'new',
          whatsapp_delivery VARCHAR(24) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS hotel_service_tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          hotel_id UUID NOT NULL REFERENCES hotel_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES hotel_qr_modules(id) ON DELETE SET NULL,
          room_no VARCHAR(20) NOT NULL,
          floor_label VARCHAR(20) NOT NULL DEFAULT '',
          source_tag VARCHAR(64) NOT NULL DEFAULT '',
          guest_name VARCHAR(120) NOT NULL DEFAULT '',
          contact_phone VARCHAR(30) NOT NULL DEFAULT '',
          requested_time VARCHAR(40) NOT NULL DEFAULT '',
          lang VARCHAR(8) NOT NULL DEFAULT 'tr',
          department VARCHAR(24) NOT NULL DEFAULT 'housekeeping',
          category VARCHAR(80) NOT NULL DEFAULT '',
          priority VARCHAR(16) NOT NULL DEFAULT 'normal',
          details TEXT NOT NULL DEFAULT '',
          voice_note_url TEXT NOT NULL DEFAULT '',
          status VARCHAR(24) NOT NULL DEFAULT 'new',
          whatsapp_delivery VARCHAR(24) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS hotel_room_qr_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          hotel_id UUID NOT NULL REFERENCES hotel_tenants(id) ON DELETE CASCADE,
          module_id UUID NOT NULL REFERENCES hotel_qr_modules(id) ON DELETE CASCADE,
          room_no VARCHAR(20) NOT NULL,
          floor_label VARCHAR(20) NOT NULL DEFAULT '',
          source_tag VARCHAR(64) NOT NULL DEFAULT '',
          revision_count INTEGER NOT NULL DEFAULT 0,
          max_revisions INTEGER NOT NULL DEFAULT 2,
          is_locked BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          UNIQUE(hotel_id, module_id, room_no)
        )
      `
      await client`ALTER TABLE hotel_room_orders ADD COLUMN IF NOT EXISTS floor_label VARCHAR(20) NOT NULL DEFAULT ''`
      await client`ALTER TABLE hotel_room_orders ADD COLUMN IF NOT EXISTS source_tag VARCHAR(64) NOT NULL DEFAULT ''`
      await client`ALTER TABLE hotel_room_orders ADD COLUMN IF NOT EXISTS voice_note_url TEXT NOT NULL DEFAULT ''`
      await client`ALTER TABLE hotel_service_tickets ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30) NOT NULL DEFAULT ''`
      await client`ALTER TABLE hotel_service_tickets ADD COLUMN IF NOT EXISTS requested_time VARCHAR(40) NOT NULL DEFAULT ''`
      await client`ALTER TABLE hotel_service_tickets ADD COLUMN IF NOT EXISTS floor_label VARCHAR(20) NOT NULL DEFAULT ''`
      await client`ALTER TABLE hotel_service_tickets ADD COLUMN IF NOT EXISTS source_tag VARCHAR(64) NOT NULL DEFAULT ''`
      await client`ALTER TABLE hotel_service_tickets ADD COLUMN IF NOT EXISTS voice_note_url TEXT NOT NULL DEFAULT ''`
      await client`ALTER TABLE hotel_room_qr_codes ADD COLUMN IF NOT EXISTS revision_count INTEGER NOT NULL DEFAULT 0`
      await client`ALTER TABLE hotel_room_qr_codes ADD COLUMN IF NOT EXISTS max_revisions INTEGER NOT NULL DEFAULT 2`
      await client`ALTER TABLE hotel_room_qr_codes ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_room_orders_hotel_id ON hotel_room_orders(hotel_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_room_orders_status ON hotel_room_orders(status)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_room_orders_created_at ON hotel_room_orders(created_at DESC)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_service_tickets_hotel_id ON hotel_service_tickets(hotel_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_service_tickets_status ON hotel_service_tickets(status)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_service_tickets_created_at ON hotel_service_tickets(created_at DESC)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_room_qr_codes_hotel_id ON hotel_room_qr_codes(hotel_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_room_qr_codes_module_id ON hotel_room_qr_codes(module_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_hotel_room_qr_codes_room_no ON hotel_room_qr_codes(room_no)`
      await client`
        CREATE TABLE IF NOT EXISTS education_attendance_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          hotel_id UUID NOT NULL REFERENCES hotel_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES hotel_qr_modules(id) ON DELETE SET NULL,
          class_code VARCHAR(24) NOT NULL DEFAULT '',
          lesson_name VARCHAR(140) NOT NULL DEFAULT '',
          student_no VARCHAR(32) NOT NULL DEFAULT '',
          student_name VARCHAR(120) NOT NULL DEFAULT '',
          parent_phone VARCHAR(30) NOT NULL DEFAULT '',
          lang VARCHAR(8) NOT NULL DEFAULT 'tr',
          scheduled_start VARCHAR(5) NOT NULL DEFAULT '',
          scheduled_end VARCHAR(5) NOT NULL DEFAULT '',
          scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          entry_status VARCHAR(24) NOT NULL DEFAULT 'on_time',
          late_minutes INTEGER NOT NULL DEFAULT 0,
          early_leave_minutes INTEGER NOT NULL DEFAULT 0,
          notify_parent BOOLEAN NOT NULL DEFAULT FALSE,
          whatsapp_delivery VARCHAR(24) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS education_material_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          hotel_id UUID NOT NULL REFERENCES hotel_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES hotel_qr_modules(id) ON DELETE SET NULL,
          class_code VARCHAR(24) NOT NULL DEFAULT '',
          lesson_name VARCHAR(140) NOT NULL DEFAULT '',
          material_key VARCHAR(40) NOT NULL DEFAULT '',
          student_no VARCHAR(32) NOT NULL DEFAULT '',
          student_name VARCHAR(120) NOT NULL DEFAULT '',
          lang VARCHAR(8) NOT NULL DEFAULT 'tr',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS education_quiz_submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          hotel_id UUID NOT NULL REFERENCES hotel_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES hotel_qr_modules(id) ON DELETE SET NULL,
          class_code VARCHAR(24) NOT NULL DEFAULT '',
          lesson_name VARCHAR(140) NOT NULL DEFAULT '',
          student_no VARCHAR(32) NOT NULL DEFAULT '',
          student_name VARCHAR(120) NOT NULL DEFAULT '',
          lang VARCHAR(8) NOT NULL DEFAULT 'tr',
          answers_json TEXT NOT NULL DEFAULT '{}',
          score INTEGER NOT NULL DEFAULT 0,
          total_questions INTEGER NOT NULL DEFAULT 0,
          due_at VARCHAR(40) NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS education_announcement_responses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          hotel_id UUID NOT NULL REFERENCES hotel_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES hotel_qr_modules(id) ON DELETE SET NULL,
          class_code VARCHAR(24) NOT NULL DEFAULT '',
          branch_code VARCHAR(24) NOT NULL DEFAULT '',
          student_no VARCHAR(32) NOT NULL DEFAULT '',
          student_name VARCHAR(120) NOT NULL DEFAULT '',
          parent_name VARCHAR(120) NOT NULL DEFAULT '',
          parent_phone VARCHAR(30) NOT NULL DEFAULT '',
          event_response VARCHAR(24) NOT NULL DEFAULT 'pending',
          needs_approval BOOLEAN NOT NULL DEFAULT FALSE,
          approval_status VARCHAR(24) NOT NULL DEFAULT 'pending',
          notes TEXT NOT NULL DEFAULT '',
          lang VARCHAR(8) NOT NULL DEFAULT 'tr',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS education_support_tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          hotel_id UUID NOT NULL REFERENCES hotel_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES hotel_qr_modules(id) ON DELETE SET NULL,
          requester_name VARCHAR(120) NOT NULL DEFAULT '',
          requester_role VARCHAR(24) NOT NULL DEFAULT 'teacher',
          class_code VARCHAR(24) NOT NULL DEFAULT '',
          department VARCHAR(24) NOT NULL DEFAULT 'technical',
          category VARCHAR(40) NOT NULL DEFAULT '',
          priority VARCHAR(16) NOT NULL DEFAULT 'normal',
          contact_phone VARCHAR(30) NOT NULL DEFAULT '',
          details TEXT NOT NULL DEFAULT '',
          status VARCHAR(24) NOT NULL DEFAULT 'new',
          whatsapp_delivery VARCHAR(24) NOT NULL DEFAULT 'pending',
          lang VARCHAR(8) NOT NULL DEFAULT 'tr',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS education_parent_teacher_meetings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          hotel_id UUID NOT NULL REFERENCES hotel_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES hotel_qr_modules(id) ON DELETE SET NULL,
          class_code VARCHAR(24) NOT NULL DEFAULT '',
          student_no VARCHAR(32) NOT NULL DEFAULT '',
          student_name VARCHAR(120) NOT NULL DEFAULT '',
          parent_name VARCHAR(120) NOT NULL DEFAULT '',
          parent_phone VARCHAR(30) NOT NULL DEFAULT '',
          teacher_key VARCHAR(40) NOT NULL DEFAULT '',
          requested_time VARCHAR(40) NOT NULL DEFAULT '',
          notes TEXT NOT NULL DEFAULT '',
          meeting_notes TEXT NOT NULL DEFAULT '',
          status VARCHAR(24) NOT NULL DEFAULT 'new',
          whatsapp_delivery VARCHAR(24) NOT NULL DEFAULT 'pending',
          lang VARCHAR(8) NOT NULL DEFAULT 'tr',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`CREATE INDEX IF NOT EXISTS idx_education_attendance_hotel_id ON education_attendance_logs(hotel_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_education_attendance_student_no ON education_attendance_logs(student_no)`
      await client`CREATE INDEX IF NOT EXISTS idx_education_material_events_hotel_id ON education_material_events(hotel_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_education_quiz_hotel_id ON education_quiz_submissions(hotel_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_education_quiz_student_no ON education_quiz_submissions(student_no)`
      await client`CREATE INDEX IF NOT EXISTS idx_education_announcement_hotel_id ON education_announcement_responses(hotel_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_education_support_hotel_id ON education_support_tickets(hotel_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_education_meetings_hotel_id ON education_parent_teacher_meetings(hotel_id)`

      await client`
        CREATE TABLE IF NOT EXISTS health_tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(24) UNIQUE NOT NULL,
          name VARCHAR(140) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS health_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID REFERENCES health_tenants(id) ON DELETE SET NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(24) NOT NULL DEFAULT 'sector_admin',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS health_sessions (
          token_hash VARCHAR(64) PRIMARY KEY,
          health_user_id UUID NOT NULL REFERENCES health_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS health_modules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES health_tenants(id) ON DELETE CASCADE,
          slug VARCHAR(24) UNIQUE NOT NULL,
          module_type VARCHAR(32) NOT NULL DEFAULT 'patient_info',
          title VARCHAR(160) NOT NULL DEFAULT '',
          config_json TEXT NOT NULL DEFAULT '{}',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS health_count_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES health_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES health_modules(id) ON DELETE SET NULL,
          line_code VARCHAR(40) NOT NULL DEFAULT '',
          scanner_id VARCHAR(40) NOT NULL DEFAULT '',
          product_qr VARCHAR(120) NOT NULL,
          meta_json TEXT NOT NULL DEFAULT '{}',
          counted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS health_form_submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES health_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES health_modules(id) ON DELETE SET NULL,
          module_slug VARCHAR(24) NOT NULL,
          module_type VARCHAR(32) NOT NULL,
          respondent_name VARCHAR(120) NOT NULL DEFAULT '',
          respondent_phone VARCHAR(40) NOT NULL DEFAULT '',
          payload_json TEXT NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`CREATE INDEX IF NOT EXISTS idx_health_tenants_code ON health_tenants(code)`
      await client`CREATE INDEX IF NOT EXISTS idx_health_users_email ON health_users(email)`
      await client`CREATE INDEX IF NOT EXISTS idx_health_sessions_user_id ON health_sessions(health_user_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_health_modules_tenant_id ON health_modules(tenant_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_health_count_events_tenant_id ON health_count_events(tenant_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_health_form_submissions_module_id ON health_form_submissions(module_id)`

      await client`
        CREATE TABLE IF NOT EXISTS factory_tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(24) UNIQUE NOT NULL,
          name VARCHAR(140) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS factory_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID REFERENCES factory_tenants(id) ON DELETE SET NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(24) NOT NULL DEFAULT 'sector_admin',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS factory_sessions (
          token_hash VARCHAR(64) PRIMARY KEY,
          factory_user_id UUID NOT NULL REFERENCES factory_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS factory_modules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES factory_tenants(id) ON DELETE CASCADE,
          slug VARCHAR(24) UNIQUE NOT NULL,
          module_type VARCHAR(32) NOT NULL DEFAULT 'safety_flow',
          title VARCHAR(160) NOT NULL DEFAULT '',
          config_json TEXT NOT NULL DEFAULT '{}',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS factory_count_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES factory_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES factory_modules(id) ON DELETE SET NULL,
          line_code VARCHAR(40) NOT NULL DEFAULT '',
          scanner_id VARCHAR(40) NOT NULL DEFAULT '',
          product_qr VARCHAR(120) NOT NULL,
          meta_json TEXT NOT NULL DEFAULT '{}',
          counted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS factory_form_submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES factory_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES factory_modules(id) ON DELETE SET NULL,
          module_slug VARCHAR(24) NOT NULL,
          module_type VARCHAR(32) NOT NULL,
          respondent_name VARCHAR(120) NOT NULL DEFAULT '',
          respondent_phone VARCHAR(40) NOT NULL DEFAULT '',
          payload_json TEXT NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS factory_cameras (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES factory_tenants(id) ON DELETE CASCADE,
          scanner_id VARCHAR(40) NOT NULL,
          line_code VARCHAR(40) NOT NULL DEFAULT '',
          camera_name VARCHAR(120) NOT NULL DEFAULT '',
          ip_address VARCHAR(80) NOT NULL DEFAULT '',
          rtsp_url TEXT NOT NULL DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          last_tested_at TIMESTAMP WITH TIME ZONE,
          last_test_status VARCHAR(24) NOT NULL DEFAULT 'never',
          last_test_note TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          UNIQUE(tenant_id, scanner_id)
        )
      `
      await client`CREATE INDEX IF NOT EXISTS idx_factory_tenants_code ON factory_tenants(code)`
      await client`CREATE INDEX IF NOT EXISTS idx_factory_users_email ON factory_users(email)`
      await client`CREATE INDEX IF NOT EXISTS idx_factory_sessions_user_id ON factory_sessions(factory_user_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_factory_modules_tenant_id ON factory_modules(tenant_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_factory_count_events_tenant_id ON factory_count_events(tenant_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_factory_form_submissions_module_id ON factory_form_submissions(module_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_factory_cameras_tenant_id ON factory_cameras(tenant_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_factory_cameras_scanner_id ON factory_cameras(scanner_id)`

      await client`
        CREATE TABLE IF NOT EXISTS retail_tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(24) UNIQUE NOT NULL,
          name VARCHAR(140) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS retail_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID REFERENCES retail_tenants(id) ON DELETE SET NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(24) NOT NULL DEFAULT 'sector_admin',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS retail_sessions (
          token_hash VARCHAR(64) PRIMARY KEY,
          retail_user_id UUID NOT NULL REFERENCES retail_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS retail_modules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES retail_tenants(id) ON DELETE CASCADE,
          slug VARCHAR(24) UNIQUE NOT NULL,
          module_type VARCHAR(32) NOT NULL DEFAULT 'product_story',
          title VARCHAR(160) NOT NULL DEFAULT '',
          config_json TEXT NOT NULL DEFAULT '{}',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS retail_count_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES retail_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES retail_modules(id) ON DELETE SET NULL,
          line_code VARCHAR(40) NOT NULL DEFAULT '',
          scanner_id VARCHAR(40) NOT NULL DEFAULT '',
          product_qr VARCHAR(120) NOT NULL,
          meta_json TEXT NOT NULL DEFAULT '{}',
          counted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS retail_form_submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES retail_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES retail_modules(id) ON DELETE SET NULL,
          module_slug VARCHAR(24) NOT NULL,
          module_type VARCHAR(32) NOT NULL,
          respondent_name VARCHAR(120) NOT NULL DEFAULT '',
          respondent_phone VARCHAR(40) NOT NULL DEFAULT '',
          payload_json TEXT NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS retail_cameras (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES retail_tenants(id) ON DELETE CASCADE,
          scanner_id VARCHAR(40) NOT NULL,
          line_code VARCHAR(40) NOT NULL DEFAULT '',
          camera_name VARCHAR(120) NOT NULL DEFAULT '',
          ip_address VARCHAR(80) NOT NULL DEFAULT '',
          rtsp_url TEXT NOT NULL DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          last_tested_at TIMESTAMP WITH TIME ZONE,
          last_test_status VARCHAR(24) NOT NULL DEFAULT 'never',
          last_test_note TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          UNIQUE(tenant_id, scanner_id)
        )
      `
      await client`CREATE INDEX IF NOT EXISTS idx_retail_tenants_code ON retail_tenants(code)`
      await client`CREATE INDEX IF NOT EXISTS idx_retail_users_email ON retail_users(email)`
      await client`CREATE INDEX IF NOT EXISTS idx_retail_sessions_user_id ON retail_sessions(retail_user_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_retail_modules_tenant_id ON retail_modules(tenant_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_retail_count_events_tenant_id ON retail_count_events(tenant_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_retail_form_submissions_module_id ON retail_form_submissions(module_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_retail_cameras_tenant_id ON retail_cameras(tenant_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_retail_cameras_scanner_id ON retail_cameras(scanner_id)`

      await client`
        CREATE TABLE IF NOT EXISTS logistics_tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(24) UNIQUE NOT NULL,
          name VARCHAR(140) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS logistics_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID REFERENCES logistics_tenants(id) ON DELETE SET NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(24) NOT NULL DEFAULT 'sector_admin',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS logistics_sessions (
          token_hash VARCHAR(64) PRIMARY KEY,
          logistics_user_id UUID NOT NULL REFERENCES logistics_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS logistics_modules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES logistics_tenants(id) ON DELETE CASCADE,
          slug VARCHAR(24) UNIQUE NOT NULL,
          module_type VARCHAR(32) NOT NULL DEFAULT 'warehouse_flow',
          title VARCHAR(160) NOT NULL DEFAULT '',
          config_json TEXT NOT NULL DEFAULT '{}',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS logistics_count_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES logistics_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES logistics_modules(id) ON DELETE SET NULL,
          line_code VARCHAR(40) NOT NULL DEFAULT '',
          scanner_id VARCHAR(40) NOT NULL DEFAULT '',
          product_qr VARCHAR(120) NOT NULL,
          meta_json TEXT NOT NULL DEFAULT '{}',
          counted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS logistics_form_submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES logistics_tenants(id) ON DELETE CASCADE,
          module_id UUID REFERENCES logistics_modules(id) ON DELETE SET NULL,
          module_slug VARCHAR(24) NOT NULL,
          module_type VARCHAR(32) NOT NULL,
          respondent_name VARCHAR(120) NOT NULL DEFAULT '',
          respondent_phone VARCHAR(40) NOT NULL DEFAULT '',
          payload_json TEXT NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `
      await client`
        CREATE TABLE IF NOT EXISTS logistics_cameras (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES logistics_tenants(id) ON DELETE CASCADE,
          scanner_id VARCHAR(40) NOT NULL,
          line_code VARCHAR(40) NOT NULL DEFAULT '',
          camera_name VARCHAR(120) NOT NULL DEFAULT '',
          ip_address VARCHAR(80) NOT NULL DEFAULT '',
          rtsp_url TEXT NOT NULL DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          last_tested_at TIMESTAMP WITH TIME ZONE,
          last_test_status VARCHAR(24) NOT NULL DEFAULT 'never',
          last_test_note TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          UNIQUE(tenant_id, scanner_id)
        )
      `
      await client`CREATE INDEX IF NOT EXISTS idx_logistics_tenants_code ON logistics_tenants(code)`
      await client`CREATE INDEX IF NOT EXISTS idx_logistics_users_email ON logistics_users(email)`
      await client`CREATE INDEX IF NOT EXISTS idx_logistics_sessions_user_id ON logistics_sessions(logistics_user_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_logistics_modules_tenant_id ON logistics_modules(tenant_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_logistics_count_events_tenant_id ON logistics_count_events(tenant_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_logistics_form_submissions_module_id ON logistics_form_submissions(module_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_logistics_cameras_tenant_id ON logistics_cameras(tenant_id)`
      await client`CREATE INDEX IF NOT EXISTS idx_logistics_cameras_scanner_id ON logistics_cameras(scanner_id)`
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
  is_demo?: boolean
  order_type?: 'demo' | 'trial' | 'individual' | 'corporate'
  creator_user_id?: string | null
  is_active?: boolean
  is_claimed: boolean
  admin_token: string | null
  recovery_code_hash?: string | null
  audio_url: string | null
  recording_count?: number
  recording_limit?: number
  video_recording_count?: number
  video_recording_limit?: number
  video_max_seconds?: number | null
  title: string
  play_count: number
  demo_expires_at?: string | null
  created_at: string
  updated_at: string
  media_items?: QRMedia[]
}

export type QRMediaType = 'audio' | 'video' | 'image' | 'youtube' | 'spotify' | 'link'
export type QRMediaSourceType = 'blob' | 'external'

export interface QRMedia {
  id: string
  qr_id: string
  media_type: QRMediaType
  source_type: QRMediaSourceType
  blob_url: string | null
  external_url: string | null
  title: string
  sort_order: number
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface UserAccount {
  id: string
  email: string
  password_hash: string
  account_type?: 'individual' | 'corporate'
  free_slots: number
  paid_slots: number
  used_slots: number
  created_at: string
  updated_at: string
}

export interface HotelTenant {
  id: string
  code: string
  name: string
  city: string
  whatsapp_number: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HotelQrModule {
  id: string
  hotel_id: string
  slug: string
  module_type:
    | 'world_clock'
    | 'menu'
    | 'room_service'
    | 'service_ticket'
    | 'room_hub'
    | 'class_attendance'
    | 'lesson_material'
    | 'homework_quiz'
    | 'announcement_event'
    | 'education_support_ticket'
    | 'parent_teacher_meeting'
  title: string
  config_json: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HotelRoomOrder {
  id: string
  hotel_id: string
  module_id: string | null
  room_no: string
  floor_label: string
  source_tag: string
  guest_name: string
  lang: string
  items_json: string
  notes: string
  voice_note_url: string
  status: 'new' | 'processing' | 'completed' | 'cancelled'
  whatsapp_delivery: 'pending' | 'sent' | 'failed' | 'skipped'
  created_at: string
  updated_at: string
}

export interface HotelServiceTicket {
  id: string
  hotel_id: string
  module_id: string | null
  room_no: string
  floor_label: string
  source_tag: string
  guest_name: string
  contact_phone: string
  requested_time: string
  lang: string
  department: 'housekeeping' | 'technical' | 'concierge'
  category: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  details: string
  voice_note_url: string
  status: 'new' | 'processing' | 'completed' | 'cancelled'
  whatsapp_delivery: 'pending' | 'sent' | 'failed' | 'skipped'
  created_at: string
  updated_at: string
}

export interface HotelUser {
  id: string
  hotel_id: string | null
  email: string
  password_hash: string
  role: 'platform_admin' | 'hotel_admin' | 'education_admin' | 'staff'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EducationUser {
  id: string
  hotel_id: string | null
  email: string
  password_hash: string
  role: 'education_admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HotelRoomQrCode {
  id: string
  hotel_id: string
  module_id: string
  room_no: string
  floor_label: string
  source_tag: string
  revision_count: number
  max_revisions: number
  is_locked: boolean
  created_at: string
  updated_at: string
}

export async function deactivateExpiredDemoQr<T extends Pick<QRCode, 'slug' | 'is_demo' | 'is_active' | 'demo_expires_at'>>(qr: T): Promise<T> {
  const expiresAt = qr.demo_expires_at ? new Date(qr.demo_expires_at).getTime() : null
  const isExpired = Boolean(qr.is_demo && qr.is_active && expiresAt && expiresAt <= Date.now())

  if (isExpired) {
    await sql`
      UPDATE qr_codes
      SET is_active = FALSE,
          updated_at = NOW()
      WHERE slug = ${qr.slug}
    `

    return {
      ...qr,
      is_active: false,
    }
  }

  return qr
}

export async function deactivateAllExpiredDemoQrs() {
  await sql`
    UPDATE qr_codes
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE is_demo = TRUE
      AND is_active = TRUE
      AND demo_expires_at IS NOT NULL
      AND demo_expires_at <= NOW()
  `
}
