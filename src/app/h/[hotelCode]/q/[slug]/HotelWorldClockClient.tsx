'use client'

import { useEffect, useMemo, useState } from 'react'
import BackToPrevious from '@/components/BackToPrevious'

interface ClockCity {
  city: string
  timezone: string
}

interface Props {
  hotelName: string
  hotelCode: string
  title: string
  cities: ClockCity[]
  initialNowIso: string
}

function formatTime(timezone: string, now: Date) {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)
}

function formatDate(timezone: string, now: Date) {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: timezone,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now)
}

export default function HotelWorldClockClient({ hotelName, hotelCode, title, cities, initialNowIso }: Props) {
  const [now, setNow] = useState(() => new Date(initialNowIso))

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const rows = useMemo(
    () =>
      cities.map((city) => ({
        ...city,
        time: formatTime(city.timezone, now),
        date: formatDate(city.timezone, now),
      })),
    [cities, now]
  )

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-3">
          <BackToPrevious fallbackHref="/hotel" />
        </div>
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            QRNot Hotel Module
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-neutral-300">
            {hotelName} ({hotelCode})
          </p>

          <div className="mt-6 space-y-3">
            {rows.map((row) => (
              <div
                key={row.timezone}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-white">{row.city}</p>
                  <p className="text-xs text-neutral-400">{row.timezone}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-sky-300 tabular-nums">{row.time}</p>
                  <p className="text-xs text-neutral-400">{row.date}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-neutral-500">Saatler otomatik olarak cihaz saatinden bağımsız güncellenir.</p>
        </div>
      </div>
    </main>
  )
}
