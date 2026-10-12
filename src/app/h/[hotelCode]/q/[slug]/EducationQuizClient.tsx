'use client'

import { useMemo, useState } from 'react'
import type { EducationQuizConfig } from '@/lib/education'
import BackToPrevious from '@/components/BackToPrevious'

interface Props {
  hotelName: string
  hotelCode: string
  slug: string
  title: string
  config: EducationQuizConfig
  initialLang: string
}

function languageLabel(lang: string) {
  if (lang === 'tr') return 'TR'
  if (lang === 'en') return 'EN'
  if (lang === 'de') return 'DE'
  return lang.toUpperCase()
}

export default function EducationQuizClient({ hotelName, hotelCode, slug, title, config, initialLang }: Props) {
  const availableLanguages = config.languages.length > 0 ? config.languages : ['tr']
  const [lang, setLang] = useState(availableLanguages.includes(initialLang) ? initialLang : availableLanguages[0])
  const [studentNo, setStudentNo] = useState('')
  const [studentName, setStudentName] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const displayQuestions = useMemo(
    () =>
      config.questions.map((question) => ({
        ...question,
        title: question.titles[lang] || question.titles.en || question.titles.tr || question.key,
        choicesView: question.choices.map((choice) => ({
          ...choice,
          label: choice.labels[lang] || choice.labels.en || choice.labels.tr || choice.key,
        })),
      })),
    [config.questions, lang]
  )

  const handleSubmit = async () => {
    if (!studentNo.trim() || !studentName.trim()) {
      setError('Öğrenci no ve adı gerekli')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/hotel/module/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelCode, slug, lang, studentNo, studentName, answers: JSON.stringify(answers) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Quiz gönderimi başarısız')
      setResult(`Sonuç: ${Number(data.score || 0)}/${Number(data.totalQuestions || 0)} (%${Number(data.percentage || 0)})`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatası')
    } finally {
      setLoading(false)
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
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${lang === language ? 'bg-violet-600 border-violet-500' : 'bg-neutral-800 border-neutral-700'}`}
            >
              {languageLabel(language)}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <input value={studentNo} onChange={(e) => setStudentNo(e.target.value)} placeholder="Öğrenci No" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
          <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Öğrenci Adı" className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3" />
        </div>

        <div className="space-y-4">
          {displayQuestions.map((question, index) => (
            <div key={question.key} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
              <p className="font-semibold mb-2">{index + 1}. {question.title}</p>
              <div className="space-y-2">
                {question.choicesView.map((choice) => (
                  <label key={choice.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={question.key}
                      checked={answers[question.key] === choice.key}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.key]: choice.key }))}
                    />
                    {choice.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => void handleSubmit()} disabled={loading} className="rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500 disabled:opacity-70">
          {loading ? 'Gönderiliyor...' : 'Quiz Gönder'}
        </button>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {result ? <p className="text-sm text-emerald-400">{result}</p> : null}
      </div>
    </main>
  )
}
