# Trendyol ve Hepsiburada ilanları

```
pazaryeri-ilanlari/
├── trendyol/      → görseller 1200 × 1800 (dikey 2:3)
│   ├── kolye-qr/  kolye-nfc/  anahtarlik-qr/  anahtarlik-nfc/
│   ├── evcil-hayvan-kunyesi/  cocuk-acil-durum-etiketi/  ani-defteri-masa-karti-seti/
└── hepsiburada/   → görseller 1500 × 1500 (kare)
    ├── (aynı 7 ürün)
```

Her ürün klasöründe:

| Dosya | Panelde nereye |
|---|---|
| `baslik.txt` | Ürün adı (≤100 karakter — kontrol edildi) |
| `aciklama.html` | Ürün açıklaması (HTML editörü) — düz metin istenirse `aciklama.txt` |
| `fiyat.txt` | Satış fiyatı (önerilen) |
| `urun-bilgileri.txt` | Kategori, marka, renk varyantları, stok kodları, KDV, materyal |
| `gorseller/01…06.png` | Ürün görselleri, dosya sırasıyla |

Yeniden üretmek için (fiyat, metin değişince): `node deliverables/pazaryeri-ilanlari/build-ilanlar.mjs`

---

## Fiyatlar

Pazaryerinde **kargo satıcıya aittir** (alıcı ödemeli seçeneği yok) ve satıştan **komisyon** kesilir. Bu yüzden pazaryeri fiyatı site fiyatından yüksektir:

`Pazaryeri fiyatı = (site fiyatı + kargo) / (1 − komisyon)` → 9 ile biten tutara yuvarlanır.

Varsayım: komisyon **%20**, anlaşmalı kargo **60 TL**. Bu varsayımla eline site fiyatı kadar kalır.

| Ürün | Site | Trendyol | Hepsiburada |
|---|---|---|---|
| Sesli Anı Kolyesi | 449 TL | 639 TL | 639 TL |
| NFC + QR Anı Kolyesi | 599 TL | 829 TL | 829 TL |
| Sesli Anahtarlık | 349 TL | 519 TL | 519 TL |
| NFC + QR Anahtarlık | 499 TL | 699 TL | 699 TL |
| NFC + QR Evcil Hayvan Künyesi | 499 TL | 699 TL | 699 TL |
| Çocuk Acil Durum Etiketi | 349 TL | 519 TL | 519 TL |
| Anı Defteri Masa Kartı Seti | 499 TL + 40 TL baskı | 749 TL | 749 TL |

**Yüklemeden önce:** Satıcı panelinden ilgili kategorinin gerçek komisyon oranını ve kargo anlaşma ücretini kontrol et; farklıysa `build-ilanlar.mjs` içindeki `PRICING` değerlerini değiştirip yeniden üret.

---

## Görseller

| Sıra | Görsel | Not |
|---|---|---|
| 01 | Ana görsel | Beyaz zemin, yazısız, sadece ürün (pazaryeri kuralı) |
| 02 | 5 neon renk seçeneği | |
| 03 | Nasıl çalışır (3 adım) | |
| 04 | Okutunca / dokununca ne görür | Telefon ekranı |
| 05 | Özellikler | NFC'li ürünlerde uyumluluk notu |
| 06 | Kimin için + tanıtım QR'ı | QR qrnot.com'a gider |

> ⚠️ **Ana görseli gerçek ürün fotoğrafıyla değiştir.** Görsellerdeki ürünler çizimdir. Trendyol ve Hepsiburada ana görselde ürünün **gerçek fotoğrafını** (beyaz zemin, yazısız) bekler; çizimle açılan ilan reddedilebilir ya da müşteri şikayetine yol açabilir. Her renk varyantı için ayrı ana fotoğraf yükle. 02–06 anlatım görselleri olarak kalabilir; açıklamada "çizimler temsilidir" notu var.

---

## Yüklemeden önce doldurulması gerekenler

Açıklamalarda ve `urun-bilgileri.txt` içinde `[DOLDUR]` yazan yerler:

- **Ölçü:** kolye ucu / anahtarlık boyutu, zincir uzunluğu
- **Paket içeriği:** örn. ürün + kurulum kartı
- **Desi** (kargo hacmi)
- **Barkod:** her renk varyantı için ayrı (GS1 Türkiye barkodu ya da pazaryerinin barkod çözümü)

Ayrıca:

- **Marka:** "QRNot" markasını pazaryerinde kendi markan olarak açtırman gerekir (marka tescil belgesi ya da başvuru evrakı istenebilir).
- **Kategori:** önerilen kategoriler `urun-bilgileri.txt` içinde; panelde en yakın kategoriyi seç.

---

## Kullanım odaklı ilanlar

Evcil hayvan künyesi ve çocuk etiketi, mevcut NFC / QR anahtarlık altyapısıyla aynı üründür; pazaryerinde farklı arama kitlesine ("kedi künyesi", "okul çantası etiketi") ayrı ilan olarak sunulur. Stok kodları ayrıdır (`QRN-PET-NFC-*`, `QRN-COCUK-QR-*`). Künye için yuvarlak gövde kullanacaksan ana fotoğrafı ona göre çek.

**Anı Defteri Masa Kartı Seti** fiziksel üründür: pazaryerinde dijital kod satılamadığı için anı defteri basılı kart seti olarak gönderilir.

1. Admin → Mağaza → Üretim & NFC → **Mod: Anı defteri**, adet: 1, kanal: `trendyol` / `hepsiburada` → 1 QR üret.
2. Setteki **tüm kartlara aynı QR'ı** bas (hepsi tek anı defterine bağlanır).
3. Alıcı kartı okutup hesabıyla anı defterini kurar; misafirler aynı QR ile anı bırakır.
4. Set içeriği ve kart ölçüsü açıklamada `[DOLDUR]` olarak bırakıldı; baskı maliyeti fiyatta 40 TL varsayıldı.

Çocuk etiketi açıklamasında gizlilik uyarısı bilerek var: QR'ı okutan herkes girilen bilgiyi görebildiği için çocuğun tam adı, okulu ve ev adresi yerine sadece veli telefonu önerilir.

## Paketleme ve kurulum

Pazaryerinden gelen alıcı ürünü **QRNot hesabıyla sahiplenir**:

1. Ürünle birlikte **3 adımlı kurulum kartı** gönder: "qrnot.com'da hesap aç → QR'ı okut → sesini kaydet".
2. Ürünlerin QR'larını admin panelden toplu üret (Admin → Mağaza → Üretim & NFC, kanal: `trendyol` / `hepsiburada`). Kanal adı, hangi pazaryerinden ne kadar ürün sahiplenildiğini görmeni sağlar.
3. NFC'li ürünlerde çipi NFC yazma istasyonunda **kazınan QR ile aynı adrese** yaz ve kilitle.

## Açıklamalarda bilerek yer alan bilgiler

- İçerik eklemek için ücretsiz QRNot hesabı gerekir; QR ilk kurulan hesaba kilitlenir.
- Ses ve video en fazla 2 dakika (bireysel ürün).
- 3 içerik kaydı dahil (ilk kayıt + 2 güncelleme); isim, telefon, adres sınırsız.
- Çizimler temsilidir, renk tonu ekrana göre değişebilir.
- Kargo süresi açıklamada yazmaz; pazaryeri panelindeki "kargoya teslim süresi" alanına **1–3 iş günü** gir.
