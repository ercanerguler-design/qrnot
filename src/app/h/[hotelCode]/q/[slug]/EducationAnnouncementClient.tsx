'use client'

import { useMemo, useState } from 'react'
import type { EducationAnnouncementConfig } from '@/lib/education'
import BackToPrevious from '@/components/BackToPrevious'

interface Props {
  hotelName: string
  hotelCode: string
  slug: string
  title: string
  config: EducationAnnouncementConfig
  initialLang: string
}

function languageLabel(lang: string) {
  if (lang === 'tr') return 'TR'
  if (lang === 'en') return 'EN'
  if (lang === 'de') return 'DE'
  return lang.toUpperCase()
}

export default function EducationAnnouncementClient({ hotelName, hotelCode, slug, title, config, initialLang }: Props) {
  const availableLanguages = config.languages.length > 0 ? config.languages : ['tr']
  const [lang, setLang] = useState(availableLanguages.includes(initialLang) ? initialLang : availableLanguages[0])
  const [studentNo, setStudentNo] = useState('')
  const [studentName, setStudentName] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [eventResponse, setEventResponse] = useState<'accepted' | 'declined'>('accepted')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const text = useMemo(
    () => ({
      title: config.titles[lang] || config.titles.en || config.titles.tr || title,
      description: config.descriptions[lang] || config.descriptions.en || config.descriptions.tr || '',
    }),
    [config.descriptions, config.titles, lang, title]
  )

  const handleSubmit = async () => {
    if (!studentNo.trim() || !studentName.trim()) {
      setError('Öğrenci no ve adı gerekli')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/hotel/module/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelCode,
          slug,
          lang,
          studentNo,
          studentName,
          parentName,
          parentPhone,
          eventResponse,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kayıt başarısız')
      setSuccess('Etkinlik yanıtı kaydedildi')
      setNotes('')
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
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${lang === language ? 'bg-pink-600 border-pink-500' : 'bg-neutral-800 border-neutral-700'}`}
            >
              {languageLabel(language)}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
          <p className="text-lg font-semibold">{text.title}</p>
          <p className="text-sm text-neutral-300 mt-2">{text.description}</p>
          {config.eventDate ? <p className="text-xs text-neutral-500 mt-2">Etkinlik: {config.eventDate}</p> : null}
          <p className="text-xs text-neutral-500 mt-1">Sınıf/Şube: {config.classCode}/{config.branchCode}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <input value={studentNo} onChange={(e) => setStudentNo(e.target.value)} placeholder="Öğrenci No" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Öğrenci Adı" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Veli Adı (opsiyonel)" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="Veli Telefonu (opsiyonel)" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
        </div>

        <select value={eventResponse} onChange={(e) => setEventResponse(e.target.value as 'accepted' | 'declined')} className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3">
          <option value="accepted">Katılacağım</option>
          <option value="declined">Katılamayacağım</option>
        </select>

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Not (opsiyonel)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />

        <button type="button" onClick={() => void handleSubmit()} className="rounded-xl bg-pink-600 px-5 py-3 font-semibold hover:bg-pink-500">
          Yanıtı Gönder
        </button>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
      </div>
    </main>
  )
}
