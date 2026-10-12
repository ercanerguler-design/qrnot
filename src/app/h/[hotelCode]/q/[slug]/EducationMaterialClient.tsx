'use client'

import { useMemo, useState } from 'react'
import type { EducationMaterialConfig } from '@/lib/education'
import BackToPrevious from '@/components/BackToPrevious'

interface Props {
  hotelName: string
  hotelCode: string
  slug: string
  title: string
  config: EducationMaterialConfig
  initialLang: string
}

function languageLabel(lang: string) {
  if (lang === 'tr') return 'TR'
  if (lang === 'en') return 'EN'
  if (lang === 'de') return 'DE'
  return lang.toUpperCase()
}

export default function EducationMaterialClient({ hotelName, hotelCode, slug, title, config, initialLang }: Props) {
  const availableLanguages = config.languages.length > 0 ? config.languages : ['tr']
  const [lang, setLang] = useState(availableLanguages.includes(initialLang) ? initialLang : availableLanguages[0])
  const [studentNo, setStudentNo] = useState('')
  const [studentName, setStudentName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const displayItems = useMemo(
    () =>
      config.items.map((item) => ({
        ...item,
        title: item.titles[lang] || item.titles.en || item.titles.tr || item.key,
      })),
    [config.items, lang]
  )

  const handleOpenMaterial = async (materialKey: string) => {
    setError(null)
    try {
      const res = await fetch('/api/hotel/module/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelCode, slug, lang, materialKey, studentNo, studentName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Materyal açılamadı')

      const targetUrl = String(data.materialUrl || '')
      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 space-y-4">
        <BackToPrevious fallbackHref="/education" />
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
        <p className="text-sm text-neutral-400">{hotelName} ({hotelCode})</p>
        <p className="text-sm text-neutral-300">Sınıf: {config.classCode} | Ders: {config.lessonName}</p>

        <div className="flex gap-2 flex-wrap">
          {availableLanguages.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => setLang(language)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${lang === language ? 'bg-sky-600 border-sky-500' : 'bg-neutral-800 border-neutral-700'}`}
            >
              {languageLabel(language)}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <input value={studentNo} onChange={(e) => setStudentNo(e.target.value)} placeholder="Öğrenci No (opsiyonel)" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Öğrenci Adı (opsiyonel)" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
        </div>

        <div className="space-y-2">
          {displayItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => void handleOpenMaterial(item.key)}
              className="w-full text-left rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 hover:bg-neutral-900 transition"
            >
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs text-neutral-400">{item.materialType.toUpperCase()}</p>
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </main>
  )
}
