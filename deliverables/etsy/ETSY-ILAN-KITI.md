# QRNot — Etsy İlan Kiti

Etsy alıcısı ödeme yapınca bir PDF indirir. PDF'te **qrnot.com/etsy** adresi yazar; alıcı burada Etsy sipariş numarasını girer ve **kendine özel QR**'ını alır. QR'ı kurarken (ses kaydı / anı defteri) **QRNot hesabıyla giriş yapar**; QR o hesaba bağlanır.

### Sipariş doğrulama — her gün yapılacak

Sadece listede olan Etsy siparişleri aktive edilebilir; uydurma sipariş numarasıyla QR alınamaz.

1. Etsy → Shop Manager → Settings → Options → **Download Data** → Orders CSV'sini indir.
2. `qrnot.com/admin/shop → Etsy → Etsy siparişleri` bölümüne CSV'yi yükle (ya da sipariş numaralarını satır satır yapıştır).
3. Her sipariş, içindeki ürün adedi kadar QR alabilir. Şüpheli bir aktivasyonu "İptal" et — QR devre dışı kalır.

> Alıcıya "24 saat içinde" aktivasyon sözü verildiği için listeyi **günde en az bir kez** güncelle. Etsy API entegrasyonu tamamlanınca bu adım otomatikleşecek (`deliverables/pazaryeri-entegrasyon/`).

> Etsy kuralı: Dijital ürünlerde "made by me / designed by me" seçilmeli. Şablon tasarımı ve QR sayfası sana ait olduğu için uygundur.

---

## İlan 1 — Voice Message QR Gift Tag (en geniş kitle)

**Başlık (≤140):**
Voice Message QR Code Gift Tag, Printable Audio Message Card, Personalized Video Message, Recordable Greeting Card, Unique Gift for Mom

**Fiyat önerisi:** $6.99 – $9.99 (instant download)

**Etiketler (13 adet, her biri ≤20 karakter):**
`voice message gift` · `qr code gift tag` · `audio message card` · `recordable card` · `video message gift` · `printable gift tag` · `mothers day gift` · `long distance gift` · `personalized gift` · `qr code card` · `memory keepsake` · `gift for grandma` · `digital gift`

**Açıklama:**
```
Give your gift a VOICE. 🎙️

Record a voice message, a video, or add photos — then print your personal QR code on a gift tag, card or sticker. When they scan it with their phone camera, they hear YOU. No app needed.

✔ Your own unique QR code, linked to your QRNot account
✔ Voice, video, photos, Spotify & YouTube links
✔ Change your message any time — the QR never changes
✔ Printable templates included: gift cards, gift tags, round stickers (A4 size)
✔ Works on iPhone & Android

HOW IT WORKS
1. Purchase and download the PDF
2. Go to qrnot.com/etsy and enter your Etsy order number (ready within 24 hours of your order)
3. Sign in or create your QRNot account, record your message and print your QR — done!

PERFECT FOR
Mother's Day · Birthdays · Anniversaries · Long-distance love · Grandparents · Baby announcements · In loving memory

This is a DIGITAL product. No physical item will be shipped.
Questions? Message me — I reply within 24 hours.
```

---

## İlan 2 — Audio & Video Wedding Guestbook (yüksek fiyat, düğün nişi)

**Başlık:**
Audio Guestbook QR Code, Wedding Voice Message Guest Book, Video Guestbook Alternative, Digital Guest Book Sign, Printable Table Card

**Fiyat önerisi:** $19 – $29 (kiralık "audio guestbook phone" ürünleri $150+; fiyat avantajını öne çıkar)

**Etiketler:**
`audio guestbook` · `wedding guestbook` · `video guestbook` · `qr guestbook` · `voice guest book` · `wedding sign` · `digital guestbook` · `wedding qr code` · `guest book alt` · `bridal shower` · `party guestbook` · `retirement gift` · `memory book`

**Açıklama:**
```
Collect your guests' VOICES, not just signatures. 💛

One QR code on your tables — guests scan it and leave a voice message, a video, a photo or a written note. You approve every memory and keep them forever.

✔ Unlimited guests, up to 300 memories
✔ Voice, video, photo and text messages
✔ Approval (moderation) + optional PIN so only your guests can post
✔ Printable table cards included (personalized with your names)
✔ Download every memory
✔ No app — guests just use their phone camera

HOW IT WORKS
1. Purchase and download the PDF
2. Go to qrnot.com/etsy, enter your order number and choose "Guestbook" (ready within 24 hours of your order)
3. Sign in or create your QRNot account, name your event, print your table cards and enjoy your day

Each guest can leave one memory per guestbook.

Weddings · Engagements · Bridal & baby showers · Birthdays · Retirements · Farewells · Memorials
```

---

## İlan 3 — Pet ID / Emergency Contact QR (pratik ürün)

**Başlık:** QR Code Pet ID Tag Printable, Lost Pet Contact Card, Emergency Info QR Sticker, Scannable Dog Tag Template

**Etiketler:** `pet qr tag` · `lost pet tag` · `dog id tag` · `qr code sticker` · `emergency contact` · `pet id card` · `scannable tag` · `cat id tag` · `pet owner gift` · `luggage tag qr` · `kids id card` · `medical id card` · `printable sticker`

Not: Emergency (acil durum) bilgisi QR sayfasında "Ara" ve "Konumu aç" butonu olarak çıkar.

---

## İlan 4 — Fiziksel ürün (kolye / anahtarlık) — kargo ayarlandıktan sonra

**Başlık:** Voice Message Necklace, QR Code Photo Pendant, Engraved Audio Memorial Necklace, NFC Tap Jewelry, Gift for Mom, Anniversary Gift

Fiziksel üründe her kolye/anahtarlık zaten kendi QR'ı ile üretildiği için **sipariş aktivasyonu gerekmez**; alıcı QR'ı okutur, **QRNot hesabıyla giriş yapar** ve içeriğini ekler — QR o hesaba kilitlenir. Pakete 3 adımlı kurulum kartı koy. Etsy'de "Production partner" / "Made by" bilgilerini doğru doldur.

---

## Dijital indirme PDF'inin içeriği (tek sayfa)

```
THANK YOU! 💛
Let's activate your personal QR code.

1. Go to:  qrnot.com/etsy
2. Enter your Etsy order number (Etsy → You → Purchases)
   Your order is ready to activate within 24 hours.
3. Choose what you bought and click "Activate"
4. Sign in or create your QRNot account
5. Record your message (or set up your guestbook)
6. Download your QR and open the printable templates

Need help? Message us on Etsy — we reply within 24 hours.
```
PDF'e büyük bir "qrnot.com/etsy" QR kodu da koy (bu genel bir QR'dır, herkese aynı gider).

## Etsy otomatik sipariş mesajı (Settings → Messages → "Order confirmation")

```
Thank you for your order! Your personal QR code will be ready to activate within 24 hours. Visit qrnot.com/etsy, enter your order number and sign in to your QRNot account to set it up. If you have any questions, just reply to this message.
```

## Fotoğraf listesi (ilan başına 10 görsel)
1. Ürünü gösteren kapak (telefon QR'ı okutuyor + ekranda ses çalar)
2. "How it works" 3 adım görseli
3. Şablon örnekleri (kart, etiket, sticker)
4. Telefon ekranı: sesli mesaj sayfası
5. Telefon ekranı: video
6. Kullanım alanları kolajı (anneler günü, düğün, bebek…)
7. "No app needed" + iPhone/Android
8. Boyut / baskı ölçüleri
9. Anı defteri: masa kartı + misafir telefonu (İlan 2 için)
10. SSS görseli
