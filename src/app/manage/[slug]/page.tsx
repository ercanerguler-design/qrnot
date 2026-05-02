'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import AudioRecorder from '@/components/AudioRecorder'
import QRDisplay from '@/components/QRDisplay'
import Link from 'next/link'

interface NoteInfo {
  slug: string
  title: string
  audio_url: string | null
  play_count: number
  created_at: string
}

function ManagePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const token = searchParams.get('token') || ''

  const [note, setNote] = useState<NoteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)

  const [newAudio, setNewAudio] = useState<File | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const playUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/q/${slug}`
      : `/q/${slug}`

  const fetchNote = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/qr/${slug}`)
    if (!res.ok) {
      setAuthError(true)
      setLoading(false)
      return
    }
    const data = await res.json()
    // Token doğrulaması: DB'deki admin_token ile karşılaştıramayız (güvenlik),
    // ama token yoksa erişimi reddet
    if (!token) {
      setAuthError(true)
      setLoading(false)
      return
    }
    setNote(data)
    setNewTitle(data.title)
    setLoading(false)
  }, [slug, token])

  useEffect(() => {
    if (!token) {
      setAuthError(true)
      setLoading(false)
      return
    }
    fetchNote()
  }, [fetchNote, token])

  const handleSave = async () => {
    if (!newAudio && newTitle === note?.title) return
    setSaving(true)
    setSaveError(null)

    const formData = new FormData()
    formData.append('token', token)
    if (newAudio) formData.append('audio', newAudio)
    if (newTitle) formData.append('title', newTitle)

    const res = await fetch(`/api/qr/${slug}/update`, {
      method: 'PUT',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      setSaveError(data.error || 'Güncelleme başarısız')
    } else {
      setSaved(true)
      setNewAudio(null)
      await fetchNote()
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          Yükleniyor...
        </div>
      </div>
    )
  }

  if (authError || !note) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-white mb-2">Erişim Reddedildi</h1>
          <p className="text-neutral-500 text-sm mb-6">
            Geçersiz veya eksik yönetim tokeni.
          </p>
          <Link
            href="/"
            className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors"
          >
            ← Ana Sayfa
          </Link>
          <h1 className="text-2xl font-bold text-white mt-3">Notunu Yönet</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {note.play_count} kez dinlendi ·{' '}
            {new Date(note.created_at).toLocaleDateString('tr-TR')}
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6 flex flex-col items-center gap-4">
          <p className="text-neutral-400 text-sm">QR Kodun</p>
          <QRDisplay url={playUrl} size={180} />
          <a
            href={playUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 text-xs transition-colors"
          >
            {playUrl}
          </a>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold">Güncelle</h2>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">Başlık</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={80}
              className="w-full bg-neutral-800 border border-neutral-700 focus:border-violet-600 text-white rounded-xl px-4 py-3 outline-none transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-neutral-400 text-sm mb-2">
              Yeni Ses Kaydı{' '}
              <span className="text-neutral-600">(isteğe bağlı)</span>
            </label>
            <AudioRecorder onAudioReady={setNewAudio} />
          </div>

          {saveError && (
            <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">
              {saveError}
            </div>
          )}

          {saved && (
            <div className="bg-green-950/40 border border-green-800 text-green-400 text-sm px-4 py-3 rounded-xl">
              ✓ Güncellendi!
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || (!newAudio && newTitle === note.title)}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Kaydediliyor...
              </>
            ) : (
              'Kaydet'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManagePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="text-neutral-500">Yükleniyor...</div>
        </div>
      }
    >
      <ManagePage />
    </Suspense>
  )
}
