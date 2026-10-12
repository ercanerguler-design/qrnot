'use client'

import { useState } from 'react'
import BackToPrevious from '@/components/BackToPrevious'

interface MenuItem {
  names: Record<string, string>
  description: Record<string, string>
  price: string
}

interface MenuSection {
  key: string
  names: Record<string, string>
  items: MenuItem[]
}

interface MenuConfig {
  languages: string[]
  sections: MenuSection[]
}

interface Props {
  hotelName: string
  hotelCode: string
  title: string
  menu: MenuConfig
  initialLang: string
}

function languageLabel(lang: string) {
  if (lang === 'tr') return 'TR'
  if (lang === 'en') return 'EN'
  if (lang === 'de') return 'DE'
  return lang.toUpperCase()
}

export default function HotelMenuClient({ hotelName, hotelCode, title, menu, initialLang }: Props) {
  const availableLanguages = menu.languages.length > 0 ? menu.languages : ['tr']
  const defaultLang = availableLanguages.includes(initialLang) ? initialLang : availableLanguages[0]
  const [selectedLang, setSelectedLang] = useState(defaultLang)

  const sections = menu.sections.map((section) => ({
    ...section,
    displayName: section.names[selectedLang] || section.names[availableLanguages[0]] || section.key,
    items: section.items.map((item) => ({
      ...item,
      displayName: item.names[selectedLang] || item.names[availableLanguages[0]] || '-',
      displayDescription: item.description[selectedLang] || item.description[availableLanguages[0]] || '',
    })),
  }))

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-3">
          <BackToPrevious fallbackHref="/hotel" />
        </div>
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            QRNot Hotel Menu
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-neutral-300">
            {hotelName} ({hotelCode})
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLang(lang)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                  selectedLang === lang
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {languageLabel(lang)}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-6">
            {sections.length === 0 ? (
              <p className="text-sm text-neutral-400">Menu icerigi yakinda eklenecek.</p>
            ) : (
              sections.map((section) => (
                <section key={section.key} className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <h2 className="text-lg font-bold text-emerald-300">{section.displayName}</h2>

                  <div className="mt-3 space-y-3">
                    {section.items.map((item, index) => (
                      <article key={`${section.key}-${index}`} className="rounded-xl border border-neutral-800 px-3 py-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{item.displayName}</p>
                            {item.displayDescription ? (
                              <p className="mt-1 text-xs text-neutral-400">{item.displayDescription}</p>
                            ) : null}
                          </div>
                          <p className="text-sm font-bold text-sky-300 whitespace-nowrap">{item.price || '-'}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
