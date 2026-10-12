'use client'

import { useMemo, useState } from 'react'
import AudioRecorder from '@/components/AudioRecorder'
import BackToPrevious from '@/components/BackToPrevious'

interface RoomServiceItem {
  key: string
  names: Record<string, string>
  price: string
}

interface RoomServiceConfig {
  languages: string[]
  items: RoomServiceItem[]
}

interface Props {
  hotelName: string
  hotelCode: string
  slug: string
  title: string
  config: RoomServiceConfig
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

export default function HotelRoomServiceClient({
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
  const [notes, setNotes] = useState('')
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [manualWhatsAppUrl, setManualWhatsAppUrl] = useState<string | null>(null)
  const [voiceNoteFile, setVoiceNoteFile] = useState<File | null>(null)
  const uiLang = resolveUiLang(selectedLang)

  const t = {
    validationRoomItem: uiLang === 'tr'
      ? 'Oda numarasi ve en az bir urun secmelisin'
      : uiLang === 'de'
        ? 'Bitte Zimmernummer und mindestens ein Produkt auswaehlen'
        : 'Please provide room number and select at least one item',
    submitFailed: uiLang === 'tr'
      ? 'Siparis gonderilemedi'
      : uiLang === 'de'
        ? 'Bestellung konnte nicht gesendet werden'
        : 'Order could not be sent',
    sentSuccess: uiLang === 'tr'
      ? 'Siparis alindi. WhatsApp ile otomatik iletildi.'
      : uiLang === 'de'
        ? 'Bestellung erhalten. Automatisch per WhatsApp gesendet.'
        : 'Order received. Sent automatically via WhatsApp.',
    fallbackSuccess: uiLang === 'tr'
      ? 'Siparis alindi. Oda servisine iletildi.'
      : uiLang === 'de'
        ? 'Bestellung erhalten. An den Zimmerservice weitergeleitet.'
        : 'Order received. Forwarded to room service.',
    manualSend: uiLang === 'tr'
      ? 'WhatsApp\'a manuel ilet'
      : uiLang === 'de'
        ? 'Manuell per WhatsApp senden'
        : 'Send manually via WhatsApp',
  }

  const displayItems = useMemo(
    () =>
      config.items.map((item) => ({
        ...item,
        displayName: item.names[selectedLang] || item.names.en || item.names.tr || item.key,
      })),
    [config.items, selectedLang]
  )

  const toggleItem = (key: string) => {
    setSelectedItems((prev) => {
      if (prev[key]) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: 1 }
    })
  }

  const setQuantity = (key: string, value: number) => {
    const quantity = Math.max(1, Math.min(20, value || 1))
    setSelectedItems((prev) => ({ ...prev, [key]: quantity }))
  }

  const handleSubmit = async () => {
    const items = Object.entries(selectedItems).map(([key, quantity]) => ({ key, quantity }))
    if (!roomNo.trim() || items.length === 0) {
      setError(t.validationRoomItem)
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
        lang: selectedLang,
        notes,
        items,
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
            formData.set('lang', payload.lang)
            formData.set('notes', payload.notes)
            formData.set('items', JSON.stringify(payload.items))
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
      setSelectedItems({})
      setNotes('')
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
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            QRNot Room Service
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
                    ? 'bg-emerald-600 border-emerald-500 text-white'
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
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
            />
            <input
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              placeholder="Misafir adi (opsiyonel)"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          {initialRoomNo ? (
            <p className="text-xs text-neutral-400">QR oda tanimi aktif: Oda {initialRoomNo}{initialFloorLabel ? ` / Kat ${initialFloorLabel}` : ''}</p>
          ) : null}

          <div className="space-y-2">
            {displayItems.map((item) => {
              const selected = Boolean(selectedItems[item.key])
              return (
                <div key={item.key} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.key)}
                    className={`text-left flex-1 ${selected ? 'text-emerald-300' : 'text-white'}`}
                  >
                    <p className="font-semibold">{item.displayName}</p>
                    <p className="text-xs text-neutral-400">{item.price || '-'}</p>
                  </button>
                  {selected ? (
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selectedItems[item.key]}
                      onChange={(event) => setQuantity(item.key, Number(event.target.value) || 1)}
                      className="w-20 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm outline-none focus:border-emerald-500"
                    />
                  ) : null}
                </div>
              )
            })}
          </div>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Ek not (opsiyonel)"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-emerald-500"
          />

          <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
            <p className="text-xs text-neutral-400">Oda servisi için sesli not (opsiyonel)</p>
            <AudioRecorder onAudioReady={(file) => setVoiceNoteFile(file)} />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 transition disabled:opacity-70"
          >
            {submitting ? 'Gonderiliyor...' : 'Siparisi Gonder'}
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
