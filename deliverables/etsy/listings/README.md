# Etsy dijital ürün ilanları — yükleme kılavuzu

Her ilan klasöründe Etsy'ye birebir kopyalanacak dosyalar var:

| Dosya | Etsy'de nereye |
|---|---|
| `title.txt` | **Title** (≤140 karakter — kontrol edildi) |
| `description.txt` | **Description** |
| `tags.txt` | **Tags** (13 etiket, her biri ≤20 karakter — kontrol edildi) |
| `price.txt` | **Price** (önerilen fiyat) |
| `images/*.png` | **Photos** — dosya adındaki sıraya göre yükle (01 kapak olur) |
| `download/QRNot-Activation-Instructions.pdf` | **Digital files** — alıcının indireceği dosya |

Görselleri ve PDF'leri yeniden üretmek için: `node deliverables/etsy/build-etsy.mjs`

## İlanlar

| Klasör | Ürün | Önerilen fiyat | Görsel |
|---|---|---|---|
| `01-voice-message-qr-gift-tag` | Sesli / videolu mesaj QR'ı (hediye etiketi, kart, sticker şablonları) | $9.99 | 7 |
| `02-audio-video-guestbook` | Dijital anı defteri (düğün / etkinlik) | $24.99 | 6 |
| `03-pet-id-emergency-qr` | Evcil hayvan / acil durum QR künyesi | $8.99 | 5 |

Fiyatlar öneridir; Etsy işlem ve listeleme ücretlerini hesaba kat.

## Etsy'de seçilecek ayarlar

- **Type:** Digital files
- **Who made it?** I did · **What is it?** A finished product · **When was it made?** Made to order
- **Category:** Paper & Party Supplies → Paper → Greeting Cards (01), Weddings → Decorations → Signs (02), Pet Supplies → Pet Collars & Leashes → Pet ID Tags (03) — Etsy önerilerine göre en yakını seç
- **Quantity:** 999 (her adet = 1 benzersiz QR; aktivasyon sistemi adedi otomatik sınırlar)
- **Personalization:** kapalı (kişiselleştirme qrnot.com'da yapılıyor)
- **Renewal:** Automatic

## Satıştan sonra yapman gereken (her gün)

Alıcının QR'ı aktive edebilmesi için sipariş numarasının QRNot'ta olması gerekir:

1. Etsy → Shop Manager → Settings → Options → **Download Data** → Orders CSV
2. `qrnot.com/admin/shop` → **Etsy** → **Etsy siparişleri** → CSV'yi yükle
3. İlanlarda ve PDF'te "24 saat içinde aktive edilir" yazıyor — listeyi **günde en az bir kez** güncelle.

## Etsy otomatik sipariş mesajı

Settings → Messages → **Order confirmation** alanına:

```
Thank you for your order! 💛 Your personal QR code will be ready to activate within 24 hours.
Open the instruction PDF, visit qrnot.com/etsy, enter your order number and sign in to your free QRNot account to set it up.
If you have any questions, just reply to this message.
```

## İlanlarda bilerek yazılan / yazılmayan şeyler

- Ses kaydı **2 dakikaya** kadar.
- İçerik güncelleme: **3 kayıt dahil** (ilk mesaj + 2 güncelleme), fazlası talep üzerine. İsim, telefon ve adres sınırsız güncellenir.
- Evcil hayvan künyesinde **GPS yok**; bulan kişi senin girdiğin telefon ve adresi görür. İlan ve SSS bunu açıkça söylüyor.
- Anı defteri: 300 anıya kadar, her misafir bir kez yazar, anılar onaydan geçer ve indirilebilir.
- Görsellerdeki QR'lar örnek amaçlıdır ve qrnot.com ana sayfasına gider; alıcının kendi QR'ı aktivasyondan sonra oluşur.
