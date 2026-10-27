'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { LangSwitch } from '@/components/warm/HeaderClient'
import { uploadMediaDirect } from '@/lib/clientUpload'
import { withLang, type Lang } from '@/lib/i18n'

// QR okutma, anı defteri ve yönetim ekranlarının ortak parçaları.

export const MAX_AUDIO_SECONDS = Number(process.env.NEXT_PUBLIC_MAX_AUDIO_SECONDS) > 0 ? Number(process.env.NEXT_PUBLIC_MAX_AUDIO_SECONDS) : 120
const FORM_UPLOAD_LIMIT = 4 * 1024 * 1024

export const QR_T = {
  tr: {
    setupBadge: 'Yeni QR',
    setupTitle: 'Bu QR artık senin',
    setupDesc: 'Ses kaydı, video ya da fotoğraf ekle. QR\'ı okutan herkes bunu görecek. Sonradan değiştirebilirsin (3 kayıt dahil).',
    titleLabel: 'Başlık',
    titlePh: 'Örn: Doğum günün kutlu olsun anne ❤️',
    optional: 'isteğe bağlı',
    contentType: 'Ne eklemek istersin?',
    audio: 'Ses',
    video: 'Video',
    image: 'Fotoğraf',
    linksTitle: 'Bağlantılar',
    youtubePh: 'YouTube linki',
    spotifyPh: 'Spotify şarkı / playlist linki',
    linkPh: 'Başka bir link (Instagram, web sitesi…)',
    emergencyTitle: 'Acil durum bilgisi',
    emergencyHint: 'Anahtarlık kaybolursa bulan kişi seni arayabilsin.',
    phonePh: 'Telefon numarası',
    locationPh: 'Adres / konum',
    submit: 'QR\'ımı hazırla',
    uploading: 'Yükleniyor',
    saving: 'Kaydediliyor…',
    needContent: 'En az bir içerik ekle: ses, video, fotoğraf ya da link.',
    tooLarge: 'Dosya yüklenemedi. Bağlantını kontrol edip tekrar dene.',
    genericError: 'Bir hata oluştu. Lütfen tekrar dene.',
    whatsappSupport: 'WhatsApp destek',
    goPremium: '💎 Premium’a geç',
    doneTitle: 'Hazır! 🎉',
    doneDesc: 'Artık bu QR\'ı okutan herkes içeriğini görecek.',
    ownerLink: 'Sahip linkin — mutlaka kaydet',
    ownerLinkHint: 'İçeriği değiştirmek için bu linke ihtiyacın var. Kimseyle paylaşma.',
    copy: 'Kopyala',
    copied: 'Kopyalandı ✓',
    shareSelf: 'Kendime WhatsApp\'la gönder',
    recoveryCode: 'Kurtarma kodun',
    recoveryHint: 'Sahip linkini kaybedersen bu kodla geri alırsın. Not al veya ekran görüntüsü al.',
    manageNow: 'İçeriği düzenle',
    viewQr: 'QR sayfasını gör',
    opened: 'kez açıldı',
    emergency: 'Acil durum',
    call: 'Ara',
    openMap: 'Konumu aç',
    noContent: 'Bu QR\'da henüz içerik yok.',
    openYoutube: 'YouTube\'da aç',
    openSpotify: 'Spotify\'da aç',
    openLink: 'Bağlantıyı aç',
    link: 'Bağlantı',
    edit: 'İçeriği düzenle',
    lostLink: 'Sahip linkini mi kaybettin?',
    expiredTitle: 'Demo süresi doldu',
    expiredDesc: 'Bu demo QR artık aktif değil. Kalıcı bir sesli kolye ya da anahtarlık edinebilirsin.',
    goShop: 'Ürünleri gör',
    goAccount: 'Hesabıma git',
    demo: 'Demo QR',
    viral: 'Sen de birine sesini hediye et',
    viralCta: 'Sesli kolye & anahtarlık',
    nfcHello: 'NFC ile açıldı',
  },
  en: {
    setupBadge: 'New QR',
    setupTitle: 'This QR is yours now',
    setupDesc: 'Add a voice message, video or photo. Anyone who scans this QR will see it. You can change it later (3 recordings included).',
    titleLabel: 'Title',
    titlePh: 'e.g. Happy birthday mom ❤️',
    optional: 'optional',
    contentType: 'What would you like to add?',
    audio: 'Voice',
    video: 'Video',
    image: 'Photo',
    linksTitle: 'Links',
    youtubePh: 'YouTube link',
    spotifyPh: 'Spotify song / playlist link',
    linkPh: 'Another link (Instagram, website…)',
    emergencyTitle: 'Emergency info',
    emergencyHint: 'If your keychain is lost, the finder can reach you.',
    phonePh: 'Phone number',
    locationPh: 'Address / location',
    submit: 'Set up my QR',
    uploading: 'Uploading',
    saving: 'Saving…',
    needContent: 'Add at least one item: voice, video, photo or a link.',
    tooLarge: 'Upload failed. Check your connection and try again.',
    genericError: 'Something went wrong. Please try again.',
    whatsappSupport: 'WhatsApp support',
    goPremium: '💎 Go Premium',
    doneTitle: 'All set! 🎉',
    doneDesc: 'Anyone who scans this QR will now see your content.',
    ownerLink: 'Your owner link — save it',
    ownerLinkHint: 'You need this link to change the content. Don\'t share it.',
    copy: 'Copy',
    copied: 'Copied ✓',
    shareSelf: 'Send it to myself on WhatsApp',
    recoveryCode: 'Your recovery code',
    recoveryHint: 'If you lose the owner link, this code gets it back. Write it down or take a screenshot.',
    manageNow: 'Edit content',
    viewQr: 'View QR page',
    opened: 'views',
    emergency: 'Emergency',
    call: 'Call',
    openMap: 'Open location',
    noContent: 'This QR has no content yet.',
    openYoutube: 'Open on YouTube',
    openSpotify: 'Open on Spotify',
    openLink: 'Open link',
    link: 'Link',
    edit: 'Edit content',
    lostLink: 'Lost your owner link?',
    expiredTitle: 'Demo expired',
    expiredDesc: 'This demo QR is no longer active. Get a lasting voice necklace or keychain.',
    goShop: 'See products',
    goAccount: 'Go to my account',
    demo: 'Demo QR',
    viral: 'Give someone your voice too',
    viralCta: 'Voice necklaces & keychains',
    nfcHello: 'Opened via NFC',
  },
}

const EMERGENCY_PHONE_MARKER = '[TEL:'
const LOCATION_MARKER = '[LOC:'

export function parseProfileTitle(rawTitle: string) {
  const source = (rawTitle || '').trim()
  const phone = source.match(/\[TEL:([^\]]+)\]/)?.[1]?.trim() || ''
  const location = source.match(/\[LOC:([^\]]+)\]/)?.[1]?.trim() || ''
  const cleanTitle = source
    .replace(/\[TEL:[^\]]+\]/g, '')
    .replace(/\[LOC:[^\]]+\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return { cleanTitle, phone, location }
}

export function composeProfileTitle(baseTitle: string, emergencyPhone: string, location: string, fallback: string) {
  const safeBase = (baseTitle || '').trim() || fallback
  const safePhone = emergencyPhone.trim()
  const safeLocation = location.trim()
  return `${safeBase}${safePhone ? ` ${EMERGENCY_PHONE_MARKER}${safePhone}]` : ''}${safeLocation ? ` ${LOCATION_MARKER}${safeLocation}]` : ''}`.slice(0, 100)
}

export function parseWhatsAppSupport(errorText: string) {
  const url = errorText.match(/https?:\/\/wa\.me\/\S+/)?.[0] || null
  const message = url ? errorText.replace(url, '').trim() : errorText
  return { message, url }
}

/** Dosyayı önce doğrudan Blob'a yüklemeyi dener; olmazsa küçük dosyalarda form ile gönderir. */
export async function attachMedia(
  formData: FormData,
  file: File,
  options: { slug: string; token?: string; onProgress: (value: number) => void; lang?: Lang }
) {
  try {
    const url = await uploadMediaDirect({ slug: options.slug, scope: 'qr', file, token: options.token, onProgress: options.onProgress })
    formData.append('media_blob_url', url)
  } catch (error) {
    if (file.size <= FORM_UPLOAD_LIMIT) {
      formData.append('media', file)
      return
    }
    // Sunucunun kendi Türkçe mesajları (yetki, kota vb.) aynen gösterilir; ağ / Blob hataları sadeleştirilir.
    const raw = error instanceof Error ? error.message : ''
    if (raw && !/vercel blob|fetch|network|failed|abort|timeout/i.test(raw)) throw error
    throw new Error(
      options.lang === 'en'
        ? 'The upload could not finish. Check your internet connection (Wi-Fi is best for large videos) and try again.'
        : 'Yükleme tamamlanamadı. İnternet bağlantını kontrol edip tekrar dene (büyük videolar için Wi-Fi önerilir).'
    )
  }
}

export function ScanShell({ lang, children, wide = false }: { lang: Lang; children: React.ReactNode; wide?: boolean }) {
  const t = QR_T[lang]
  return (
    <div className="warm flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 pt-4">
        <Link href={withLang('/', lang)} className="inline-flex items-center gap-2" aria-label="QRNot">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-coral text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </span>
          <span className="font-display text-lg font-semibold">QRNot</span>
        </Link>
        <Suspense fallback={null}>
          <LangSwitch lang={lang} />
        </Suspense>
      </div>
      <main className={`mx-auto w-full flex-1 px-4 py-8 ${wide ? 'max-w-2xl' : 'max-w-xl'}`}>{children}</main>
      <footer className="mx-auto w-full max-w-xl px-4 pb-8">
        <Link
          href={withLang('/shop', lang)}
          className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-sm hover:border-line-2"
        >
          <span className="text-ink-2">{t.viral}</span>
          <span className="font-semibold text-coral-2">{t.viralCta} →</span>
        </Link>
      </footer>
    </div>
  )
}

/** Hata metnindeki Premium sayfası adresini ayırır (değişiklik hakkı dolunca sunucu bu adresi verir). */
export function parsePremiumLink(errorText: string) {
  const url = errorText.match(/https?:\/\/\S+\/shop\/premium\S*/)?.[0] || null
  const message = url ? errorText.replace(url, '').replace(/[:\s]+$/, '').trim() : errorText
  return { message, url }
}

export function ErrorBox({ text, lang }: { text: string; lang: Lang }) {
  const premium = parsePremiumLink(text)
  const parsed = parseWhatsAppSupport(premium.message)
  return (
    <div className="w-alert w-alert-error">
      <p>{parsed.message}</p>
      {premium.url && (
        <Link href={withLang('/shop/premium', lang)} className="w-btn w-btn-primary w-btn-sm mt-3">
          {QR_T[lang].goPremium}
        </Link>
      )}
      {parsed.url && (
        <a href={parsed.url} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-whatsapp w-btn-sm mt-3">
          {QR_T[lang].whatsappSupport}
        </a>
      )}
    </div>
  )
}

function CopyRow({ value, lang, mono = false }: { value: string; lang: Lang; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  const t = QR_T[lang]
  return (
    <div className="flex items-center gap-2">
      <p className={`min-w-0 flex-1 break-all rounded-xl bg-cream-2 px-3 py-2 text-xs text-ink-2 ${mono ? 'font-mono text-base tracking-[0.25em] text-ink' : ''}`}>{value}</p>
      <button
        type="button"
        className="w-btn w-btn-ghost w-btn-sm shrink-0"
        onClick={async () => {
          await navigator.clipboard.writeText(value).catch(() => undefined)
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        }}
      >
        {copied ? t.copied : t.copy}
      </button>
    </div>
  )
}

export function OwnerSecrets({ slug, manageUrl, recoveryCode, lang }: { slug: string; manageUrl: string; recoveryCode: string; lang: Lang }) {
  const t = QR_T[lang]
  return (
    <div className="space-y-4">
      <div className="w-card space-y-3 p-5">
        <div>
          <p className="font-semibold text-ink">🔑 {t.ownerLink}</p>
          <p className="mt-1 text-xs text-muted">{t.ownerLinkHint}</p>
        </div>
        <CopyRow value={manageUrl} lang={lang} />
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`QRNot — ${t.ownerLink}: ${manageUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-btn w-btn-whatsapp w-btn-sm"
        >
          {t.shareSelf}
        </a>
      </div>
      <div className="w-card space-y-3 p-5">
        <div>
          <p className="font-semibold text-ink">🛟 {t.recoveryCode}</p>
          <p className="mt-1 text-xs text-muted">{t.recoveryHint}</p>
        </div>
        <CopyRow value={recoveryCode} lang={lang} mono />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <a href={manageUrl} className="w-btn w-btn-dark">
          {t.manageNow}
        </a>
        <a href={withLang(`/q/${slug}`, lang)} className="w-btn w-btn-ghost">
          {t.viewQr}
        </a>
      </div>
    </div>
  )
}


const GATE_T = {
  tr: {
    title: 'Önce giriş yap',
    desc: 'QR kodun hesabına bağlanır; böylece sadece sen yönetebilir, kaybetsen bile hesabından geri bulabilirsin.',
    cta: 'Giriş yap / hesap aç',
  },
  en: {
    title: 'Sign in first',
    desc: 'Your QR code is linked to your account, so only you can manage it — and you can always find it again in your account.',
    cta: 'Sign in / create an account',
  },
}

/** Boş QR kurulumu üye girişi ister; giriş yoksa formu göstermeden giriş sayfasına yönlendirir. */
export function SignInGate({ slug, lang, children }: { slug: string; lang: Lang; children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'in' | 'out'>('checking')

  useEffect(() => {
    let alive = true
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => alive && setState(res.ok ? 'in' : 'out'))
      .catch(() => alive && setState('out'))
    return () => {
      alive = false
    }
  }, [])

  if (state === 'in') return <>{children}</>
  const t = GATE_T[lang]
  const loginHref = withLang(`/account?next=${encodeURIComponent(withLang(`/q/${slug}`, lang))}`, lang)
  return (
    <ScanShell lang={lang}>
      <div className="w-card space-y-4 p-6 text-center">
        {state === 'checking' ? (
          <p className="text-sm text-muted">…</p>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold">{t.title}</h1>
            <p className="text-ink-2">{t.desc}</p>
            <Link href={loginHref} className="w-btn w-btn-primary w-full">
              {t.cta}
            </Link>
          </>
        )}
      </div>
    </ScanShell>
  )
}
