'use client'

import { useMemo, useState } from 'react'
import type { EducationParentTeacherConfig } from '@/lib/education'
import BackToPrevious from '@/components/BackToPrevious'

interface Props {
  hotelName: string
  hotelCode: string
  slug: string
  title: string
  config: EducationParentTeacherConfig
  initialLang: string
}

function languageLabel(lang: string) {
  if (lang === 'tr') return 'TR'
  if (lang === 'en') return 'EN'
  if (lang === 'de') return 'DE'
  return lang.toUpperCase()
}

export default function EducationParentTeacherClient({ hotelName, hotelCode, slug, title, config, initialLang }: Props) {
  const availableLanguages = config.languages.length > 0 ? config.languages : ['tr']
  const [lang, setLang] = useState(availableLanguages.includes(initialLang) ? initialLang : availableLanguages[0])
  const [studentNo, setStudentNo] = useState('')
  const [studentName, setStudentName] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [teacherKey, setTeacherKey] = useState('')
  const [requestedTime, setRequestedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [manualWhatsAppUrl, setManualWhatsAppUrl] = useState<string | null>(null)

  const teachers = useMemo(
    () =>
      config.teachers.map((teacher) => ({
        ...teacher,
        name: teacher.names[lang] || teacher.names.en || teacher.names.tr || teacher.key,
      })),
    [config.teachers, lang]
  )

  const handleSubmit = async () => {
    if (!studentNo.trim() || !studentName.trim() || !parentName.trim() || !teacherKey || !requestedTime.trim()) {
      setError('Öğrenci, veli, öğretmen ve zaman gerekli')
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
          studentNo,
          studentName,
          parentName,
          parentPhone,
          teacherKey,
          requestedTime,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Talep gönderilemedi')

      setSuccess('Randevu talebi alındı')
      setManualWhatsAppUrl(String(data.manualWhatsAppUrl || '') || null)
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
        <p className="text-sm text-neutral-300">Sınıf: {config.classCode}</p>

        <div className="flex gap-2 flex-wrap">
          {availableLanguages.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => setLang(language)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${lang === language ? 'bg-rose-600 border-rose-500' : 'bg-neutral-800 border-neutral-700'}`}
            >
              {languageLabel(language)}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <input value={studentNo} onChange={(e) => setStudentNo(e.target.value)} placeholder="Öğrenci No" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Öğrenci Adı" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Veli Adı" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="Veli Telefonu" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <select value={teacherKey} onChange={(e) => setTeacherKey(e.target.value)} className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3">
            <option value="">Öğretmen seç</option>
            {teachers.map((teacher) => (
              <option key={teacher.key} value={teacher.key}>{teacher.name}</option>
            ))}
          </select>
          <input value={requestedTime} onChange={(e) => setRequestedTime(e.target.value)} placeholder="Randevu zamanı (ör: 2026-05-15 14:30)" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
        </div>

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Görüşme notu (opsiyonel)" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />

        <button type="button" onClick={() => void handleSubmit()} className="rounded-xl bg-rose-600 px-5 py-3 font-semibold hover:bg-rose-500">
          Randevu Talebi Gönder
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
