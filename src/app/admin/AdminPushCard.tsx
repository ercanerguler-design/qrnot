'use client'

import { useCallback, useEffect, useState } from 'react'

// Yönetici anlık bildirimleri: bu cihazı kaydet → yeni DPP demo talebi ve yeni ödeme anında telefona düşer.
// iPhone: önce Safari'de Paylaş → "Ana Ekrana Ekle", sonra ana ekrandaki uygulamadan aç ve buradan bildirimi aç.

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

function deviceLabel() {
  const ua = navigator.userAgent
  const os = /iphone|ipad/i.test(ua) ? 'iPhone/iPad' : /android/i.test(ua) ? 'Android' : /mac/i.test(ua) ? 'Mac' : /windows/i.test(ua) ? 'Windows' : 'Cihaz'
  const browser = /edg\//i.test(ua) ? 'Edge' : /chrome|crios/i.test(ua) ? 'Chrome' : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : ''
  return `${os}${browser ? ` · ${browser}` : ''}`
}

type State = 'loading' | 'on' | 'off' | 'unsupported' | 'denied' | 'ios-install'

export function AdminPushCard({ password }: { password: string }) {
  const [state, setState] = useState<State>('loading')
  const [devices, setDevices] = useState<Array<{ label: string; last_sent_at: string | null }>>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const api = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      const res = await fetch('/api/admin/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, action, ...extra }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız')
      return data
    },
    [password]
  )

  useEffect(() => {
    const check = async () => {
      try {
        const st = await api('status')
        setDevices(st.devices || [])
      } catch {}
      const ios = /iphone|ipad/i.test(navigator.userAgent)
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setState(ios && !standalone ? 'ios-install' : 'unsupported')
        return
      }
      if (Notification.permission === 'denied') {
        setState('denied')
        return
      }
      const reg = await navigator.serviceWorker.getRegistration('/sw.js').catch(() => undefined)
      const sub = await reg?.pushManager.getSubscription().catch(() => null)
      setState(sub ? 'on' : 'off')
    }
    void check()
  }, [api])

  const enable = async () => {
    setBusy(true)
    setMsg(null)
    try {
      if (!VAPID) throw new Error('Bildirim anahtarı bu ortamda tanımlı değil')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID) }))
      const res = await api('subscribe', { subscription: sub.toJSON(), label: deviceLabel() })
      setDevices(res.devices || [])
      setState('on')
      const t = await api('test')
      setMsg(t.push > 0 ? 'Açıldı. Deneme bildirimi gönderildi; birkaç saniye içinde gelmeli.' : 'Açıldı ama deneme bildirimi gönderilemedi.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Açılamadı')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        const res = await api('unsubscribe', { endpoint: sub.endpoint })
        setDevices(res.devices || [])
      }
      setState('off')
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    setBusy(true)
    try {
      const t = await api('test')
      setMsg(`Deneme gönderildi: ${t.push} cihaz${t.whatsapp === 'sent' ? ' + WhatsApp' : ''}.`)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gönderilemedi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950/70 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="font-semibold">📲 Anlık bildirim</h2>
          <p className="text-sm text-neutral-400">Yeni DPP demo talebi ve yeni ödeme anında bu cihaza düşer. Kayıtlı cihaz: {devices.length ? devices.map((d) => d.label).join(', ') : 'yok'}</p>
        </div>
        {state === 'off' && (
          <button disabled={busy} onClick={enable} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            Bu cihazda aç
          </button>
        )}
        {state === 'on' && (
          <>
            <span className="text-sm text-emerald-400">✓ Bu cihazda açık</span>
            <button disabled={busy} onClick={test} className="rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800">
              Deneme gönder
            </button>
            <button disabled={busy} onClick={disable} className="rounded-xl border border-neutral-700 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800">
              Kapat
            </button>
          </>
        )}
      </div>
      {state === 'ios-install' && (
        <p className="mt-3 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          iPhone’da bildirim için: Safari’de <b>Paylaş</b> → <b>Ana Ekrana Ekle</b>. Sonra ana ekrandaki “QRNot Yönetim” uygulamasından girip buradan aç.
        </p>
      )}
      {state === 'denied' && <p className="mt-3 text-sm text-amber-300">Bildirim izni bu tarayıcıda reddedilmiş; tarayıcı ayarlarından bu site için izin ver.</p>}
      {state === 'unsupported' && <p className="mt-3 text-sm text-neutral-400">Bu tarayıcı anlık bildirimi desteklemiyor.</p>}
      {msg && <p className="mt-3 text-sm text-cyan-300">{msg}</p>}
    </div>
  )
}
