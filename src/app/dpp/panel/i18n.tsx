'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LOCALES, msg, type MsgKey, type MsgParams } from '@/lib/dpp/i18n'
import { PASSPORT_LABELS } from '@/lib/dpp/passportLabels'
import { DPP_LANG_NAMES, DPP_LANGS, isDppLang, type DppLang } from '@/lib/dpp/types'

// DPP paneli dil bağlamı: seçim tarayıcıda hatırlanır; ilk açılışta tarayıcı dili, yoksa Türkçe.

const STORAGE_KEY = 'qrnot_dpp_lang'
let currentLang: DppLang = 'tr'
/** API çağrıları için geçerli dil (x-dpp-lang başlığı) */
export const panelLang = () => currentLang

interface PanelI18n {
  lang: DppLang
  locale: string
  rtl: boolean
  setLang: (lang: DppLang) => void
  t: (key: MsgKey, params?: MsgParams) => string
  /** Kategori, belge türü gibi pasaportla ortak etiketler */
  labels: (typeof PASSPORT_LABELS)[DppLang]
  date: (value: string | null | undefined, withTime?: boolean) => string
  number: (value: number) => string
}

const Ctx = createContext<PanelI18n | null>(null)

function initialLang(preferred?: DppLang): DppLang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isDppLang(saved)) return saved
  } catch {}
  if (preferred) return preferred
  for (const l of navigator.languages || [navigator.language]) {
    const code = String(l).slice(0, 2).toLowerCase()
    if (isDppLang(code)) return code
  }
  return 'tr'
}

/** preferred: kayıtlı seçim yoksa kullanılacak dil (ör. tedarikçi formunun firma tarafından seçilen dili) */
export function PanelI18nProvider({ children, preferred }: { children: React.ReactNode; preferred?: DppLang }) {
  const [lang, setLangState] = useState<DppLang>(preferred || 'tr')

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setLangState(initialLang(preferred)))
    return () => window.cancelAnimationFrame(raf)
  }, [preferred])

  useEffect(() => {
    currentLang = lang
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: DppLang) => {
    setLangState(next)
    currentLang = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }, [])

  const value = useMemo<PanelI18n>(() => {
    const locale = LOCALES[lang]
    return {
      lang,
      locale,
      rtl: lang === 'ar',
      setLang,
      t: (key, params) => msg(lang, key, params),
      labels: PASSPORT_LABELS[lang],
      date: (value, withTime = false) => {
        if (!value) return '—'
        const d = new Date(value)
        return withTime ? d.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' }) : d.toLocaleDateString(locale)
      },
      number: (value) => value.toLocaleString(locale),
    }
  }, [lang, setLang])

  return (
    <Ctx.Provider value={value}>
      <div dir={value.rtl ? 'rtl' : 'ltr'} lang={lang}>
        {children}
      </div>
    </Ctx.Provider>
  )
}

export function useT() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('PanelI18nProvider eksik')
  return ctx
}

/** Dil seçici (giriş ekranı ve üst menü) */
export function LangSelect({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useT()
  return (
    <label className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2 py-1 text-sm ${className}`}>
      <span aria-hidden>🌐</span>
      <span className="sr-only">{t('language')}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value as DppLang)} className="cursor-pointer bg-transparent py-0.5 outline-none" aria-label={t('language')}>
        {DPP_LANGS.map((l) => (
          <option key={l} value={l}>
            {DPP_LANG_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  )
}
