'use client'

import { useMemo, useState } from 'react'
import type { EducationSupportConfig } from '@/lib/education'
import BackToPrevious from '@/components/BackToPrevious'

interface Props {
  hotelName: string
  hotelCode: string
  slug: string
  title: string
  config: EducationSupportConfig
  initialLang: string
}

function languageLabel(lang: string) {
  if (lang === 'tr') return 'TR'
  if (lang === 'en') return 'EN'
  if (lang === 'de') return 'DE'
  return lang.toUpperCase()
}

export default function EducationSupportClient({ hotelName, hotelCode, slug, title, config, initialLang }: Props) {
  const availableLanguages = config.languages.length > 0 ? config.languages : ['tr']
  const [lang, setLang] = useState(availableLanguages.includes(initialLang) ? initialLang : availableLanguages[0])
  const [requesterName, setRequesterName] = useState('')
  const [requesterRole, setRequesterRole] = useState('teacher')
  const [categoryKey, setCategoryKey] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [contactPhone, setContactPhone] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [manualWhatsAppUrl, setManualWhatsAppUrl] = useState<string | null>(null)

  const categories = useMemo(
    () =>
      config.categories.map((category) => ({
        ...category,
        title: category.titles[lang] || category.titles.en || category.titles.tr || category.key,
      })),
    [config.categories, lang]
  )

  const handleSubmit = async () => {
    if (!requesterName.trim() || !categoryKey || !details.trim()) {
      setError('Ad, kategori ve detay gerekli')
      return
    }

    setError(null)
    setSuccess(null)
    setManualWhatsAppUrl(null)

    try {
      const res = await fetch('/api/hotel/module/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelCode,
          slug,
          lang,
          guestName: requesterName,
          requesterRole,
          categoryKey,
          priority,
          details,
          contactPhone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Talep oluşturulamadı')

      setSuccess('Destek talebi kaydedildi')
      setManualWhatsAppUrl(String(data.manualWhatsAppUrl || '') || null)
      setDetails('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 space-y-4">
        <BackToPrevious fallbackHref="/education" />
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
        <p className="text-sm text-neutral-400">{hotelName} ({hotelCode})</p>

        <div className="flex gap-2 flex-wrap">
          {availableLanguages.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => setLang(language)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${lang === language ? 'bg-amber-600 border-amber-500' : 'bg-neutral-800 border-neutral-700'}`}
            >
              {languageLabel(language)}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Talep Sahibi" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <select value={requesterRole} onChange={(e) => setRequesterRole(e.target.value)} className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3">
            <option value="teacher">teacher</option>
            <option value="student">student</option>
            <option value="parent">parent</option>
            <option value="admin">admin</option>
          </select>
          <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)} className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3">
            <option value="">Kategori seç</option>
            {categories.map((category) => (
              <option key={category.key} value={category.key}>{category.title} [{category.department}]</option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3">
            <option value="low">low</option>
            <option value="normal">normal</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Telefon (opsiyonel)" className="sm:col-span-2 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
        </div>

        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={5} placeholder="Talep detayı" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />

        <button type="button" onClick={() => void handleSubmit()} className="rounded-xl bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500">
          Destek Talebi Gönder
        </button>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
        {manualWhatsAppUrl ? (
          <a href={manualWhatsAppUrl} target="_blank" rel="noreferrer" className="text-sm text-sky-300 underline">
            WhatsApp&apos;a manuel ilet
          </a>
        ) : null}
      </div>
    </main>
  )
}
