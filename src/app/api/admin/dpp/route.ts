import { NextRequest, NextResponse, after } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'
import { audit, runDailyMaintenance, safetyStatus, snapshotCompany, trashBlob } from '@/lib/dpp/safety'
import { sql } from '@/lib/db'
import { clientIp, consumeRateLimit } from '@/lib/growthSchema'
import { createDppUser, randomKey, resetDppUserPassword } from '@/lib/dpp/auth'
import { ensureDppSchema } from '@/lib/dpp/schema'
import { DPP_PLANS, type DppPlan } from '@/lib/dpp/types'

// QRNot admin konsolu → DPP firmaları: firma açma, paket / ürün sınırı, aktif-pasif, yönetici şifresi sıfırlama, silme.

export async function POST(req: NextRequest) {
  try {
    if (!(await consumeRateLimit(`admin-dpp:${clientIp(req.headers)}`, 300, 3600))) {
      return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 })
    }
    const body = await req.json().catch(() => ({}))
    if (!(await checkAdminPassword(req, body.password))) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    await ensureDppSchema()
    const action = String(body.action || '')
    const id = String(body.id || '')
    const validId = /^[0-9a-f-]{36}$/i.test(id)
    // Günlük yedek / çöp temizliği (günde bir kez) ve yönetici işlemlerinin kaydı — yanıtı bekletmeden
    after(() => runDailyMaintenance().catch((e) => console.error('[dpp maintenance]', e)))
    if (!['companies.list', 'safety.status', 'companies.delete'].includes(action)) {
      const { password: _pw, ...request } = body as Record<string, unknown>
      void _pw
      after(() => audit(validId ? id : null, 'admin', action, id || null, { request }))
    }

    if (action === 'companies.list') {
      const companies = await sql`
        SELECT c.id, c.code, c.name, c.country, c.email, c.phone, c.plan, c.product_limit, c.is_active, c.admin_note, c.created_at,
               (SELECT COUNT(*)::int FROM dpp_products p WHERE p.company_id = c.id AND p.status <> 'archived') AS products,
               (SELECT COUNT(*)::int FROM dpp_products p WHERE p.company_id = c.id AND p.status = 'published') AS published,
               (SELECT COUNT(*)::int FROM dpp_items i JOIN dpp_products p ON p.id = i.product_id WHERE p.company_id = c.id) AS items,
               (SELECT COUNT(*)::int FROM dpp_scans s JOIN dpp_products p ON p.id = s.product_id WHERE p.company_id = c.id AND s.created_at > NOW() - INTERVAL '30 days') AS scans30,
               (SELECT json_agg(json_build_object('id', u.id, 'email', u.email, 'role', u.role, 'is_active', u.is_active, 'last_login_at', u.last_login_at) ORDER BY u.created_at)
                  FROM dpp_users u WHERE u.company_id = c.id) AS users
        FROM dpp_companies c
        ORDER BY c.created_at DESC
      `
      return NextResponse.json({ companies })
    }

    if (action === 'companies.create') {
      const name = String(body.name || '').trim().slice(0, 200)
      const email = String(body.ownerEmail || '').trim()
      if (!name) return NextResponse.json({ error: 'Firma adı zorunlu' }, { status: 400 })
      const plan = (String(body.plan) in DPP_PLANS ? String(body.plan) : 'pilot') as DppPlan
      const limit = Math.max(1, Math.min(100000, Math.floor(Number(body.productLimit) || DPP_PLANS[plan].productLimit)))
      const base = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'FIRMA'
      let code = base
      for (let i = 2; ((await sql`SELECT 1 FROM dpp_companies WHERE code = ${code}`) as unknown[]).length; i++) code = `${base}${i}`
      const rows = (await sql`
        INSERT INTO dpp_companies (code, name, country, email, phone, plan, product_limit, restricted_key, admin_note)
        VALUES (${code}, ${name}, ${String(body.country || 'TR').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || 'TR'},
                ${email.toLowerCase()}, ${String(body.phone || '').slice(0, 40)}, ${plan}, ${limit}, ${randomKey()}, ${String(body.note || '').slice(0, 2000)})
        RETURNING id
      `) as Array<{ id: string }>
      try {
        const owner = await createDppUser(rows[0].id, email, 'owner', String(body.ownerName || ''))
        return NextResponse.json({ id: rows[0].id, code, ownerEmail: owner.email, password: owner.password })
      } catch (err) {
        await sql`DELETE FROM dpp_companies WHERE id = ${rows[0].id}`
        throw err
      }
    }

    if (action === 'companies.update' && validId) {
      const plan = (String(body.plan) in DPP_PLANS ? String(body.plan) : 'pilot') as DppPlan
      const limit = Math.max(1, Math.min(100000, Math.floor(Number(body.productLimit) || DPP_PLANS[plan].productLimit)))
      await sql`
        UPDATE dpp_companies SET plan = ${plan}, product_limit = ${limit}, is_active = ${body.isActive !== false}, admin_note = ${String(body.note ?? '').slice(0, 2000)}
        WHERE id = ${id}
      `
      if (body.isActive === false) await sql`DELETE FROM dpp_sessions WHERE user_id IN (SELECT id FROM dpp_users WHERE company_id = ${id})`
      return NextResponse.json({ ok: true })
    }

    if (action === 'users.resetPassword' && /^[0-9a-f-]{36}$/i.test(String(body.userId || ''))) {
      return NextResponse.json({ password: await resetDppUserPassword(String(body.userId)) })
    }

    if (action === 'users.add' && validId) {
      const user = await createDppUser(id, String(body.email || ''), body.role === 'editor' || body.role === 'viewer' ? body.role : 'owner')
      return NextResponse.json({ email: user.email, password: user.password })
    }

    if (action === 'safety.status') return NextResponse.json(await safetyStatus())
    if (action === 'backup.run') return NextResponse.json(await runDailyMaintenance(true))

    if (action === 'companies.delete' && validId) {
      // Sunucu tarafında da onay: firma kodu birebir yazılmalı
      const company = ((await sql`SELECT code, name, is_active FROM dpp_companies WHERE id = ${id}`) as Array<{ code: string; name: string; is_active: boolean }>)[0]
      if (!company) return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 })
      if (String(body.confirm || '') !== company.code) return NextResponse.json({ error: 'Onay için firma kodunu birebir yazın' }, { status: 400 })
      const published = ((await sql`SELECT COUNT(*)::int AS n FROM dpp_products WHERE company_id = ${id} AND version > 0`) as Array<{ n: number }>)[0].n
      if (published > 0 && company.is_active) {
        return NextResponse.json({ error: 'Yayınlanmış pasaportu olan firma silinemez: önce firmayı pasife alın (pasaportları ürün ömrü boyunca açık kalmalı).' }, { status: 400 })
      }
      // Silmeden önce firmanın tam kopyası alınır (süresiz saklanır)
      const snapshot = await snapshotCompany(id, company.code)
      const blobs = (await sql`
        SELECT d.blob_url AS url FROM dpp_documents d JOIN dpp_products p ON p.id = d.product_id WHERE p.company_id = ${id}
        UNION ALL
        SELECT p.image_url FROM dpp_products p WHERE p.company_id = ${id} AND p.image_url IS NOT NULL
        UNION
        SELECT v.snapshot->>'imageUrl' FROM dpp_versions v JOIN dpp_products p ON p.id = v.product_id WHERE p.company_id = ${id} AND v.snapshot->>'imageUrl' IS NOT NULL
        UNION
        SELECT f->>'url' FROM dpp_supplier_requests r, jsonb_array_elements(COALESCE(r.response->'files', '[]'::jsonb)) f WHERE r.company_id = ${id}
      `) as Array<{ url: string }>
      await sql`DELETE FROM dpp_companies WHERE id = ${id}`
      // Dosyalar hemen silinmez: 30 gün çöp kutusunda bekler
      for (const b of blobs) await trashBlob(b.url, id, 'company-deleted')
      await audit(id, 'admin', 'companies.delete', id, { company, snapshot: snapshot.url, files: blobs.length })
      return NextResponse.json({ ok: true, deletedFiles: blobs.length, snapshot: snapshot.url })
    }

    return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
  } catch (err) {
    console.error('[admin/dpp]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Sunucu hatası' }, { status: 400 })
  }
}
