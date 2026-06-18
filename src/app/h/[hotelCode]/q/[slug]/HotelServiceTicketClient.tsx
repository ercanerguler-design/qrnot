'use client'

import { useMemo, useState } from 'react'
import AudioRecorder from '@/components/AudioRecorder'
import BackToPrevious from '@/components/BackToPrevious'

interface ServiceTicketCategory {
  key: string
  department: 'housekeeping' | 'technical' | 'concierge'
  names: Record<string, string>
}

interface ServiceTicketConfig {
  languages: string[]
  categories: ServiceTicketCategory[]
}

interface Props {
  hotelName: string
  hotelCode: string
  slug: string
  title: string
  config: ServiceTicketConfig
  initialLang: string
  initialRoomNo: string
  initialFloorLabel: string
  initialSourceTag: string
}

function languageLabel(lang: string) {
  if (lang === 'tr') return 'TR'
  if (lang === 'en') return 'EN'
  if (lang === 'de') return 'DE'
  return lang.toUpperCase()
}

type UiLang = 'tr' | 'en' | 'de'

function resolveUiLang(lang: string): UiLang {
  if (lang === 'tr' || lang === 'en' || lang === 'de') return lang
  return 'tr'
}

export default function HotelServiceTicketClient({
  hotelName,
  hotelCode,
  slug,
  title,
  config,
  initialLang,
  initialRoomNo,
  initialFloorLabel,
  initialSourceTag,
}: Props) {
  const availableLanguages = config.languages.length > 0 ? config.languages : ['tr']
  const defaultLang = availableLanguages.includes(initialLang) ? initialLang : availableLanguages[0]
  const [selectedLang, setSelectedLang] = useState(defaultLang)
  const [roomNo, setRoomNo] = useState(initialRoomNo)
  const [guestName, setGuestName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [requestedTime, setRequestedTime] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<'all' | 'housekeeping' | 'technical' | 'concierge'>('all')
  const [categoryKey, setCategoryKey] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [manualWhatsAppUrl, setManualWhatsAppUrl] = useState<string | null>(null)
  const [voiceNoteFile, setVoiceNoteFile] = useState<File | null>(null)
  const uiLang = resolveUiLang(selectedLang)

  const t = {
    validationRequired: uiLang === 'tr'
      ? 'Oda no, kategori ve detay gerekli'
      : uiLang === 'de'
        ? 'Zimmernummer, Kategorie und Details sind erforderlich'
        : 'Room number, category, and details are required',
    submitFailed: uiLang === 'tr'
      ? 'Talep gonderilemedi'
      : uiLang === 'de'
        ? 'Anfrage konnte nicht gesendet werden'
        : 'Request could not be sent',
    sentSuccess: uiLang === 'tr'
      ? 'Talebin alindi. WhatsApp ile otomatik iletildi.'
      : uiLang === 'de'
        ? 'Anfrage erhalten. Automatisch per WhatsApp gesendet.'
        : 'Request received. Sent automatically via WhatsApp.',
    fallbackSuccess: uiLang === 'tr'
      ? 'Talebin alindi, ekibe iletildi.'
      : uiLang === 'de'
        ? 'Anfrage erhalten und an das Team weitergeleitet.'
        : 'Request received and forwarded to the team.',
    manualSend: uiLang === 'tr'
      ? 'WhatsApp\'a manuel ilet'
      : uiLang === 'de'
        ? 'Manuell per WhatsApp senden'
        : 'Send manually via WhatsApp',
  }

  const displayCategories = useMemo(
    () =>
      config.categories.map((item) => ({
        ...item,
        displayName: item.names[selectedLang] || item.names.en || item.names.tr || item.key,
      })),
    [config.categories, selectedLang]
  )

  const filteredCategories = useMemo(
    () =>
      displayCategories.filter((item) => departmentFilter === 'all' || item.department === departmentFilter),
    [departmentFilter, displayCategories]
  )

  const quickActions = useMemo(() => {
    const pick = (key: string) => displayCategories.find((item) => item.key === key)
    return [pick('taxi-call'), pick('room-cleaning'), pick('air-conditioning'), pick('late-checkout'), pick('wake-up-call')].filter(
      (item): item is NonNullable<typeof item> => Boolean(item)
    )
  }, [displayCategories])

  const handleSubmit = async () => {
    if (!roomNo.trim() || !categoryKey || !details.trim()) {
      setError(t.validationRequired)
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setManualWhatsAppUrl(null)

    try {
      const payload = {
        hotelCode,
        slug,
        roomNo,
        floorLabel: initialFloorLabel,
        sourceTag: initialSourceTag,
        guestName,
        contactPhone,
        requestedTime,
        lang: selectedLang,
        categoryKey,
        priority,
        details,
      }

      const res = voiceNoteFile
        ? await (async () => {
            const formData = new FormData()
            formData.set('hotelCode', payload.hotelCode)
            formData.set('slug', payload.slug)
            formData.set('roomNo', payload.roomNo)
            formData.set('floorLabel', payload.floorLabel)
            formData.set('sourceTag', payload.sourceTag)
            formData.set('guestName', payload.guestName)
            formData.set('contactPhone', payload.contactPhone)
            formData.set('requestedTime', payload.requestedTime)
            formData.set('lang', payload.lang)
            formData.set('categoryKey', payload.categoryKey)
            formData.set('priority', payload.priority)
            formData.set('details', payload.details)
            formData.set('voiceNote', voiceNoteFile)
            return fetch('/api/hotel/module/submit', { method: 'POST', body: formData })
          })()
        : await fetch('/api/hotel/module/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || t.submitFailed)
      }

      const whatsappDelivery = String(data.whatsappDelivery || '')
      setSuccess(whatsappDelivery === 'sent' ? t.sentSuccess : t.fallbackSuccess)
      setManualWhatsAppUrl(whatsappDelivery === 'sent' ? null : (data.manualWhatsAppUrl || null))
      setDetails('')
      setVoiceNoteFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunucu hatasi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-3">
          <BackToPrevious fallbackHref="/hotel" />
        </div>
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
            QRNot Service Ticket
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
          <p className="text-sm text-neutral-300">{hotelName} ({hotelCode})</p>

          <div className="flex flex-wrap gap-2">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLang(lang)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                  selectedLang === lang
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {languageLabel(lang)}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={roomNo}
              onChange={(event) => setRoomNo(event.target.value)}
              placeholder="Oda numarasi"
              readOnly={Boolean(initialRoomNo)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            />
            <input
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              placeholder="Misafir adi (opsiyonel)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            />
            <input
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder="Iletisim telefonu (opsiyonel)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            />
            <input
              value={requestedTime}
              onChange={(event) => setRequestedTime(event.target.value)}
              placeholder="Istenen saat (or: 21:30)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
            />
          </div>

          {initialRoomNo ? (
            <p className="text-xs text-neutral-400">QR oda tanimi aktif: Oda {initialRoomNo}{initialFloorLabel ? ` / Kat ${initialFloorLabel}` : ''}</p>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs text-neutral-500">Hizli islemler</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => setCategoryKey(action.key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                    categoryKey === action.key
                      ? 'bg-sky-600 border-sky-500 text-white'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                  }`}
                >
                  {action.displayName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setDepartmentFilter('all')}
              className={`rounded-lg border px-3 py-2 text-xs transition ${departmentFilter === 'all' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'}`}
            >
              all
            </button>
            <button
              type="button"
              onClick={() => setDepartmentFilter('housekeeping')}
              className={`rounded-lg border px-3 py-2 text-xs transition ${departmentFilter === 'housekeeping' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'}`}
            >
              housekeeping
            </button>
            <button
              type="button"
              onClick={() => setDepartmentFilter('technical')}
              className={`rounded-lg border px-3 py-2 text-xs transition ${departmentFilter === 'technical' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'}`}
            >
              technical
            </button>
            <button
              type="button"
              onClick={() => setDepartmentFilter('concierge')}
              className={`rounded-lg border px-3 py-2 text-xs transition ${departmentFilter === 'concierge' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'}`}
            >
              concierge
            </button>
          </div>

          <select
            value={categoryKey}
            onChange={(event) => setCategoryKey(event.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
          >
            <option value="">Kategori sec</option>
            {filteredCategories.map((category) => (
              <option key={category.key} value={category.key}>
                {category.displayName} [{category.department}]
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as 'low' | 'normal' | 'high' | 'urgent')}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
          >
            <option value="low">low</option>
            <option value="normal">normal</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>

          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={5}
            placeholder="Talep detayi"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-sky-500"
          />

          <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
            <p className="text-xs text-neutral-400">Bu talep için sesli not (opsiyonel)</p>
            <AudioRecorder onAudioReady={(file) => setVoiceNoteFile(file)} />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="rounded-xl bg-sky-600 px-5 py-3 font-semibold hover:bg-sky-500 transition disabled:opacity-70"
          >
            {submitting ? 'Gonderiliyor...' : 'Talebi Gonder'}
          </button>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
          {manualWhatsAppUrl ? (
            <a href={manualWhatsAppUrl} target="_blank" rel="noreferrer" className="text-sm text-sky-300 underline">
              {t.manualSend}
            </a>
          ) : null}
        </div>
      </div>
    </main>
  )
}
