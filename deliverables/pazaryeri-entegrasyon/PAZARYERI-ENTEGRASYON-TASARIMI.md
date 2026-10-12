# QRNot — Pazaryeri Entegrasyon Tasarımı

| | |
|---|---|
| Durum | Tasarım (v1) — uygulanmaya hazır |
| Kapsam | Trendyol, Hepsiburada, ÇiçekSepeti, N11, Amazon.com.tr, Etsy |
| İlgili kod | `src/app/api/etsy/activate`, `src/app/api/admin/shop`, `src/lib/growthSchema.ts`, `src/lib/claimAuth.ts`, `src/lib/webNfc.ts` |

---

## 1. Amaç ve ilkeler

QRNot ürünlerini birden çok pazaryerinde satarken:

1. **Hiçbir QR doğrulanmamış siparişle aktive edilmez.** (Bugün Etsy'de elle CSV yükleyerek uygulanan kural, tüm kanallarda otomatik hale gelir.)
2. **Her QR bir üyenin hesabına bağlanır.** Sahiplenme üyelik ister; QR `owner_user_id` ile hesaba yazılır, başka hesap sahiplenemez.
3. **Ücretsiz ürün yoktur.** QR hakkı yalnızca ödenmiş bir siparişten doğar.
4. **İptal / iade otomatik yansır.** Pazaryerinde iptal edilen siparişin QR'ı devre dışı kalır.
5. **Kanal bağımsız çekirdek.** Pazaryerine özgü kod yalnızca "adaptör" katmanındadır; aktivasyon, üretim ve sahiplenme tek bir akıştan geçer.

---

## 2. Ürün tipine göre akış

| Ürün | Pazaryerinde satış şekli | Alıcıya ulaşan | Aktivasyon |
|---|---|---|---|
| Kolye / anahtarlık (QR) | Fiziksel ürün | Üzerine QR kazınmış ürün | QR fabrikadan bağlı; alıcı okutup **hesabıyla** sahiplenir |
| Kolye / anahtarlık (NFC + QR) | Fiziksel ürün | Programlanmış + kilitli NFC çip, QR yedeği | Aynı |
| Dijital Anı Defteri | Dijital ürün / hizmet | Aktivasyon kodu (mesaj veya kart) | Kod + sipariş doğrulaması → anı defteri QR'ı hesaba tanımlanır |
| Dijital QR Hakkı | Dijital ürün / hizmet | Aktivasyon kodu | Kod + sipariş doğrulaması → hesaba QR hakkı eklenir |

**Neden fiziksel üründe aktivasyon kodu yok?** QR / NFC üretimde rastgele ve tahmin edilemez bir slug ile üretilir; ürün fiziksel olarak alıcıdadır ve ilk sahiplenmede alıcının hesabına kilitlenir. Ek kod, kurulum sürtünmesini artırır ama güvenlik kazancı sağlamaz.

---

## 3. Mimari

```
                 ┌───────────────────────── Adaptör katmanı ─────────────────────────┐
 Trendyol API ──►│ TrendyolAdapter │ HepsiburadaAdapter │ CicekSepetiAdapter │ ...    │
                 └──────────────────────────────┬────────────────────────────────────┘
                                                │ normalize edilmiş sipariş (MarketplaceOrder)
                                                ▼
                                   ┌───────────────────────────┐
     Zamanlayıcı (cron, 10 dk) ───►│   Sipariş senkron servisi  │──► marketplace_orders (upsert)
     Webhook (destekleyen kanal)──►│   idempotent, sayfalı      │──► sync_runs (log)
                                   └─────────────┬─────────────┘
                                                 │ durum değişimi olayları
                ┌────────────────────────────────┼─────────────────────────────────┐
                ▼                                ▼                                 ▼
     Fiziksel satır: üretim kuyruğu    Dijital satır: aktivasyon kodu      İptal / iade: QR devre dışı
     (production_jobs)                 (activation_codes)                  (qr_codes.is_active = false)
                │                                │
                ▼                                ▼
     Admin: toplu QR + NFC istasyonu    Alıcı: qrnot.com/aktive-et
     kargo → takip no pazaryerine       (giriş + kod + sipariş no)
```

### 3.1 Adaptör arayüzü

```ts
interface MarketplaceAdapter {
  channel: 'trendyol' | 'hepsiburada' | 'ciceksepeti' | 'n11' | 'amazon_tr' | 'etsy'
  /** Belirtilen zamandan sonra değişen siparişleri sayfalı getirir. */
  fetchOrders(since: Date, cursor?: string): Promise<{ orders: MarketplaceOrder[]; nextCursor?: string }>
  /** Kargo bilgisi / takip numarasını pazaryerine bildirir. */
  pushShipment(orderRef: string, shipment: { carrier: string; trackingNo: string }): Promise<void>
  /** (Destekleniyorsa) alıcıya sipariş mesajı gönderir — aktivasyon kodu için. */
  sendBuyerMessage?(orderRef: string, text: string): Promise<void>
}

interface MarketplaceOrder {
  channel: string
  orderRef: string             // pazaryeri sipariş numarası
  status: 'created' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  buyerName: string
  lines: Array<{ sku: string; quantity: number; lineRef: string }>
  orderedAt: string
  raw: unknown                 // denetim için ham yanıt (kişisel veri maskelenmiş)
}
```

### 3.2 Kanal notları

> Uç nokta adları, kimlik doğrulama şekli ve oran sınırları her kanalın **güncel satıcı API dokümantasyonundan teyit edilmelidir**; aşağıdaki tablo tasarım varsayımıdır.

| Kanal | Kimlik doğrulama (varsayım) | Sipariş çekme | Kargo bildirimi | Not |
|---|---|---|---|---|
| Trendyol | Satıcı ID + API anahtarı | Sipariş paketleri listesi, tarih filtresi | Paket durumu güncelleme | Webhook desteği kontrol edilmeli |
| Hepsiburada | Merchant ID + kullanıcı/anahtar | Sipariş listesi | Paketleme / kargo bildirimi | Test ortamı ile başla |
| ÇiçekSepeti | Satıcı API anahtarı | Sipariş listesi | Kargo bildirimi | Dijital kart senaryosu için ürün tipi teyidi |
| N11 | API anahtar + gizli anahtar | Sipariş listesi | Kargo bildirimi | — |
| Amazon.com.tr | SP-API (LWA OAuth) | Orders API | Shipment confirmation | Dijital hizmet listeleme kuralları teyit edilmeli |
| Etsy | Open API v3 (OAuth 2.0) | Shop receipts | Tracking ekleme | Bugünkü CSV yüklemenin yerini alır |

**SKU eşlemesi:** Her kanaldaki ürün kodu, QRNot ürün kimliğine (`kolye-qr`, `kolye-nfc`, `anahtarlik-qr`, `anahtarlik-nfc`, `ani-defteri`, `dijital-qr`) `channel_skus` tablosuyla eşlenir. Eşleşmeyen SKU senkronu durdurmaz; admin paneline uyarı düşer.

---

## 4. Veri modeli

Mevcut `etsy_orders` tablosu, tüm kanalları kapsayan `marketplace_orders` yapısına genişletilir. (Geçişte Etsy kayıtları `channel = 'etsy'` olarak taşınır.)

```sql
CREATE TABLE marketplace_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel       VARCHAR(24)  NOT NULL,
  order_ref     VARCHAR(64)  NOT NULL,
  status        VARCHAR(16)  NOT NULL,
  buyer_name    VARCHAR(160) NOT NULL DEFAULT '',
  ordered_at    TIMESTAMPTZ,
  synced_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (channel, order_ref)
);

CREATE TABLE marketplace_order_lines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  line_ref      VARCHAR(64) NOT NULL,
  product_id    VARCHAR(24) NOT NULL,      -- QRNot ürün kimliği (SKU eşlemesinden)
  quantity      INTEGER NOT NULL,
  UNIQUE (order_id, line_ref)
);

CREATE TABLE channel_skus (
  channel       VARCHAR(24) NOT NULL,
  channel_sku   VARCHAR(80) NOT NULL,
  product_id    VARCHAR(24) NOT NULL,
  PRIMARY KEY (channel, channel_sku)
);

-- Dijital ürünler için: her adet = 1 tek kullanımlık kod
CREATE TABLE activation_codes (
  code_hash     VARCHAR(64) PRIMARY KEY,   -- kodun kendisi saklanmaz (sha256)
  line_id       UUID NOT NULL REFERENCES marketplace_order_lines(id),
  redeemed_by   UUID,                      -- users.id
  redeemed_at   TIMESTAMPTZ,
  qr_id         UUID,                      -- oluşturulan anı defteri QR'ı (varsa)
  revoked       BOOLEAN NOT NULL DEFAULT FALSE
);

-- Fiziksel ürünler için üretim kuyruğu
CREATE TABLE production_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id       UUID NOT NULL REFERENCES marketplace_order_lines(id),
  qr_id         UUID,                      -- üretimde atanan QR
  state         VARCHAR(16) NOT NULL DEFAULT 'queued',  -- queued → engraved → nfc_written → packed → shipped
  tracking_no   VARCHAR(80) NOT NULL DEFAULT '',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sync_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel       VARCHAR(24) NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ,
  fetched       INTEGER NOT NULL DEFAULT 0,
  error         TEXT
);
```

`qr_codes` tarafında mevcut kolonlar kullanılır: `source_channel` (kanal), `owner_user_id` (sahiplenen üye), `is_active` (iptalde `false`), `nfc_encoded_at` / `nfc_locked` (NFC istasyonu).

---

## 5. Akışlar

### 5.1 Sipariş senkronu

1. Zamanlayıcı her 10 dakikada bir, her kanal için `since = son başarılı senkron − 15 dk` ile siparişleri çeker (örtüşme, kaçan kaydı önler).
2. Her sipariş `(channel, order_ref)` anahtarıyla **upsert** edilir — aynı sipariş iki kez gelse de tek kayıt oluşur (idempotent).
3. Durum değişimi olay üretir:
   - `paid` → fiziksel satırlar için `production_jobs`, dijital satırlar için `activation_codes` oluşturulur.
   - `cancelled` / `returned` → bağlı kodlar `revoked = true`, bağlı QR'lar `is_active = false`.
4. Hata durumunda `sync_runs.error` yazılır; ardışık 3 hata admin paneline uyarı ve WhatsApp bildirimi düşürür.

### 5.2 Fiziksel ürün üretimi (mevcut admin altyapısı)

1. Admin → Mağaza → **Üretim & NFC** ekranında kuyruk, ürün ve kanala göre listelenir.
2. "Toplu QR üret" ile kuyruğa QR atanır; CSV, lazer kazıma / baskı yazılımına verilir.
3. NFC'li ürünlerde **NFC yazma istasyonu** (Android + Chrome) sıradaki etikete `qrnot.com/n/<slug>` yazar ve kilitler; `nfc_encoded_at` işaretlenir.
4. Paketleme: ürün + 3 adımlı kurulum kartı ("qrnot.com'da hesap aç → QR'ı okut → sesini kaydet").
5. Kargo takip numarası girilince `pushShipment` ile pazaryerine bildirilir.

**Eşleşme güvencesi:** Kazınan QR ile NFC çipine yazılan adres aynı `slug` olmalıdır. İstasyon, yazmadan önce ekranda slug'ı büyük puntoyla gösterir; paketlemede ürünün QR'ı okutularak `production_jobs.qr_id` ile karşılaştırılır.

### 5.3 Dijital ürün aktivasyonu

1. `paid` siparişin her dijital adedi için `QN-` önekli, karışıklık yaratmayan 32 karakterlik alfabeden 8 rastgele karakterli kod (ör. `QN-7KX4-M9P2`) üretilir; yalnızca hash'i saklanır.
2. Kod alıcıya iletilir: pazaryeri mesaj API'si destekliyorsa otomatik, değilse sipariş notu / e-posta şablonu ile.
3. Alıcı `qrnot.com/aktive-et` sayfasında **giriş yapar**, kodu girer.
4. Sunucu: kod hash'i eşleşiyor mu, `revoked` değil mi, daha önce kullanılmamış mı → tek transaction içinde `redeemed_by` yazılır ve
   - `ani-defteri`: kullanıcıya bağlı anı defteri QR'ı oluşturulur,
   - `dijital-qr`: kullanıcının `paid_slots` değeri 1 artırılır.
5. Kod deneme sınırı: IP başına saatte 10 hatalı deneme (mevcut `rate_limits` altyapısı).

> Etsy'de bugünkü "sipariş no + e-posta" akışı, Etsy adaptörü devreye girince bu kod akışına taşınır. Geçiş süresince iki akış birlikte çalışabilir.

### 5.4 İptal ve iade

| Durum | Fiziksel ürün | Dijital ürün |
|---|---|---|
| Kargo öncesi iptal | Üretim işi iptal; atanmış QR havuza geri döner (henüz kazınmadıysa) | Kodlar `revoked` |
| Teslim sonrası iade | Ürün geri gelince QR `is_active = false`; içerik sahibine bildirim | Kullanılmamış kod `revoked`; kullanılmış dijital üründe yasal cayma hakkı yoktur, destek kararı ile işlem yapılır |

---

## 6. Güvenlik

| Tehdit | Önlem |
|---|---|
| Uydurma sipariş numarasıyla aktivasyon | Yalnızca senkronla gelen `paid` siparişler; kod hash'i + tek kullanım |
| Kod tahmini | 32 karakterlik alfabe ile 8 karakter rastgele kısım (~10¹² olasılık) + deneme sınırı |
| Başkasının ürününü sahiplenme | Sahiplenme üyelik ister; ilk sahiplenmede `owner_user_id` kilitlenir; eşzamanlı sahiplenme `is_claimed = FALSE` koşuluyla engellenir |
| API anahtarı sızıntısı | Anahtarlar yalnızca Vercel ortam değişkeninde; loglarda maskeleme; kanal başına ayrı anahtar |
| Kişisel veri | Pazaryerinden yalnızca sipariş no, ürün, adet ve alıcı adı saklanır; adres / telefon saklanmaz (kargo pazaryeri panelinden) |
| Webhook sahteciliği | İmza doğrulaması (destekleyen kanallarda), aksi halde webhook yalnızca "senkron tetikleyici" olarak kullanılır, veri API'den çekilir |

---

## 7. Operasyon ve izleme

- **Admin paneli → Kanallar** sekmesi: her kanal için son senkron zamanı, son hata, bekleyen üretim, kullanılmamış kod sayısı.
- **Günlük özet (WhatsApp):** yeni sipariş, üretimde bekleyen, kargoya verilen, iptal.
- **SLA hedefleri:** sipariş → aktivasyon kodu ≤ 15 dk; fiziksel ürün → kargo 1–3 iş günü.
- **KPI'lar:** kurulum tamamlama oranı (sahiplenilen / satılan), ilk okutmaya kadar geçen süre, kanal bazında iptal / iade oranı.

---

## 8. Uygulama planı

| Adım | İş | Tahmini süre |
|---|---|---|
| 1 | `marketplace_orders` şeması, `etsy_orders` geçişi, adaptör arayüzü | 2 gün |
| 2 | Etsy adaptörü (Open API v3) — bugünkü CSV adımını kaldırır | 3 gün |
| 3 | Aktivasyon kodu akışı (`/aktive-et`), admin kod yönetimi | 3 gün |
| 4 | Üretim kuyruğu ↔ mevcut toplu QR + NFC istasyonu entegrasyonu | 2 gün |
| 5 | İlk Türk pazaryeri adaptörü (pilot platform) + kargo bildirimi | 4 gün |
| 6 | Kanallar izleme ekranı, günlük özet bildirimi | 2 gün |
| 7 | Uçtan uca test: sipariş → üretim → sahiplenme → iptal | 2 gün |

Toplam: ~3 hafta (tek geliştirici). Her adaptör ek ~3–4 gün.

---

## 9. Bugünden itibaren geçerli ara çözüm

Adaptörler hazır olana kadar:

- **Etsy:** Admin → Mağaza → Etsy sekmesinde Etsy "Orders" CSV'sini günde en az bir kez yükle. Listede olmayan sipariş aktive edilemez; her sipariş ürün adedi kadar QR alır.
- **Diğer pazaryerleri (fiziksel ürün):** Ek işlem gerekmez; ürün kendi QR / NFC'si ile gönderilir, alıcı hesabıyla sahiplenir.
- **Diğer pazaryerleri (dijital ürün):** Adaptör hazır olmadan dijital ürün listelenmemeli.
