import Link from 'next/link'

const whatsappOrderHref = 'https://wa.me/905433929230?text=Merhaba%20QRNote%2C%20bireysel%20QR%20sipari%C5%9Fi%20ve%20fiyat%20bilgisi%20almak%20istiyorum.'
const whatsappCorporateHref = 'https://wa.me/905433929230?text=Merhaba%20QRNote%2C%20500%20adet%20ve%20%C3%BCzeri%20kurumsal%20QR%20paketi%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.'

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 overflow-x-hidden">

      {/* Background glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-violet-700/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-violet-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-3xl" />
      </div>

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🎙️</span>
          <span className="text-white font-bold text-xl tracking-tight">QRNote</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#nasil-calisir" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors hidden sm:block">
            Nasıl çalışır?
          </a>
          <a href="#kurumsal-cozumler" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors hidden sm:block">
            Kurumsal Çözümler
          </a>
          <a
            href={whatsappOrderHref}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all border border-neutral-700"
          >
            Fiyat Al
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 text-center px-4 pt-16 pb-24 max-w-5xl mx-auto">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-full px-4 py-1.5 text-violet-400 text-sm font-medium mb-10">
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse inline-block" />
          Anahtarlıklar artık konuşuyor
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.95] tracking-tight">
          Hediyene<br />
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            bir ses ver
          </span>
        </h1>

        <p className="text-neutral-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          QR kodlu anahtarlık, bileklik veya sticker.{' '}
          <span className="text-neutral-300">Tarayanlar anında sesini duyar.</span>{' '}
          Uygulama indirmeleri gerekmez. İstediğin zaman güncelle.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap mb-20">
          <Link
            href="/demo"
            className="bg-white hover:bg-neutral-100 text-neutral-950 font-semibold px-8 py-4 rounded-2xl transition-all active:scale-95 text-base shadow-2xl"
          >
            3 Ücretsiz Demo QR Dene
          </Link>
          <a
            href="#nasil-calisir"
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all active:scale-95 text-base shadow-2xl shadow-violet-900/50"
          >
            Nasıl çalışır? →
          </a>
          <a
            href={whatsappOrderHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 px-6 py-4 text-base transition-colors"
          >
            Sipariş Ver
          </a>
        </div>

        {/* Visual — phone mockup */}
        <div className="flex justify-center items-end gap-6 sm:gap-10">

          {/* Left card — keychain */}
          <div className="hidden sm:flex flex-col items-center gap-3 opacity-60 mb-4">
            <div className="w-16 h-28 bg-neutral-800 rounded-2xl border border-neutral-700 flex items-center justify-center">
              <span className="text-3xl">🔑</span>
            </div>
            <div className="bg-white rounded-lg p-1.5 shadow-xl">
              <div className="w-10 h-10 grid grid-cols-5 gap-px">
                {[1,1,1,1,1, 1,0,0,0,1, 1,0,1,0,1, 1,0,0,0,1, 1,1,1,1,1].map((v,i) => (
                  <div key={i} className={`rounded-sm ${v ? 'bg-neutral-900' : 'bg-white'}`} />
                ))}
              </div>
            </div>
            <p className="text-neutral-600 text-xs">Scan &amp; play</p>
          </div>

          {/* Center — phone */}
          <div className="relative">
            <div className="w-60 sm:w-72 bg-neutral-900 rounded-[2.5rem] border border-neutral-700/60 p-3 shadow-2xl shadow-black/60">
              {/* Phone notch */}
              <div className="flex justify-center mb-2">
                <div className="w-20 h-1.5 bg-neutral-700 rounded-full" />
              </div>
              {/* App screen */}
              <div className="bg-neutral-950 rounded-[2rem] px-5 py-8 text-center">
                <div className="w-14 h-14 bg-violet-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                  <span className="text-2xl">🎙️</span>
                </div>
                <p className="text-white font-semibold text-sm mb-1">Annemin Sesi ❤️</p>
                <p className="text-neutral-600 text-xs mb-5">2 saat önce · 47 dinleme</p>

                {/* Custom audio player */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <button className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-900/50">
                      <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                    <div className="flex-1">
                      <div className="bg-neutral-700 rounded-full h-1.5 w-full">
                        <div className="bg-violet-500 h-1.5 rounded-full w-2/5" />
                      </div>
                    </div>
                    <span className="text-neutral-500 text-xs">1:23</span>
                  </div>
                </div>

                <p className="text-neutral-700 text-xs mt-4">qrnote.app/q/xK9mP2</p>
              </div>
            </div>

            {/* QR badge floating */}
            <div className="absolute -top-3 -right-3 bg-white rounded-xl p-2 shadow-2xl shadow-black/50">
              <div className="w-12 h-12 grid grid-cols-5 gap-px">
                {[1,1,1,1,1, 1,0,0,0,1, 1,0,1,0,1, 1,0,0,0,1, 1,1,1,1,1].map((v,i) => (
                  <div key={i} className={`rounded-sm ${v ? 'bg-neutral-900' : 'bg-white'}`} />
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -bottom-2 -left-10 bg-green-950 border border-green-800 rounded-xl px-3 py-1.5 text-green-400 text-xs font-medium whitespace-nowrap">
              ✓ Uygulama gerekmez
            </div>
          </div>

          {/* Right card — sticker */}
          <div className="hidden sm:flex flex-col items-center gap-3 opacity-60 mb-4">
            <div className="w-16 h-28 bg-neutral-800 rounded-2xl border border-neutral-700 flex items-center justify-center">
              <span className="text-3xl">🎁</span>
            </div>
            <div className="bg-white rounded-lg p-1.5 shadow-xl">
              <div className="w-10 h-10 grid grid-cols-5 gap-px">
                {[1,1,1,1,1, 1,0,1,0,1, 1,1,0,1,1, 1,0,1,0,1, 1,1,1,1,1].map((v,i) => (
                  <div key={i} className={`rounded-sm ${v ? 'bg-neutral-900' : 'bg-white'}`} />
                ))}
              </div>
            </div>
            <p className="text-neutral-600 text-xs">Her zaman güncel</p>
          </div>

        </div>
      </section>

      <section className="relative z-10 px-4 py-10 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6">
            <p className="text-violet-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">Bireysel Kullanıcı</p>
            <h2 className="text-white text-2xl font-black mb-3">Önce Demo, Sonra Satın Al</h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-5">
              Bireysel kullanıcı önce 3 ücretsiz demo QR ile sistemi test edebilir. Kalıcı kullanım için ürünü veya slotu satın alır; ardından kendisine atanan QR kodu ilk taramada sahiplenip sesini yükler.
            </p>
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 mb-5">
              <p className="text-white font-semibold mb-1">Bireysel Paket</p>
              <p className="text-neutral-500 text-sm mb-3">Önce 3 demo QR oluştur, okut, sahiplen ve sesini dene. Sonra kalıcı paket veya fiziksel ürün siparişine geç.</p>
              <p className="text-violet-400 text-sm font-medium">Demo public, kalıcı üretim ise satın alma ile açılır.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold px-6 py-3 rounded-2xl transition-all active:scale-95"
              >
                3 Demo QR Oluştur
              </Link>
              <a
                href={whatsappOrderHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-2xl transition-all active:scale-95"
              >
                Fiyat Al / Satın Al
              </a>
            </div>
          </div>

          <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6">
            <p className="text-green-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">Kurumsal Üretim</p>
            <h2 className="text-white text-2xl font-black mb-3">Toplu QR üretimi sadece iş ortakları için</h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-5">
              Çoklu QR üretimi admin panelinden yönetilir. 500 adet ve üzeri kurumsal üretim, etiketleme ve teslim akışı için doğrudan bizimle iletişime geçilir.
            </p>
            <a
              href={whatsappCorporateHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-2xl transition-all active:scale-95"
            >
              Kurumsal Teklif Al
            </a>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-8 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-950/60 via-neutral-900 to-violet-950/60 border border-emerald-800/30 rounded-3xl p-8 sm:p-10">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div>
              <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">Public Demo</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">3 ücretsiz demo QR ile sistemi şimdi test et</h2>
              <p className="text-neutral-400 leading-relaxed mb-6">
                QR oluştur, okut, ilk ses kaydını bırak ve sahip linkini gör. Demo bittiğinde aynı akışın kalıcı sürümü için satın alma veya WhatsApp üzerinden devam edebilirsin.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold px-7 py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  Demo Akışını Aç
                </Link>
                <a
                  href={whatsappOrderHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  Satın Alma İçin Yaz
                </a>
              </div>
            </div>
            <div className="bg-black/20 border border-white/10 rounded-3xl p-6">
              <p className="text-white font-semibold mb-3">Demo Kuralları</p>
              <div className="space-y-3 text-sm text-neutral-300">
                <p>En fazla 3 ücretsiz QR</p>
                <p>Session + IP bazlı limit</p>
                <p>Gerçek claim ve yönetim akışı açık</p>
                <p>Kalıcı paket için satın alma yönlendirmesi var</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="relative z-10 border-y border-neutral-800/60 bg-neutral-900/30 py-6">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          {[
            { n: '∞', label: 'Güncellenebilir' },
            { n: '0', label: 'Uygulama gerekli' },
            { n: '< 3sn', label: 'Yükleme süresi' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-black text-violet-400">{s.n}</p>
              <p className="text-neutral-600 text-xs sm:text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="nasil-calisir" className="relative z-10 px-4 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">3 adımda hazır</h2>
          <p className="text-neutral-500 text-lg">Teknik bilgi gerekmez. Ciddi hiçbir şey gerekmez.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              n: '01',
              icon: '📦',
              title: 'QR Ürünü Al',
              desc: 'Anahtarlık, bileklik, sticker veya herhangi bir fiziksel ürün. Üzerinde senin için oluşturulmuş benzersiz bir QR kodu var.',
              color: 'from-violet-600/20 to-transparent',
            },
            {
              n: '02',
              icon: '🎙️',
              title: 'İlk Taramada Sahiplen',
              desc: 'QR kodu ilk tarayan kişi sesini kaydeder. 10 saniye bile yeterli. Sahip linki otomatik oluşur, kaybetme.',
              color: 'from-purple-600/20 to-transparent',
            },
            {
              n: '03',
              icon: '🔊',
              title: 'Herkes Duyar',
              desc: 'Artık bu QR\'ı tarayan herkes sesini duyar. Notu güncellersen eski ses silinir, yenisi yerine geçer. QR kodu hiç değişmez.',
              color: 'from-fuchsia-600/20 to-transparent',
            },
          ].map(step => (
            <div key={step.n} className={`bg-gradient-to-b ${step.color} bg-neutral-900 border border-neutral-800 rounded-3xl p-7 relative overflow-hidden`}>
              <span className="absolute top-5 right-5 text-neutral-800/80 text-5xl font-black select-none">{step.n}</span>
              <div className="text-4xl mb-5">{step.icon}</div>
              <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="relative z-10 px-4 py-16 max-w-5xl mx-auto">
        <h2 className="text-center text-3xl sm:text-4xl font-black text-white mb-4">Kim için?</h2>
        <p className="text-center text-neutral-500 mb-12">Fiziksel bir ürün + ses = sihir.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { emoji: '🔑', title: 'Anahtarlık', desc: 'Sevdiğine kişisel sesli mesaj.' },
            { emoji: '🎁', title: 'Hediye', desc: 'Sürpriz sesi olan hediye.' },
            { emoji: '👶', title: 'Bebek Anısı', desc: 'İlk kelimeler, ilk gülüşler.' },
            { emoji: '💍', title: 'Özel Anlar', desc: 'Söz, nişan, yıldönümü.' },
          ].map(uc => (
            <div
              key={uc.title}
              className="group bg-neutral-900/60 border border-neutral-800 hover:border-violet-700/50 rounded-2xl p-5 text-center transition-all hover:bg-neutral-900"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">{uc.emoji}</div>
              <h3 className="text-white font-semibold mb-1">{uc.title}</h3>
              <p className="text-neutral-600 text-sm">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 px-4 py-16 max-w-5xl mx-auto">
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-3xl p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-10 text-center">
            Neden QRNote?
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                icon: '📱',
                title: 'Sıfır sürtüşme',
                desc: 'Tarayan kişi direkt sesi duyar. Uygulama yok, hesap yok, kayıt yok.',
              },
              {
                icon: '♻️',
                title: 'Sonsuz güncellenebilir',
                desc: 'Yeni ses kaydedince eski silinir. QR kodu hep güncel, depolama sorunu yok.',
              },
              {
                icon: '🔗',
                title: 'Kalıcı bağlantı',
                desc: 'QR kodu ömür boyu aynı URL\'e bağlı. Fiziksel ürün değişmez, dijital içerik güncellenir.',
              },
              {
                icon: '🎁',
                title: 'Hediyeye hazır',
                desc: 'QR kodu hediye edebilirsin. Yeni sahip ses kaydı bırakır, sen de dilediğin zaman güncellersin.',
              },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-4 p-5 rounded-2xl hover:bg-neutral-800/40 transition-colors">
                <span className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B SECTION */}
      <section id="kurumsal-cozumler" className="relative z-10 px-4 py-16 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-violet-950/50 via-neutral-900 to-purple-950/50 border border-violet-800/30 rounded-3xl p-8 sm:p-12">
          <div className="grid lg:grid-cols-[1.4fr_0.9fr] gap-8 items-start">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-violet-600/15 border border-violet-500/20 rounded-full px-3 py-1 text-violet-400 text-xs font-medium mb-6">
              İş Ortakları İçin
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 leading-tight">
              Ürünlerinize<br />ses katın
            </h2>
            <p className="text-neutral-400 mb-6 leading-relaxed">
              Anahtarlık, bileklik, sticker, kartpostal ya da kullanım kılavuzu yerine ürün üstünde konuşan QR kodlar.
              Müşteriniz QR'ı tarar ve ürünün sesli anlatımını anında dinler. Kurumsal paketlerde 500 adet ve üzeri üretim planı açıyoruz.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                'Kurumsal planda tek pakette 500 QR kod',
                'Ürün anlatımı, kurulum talimatı ve sesli kullanım kılavuzu',
                'Her QR benzersiz ve kalıcı URL',
                'Müşteri destek gerektirmiyor — tam otonom',
                'WhatsApp üzerinden hızlı kurulum ve destek',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-neutral-400 text-sm">
                  <span className="text-violet-500 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <a
                href={whatsappCorporateHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-green-950/40"
              >
                WhatsApp ile Teklif Al →
              </a>
            </div>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-3xl p-6 lg:p-7">
            <p className="text-violet-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">Kurumsal Paket</p>
            <h3 className="text-white text-3xl font-black mb-2">500 QR</h3>
            <p className="text-5xl font-black text-white mb-2">2.599 TL</p>
            <p className="text-neutral-500 text-sm mb-4">Üreticiler, kutu içi kullanım kılavuzları ve sesli ürün anlatımı için başlangıç paketi.</p>
            <p className="text-amber-300/90 text-sm mb-6">500 adet ve üzeri kurumsal üretim için lütfen iletişime geçiniz.</p>
            <div className="space-y-3 mb-6 text-sm text-neutral-300">
              <p>Min. sipariş: 500 adet</p>
              <p>QR üretim ve teslim akışı</p>
              <p>Ürün başına sabit sesli anlatım altyapısı</p>
            </div>
            <a
              href={whatsappCorporateHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-3.5 rounded-2xl transition-all active:scale-95"
            >
              WhatsApp ile İletişime Geç
            </a>
          </div>
        </div>
      </div>
      </section>

      <section className="relative z-10 px-4 py-16 max-w-5xl mx-auto">
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">İletişim &amp; Ödeme Bilgileri</h2>
            <p className="text-neutral-500">Slot satın almak veya destek almak için aşağıdaki kanallardan ulaşın.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-white font-bold text-lg mb-2">Sipariş & Destek</h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-5">
                Bireysel sipariş, fiyat bilgisi ve destek talepleri için WhatsApp üzerinden ulaşabilirsiniz.
              </p>
              <a
                href={whatsappOrderHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-3.5 rounded-2xl transition-all active:scale-95"
              >
                Sipariş İçin Yaz
              </a>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 lg:col-span-2">
              <div className="text-3xl mb-4">🏦</div>
              <h3 className="text-white font-bold text-lg mb-2">Banka / Havale Bilgileri</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-600 mb-1">Şirket Adı</p>
                  <p className="text-white font-medium">SCE Innovation Ltd.Şti</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">Banka</p>
                  <p className="text-white font-medium">Türkiye Garanti Bankası</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">IBAN</p>
                  <p className="text-white font-medium break-all">TR48 0006 2000 7740 0006 2930 33</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">Hesap No</p>
                  <p className="text-white font-medium">774-6293033</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">Şube</p>
                  <p className="text-white font-medium">Etlik Şubesi</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">Kart Ödeme</p>
                  <p className="text-white font-medium">VISA</p>
                </div>
              </div>
              <div className="mt-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <p className="text-neutral-400 text-sm">
                  Ödeme sonrası dekontunuzu ve sipariş detayınızı WhatsApp üzerinden paylaşabilirsiniz. Tüm tahsilatlar SCE Innovation Ltd.Şti adına alınır.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 px-4 py-24 text-center max-w-3xl mx-auto">
        <div className="text-6xl mb-6">🎙️</div>
        <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">
          Anahtarlığın<br />
          <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            konuşma vakti
          </span>
        </h2>
        <p className="text-neutral-500 text-lg mb-10">
          Fiziksel ürünler artık dijital sesler taşıyabilir.
        </p>
        <a
          href={whatsappOrderHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-10 py-5 rounded-2xl transition-all active:scale-95 text-lg shadow-2xl shadow-violet-900/50"
        >
          Fiyat Al / Satın Al
        </a>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-neutral-900 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-700 text-sm">
          <div className="flex items-center gap-2">
            <span>🎙️</span>
            <span className="font-semibold text-neutral-600">QRNote</span>
          </div>
          <p>Sesli anılar, kalıcı QR kodlar</p>
          <a href={whatsappOrderHref} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">
            WhatsApp Destek
          </a>
        </div>
      </footer>

    </div>
  )
}

