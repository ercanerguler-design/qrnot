'use client'

import { useEffect, useRef, useState } from 'react'
import AudioPlayer from '@/components/AudioPlayer'
import Link from 'next/link'
import BackToPrevious from '@/components/BackToPrevious'

interface Note {
  slug: string
  title: string
  audio_url: string
  play_count: number
}

export default function PlayClient({ note }: { note: Note }) {
  const [counted, setCounted] = useState(false)
  const didCount = useRef(false)

  useEffect(() => {
    if (didCount.current) return
    didCount.current = true
    fetch(`/api/note/${note.slug}`).then(() => setCounted(true))
  }, [note.slug])

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-4">
          <BackToPrevious fallbackHref="/" />
        </div>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎙️</div>
          <h1 className="text-xl font-bold text-white mb-1">{note.title}</h1>
          <p className="text-neutral-600 text-xs">
            Sana bırakılmış bir sesli mesaj var
          </p>
        </div>

        {/* Player */}
        <AudioPlayer audioUrl={note.audio_url} title={note.title} />

        {/* Stats */}
        <div className="mt-4 text-center">
          <p className="text-neutral-700 text-xs">
            {counted ? note.play_count + 1 : note.play_count} kez dinlendi
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/create"
            className="text-neutral-600 hover:text-violet-400 text-xs transition-colors"
          >
            Sen de QRNote oluştur →
          </Link>
        </div>
      </div>
    </div>
  )
}
