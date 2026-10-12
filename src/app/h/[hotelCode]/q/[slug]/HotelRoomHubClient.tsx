'use client'

import BackToPrevious from '@/components/BackToPrevious'

interface Props {
  hotelName: string
  hotelCode: string
  title: string
  initialRoomNo: string
  initialFloorLabel: string
  initialSourceTag: string
  roomServiceSlug: string
  serviceTicketSlug: string
  worldClockSlug: string
  menuSlug: string
}

function buildModuleHref(hotelCode: string, slug: string, roomNo: string, floorLabel: string, sourceTag: string) {
  if (!slug) return '#'
  const params = new URLSearchParams()
  if (roomNo) params.set('room', roomNo)
  if (floorLabel) params.set('floor', floorLabel)
  if (sourceTag) params.set('source', sourceTag)
  const query = params.toString()
  return `/h/${hotelCode}/q/${slug}${query ? `?${query}` : ''}`
}

export default function HotelRoomHubClient({
  hotelName,
  hotelCode,
  title,
  initialRoomNo,
  initialFloorLabel,
  initialSourceTag,
  roomServiceSlug,
  serviceTicketSlug,
  worldClockSlug,
  menuSlug,
}: Props) {
  const roomServiceHref = buildModuleHref(hotelCode, roomServiceSlug, initialRoomNo, initialFloorLabel, initialSourceTag)
  const serviceTicketHref = buildModuleHref(hotelCode, serviceTicketSlug, initialRoomNo, initialFloorLabel, initialSourceTag)
  const worldClockHref = buildModuleHref(hotelCode, worldClockSlug, initialRoomNo, initialFloorLabel, initialSourceTag)
  const menuHref = buildModuleHref(hotelCode, menuSlug, initialRoomNo, initialFloorLabel, initialSourceTag)

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-3">
          <BackToPrevious fallbackHref="/hotel" />
        </div>
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            QRNot Oda Asistanı
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
          <p className="text-sm text-neutral-300">{hotelName} ({hotelCode})</p>

          {initialRoomNo ? (
            <p className="text-xs text-neutral-400">
              Oda: {initialRoomNo}
              {initialFloorLabel ? ` / Kat ${initialFloorLabel}` : ''}
            </p>
          ) : (
            <p className="text-xs text-amber-300">Bu QR oda parametresi olmadan açıldı. Oda bazlı işlem için room parametresi önerilir.</p>
          )}

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <a
              href={roomServiceSlug ? roomServiceHref : '#'}
              className={`rounded-2xl border p-4 transition ${roomServiceSlug ? 'border-emerald-700 bg-emerald-900/20 hover:bg-emerald-900/35' : 'border-neutral-800 bg-neutral-900/40 opacity-60 pointer-events-none'}`}
            >
              <p className="font-semibold">Oda Servisi Sipariş</p>
              <p className="text-xs text-neutral-300 mt-1">Yiyecek ve içecek siparişi gönder.</p>
            </a>

            <a
              href={serviceTicketSlug ? serviceTicketHref : '#'}
              className={`rounded-2xl border p-4 transition ${serviceTicketSlug ? 'border-sky-700 bg-sky-900/20 hover:bg-sky-900/35' : 'border-neutral-800 bg-neutral-900/40 opacity-60 pointer-events-none'}`}
            >
              <p className="font-semibold">Teknik / Housekeeping / Concierge</p>
              <p className="text-xs text-neutral-300 mt-1">Arıza, temizlik, taksi ve diğer talepler.</p>
            </a>

            <a
              href={worldClockSlug ? worldClockHref : '#'}
              className={`rounded-2xl border p-4 transition ${worldClockSlug ? 'border-amber-700 bg-amber-900/20 hover:bg-amber-900/35' : 'border-neutral-800 bg-neutral-900/40 opacity-60 pointer-events-none'}`}
            >
              <p className="font-semibold">Dünya Saatleri</p>
              <p className="text-xs text-neutral-300 mt-1">Farklı şehir saatlerini görüntüle.</p>
            </a>

            <a
              href={menuSlug ? menuHref : '#'}
              className={`rounded-2xl border p-4 transition ${menuSlug ? 'border-fuchsia-700 bg-fuchsia-900/20 hover:bg-fuchsia-900/35' : 'border-neutral-800 bg-neutral-900/40 opacity-60 pointer-events-none'}`}
            >
              <p className="font-semibold">Restoran Menüsü</p>
              <p className="text-xs text-neutral-300 mt-1">Çok dilli menüyü incele.</p>
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
