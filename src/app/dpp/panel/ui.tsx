'use client'

import { upload } from '@vercel/blob/client'
import { useRef, useState, type ReactNode } from 'react'
import { msg } from '@/lib/dpp/i18n'
import { panelLang, useT } from './i18n'

// DPP paneli ortak arayüz parçaları ve API yardımcıları.

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

export async function api<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch('/api/dpp/panel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-dpp-lang': panelLang() },
    body: JSON.stringify({ action, ...payload }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new Event('dpp:logout'))
    throw new ApiError(data.error || msg(panelLang(), 'err_generic'), res.status)
  }
  return data as T
}

/** Oturum API'si (giriş, çıkış, şifre) */
export async function authApi(payload: Record<string, unknown>) {
  const res = await fetch('/api/dpp/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-dpp-lang': panelLang() },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || msg(panelLang(), 'err_generic'), res.status)
  return data
}

/** Dosyayı firmanın klasörüne doğrudan Blob'a yükler; dönen URL kaydetme işlemine gönderilir. */
export async function uploadFile(companyId: string, file: File, onProgress?: (p: number) => void) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)
  const blob = await upload(`dpp/${companyId}/${Date.now()}.${ext}`, file, {
    access: 'private',
    handleUploadUrl: '/api/dpp/upload',
    clientPayload: JSON.stringify({ lang: panelLang() }),
    contentType: file.type || undefined,
    multipart: file.size > 8 * 1024 * 1024,
    onUploadProgress: ({ percentage }) => onProgress?.(percentage),
  })
  return blob.url
}

export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  const href = URL.createObjectURL(new Blob([type.startsWith('text/csv') ? '﻿' + text : text], { type }))
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(href), 3000)
}

export const csvCell = (v: unknown) => {
  const s = String(v ?? '')
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500'

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'; size?: 'sm' | 'md' }) {
  const v = {
    primary: 'bg-[#0f3d5e] text-white hover:bg-[#0b2f49]',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
    danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }[variant]
  const s = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
  return (
    <button type="button" {...props} className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${v} ${s} ${className}`}>
      {children}
    </button>
  )
}

export function Card({ title, subtitle, actions, children, className = '' }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Field({ label, hint, children, className = '' }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

/** Belirgin dosya seçici: büyük, kesik çizgili alan + seçilen dosyanın adı ve boyutu. */
export function FilePicker({ accept, file, onChange, disabled }: { accept: string; file: File | null; onChange: (f: File | null) => void; disabled?: boolean }) {
  const { t, number } = useT()
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        if (!disabled && e.dataTransfer.files[0]) onChange(e.dataTransfer.files[0])
      }}
      className={`flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition ${drag ? 'border-sky-500 bg-sky-50' : file ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-300 bg-slate-50'}`}
    >
      <input ref={ref} type="file" accept={accept} className="hidden" disabled={disabled} onChange={(e) => onChange(e.target.files?.[0] || null)} />
      <Button variant="primary" size="sm" disabled={disabled} onClick={() => ref.current?.click()}>
        {t('doc_choose')}
      </Button>
      <span className="min-w-0 flex-1 text-sm">
        {file ? (
          <>
            <span className="block truncate font-semibold text-slate-800">{file.name}</span>
            <span className="text-xs text-slate-500">{number(Math.max(1, Math.round(file.size / 1024)))} KB</span>
          </>
        ) : (
          <>
            <span className="block text-slate-600">{t('doc_no_file')}</span>
            <span className="text-xs text-slate-400">{t('doc_drop')}</span>
          </>
        )}
      </span>
      {file && !disabled && (
        <button type="button" className="text-slate-400 hover:text-slate-700" aria-label={t('delete')} onClick={() => (onChange(null), ref.current && (ref.current.value = ''))}>
          ✕
        </button>
      )}
    </div>
  )
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info' | 'warn'; children: ReactNode }) {
  const cls = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
  }[tone]
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>
}

export function StatusBadge({ status, changes }: { status: string; changes?: boolean }) {
  const { t } = useT()
  const map: Record<string, [string, string]> = {
    draft: [t('st_draft'), 'bg-slate-100 text-slate-700'],
    published: [t('st_published'), 'bg-emerald-100 text-emerald-800'],
    archived: [t('st_archived'), 'bg-amber-100 text-amber-800'],
  }
  const [label, cls] = map[status] || [status, 'bg-slate-100 text-slate-700']
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
      {changes && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">{t('st_unpublished_changes')}</span>}
    </span>
  )
}

export function Empty({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="text-4xl">{icon}</p>
      <p className="mt-3 font-semibold text-slate-800">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  )
}
