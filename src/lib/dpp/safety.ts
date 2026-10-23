import { deleteBlob, putBlob } from '@/lib/blob'
import { sql } from '@/lib/db'
import { ensureDppSchema } from './schema'

// Veri güvenliği: işlem kaydı (audit), silinen dosyalar için 30 günlük çöp kutusu, günlük tam yedek
// ve firma silinmeden önce tam kopya. Amaç: hiçbir firma verisi kayıt dışı değişmesin ya da geri dönüşsüz kaybolmasın.

export const TRASH_DAYS = 30
export const BACKUP_KEEP_DAYS = 30

type Json = Record<string, unknown>

/** Her yazma işlemi kalıcı olarak kaydedilir; silme işlemlerinde silinen verinin kopyası `detail` içinde durur. */
export async function audit(companyId: string | null, actor: string, action: string, targetId: string | null, detail: Json = {}) {
  try {
    await ensureDppSchema()
    await sql`
      INSERT INTO dpp_audit (company_id, actor, action, target_id, detail)
      VALUES (${companyId}, ${actor.slice(0, 255)}, ${action.slice(0, 60)}, ${targetId ? targetId.slice(0, 80) : null}, ${JSON.stringify(detail)}::jsonb)
    `
  } catch (err) {
    // Kayıt hatası asıl işlemi bozmasın ama görünür olsun
    console.error('[dpp audit]', action, err)
  }
}

/** Dosyayı hemen silmez: 30 gün çöp kutusunda bekler, sonra günlük bakımda (hâlâ hiçbir yerde kullanılmıyorsa) silinir. */
export async function trashBlob(url: string | null | undefined, companyId: string | null, reason: string) {
  if (!url) return
  await ensureDppSchema()
  await sql`
    INSERT INTO dpp_trash (url, company_id, reason, purge_after)
    VALUES (${url}, ${companyId}, ${reason.slice(0, 120)}, NOW() + make_interval(days => ${TRASH_DAYS}))
    ON CONFLICT (url) DO NOTHING
  `
}

const BACKUP_TABLES = ['dpp_companies', 'dpp_users', 'dpp_products', 'dpp_versions', 'dpp_items', 'dpp_documents', 'dpp_supplier_requests', 'dpp_trash'] as const

async function tableRows(table: (typeof BACKUP_TABLES)[number], companyId?: string) {
  // Tablo adları sabit listeden gelir; firma filtresi parametreli
  switch (table) {
    case 'dpp_companies':
      return companyId ? sql`SELECT * FROM dpp_companies WHERE id = ${companyId}` : sql`SELECT * FROM dpp_companies`
    case 'dpp_users':
      return companyId ? sql`SELECT * FROM dpp_users WHERE company_id = ${companyId}` : sql`SELECT * FROM dpp_users`
    case 'dpp_products':
      return companyId ? sql`SELECT * FROM dpp_products WHERE company_id = ${companyId}` : sql`SELECT * FROM dpp_products`
    case 'dpp_versions':
      return companyId
        ? sql`SELECT v.* FROM dpp_versions v JOIN dpp_products p ON p.id = v.product_id WHERE p.company_id = ${companyId}`
        : sql`SELECT * FROM dpp_versions`
    case 'dpp_items':
      return companyId
        ? sql`SELECT i.* FROM dpp_items i JOIN dpp_products p ON p.id = i.product_id WHERE p.company_id = ${companyId}`
        : sql`SELECT * FROM dpp_items`
    case 'dpp_documents':
      return companyId
        ? sql`SELECT d.* FROM dpp_documents d JOIN dpp_products p ON p.id = d.product_id WHERE p.company_id = ${companyId}`
        : sql`SELECT * FROM dpp_documents`
    case 'dpp_supplier_requests':
      return companyId ? sql`SELECT * FROM dpp_supplier_requests WHERE company_id = ${companyId}` : sql`SELECT * FROM dpp_supplier_requests`
    case 'dpp_trash':
      return companyId ? sql`SELECT * FROM dpp_trash WHERE company_id = ${companyId}` : sql`SELECT * FROM dpp_trash`
  }
}

/** Tüm DPP verisinin (ya da tek firmanın) JSON kopyası. Oturum anahtarları ve okutma istatistikleri dahil edilmez. */
export async function exportDppData(companyId?: string) {
  await ensureDppSchema()
  const tables: Record<string, unknown[]> = {}
  for (const t of BACKUP_TABLES) tables[t] = (await tableRows(t, companyId)) as unknown[]
  return { schema: 'qrnot-dpp-backup/1', createdAt: new Date().toISOString(), companyId: companyId || null, tables }
}

/** Firma silinmeden önce tam kopyası özel depoya yazılır (geri getirme için). */
export async function snapshotCompany(companyId: string, code: string) {
  const data = await exportDppData(companyId)
  const body = JSON.stringify(data)
  const blob = await putBlob(`backups/dpp/deleted/${code}-${Date.now()}.json`, body)
  return { url: blob.url, size: body.length }
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Günlük bakım: günün yedeği yoksa alır, süresi dolan çöp dosyalarını ve eski yedekleri temizler.
 * Aynı gün birden fazla tetiklenirse sadece biri çalışır (dpp_backups.day birincil anahtar).
 */
export async function runDailyMaintenance(force = false) {
  await ensureDppSchema()
  const day = today()
  if (!force) {
    const done = (await sql`SELECT 1 FROM dpp_backups WHERE day = ${day}`) as unknown[]
    if (done.length) return { skipped: true }
  }
  const claimed = (await sql`
    INSERT INTO dpp_backups (day, status) VALUES (${day}, 'running')
    ON CONFLICT (day) DO UPDATE SET status = 'running', started_at = NOW()
      WHERE ${force} OR (dpp_backups.status <> 'ok' AND dpp_backups.started_at < NOW() - INTERVAL '15 minutes')
    RETURNING day
  `) as unknown[]
  if (!claimed.length) return { skipped: true }

  try {
    const data = await exportDppData()
    const body = JSON.stringify(data)
    const blob = await putBlob(`backups/dpp/daily/${day}.json`, body)
    const counts = Object.fromEntries(Object.entries(data.tables).map(([k, v]) => [k, v.length]))
    await sql`
      UPDATE dpp_backups SET status = 'ok', url = ${blob.url}, size_bytes = ${body.length}, counts = ${JSON.stringify(counts)}::jsonb, finished_at = NOW()
      WHERE day = ${day}
    `
  } catch (err) {
    console.error('[dpp backup]', err)
    await sql`UPDATE dpp_backups SET status = 'failed', finished_at = NOW() WHERE day = ${day}`
    return { ok: false }
  }

  // Çöp: süresi dolmuş ve hâlâ hiçbir kayıtta kullanılmayan dosyalar silinir (elle geri getirilenler korunur)
  const expired = (await sql`
    SELECT t.url FROM dpp_trash t
    WHERE t.purge_after < NOW()
      AND NOT EXISTS (SELECT 1 FROM dpp_documents d WHERE d.blob_url = t.url)
      AND NOT EXISTS (SELECT 1 FROM dpp_products p WHERE p.image_url = t.url)
      AND NOT EXISTS (SELECT 1 FROM dpp_versions v WHERE v.snapshot->>'imageUrl' = t.url)
    LIMIT 500
  `) as Array<{ url: string }>
  for (const { url } of expired) {
    await deleteBlob(url).catch(() => undefined)
    await sql`DELETE FROM dpp_trash WHERE url = ${url}`
  }

  // Eski günlük yedekler (30 günden eski) silinir; firma silme kopyaları süresiz tutulur
  const old = (await sql`
    SELECT day, url FROM dpp_backups WHERE day < (CURRENT_DATE - ${BACKUP_KEEP_DAYS}::int) AND url IS NOT NULL
  `) as Array<{ day: string; url: string }>
  for (const b of old) {
    await deleteBlob(b.url).catch(() => undefined)
    await sql`UPDATE dpp_backups SET url = NULL, status = 'expired' WHERE day = ${b.day}`
  }
  return { ok: true, purged: expired.length }
}

/** Yönetici paneli: son yedekler ve çöp kutusu özeti */
export async function safetyStatus() {
  await ensureDppSchema()
  const [backups, trash, audits] = await Promise.all([
    sql`SELECT day::text AS day, status, size_bytes, counts, finished_at FROM dpp_backups ORDER BY day DESC LIMIT 7`,
    sql`SELECT COUNT(*)::int AS n FROM dpp_trash`,
    sql`SELECT COUNT(*)::int AS n FROM dpp_audit WHERE created_at > NOW() - INTERVAL '30 days'`,
  ])
  return { backups, trashFiles: (trash as Array<{ n: number }>)[0].n, audit30: (audits as Array<{ n: number }>)[0].n }
}
