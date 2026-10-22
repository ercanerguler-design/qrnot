'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Me } from './PanelApp'
import { Alert, api, Button, Card, Field, fmtDate, inputCls } from './ui'

// Firma bilgileri, yetkili erişim anahtarı, ekip yönetimi ve hesap şifresi.

interface Company {
  name: string
  code: string
  country: string
  address: string
  website: string
  email: string
  phone: string
  tax_id: string
  planLabel: string
  product_limit: number
  used: number
  restricted_key: string | null
  created_at: string
}

interface TeamUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'editor' | 'viewer'
  is_active: boolean
  must_change_password: boolean
  last_login_at: string | null
}

const ROLE_HELP = {
  owner: 'Yönetici — her şey + ekip ve firma ayarları',
  editor: 'Editör — ürün, belge, seri no, yayın',
  viewer: 'İzleyici — sadece görüntüleme',
}

export default function Settings({ section, me }: { section: 'company' | 'users' | 'account'; me: Me }) {
  if (section === 'company') return <CompanySettings me={me} />
  if (section === 'users') return <TeamSettings me={me} />
  return <AccountSettings me={me} />
}

function CompanySettings({ me }: { me: Me }) {
  const [c, setC] = useState<Company | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const isOwner = me.role === 'owner'

  const load = useCallback(async () => {
    try {
      setC((await api<{ company: Company }>('company.get')).company)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yüklenemedi')
    }
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (!c) return error ? <Alert>{error}</Alert> : <p className="text-slate-500">Yükleniyor…</p>
  const set = (k: keyof Company, v: string) => {
    setC({ ...c, [k]: v })
    setSaved(false)
  }
  const accessLink = c.restricted_key ? `${window.location.origin}/p/PASAPORT-KODU?k=${c.restricted_key}` : ''

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Firma bilgileri</h1>
      {error && <Alert>{error}</Alert>}
      {saved && <Alert tone="success">Kaydedildi. Yeni bilgiler pasaportlarda “Pasaportu yayınlayan” alanında görünür.</Alert>}
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Card title="Firma profili" subtitle={isOwner ? undefined : 'Sadece firma yöneticisi değiştirebilir'}>
          <fieldset disabled={!isOwner} className="grid gap-4 sm:grid-cols-2">
            <Field label="Firma adı" className="sm:col-span-2">
              <input className={inputCls} value={c.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Ülke (ISO kodu)">
              <input className={`${inputCls} uppercase`} maxLength={2} value={c.country} onChange={(e) => set('country', e.target.value.toUpperCase())} />
            </Field>
            <Field label="Vergi / EORI no">
              <input className={inputCls} value={c.tax_id} onChange={(e) => set('tax_id', e.target.value)} />
            </Field>
            <Field label="Adres" className="sm:col-span-2">
              <textarea className={`${inputCls} min-h-16`} value={c.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Web sitesi">
              <input className={inputCls} placeholder="https://" value={c.website} onChange={(e) => set('website', e.target.value)} />
            </Field>
            <Field label="E-posta">
              <input className={inputCls} type="email" value={c.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Telefon">
              <input className={inputCls} value={c.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
          </fieldset>
          {isOwner && (
            <Button
              variant="primary"
              className="mt-4"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                setError(null)
                try {
                  await api('company.save', c as unknown as Record<string, unknown>)
                  setSaved(true)
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Kaydedilemedi')
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          )}
        </Card>
        <div className="space-y-5">
          <Card title="Paket">
            <p className="text-2xl font-bold">{c.planLabel}</p>
            <p className="mt-1 text-sm text-slate-500">
              {c.used} / {c.product_limit.toLocaleString('tr-TR')} aktif ürün · firma kodu {c.code}
            </p>
            <p className="mt-3 text-xs text-slate-500">Paket değişikliği için QRNot destek: 0850 888 1 889</p>
          </Card>
          {isOwner && c.restricted_key && (
            <Card title="🔒 Yetkili erişim" subtitle="Denetim kurumları ve geri dönüşüm tesisleri için">
              <p className="text-sm text-slate-600">
                Herhangi bir pasaport adresinin sonuna aşağıdaki anahtarı eklersen kısıtlı bilgiler (tedarikçi, tesis, notlar, kısıtlı belgeler) de görünür:
              </p>
              <p className="mt-2 break-all rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs">?k={c.restricted_key}</p>
              <p className="mt-2 break-all text-xs text-slate-500">Örnek: {accessLink}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void navigator.clipboard.writeText(`?k=${c.restricted_key}`)}>
                  Kopyala
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    if (!window.confirm('Anahtar yenilensin mi? Daha önce paylaşılan yetkili erişim linkleri çalışmaz hale gelir.')) return
                    const res = await api<{ restrictedKey: string }>('company.rotateKey')
                    setC({ ...c, restricted_key: res.restrictedKey })
                  }}
                >
                  Anahtarı yenile
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function TeamSettings({ me }: { me: Me }) {
  const [users, setUsers] = useState<TeamUser[] | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<TeamUser['role']>('editor')
  const [error, setError] = useState<string | null>(null)
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setUsers((await api<{ users: TeamUser[] }>('users.list')).users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yüklenemedi')
    }
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const act = async (task: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await task()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Ekip</h1>
      {error && <Alert>{error}</Alert>}
      {secret && (
        <Alert tone="success">
          <p className="font-semibold">Giriş bilgileri — bu şifre bir daha gösterilmeyecek:</p>
          <p className="mt-2 font-mono">
            {window.location.origin}/dpp/panel
            <br />
            E-posta: {secret.email}
            <br />
            Geçici şifre: {secret.password}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/dpp/panel\nE-posta: ${secret.email}\nGeçici şifre: ${secret.password}`)}>
              Kopyala
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSecret(null)}>
              Kapat
            </Button>
          </div>
          <p className="mt-2 text-xs">Kullanıcı ilk girişte kendi şifresini belirler.</p>
        </Alert>
      )}
      <Card title="Ekip üyesi ekle">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_14rem_auto] sm:items-end">
          <Field label="E-posta">
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Ad soyad">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Rol">
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as TeamUser['role'])}>
              {Object.entries(ROLE_HELP).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Button
            variant="primary"
            disabled={busy || !email}
            onClick={() =>
              void act(async () => {
                const res = await api<{ email: string; password: string }>('users.add', { email, name, role })
                setSecret(res)
                setEmail('')
                setName('')
              })
            }
          >
            Ekle
          </Button>
        </div>
      </Card>
      <Card title="Kullanıcılar">
        {!users ? (
          <p className="text-slate-500">Yükleniyor…</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {u.name || u.email} {u.id === me.id && <span className="text-xs font-normal text-slate-500">(sen)</span>}
                    {!u.is_active && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">Pasif</span>}
                    {u.must_change_password && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">İlk giriş bekleniyor</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {u.email} · son giriş {fmtDate(u.last_login_at, true)}
                  </p>
                </div>
                {u.id !== me.id && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select className={`${inputCls} w-auto py-1 text-xs`} value={u.role} disabled={busy} onChange={(e) => void act(() => api('users.update', { id: u.id, role: e.target.value, isActive: u.is_active }))}>
                      <option value="owner">Yönetici</option>
                      <option value="editor">Editör</option>
                      <option value="viewer">İzleyici</option>
                    </select>
                    <Button size="sm" disabled={busy} onClick={() => void act(() => api('users.update', { id: u.id, role: u.role, isActive: !u.is_active }))}>
                      {u.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          if (!window.confirm(`${u.email} için yeni geçici şifre oluşturulsun mu?`)) return
                          const res = await api<{ password: string }>('users.resetPassword', { id: u.id })
                          setSecret({ email: u.email, password: res.password })
                        })
                      }
                    >
                      Şifre sıfırla
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={() => void act(async () => (window.confirm(`${u.email} silinsin mi?`) ? void (await api('users.remove', { id: u.id })) : undefined))}
                    >
                      Sil
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function AccountSettings({ me }: { me: Me }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold">Hesabım</h1>
      <Card title={me.email} subtitle={`${me.companyName} · ${ROLE_HELP[me.role]}`}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setMsg(null)
            try {
              const res = await fetch('/api/dpp/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'password', current, next }) })
              const data = await res.json().catch(() => ({}))
              if (!res.ok) throw new Error(data.error || 'Değiştirilemedi')
              setMsg({ tone: 'success', text: 'Şifren değiştirildi' })
              setCurrent('')
              setNext('')
            } catch (err) {
              setMsg({ tone: 'error', text: err instanceof Error ? err.message : 'Değiştirilemedi' })
            } finally {
              setBusy(false)
            }
          }}
        >
          <Field label="Mevcut şifre">
            <input className={inputCls} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
          <Field label="Yeni şifre" hint="En az 8 karakter">
            <input className={inputCls} type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
          </Field>
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Kaydediliyor…' : 'Şifreyi değiştir'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
