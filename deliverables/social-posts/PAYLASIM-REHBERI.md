# QRNot — Sosyal medya görselleri ve paylaşım metinleri

Görseller: `deliverables/social-posts/png/`
Yeniden üretmek için (metin / fiyat değişince): `node deliverables/social-posts/build-posts.mjs`

Görsellerdeki QR kodlar gerçektir ve `qrnot.com/shop`'a gider. Her biri platformu ayırt eden bir UTM etiketi taşır, böylece hangi paylaşımın satış getirdiği site analizinde görünür.

| Dosya | Ölçü | Nerede |
|---|---|---|
| `ig-01` … `ig-14` | 1080 × 1350 (4:5) | Instagram post / carousel, Facebook |
| `st-01` … `st-05` | 1080 × 1920 (9:16) | Instagram Story / Reels kapağı, TikTok |
| `li-01`, `li-03`, `li-04` | 1200 × 1200 | LinkedIn kare post |
| `li-02` | 1200 × 627 | LinkedIn yatay post / link görseli |

---

## Instagram

### 1) Tanıtım — `ig-01-tanitim.png`
```
Hediye veriyorsun. Peki sesini de veriyor musun? 🎙️

Sesli Anı Kolyesi'nin arkasındaki QR'ı okutan kişi
senin sesini duyar, videonu izler, fotoğraflarınıza bakar.

Uygulama yok. Pil yok. Mesajını sonradan güncelleyebilirsin (3 kayıt dahil).

🔗 Profildeki linkten: qrnot.com
```
`#QRNot #SesliHediye #KişiyeÖzelHediye #AnıKolyesi #HediyeFikri #SevgiliyeHediye #AnneyeHediye`

### 2) Carousel "Nasıl çalışır?" — tek post, bu sırayla yükle
1. `ig-02-carousel-kapak.png`
2. `ig-03-carousel-1-satin-al.png`
3. `ig-04-carousel-2-kur.png`
4. `ig-05-carousel-3-hediye-et.png`
5. `ig-06-carousel-4-guncelle.png`

```
4 adımda sesli hediye 👇

1️⃣ Satın al — kolye, anahtarlık ya da anı defteri
2️⃣ Hesabınla kur — QR'ı okut, sesini kaydet. QR artık senin.
3️⃣ Hediye et — kutuyu açar, okutur, dinler
4️⃣ Sonradan güncelle — yıl dönümünde yeni bir mesaj ekle (3 kayıt dahil)

Kaydır, nasıl çalıştığını gör →
qrnot.com
```
`#QRNot #SesliHediye #NasılYapılır #HediyeFikri #KişiyeÖzelHediye`

### 3) NFC — `ig-07-nfc.png`
```
Dokun. Dinle. 📶

NFC + QR Anı Kolyesi'nde kamerayı açmana bile gerek yok.
Telefonu kolyeye yaklaştır, ses çalsın.

✔ iPhone XS ve sonrası, NFC'si açık Android
✔ NFC olmayan telefonlar için QR yedekte
✔ Çip kilitli gelir, kimse değiştiremez

qrnot.com/nfc
```
`#QRNot #NFC #NFCKolye #SesliHediye #TeknolojikHediye #HediyeFikri`

### 4) Anı defteri — `ig-08-ani-defteri.png`
```
Düğününüzde kimin ne dediğini 10 yıl sonra da dinleyin. 💒

Masalara tek bir QR kart koyun.
Misafirler sesli mesaj, video ya da fotoğraf bıraksın.
Siz onaylayın, saklayın, istediğiniz zaman dinleyin.

Yazdırılabilir masa kartları dahil · qrnot.com/guestbook
```
`#QRNot #DüğünAnıDefteri #DijitalAnıDefteri #Düğün #Nişan #DüğünHazırlığı #Gelin`

### 5) Ürünler — `ig-09-urunler.png`
```
Bir QR, altı farklı hikâye. Seninki hangisi? 💛

🩷 Sesli Anı Kolyesi — 449 TL
🧡 NFC + QR Kolye — 599 TL
💙 Sesli Anahtarlık — 349 TL
💚 NFC + QR Anahtarlık — 499 TL
📖 Dijital Anı Defteri — 499 TL
🔲 Dijital QR Hakkı — 249 TL

1–3 iş gününde kargoda · Kargo alıcı ödemeli
qrnot.com/shop
```
`#QRNot #SesliHediye #HediyeFikri #KişiyeÖzelHediye #AnıKolyesi #Anahtarlık`

### 6) Story — `st-03-story-urunler.png`
- Link çıkartması ekle: `qrnot.com/shop`
- İsteğe bağlı anket çıkartması: "Hediyede ses mi, video mu?"
- Not: Story'nin en alt ~250 px'i yanıt çubuğunun altında kalabilir; link çıkartmasını ortaya koy.

---

### 7) Anı defteri carousel'i — tek post, bu sırayla yükle
1. `ig-10-ani-defteri-kapak.png`
2. `ig-11-ani-defteri-1-kur.png`
3. `ig-12-ani-defteri-2-masa-karti.png`
4. `ig-13-ani-defteri-3-misafir.png`
5. `ig-14-ani-defteri-4-sakla.png`

```
İmza değil, ses toplayın. 💒

Dijital Anı Defteri nasıl çalışır? 👇
1️⃣ Dakikalar içinde kur — etkinlik adı, onay ve isteğe bağlı PIN
2️⃣ Masa kartlarını bas — isimlerinizle hazır şablon
3️⃣ Misafirler okutup anı bırakır — ses, video, fotoğraf ya da not
4️⃣ Onayla, sakla, indir — her anı önce senin onayından geçer

Uygulama yok, kiralık telefon yok, sıra yok.
Her misafir kendi telefonundan, aynı anda kaydeder.

300 anıya kadar · 499 TL · qrnot.com/guestbook
```
`#QRNot #DijitalAnıDefteri #DüğünAnıDefteri #Düğün #Nişan #KınaGecesi #DüğünHazırlığı #Gelin #DüğünFikirleri`

### 8) Anı defteri Story — `st-04-story-ani-defteri.png`
- Link çıkartması: `qrnot.com/guestbook`
- İsteğe bağlı soru kutusu: "Düğününüz ne zaman? 💍"

## TikTok

TikTok'ta bu görseller iki şekilde kullanılır:
- **Video kapağı:** Videoyu yüklerken "Kapak seç" → "Görsel yükle" ile `st-01` veya `st-02`.
- **Fotoğraf modu (carousel):** `st-01` + `ig` görselleri, müzik ekleyerek kaydırmalı gönderi.

### `st-01-tiktok-kapak-pov.png` — "POV: Hediyenin içinde bir ses var" videosu için
```
POV: hediyenin içinde bir ses var 🎙️💛
kolyenin arkasındaki QR'ı okut, onun sesini duy.
uygulama yok, pil yok.

qrnot.com
```
`#QRNot #SesliHediye #HediyeFikri #POV #Sevgili #AnnemeHediye`

### `st-02-tiktok-kapak-kurulum.png` — 15 saniyelik kurulum videosu için
```
15 saniyede sesli hediye nasıl hazırlanır? 👇
1. hesabına gir
2. QR'ı okut
3. sesini kaydet
bitti. mesajını sonradan da güncelleyebilirsin.

qrnot.com
```
`#QRNot #NasılYapılır #HediyeFikri #SesliHediye #DIY`

---

### `st-05-tiktok-kapak-ani-defteri.png` — anı defteri videosu için
Video fikri: masadaki QR kart → misafir okutup sesli mesaj bırakıyor → çift düğünden sonra kanepede mesajları dinliyor.
```
POV: düğünden sonra misafirlerin sesini dinliyorsunuz 💛
masalara tek bir QR kart, misafirler sesli mesaj ve video bırakıyor.
uygulama yok, kiralık telefon yok.

qrnot.com/guestbook
```
`#QRNot #DüğünAnıDefteri #Düğün #POV #Gelin #DüğünHazırlığı`

## LinkedIn

### 1) Kurumsal — `li-01-kurumsal.png`
```
QR kodları sadece menü göstermek için değil.

QRNot'ta her sektöre özel bir panel var: QR'ları toplu üretiyor,
içeriği tek yerden güncelliyor, gelen talepleri canlı izliyorsunuz.

🏨 Otel — oda servisi, temizlik ve teknik talepler
🎓 Eğitim — QR ile yoklama, ders materyali
🏥 Sağlık — ilaç ve cihaz kullanım talimatı
🏭 Fabrika — makine üzerinde kullanım kılavuzu, bakım, iş güvenliği
🛍️ Perakende — raf etiketinde ürün hikâyesi, fiyat kontrolü
🚚 Lojistik — teslimat kanıtı, soğuk zincir takibi

Okutan kişinin uygulama indirmesi gerekmiyor.
Sektörünüz için teklif: qrnot.com/#kurumsal

#QRKod #Dijitalleşme #OperasyonelVerimlilik #Otel #Üretim #Lojistik #Perakende
```

### 2) Fabrika — `li-02-fabrika-kilavuz.png`
```
Kullanım kılavuzu çekmecede değil, makinenin üzerinde olmalı.

Makineye ya da ürettiğiniz ürüne yapıştırılan tek bir QR ile:
✔ Montaj ve kullanım videosu
✔ Kılavuz bağlantısı
✔ Bakım ve arıza bildirimi
✔ İş güvenliği akışı ve operatör eğitimi

İçerik değişince QR'ı yeniden basmanıza gerek yok; panelden güncellersiniz.

Detay ve teklif: qrnot.com

#Üretim #EndüstriyelDijitalleşme #İSG #Bakım #QRKod #Fabrika
```

### 3) Güven — `li-03-guven.png`
```
Duygusal bir ürün, ancak güvenilir olduğunda değerli.

QRNot'ta bu ay sağlamlaştırdıklarımız:
✔ Her QR, satın alan üyenin hesabına kilitleniyor; başkası sahiplenemiyor
✔ Pazaryeri siparişleri doğrulanmadan dijital ürün aktive edilemiyor
✔ NFC çipler programlanıp kilitleniyor
✔ Dijital anı defterinde her misafir bir kez yazabiliyor

Hediyelik satıcıları ve pazaryerleriyle pilot görüşmelerine açığız.

#ECommerce #ÜrünYönetimi #Güvenlik #Hediye #Girişimcilik
```

---

### 4) Düğün ve etkinlik organizatörleri — `li-04-organizatorler.png`
```
Düğün ve etkinlik organizatörleri: paketinize dijital anı defteri ekleyin.

Masalara konan tek bir QR kart ile misafirler kendi telefonlarından
sesli mesaj, video ve fotoğraf bırakıyor.

✔ Kiralık telefon, kurulum ekibi, iade süreci yok
✔ Misafirler sırada beklemeden, aynı anda kaydediyor
✔ Çiftin onayı, PIN koruması, indirilebilir anılar
✔ İsimli masa kartları hazır şablon

Toplu alım ve iş birliği için: qrnot.com/guestbook · sce@scegrup.com

#DüğünOrganizasyonu #EtkinlikYönetimi #Wedding #EventPlanning #QRKod
```

## Paylaşım takvimi (ilk 2 hafta, önerilen)

| Gün | Instagram | TikTok | LinkedIn |
|---|---|---|---|
| Pzt | ig-01 Tanıtım | st-01 POV videosu | li-01 Kurumsal |
| Çar | Carousel (ig-02…06) | — | — |
| Cum | ig-07 NFC + Story st-03 | st-02 Kurulum videosu | li-02 Fabrika |
| Pzt | Anı defteri carousel (ig-10…14) + Story st-04 | st-05 Anı defteri videosu | li-04 Organizatörler |
| Per | ig-09 Ürünler + Story st-03 | — | li-03 Güven |

**Hatırlatma:** "Ücretsiz dene", "ücretsiz kargo" ya da uydurma müşteri yorumu kullanma (bkz. `MARKETING_CONTENT.md`).
