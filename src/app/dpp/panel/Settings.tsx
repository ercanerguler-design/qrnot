'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MsgKey } from '@/lib/dpp/i18n'
import { useT } from './i18n'
import type { Me } from './PanelApp'
import { Alert, api, authApi, Button, Card, Field, inputCls } from './ui'

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
  plan: string
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

const ROLE_HELP: Record<TeamUser['role'], MsgKey> = { owner: 'rh_owner', editor: 'rh_editor', viewer: 'rh_viewer' }

export default function Settings({ section, me }: { section: 'company' | 'users' | 'account'; me: Me }) {
  if (section === 'company') return <CompanySettings me={me} />
  if (section === 'users') return <TeamSettings me={me} />
  return <AccountSettings me={me} />
}

function CompanySettings({ me }: { me: Me }) {
  const { t, number } = useT()
  const [c, setC] = useState<Company | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const isOwner = me.role === 'owner'

  const load = useCallback(async () => {
    try {
      setC((await api<{ company: Company }>('company.get')).company)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('err_load'))
    }
  }, [t])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  if (!c) return error ? <Alert>{error}</Alert> : <p className="text-slate-500">{t('loading')}</p>
  const set = (k: keyof Company, v: string) => {
    setC({ ...c, [k]: v })
    setSaved(false)
  }
  const accessLink = c.restricted_key ? `${window.location.origin}/p/${t('ra_placeholder')}?k=${c.restricted_key}` : ''

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t('nav_company')}</h1>
      {error && <Alert>{error}</Alert>}
      {saved && <Alert tone="success">{t('co_saved')}</Alert>}
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Card title={t('co_profile')} subtitle={isOwner ? undefined : t('co_owner_only')}>
          <fieldset disabled={!isOwner} className="grid gap-4 sm:grid-cols-2">
            <Field label={t('f_company_name')} className="sm:col-span-2">
              <input className={inputCls} value={c.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label={t('f_country')}>
              <input className={`${inputCls} uppercase`} dir="ltr" maxLength={2} value={c.country} onChange={(e) => set('country', e.target.value.toUpperCase())} />
            </Field>
            <Field label={t('f_tax')}>
              <input className={inputCls} value={c.tax_id} onChange={(e) => set('tax_id', e.target.value)} />
            </Field>
            <Field label={t('f_address')} className="sm:col-span-2">
              <textarea className={`${inputCls} min-h-16`} value={c.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label={t('f_website')}>
              <input className={inputCls} dir="ltr" placeholder="https://" value={c.website} onChange={(e) => set('website', e.target.value)} />
            </Field>
            <Field label={t('f_email')}>
              <input className={inputCls} dir="ltr" type="email" value={c.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label={t('f_phone')}>
              <input className={inputCls} dir="ltr" value={c.phone} onChange={(e) => set('phone', e.target.value)} />
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
                  setError(err instanceof Error ? err.message : t('err_save'))
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? t('saving') : t('save')}
            </Button>
          )}
        </Card>
        <div className="space-y-5">
          <Card title={t('co_plan')}>
            <p className="text-2xl font-bold">{t(`plan_${c.plan}` as MsgKey)}</p>
            <p className="mt-1 text-sm text-slate-500">{t('co_plan_line', { used: number(c.used), limit: number(c.product_limit), code: c.code })}</p>
            <p className="mt-3 text-xs text-slate-500">{t('co_plan_note')}</p>
          </Card>
          {isOwner && c.restricted_key && (
            <Card title={t('ra_title')} subtitle={t('ra_sub')}>
              <p className="text-sm text-slate-600">{t('ra_desc')}</p>
              <p className="mt-2 break-all rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs" dir="ltr">
                ?k={c.restricted_key}
              </p>
              <p className="mt-2 break-all text-xs text-slate-500" dir="ltr">
                {t('ra_example', { url: accessLink })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void navigator.clipboard.writeText(`?k=${c.restricted_key}`)}>
                  {t('copy')}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    if (!window.confirm(t('ra_confirm_rotate'))) return
                    const res = await api<{ restrictedKey: string }>('company.rotateKey')
                    setC({ ...c, restricted_key: res.restrictedKey })
                  }}
                >
                  {t('ra_rotate')}
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
  const { t, date } = useT()
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
      setError(err instanceof Error ? err.message : t('err_load'))
    }
  }, [t])
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
      setError(err instanceof Error ? err.message : t('err_generic'))
    } finally {
      setBusy(false)
    }
  }

  const secretText = secret ? `${window.location.origin}/dpp/panel\n${t('f_email')}: ${secret.email}\n${t('tm_temp_pw')}: ${secret.password}` : ''

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t('nav_team')}</h1>
      {error && <Alert>{error}</Alert>}
      {secret && (
        <Alert tone="success">
          <p className="font-semibold">{t('tm_secret_title')}</p>
          <p className="mt-2 whitespace-pre-line font-mono" dir="ltr">
            {secretText}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => void navigator.clipboard.writeText(secretText)}>
              {t('copy')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSecret(null)}>
              {t('close')}
            </Button>
          </div>
          <p className="mt-2 text-xs">{t('tm_first_login')}</p>
        </Alert>
      )}
      <Card title={t('tm_add_title')}>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_16rem_auto] sm:items-end">
          <Field label={t('f_email')}>
            <input className={inputCls} dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label={t('f_full_name')}>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('f_role')}>
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as TeamUser['role'])}>
              {(Object.keys(ROLE_HELP) as Array<TeamUser['role']>).map((k) => (
                <option key={k} value={k}>
                  {t(ROLE_HELP[k])}
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
            {t('add')}
          </Button>
        </div>
      </Card>
      <Card title={t('tm_users')}>
        {!users ? (
          <p className="text-slate-500">{t('loading')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {u.name || u.email} {u.id === me.id && <span className="text-xs font-normal text-slate-500">{t('tm_you')}</span>}
                    {!u.is_active && <span className="ms-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">{t('tm_inactive')}</span>}
                    {u.must_change_password && <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{t('tm_pending')}</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span dir="ltr">{u.email}</span> · {t(`role_${u.role}` as MsgKey)} · {t('tm_last_login', { d: date(u.last_login_at, true) })}
                  </p>
                </div>
                {u.id !== me.id && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select className={`${inputCls} w-auto py-1 text-xs`} value={u.role} disabled={busy} onChange={(e) => void act(() => api('users.update', { id: u.id, role: e.target.value, isActive: u.is_active }))}>
                      <option value="owner">{t('role_owner')}</option>
                      <option value="editor">{t('role_editor')}</option>
                      <option value="viewer">{t('role_viewer')}</option>
                    </select>
                    <Button size="sm" disabled={busy} onClick={() => void act(() => api('users.update', { id: u.id, role: u.role, isActive: !u.is_active }))}>
                      {u.is_active ? t('tm_deactivate') : t('tm_activate')}
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          if (!window.confirm(t('tm_confirm_reset', { email: u.email }))) return
                          const res = await api<{ password: string }>('users.resetPassword', { id: u.id })
                          setSecret({ email: u.email, password: res.password })
                        })
                      }
                    >
                      {t('tm_reset')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          if (!window.confirm(t('tm_confirm_delete', { email: u.email }))) return
                          await api('users.remove', { id: u.id })
                        })
                      }
                    >
                      {t('delete')}
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
  const { t } = useT()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold">{t('nav_account')}</h1>
      <Card title={me.email} subtitle={`${me.companyName} · ${t(ROLE_HELP[me.role])}`}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setMsg(null)
            try {
              await authApi({ action: 'password', current, next })
              setMsg({ tone: 'success', text: t('acc_changed') })
              setCurrent('')
              setNext('')
            } catch (err) {
              setMsg({ tone: 'error', text: err instanceof Error ? err.message : t('err_pw_change') })
            } finally {
              setBusy(false)
            }
          }}
        >
          <Field label={t('f_current_pw')}>
            <input className={inputCls} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
          <Field label={t('f_new_pw')} hint={t('hint_min8')}>
            <input className={inputCls} type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
          </Field>
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? t('saving') : t('acc_btn')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
