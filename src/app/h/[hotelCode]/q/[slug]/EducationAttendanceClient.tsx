'use client'

import { useState } from 'react'
import type { EducationAttendanceConfig } from '@/lib/education'
import BackToPrevious from '@/components/BackToPrevious'

interface Props {
  hotelName: string
  hotelCode: string
  slug: string
  title: string
  config: EducationAttendanceConfig
  initialLang: string
}

function languageLabel(lang: string) {
  if (lang === 'tr') return 'TR'
  if (lang === 'en') return 'EN'
  if (lang === 'de') return 'DE'
  return lang.toUpperCase()
}

export default function EducationAttendanceClient({ hotelName, hotelCode, slug, title, config, initialLang }: Props) {
  const availableLanguages = config.languages.length > 0 ? config.languages : ['tr']
  const [lang, setLang] = useState(availableLanguages.includes(initialLang) ? initialLang : availableLanguages[0])
  const [studentNo, setStudentNo] = useState('')
  const [studentName, setStudentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [scanTime, setScanTime] = useState('')
  const [notifyParent, setNotifyParent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [manualWhatsAppUrl, setManualWhatsAppUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!studentNo.trim() || !studentName.trim()) {
      setError('Öğrenci no ve adı gerekli')
      return
    }

    setLoading(true)
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
          parentPhone,
          scanTime,
          notifyParent,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kayıt başarısız')

      const statusMap: Record<string, string> = {
        on_time: 'Zamanında',
        late: 'Geç',
        early_leave: 'Erken çıkış',
      }
      setSuccess(`Yoklama kaydı alındı (${statusMap[String(data.entryStatus || 'on_time')] || 'Zamanında'})`)
      setManualWhatsAppUrl(String(data.manualWhatsAppUrl || '') || null)
      setStudentNo('')
      setStudentName('')
      setScanTime('')
      setNotifyParent(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 space-y-4">
        <BackToPrevious fallbackHref="/education" />
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
        <p className="text-sm text-neutral-400">{hotelName} ({hotelCode})</p>
        <p className="text-sm text-neutral-300">Sınıf: {config.classCode} | Ders: {config.lessonName} | Saat: {config.scheduledStart} - {config.scheduledEnd}</p>

        <div className="flex gap-2 flex-wrap">
          {availableLanguages.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => setLang(language)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${lang === language ? 'bg-emerald-600 border-emerald-500' : 'bg-neutral-800 border-neutral-700'}`}
            >
              {languageLabel(language)}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <input value={studentNo} onChange={(e) => setStudentNo(e.target.value)} placeholder="Öğrenci No" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Öğrenci Adı" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="Veli Telefonu (opsiyonel)" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <input value={scanTime} onChange={(e) => setScanTime(e.target.value)} placeholder="Tarama saati (HH:MM)" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={notifyParent}
            onChange={(e) => setNotifyParent(e.target.checked)}
            disabled={!config.parentNotificationEnabled}
          />
          Veliye bildirim gönder (opsiyonel)
        </label>

        <button type="button" onClick={() => void handleSubmit()} disabled={loading} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-70">
          {loading ? 'Kaydediliyor...' : 'Yoklamayı Kaydet'}
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
