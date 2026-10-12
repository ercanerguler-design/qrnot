# QRNot × Pazaryerleri — Ortaklık Sunumu 2026

> Hedef kitle: ÇiçekSepeti, Trendyol, Hepsiburada, N11 ve Amazon.com.tr kategori / iş geliştirme ekipleri.
> Süre: 15 dakika sunum + 10 dakika soru-cevap. Her slaytta **başlık**, **ana mesaj** ve **konuşma notu** var.
> Teknik entegrasyonun detayı için: `deliverables/pazaryeri-entegrasyon/PAZARYERI-ENTEGRASYON-TASARIMI.md`

---

## Slayt 1 — Kapak

**QRNot: Hediyeye ses veren ürün katmanı**

Sesli, videolu ve NFC'li hediye ürünleri — pazaryeri entegrasyonuna hazır.

*qrnot.com · SCE Grup*

---

## Slayt 2 — Tek cümlede QRNot

**Fiziksel bir hediyeye; sesli mesaj, video, fotoğraf ve link taşıyan, sonradan güncellenebilen kişisel bir sayfa bağlıyoruz.**

- Hediyeyi alan kişi QR'ı okutur ya da telefonunu NFC çipe dokundurur.
- Uygulama indirmeden, gönderenin sesini duyar, videosunu izler.
- QR ve NFC çip hiç değişmez; içerik hesap sahibi tarafından istenildiği zaman güncellenir.

**Konuşma notu:** "Kart notu okunur ve atılır. QRNot ürünü yıllarca yeniden açılır."

---

## Slayt 3 — Problem

| Pazaryerinde bugün | Sonuç |
|---|---|
| Hediyelik ürünler birbirine benziyor | Rekabet fiyata kayıyor, marj eriyor |
| Kişiselleştirme çoğunlukla isim baskısı ile sınırlı | Duygusal fark yaratma alanı dar |
| "Hediye notu" alanı düz metin | Hediye verenin asıl istediği — sesi, anısı — taşınamıyor |

---

## Slayt 4 — Çözüm: Ürün gamı

| Ürün | Ne yapar | Liste fiyatı (TL) |
|---|---|---|
| Sesli Anı Kolyesi | Pleksi, neon damla baskı, arkada kişiye özel QR | 449 |
| NFC + QR Anı Kolyesi | Dokun-aç NFC çip + QR yedeği, kilitli programlanmış | 599 |
| Sesli Anahtarlık | Ses / video / acil iletişim bilgisi tek QR'da | 349 |
| NFC + QR Anahtarlık | Kartvizit, evcil hayvan künyesi, hediye | 499 |
| Dijital Anı Defteri | Düğün / etkinlik: misafirler sesli-videolu anı bırakır | 499 |
| Dijital QR Hakkı | Satıcının kendi ürününe / kartına basacağı QR | 249 |

- Ücretsiz ürün ya da deneme yoktur; her QR satın alınmış bir ürüne veya hakka bağlıdır.
- Fiyatlar QRNot mağaza liste fiyatlarıdır; pazaryeri fiyatlaması komisyon modeline göre ayrıca belirlenir.

---

## Slayt 5 — Kullanıcı deneyimi (3 adım)

1. **Satın al** — Ürün pazaryerinden ya da qrnot.com'dan alınır.
2. **Kur** — Alıcı QRNot hesabıyla giriş yapar, QR'ı okutur; sesini kaydeder veya video / fotoğraf yükler. QR o hesaba bağlanır.
3. **Hediye et** — Alan kişi okutur ya da dokundurur; içerik anında açılır. Uygulama gerekmez.

**Neden hesap zorunlu?** Ürünün içeriğini sadece sahibi yönetebilir; kayıp ya da cihaz değişikliğinde QR hesaptan geri bulunur. Bu, pazaryeri için "satış sonrası destek yükü" riskini azaltır.

---

## Slayt 6 — Güven ve güvenlik (pazaryeri için kritik)

| Konu | QRNot'ta nasıl çözüldü |
|---|---|
| Sahiplik | Her QR satın alan üyenin hesabına bağlanır; başka hesap sahiplenemez |
| Sahte aktivasyon | Pazaryeri siparişleri doğrulanmadan dijital ürün aktive edilemez |
| İptal / iade | İptal edilen siparişin QR'ı devre dışı kalır; içerik açılmaz |
| Kötüye kullanım | Giriş ve yönetim uç noktalarında deneme sınırı, oturum güvenliği |
| Anı defteri | Aynı misafir aynı deftere bir kez anı bırakır; ev sahibi onayı (moderasyon) ve PIN |
| NFC | Çip, QR sayfasına programlanır ve kilitlenir; başkası yeniden yazamaz |
| Altyapı | Vercel üzerinde yayında, Neon PostgreSQL, Vercel Blob medya depolama |

---

## Slayt 7 — Pazaryerine değeri

| Paydaş | Kazanım |
|---|---|
| **Pazaryeri** | Hediye kategorisinde fark yaratan, fiyat dışı rekabet unsuru; özel gün kampanyalarına yeni ürün tipi |
| **Satıcı** | Aynı ürünü daha yüksek algı değeriyle satma; "dijital QR hakkı" ile kendi ürününe katman ekleme |
| **Alıcı** | Unutulmayan, yeniden açılan, güncellenebilen hediye |

---

## Slayt 8 — İş modelleri

**Model A — QRNot mağazası (hemen başlar)**
QRNot, pazaryerinde satıcı mağazası olarak fiziksel ürünleri listeler. Standart komisyon, QRNot lojistik ve destek.

**Model B — Satıcı eklentisi (B2B)**
Pazaryerindeki hediye satıcıları ürünlerine QRNot QR / NFC etiketi ekler. QRNot, satıcıya toplu QR hakkı ya da etiket satar.

**Model C — Sepet eklentisi (co-branded add-on)**
Ürün sayfasında "Sesli mesaj ekle" seçeneği. Add-on bedelinden pazaryeri ile gelir paylaşımı.

**Model D — White-label**
Pazaryeri markasıyla sunulan deneyim. Yıllık lisans + hacim kademesi.

Önerilen sıra: **A ile başla → pilot verisiyle B ve C'ye geç.**

---

## Slayt 9 — Entegrasyon özeti

```
Pazaryeri siparişi ──► QRNot sipariş senkronu (API) ──► Doğrulanmış sipariş kaydı
                                                         │
             ┌───────────────────────────────────────────┼─────────────────────────────┐
             ▼                                           ▼                             ▼
   Fiziksel ürün: üretim kuyruğu               Dijital ürün: aktivasyon kodu   İptal / iade: QR devre dışı
   (QR kazıma + NFC yazma istasyonu)           (pakete / mesaja eklenir)       (otomatik)
             │                                           │
             └──────────────► Alıcı QRNot hesabıyla QR'ı sahiplenir ◄─────────┘
```

- Pazaryeri tarafında **ek geliştirme gerekmez** (Model A); QRNot, pazaryerinin satıcı API'lerini kullanır.
- Model C için ürün sayfası add-on alanı ve sipariş satırında "kişiselleştirme" bilgisinin taşınması gerekir.

---

## Slayt 10 — Platforma özel senaryolar

| Platform | Senaryo | Öncelikli kategori |
|---|---|---|
| ÇiçekSepeti | Çiçek + sesli/videolu not (dijital QR kartı) | Çiçek, hediye kutusu |
| Trendyol | Özel gün koleksiyonları: kolye, anahtarlık | Takı, aksesuar |
| Hepsiburada | Premium hediye, NFC'li ürünler | Hediyelik, elektronik aksesuar |
| N11 | Kampanya dönemlerinde kişiselleştirilebilir paketler | Hediyelik |
| Amazon.com.tr | Anı defteri (düğün / etkinlik) | Parti ve etkinlik |

---

## Slayt 11 — Pilot önerisi (90 gün)

| Faz | Süre | Çıktı |
|---|---|---|
| 1. Kurulum | Hafta 1–2 | Mağaza açılışı, 6 ürün listesi, sipariş API bağlantısı |
| 2. Lansman | Hafta 3–6 | Kategori vitrini / kampanya alanı denemesi |
| 3. Ölçüm | Hafta 7–10 | Dönüşüm, sepet tutarı, iade, yorum puanı, kurulum tamamlama oranı |
| 4. Karar | Hafta 11–12 | Sonuç raporu, Model B/C için ticari teklif |

**Pazaryerinden talebimiz:** Kategori yöneticisi ile haftalık temas, bir özel gün kampanyasında görünürlük, pilot süresince satış verisi paylaşımı.

**QRNot taahhüdü:** 1–3 iş günü kargo, WhatsApp + e-posta destek, haftalık KPI raporu.

---

## Slayt 12 — Ölçeceğimiz KPI'lar

| KPI | Tanım |
|---|---|
| Dönüşüm oranı | Ürün sayfası ziyaretinden siparişe |
| Ortalama sepet tutarı | Add-on içeren / içermeyen siparişlerde |
| Kurulum tamamlama oranı | Satılan ürünlerden QR'ı sahiplenilenlerin oranı |
| Tekrar açılma | QR / NFC okutma sayısı (ilk 30 gün) |
| İade oranı | Kategori ortalamasıyla karşılaştırmalı |
| Yorum puanı | Ürün yorumları ortalaması |

> Not: Bu sunumda dönüşüm veya iade etkisine dair rakam **vaat edilmez**; pilot verisiyle ölçülür ve raporlanır.

---

## Slayt 13 — Birim ekonomi (örnek, Model C)

Varsayımlarla hazırlanmış görüşme modeli — gerçek değerler pilotta belirlenir.

| Kalem | Varsayım |
|---|---|
| Add-on (dijital QR kartı) fiyatı | 249 TL |
| Pazaryeri payı | Platformun standart komisyon oranı |
| Attach rate (hediye siparişlerinde) | Senaryo: %1 / %2 / %3 |

Formül: `Ek ciro = Hediye sipariş sayısı × attach rate × 249 TL`
Örnek: 100.000 hediye siparişi × %2 × 249 TL = **498.000 TL ek ciro**

---

## Slayt 14 — Riskler ve önlemler

| Risk | Önlem |
|---|---|
| Alıcı kurulumu tamamlamaz | Paket içi kart (3 adım), sipariş sonrası hatırlatma mesajı, WhatsApp destek |
| Hesap açma adımı sürtünme yaratır | Tek ekran kayıt, kayıt sonrası doğrudan QR kurulumuna dönüş |
| Hatalı / sahte aktivasyon | Sipariş API doğrulaması; iptalde otomatik devre dışı |
| Üretim kapasitesi | Toplu QR üretimi + NFC yazma istasyonu; kampanya öncesi stok planı |
| İçerik uygunluğu | Anı defterinde moderasyon; şikayet halinde içerik kaldırma süreci |

---

## Slayt 15 — Yol haritası

| Dönem | Hedef |
|---|---|
| Q4 2026 | İlk pazaryerinde mağaza (Model A), sipariş senkronu, yılbaşı kampanyası |
| Q1 2027 | Sevgililer Günü kampanyası, 2. pazaryeri, satıcı eklentisi (Model B) pilotu |
| Q2 2027 | Anneler Günü + düğün sezonu: anı defteri odaklı kampanyalar, sepet eklentisi (Model C) görüşmesi |
| Q3 2027 | Çok kanallı sipariş yönetimi, kurumsal (B2B) toplu paketler |

---

## Slayt 16 — Kapanış

**Hediyeler satılıyor. Anılar yeniden açılıyor.**

90 günlük, ölçülebilir bir pilotla başlayalım.

İletişim: qrnot.com · sce@scegrup.com

---

## Ek A — 2 dakikalık konuşma metni

"Hediyelik kategorisinde ürünler birbirine benziyor ve rekabet fiyata kayıyor. QRNot bu kategoriye fiyat dışı bir fark getiriyor: kolyeye, anahtarlığa ya da bir karta, gönderenin sesini, videosunu ve fotoğraflarını taşıyan kişisel bir sayfa bağlıyoruz. Alan kişi uygulama indirmeden, okutarak ya da NFC ile dokunarak açıyor. İçerik sonradan güncellenebildiği için ürün yıllarca yeniden açılıyor.

Bugün altı ürünle satıştayız; hepsi ücretli, her QR satın alan üyenin hesabına bağlı. Pazaryeri siparişlerini API ile doğruluyoruz, iptal edilen siparişin QR'ı otomatik kapanıyor. Önerimiz basit: mağaza olarak 90 günlük bir pilot. Dönüşüm, sepet tutarı ve iade üzerindeki etkiyi birlikte ölçelim; veri olumluysa satıcı eklentisi ve sepet eklentisi modellerine geçelim."

## Ek B — Sık sorulan sorular

**Alıcının uygulama indirmesi gerekiyor mu?** Hayır. QR kamera ile, NFC ise iPhone XS ve sonrası ile NFC'si açık Android telefonlarda doğrudan açılır.

**Neden üyelik gerekiyor?** QR'ın sahibini güvenle belirlemek ve kaybolma / cihaz değişikliğinde erişimi korumak için. Üyelik ücretsizdir; ürünler ücretlidir.

**İçerik ne kadar süre saklanır?** Ürün aktif olduğu sürece. Hesap sahibi içeriği istediği zaman değiştirebilir veya kaldırabilir.

**İade nasıl işler?** Fiziksel ürünlerde yasal 14 günlük cayma hakkı geçerlidir. Hesaba tanımlanmış ve kullanılmaya başlanmış dijital ürünlerde cayma hakkı bulunmaz (mesafeli sözleşmeler mevzuatı).

**Kişisel veriler?** KVKK aydınlatma metni ve gizlilik politikası qrnot.com'da yayındadır; medya dosyaları yalnızca QR sahibinin paylaşım tercihine göre erişilebilir.

## Ek C — Sunumdan önce kontrol listesi

- [ ] Pazar büyüklüğü verisi kullanılacaksa güncel ve kaynaklı rakam ekle (ör. ETBİS / Ticaret Bakanlığı e-ticaret bülteni).
- [ ] Hedef platformun güncel komisyon oranlarını ilgili kategori için teyit et.
- [ ] Canlı demo: bir kolye + bir anı defteri QR'ı hazır olsun, telefonla okut.
- [ ] Her slayt için gerçek ürün fotoğrafı (neon kolye, anahtarlık, masa kartı).
