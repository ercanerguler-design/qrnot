# QRNot DPP — Satış ve Pazarlama Planı

Kime: Ercan (iç çalışma dosyası). E-posta ve LinkedIn metinleri doğrudan kopyalanıp kullanılabilir.
Son güncelleme: Ekim 2026

**İçindekiler**
1. Rakipler: Türkiye'de kim var, biz neredeyiz?
2. Konumlandırma: tek cümlede biz
3. Türkiye'de kime gideceğiz? (sektörler, şehirler, kurumlar)
4. Yurt dışında kime gideceğiz?
5. Müşteri bulma süreci (günlük ritim, takip, CRM)
6. E-posta şablonları (TR + EN)
7. LinkedIn: yurt dışı için etkili içerik planı ve hazır paylaşımlar
8. İlk 90 gün planı ve ölçümler
9. Her zaman doğru konuş (kırmızı çizgiler)
10. Kaynaklar

---

## 1. Rakipler: Türkiye'de kim var, biz neredeyiz?

Evet, Türkiye'de rakip var ve sayıları artıyor. Aşağıdaki bilgiler firmaların kendi sitelerinden derlendi (Ekim 2026). Bağımsız olarak doğrulanmadı.

| Firma | Odak | Öne çıkan | Bizden önde oldukları yer |
|---|---|---|---|
| **NavelCord** (Fits Teknoloji, İzmir) | Batarya ağırlıklı; tekstil hazırlıkta | ERP / PLM / tedarikçi verisini toplayıp AB DPP Kaydı'na gönderme; GS1 Türkiye çözüm ortağı olduğunu belirtiyor | Batarya, entegrasyon, AB kaydına gönderim |
| **DPPVisa** | 12 sektör (lastik, batarya, otomotiv, oyuncak, tekstil…) | 36 yıllık MES geçmişi; ERP'den AB kaydına tek nokta; EN 18216 / 18219 / 18222 standartlarına uygun API iddiası | Kurumsal entegrasyon, standart / API iddiası, sektör genişliği |
| **DPPSkop** | Genel ürün kimliği (tekstil, elektronik, mobilya, gıda…) | İlk 3 ürün ücretsiz deneme, video / 3D içerik, marka şablonları | Ücretsiz deneme, zengin medya |
| **epassportify** | Tekstil KOBİ'leri, self-servis SaaS | GS1 Digital Link QR, bileşen bazında malzeme, tedarik zinciri haritası, ücretsiz hesap | Self-servis kayıt, ücretsiz başlangıç, tekstile özel alanlar |
| **Cormind** | Tedarik zinciri, REACH, e-atık | Uyum odaklı geniş paket | Kimyasal uyum (REACH) |
| **Mitrotech** (Bursa) | ERP + DPP hizmeti | Danışmanlık ve entegrasyon | Proje bazlı entegrasyon |
| **Cirtrace** | Tekstil yaşam döngüsü izleme | AB döngüsel ekonomi portalında listeli | İzlenebilirlik |
| **DPP Türkiye** (dppturkiye.org) | Rakip değil, tarafsız topluluk | Çalışma grupları, politika önerileri | — Katılmalıyız: görünürlük ve güven |

### Bizim rakiplere göre fazlamız (bugün çalışıyor, test edildi)

1. **8 dil, hem pasaportta hem panelde.** Rakiplerin çoğu TR/EN.
   - Tedarikçi formu da 8 dilde.
   - Arapça sağdan sola.
2. **Tedarikçi veri portalı.** Tedarikçi giriş yapmadan, kendi dilinde, linkle bilgi ve belge gönderiyor; firma onaylayıp tek tıkla aktarıyor. Bu, rakiplerin sitelerinde bu açıklıkta görünmüyor.
3. **Karbon tahmini yardımcısı.** Kaynaklı aralık hesaplıyor ve pasaportta açıkça "tahmin" yazıyor. Rakiplerin sitelerinde karbon hesabı görünmüyor.
4. **Fiziksel etiket gücü.** QR ve NFC'yi kendimiz üretiyoruz.
   - Seri numarası sınırsız.
   - Etiket sayfası ve CSV çıktısı hazır.
5. **Güven altyapısı:**
   - Sürümlü yayın; yayınlanmış pasaport silinmez.
   - Yetkili erişim anahtarı.
   - Her değişiklik işlem kaydında.
   - Günlük otomatik yedek; silinen dosya 30 gün geri alınabilir.
   - Çakışma koruması.
   - Açık güvenlik sayfası ve KVKK/GDPR sözleşme taslağı.
6. **Hızlı başlangıç ve Türkçe destek.** Firma hesabı dakikalar içinde açılıyor; pilot aynı gün başlıyor.

### Eksiklerimiz (dürüst liste, öncelik sırasıyla)

| # | Eksik | Neden önemli | Öneri |
|---|---|---|---|
| 1 | Ücretsiz deneme / self-servis kayıt | DPPSkop ve epassportify ücretsiz başlatıyor; KOBİ önce denemek istiyor | "3 ürün, 30 gün ücretsiz" deneme |
| 2 | Referans müşteri | Kurumsal alıcı "kim kullanıyor?" diye sorar | İlk 3–5 pilot firmaya kuruculara özel indirim karşılığında referans izni |
| 3 | API ve ERP entegrasyonu | Orta-büyük firmalar ERP'den otomatik veri ister | Okuma API'si var (JSON); yazma API'si ve Logo / Mikro / SAP için CSV şablonu |
| 4 | AB DPP Kaydı'na gönderim ve CEN standartları (EN 18216 / 18219 / 18222) | Rakipler iddia ediyor; kurumsal alıcı soracak | Standart metinleri incelenip uyum çalışması planlanmalı; o zamana kadar "yol haritamızda" de, "uyumluyuz" deme |
| 5 | Batarya pasaportuna özel veri modeli | Şubat 2027 kesin tarih, en sıcak pazar | Batarya alanlarını ekle ya da şimdilik tekstil / mobilya / ev tekstiline odaklan |
| 6 | AB'de veri barındırma | Bazı AB alıcıları şart koşar | Talep gelince Frankfurt'a taşıma |
| 7 | GS1 Türkiye çözüm ortaklığı | Güven ve yönlendirme kanalı | Başvur |

**Strateji önerim:** Kurumsal entegrasyon yarışına şimdi girme; orada NavelCord ve DPPVisa önde. Bizim sahamız:

> **AB'ye ihracat yapan KOBİ üreticiler, öncelikle tekstil ve ev tekstili.** Hızlı kurulum, 8 dil, tedarikçiyi işin içine katma ve fiziksel etiket.

---

## 2. Konumlandırma: tek cümlede biz

**TR:**
> QRNot DPP, AB'ye ihracat yapan üreticilerin dijital ürün pasaportunu tedarikçileriyle birlikte, 8 dilde ve etiketiyle birlikte birkaç gün içinde hazır hale getirir.

**EN:**
> QRNot DPP helps manufacturers exporting to the EU get Digital Product Passports ready in days, together with their suppliers, in 8 languages, labels included.

**Yurt dışı (AB markası / ithalatçısı) için ikinci cümle:**
> Your Turkish suppliers fill in the data through a link in their own language; you get audit-ready passports without chasing spreadsheets.

---

## 3. Türkiye'de kime gideceğiz?

### Öncelik sırası

| Öncelik | Sektör | Neden | Nerede |
|---|---|---|---|
| **1** | Hazır giyim ve tekstil (denim, örme, triko, iş elbisesi) | AB'nin öncelikli ürün grubu; Türkiye'nin AB'ye en büyük ihracat kalemlerinden; tedarikçi zinciri uzun, portalımız tam buraya uyuyor | İstanbul, Bursa, İzmir, Denizli, Gaziantep, Kahramanmaraş, Uşak |
| **1** | Ev tekstili (havlu, bornoz, nevresim, perde, halı) | AB'ye yoğun ihracat, malzeme bilgisi net | Denizli, Bursa, Uşak, Gaziantep (halı), Kayseri |
| **2** | Mobilya | AB'nin öncelikli grupları arasında; seri ve model düzeyi uygun | İnegöl, Kayseri, Ankara (Siteler), İstanbul, Bursa |
| **2** | Ayakkabı ve deri | Tekstile benzer malzeme yapısı | İstanbul, İzmir, Konya |
| **3** | Batarya, e-mobilite, enerji depolama | Şubat 2027 kesin tarih; ama rakipler güçlü ve özel veri modeli gerekiyor | İstanbul, Kocaeli, Bursa, Manisa |
| **3** | Elektrik-elektronik, beyaz eşya, oyuncak, yapı malzemesi, seramik | İkincil düzenlemelerle sıra gelecek | Manisa, Eskişehir, Bilecik, Çanakkale, Kocaeli |

### Hangi rol ile konuşmalı?

- **Küçük firma:** patron / genel müdür.
- **Orta firma:** ihracat müdürü, kalite müdürü, sürdürülebilirlik sorumlusu.
- **Büyük firma:** sürdürülebilirlik direktörü, BT / ERP sorumlusu.
- **En sıcak sinyal:** "AB'deki müşterimiz DPP / malzeme verisi / sertifika istiyor."

### Kanallar ve kurumlar (aracılar)

1. **İhracatçı birlikleri (TİM bünyesinde).** Üyelerine seminer düzenliyorlar; "DPP'ye hazırlık" semineri teklif et. Tekstil ve hazır giyim için:
   - İHKİB (İstanbul Hazırgiyim ve Konfeksiyon)
   - İTHİB (İstanbul Tekstil ve Hammaddeleri)
   - UTİB (Uludağ Tekstil, Bursa)
   - Ege Hazır Giyim ve Konfeksiyon İhracatçıları Birliği (İzmir)
   - Denizli İhracatçılar Birliği

   Ayrıca mobilya ve diğer sektörlerin ilgili birlikleri.
2. **Sanayi ve ticaret odaları:**
   - İSO, İTO
   - BTSO (Bursa)
   - EBSO / İzmir Ticaret Odası
   - Denizli, Gaziantep ve Kayseri sanayi odaları

   Odaların eğitim ve dış ticaret birimleri seminer ve bülten için uygun.
3. **Sektör dernekleri:**
   - TGSD (Türkiye Giyim Sanayicileri Derneği)
   - TTSİS (Türkiye Tekstil Sanayi İşveren Sendikası)
   - Mobilya sanayicileri dernekleri
4. **Organize sanayi bölgeleri (OSB'ler).** Bölge müdürlükleri duyuru yapabiliyor; Denizli, Bursa, Uşak, Gaziantep ve İnegöl OSB'leri öncelikli.
5. **DPP Türkiye platformu.** Katıl, çalışma gruplarında görün. Rakip değil, vitrin.
6. **GS1 Türkiye.** Barkod (GTIN) alan her ihracatçı potansiyel müşteri. Çözüm ortaklığına başvur.
7. **Danışmanlar ve belgelendirme firmaları.** OEKO-TEX, GOTS, GRS denetçileri ve sürdürülebilirlik danışmanları. Komisyonlu yönlendirme (referans) anlaşması yap. Bunlar DPP'yi müşterisine anlatan ilk kişiler.
8. **ERP bayileri.** Logo, Mikro gibi yerli ERP'lerin bayileri: "ERP'nizden CSV ile DPP" ortaklığı.
9. **Fuarlar.** Ziyaretçi olarak git, katılımcı firmalarla tanış:
   - Texhibition İstanbul (kumaş / tedarik)
   - İstanbul Mobilya Fuarı
   - Heimtextil (Frankfurt, ev tekstili; Türk firmaları yoğun)
10. **Destekler.** Müşterinin bu hizmeti KOSGEB veya Ticaret Bakanlığı dijitalleşme / ihracat destekleriyle karşılayıp karşılayamayacağını bir danışmanla kontrol et. Uygunsa bu güçlü bir satış argümanı. Doğrulamadan "destekleniyor" deme.

### Liste nasıl çıkarılır?

- İhracatçı birliklerinin üye rehberleri (sektör ve şehir filtresiyle).
- LinkedIn'de "export manager", "dış ticaret müdürü", "sürdürülebilirlik" + şehir + sektör araması.
- Fuar katılımcı listeleri (fuar sitelerinde yayınlanır).
- OSB firma rehberleri.
- AB markalarının yayımladığı tedarikçi listeleri. Birçok AB markası tedarikçi fabrikalarını açıklıyor; listede Türk fabrikaları çoksa hem markaya hem fabrikaya git.

---

## 4. Yurt dışında kime gideceğiz?

İki ayrı hedef var, mesajları farklı:

**A) AB'deki marka ve ithalatçılar.** Türkiye'den ürün alanlar: Almanya, Hollanda, Fransa, İspanya, Belçika, Danimarka, İsveç, İtalya, Polonya.
- **Kimle konuş:**
  - Head of Sustainability, Sourcing / Supply Chain Director
  - Product Compliance Manager, CSR Manager
  - Küçük markada Founder
- **Acı noktaları:** Tedarikçiden veri toplamak, dil farkı, Excel karmaşası.
- **Mesaj:** "Türk tedarikçileriniz veriyi kendi dilinde, linkle girsin; siz pasaportu yayınlayın."
- **Neden önemli:** Bir marka 10–50 Türk tedarikçisini getirebilir; en verimli kanal bu.

**B) AB'de satış yapan Türk sahipli şirketler ve distribütörler.** Almanya ve Hollanda'daki Türk diasporası tekstil toptancıları.
- Türkçe konuşulur, güven hızlı kurulur.

**Ülke notu: soğuk e-posta kuralları farklı.**
- **Almanya ve Avusturya:** Önceden izin almadan reklam amaçlı e-posta (B2B dahil) hukuken risklidir. Bu ülkelerde LinkedIn, telefon, fuar ve aracı kanalları kullan.
- **Diğer AB ülkeleri:** B2B iletişim çoğunlukla "meşru menfaat" ile yapılır. Her e-postada çıkış imkânı sun, kısa ve kişisel tut.
- **Türkiye:** Tacir ve esnafa ticari elektronik ileti için önceden onay şartı yoktur, ama ret hakkı tanınmalıdır. Her mailde "istemiyorsanız yanıtlamanız yeterli" satırı olsun.
- Şüphede kalırsan hukukçuna sor.

---

## 5. Müşteri bulma süreci

### Günlük ritim (haftada 5 gün, günde ~2 saat)

| Süre | İş |
|---|---|
| 30 dk | 10 yeni firma araştır, CRM'e ekle (karar verici adı, kaynak, kişiselleştirme notu) |
| 40 dk | 10 kişiselleştirilmiş ilk temas (e-posta ya da LinkedIn) |
| 20 dk | Takip mesajları (aşağıdaki takvime göre) |
| 15 dk | LinkedIn: 5 anlamlı yorum (DPP / ESPR konuşan kişilerin gönderilerine) |
| 15 dk | Gelen cevaplar, demo planlama |

### Takip takvimi (bir firma için)

| Gün | Kanal | Ne |
|---|---|---|
| 0 | E-posta | İlk temas (şablon 6.1 / 6.3) |
| 2 | LinkedIn | Bağlantı isteği + kısa not |
| 5 | E-posta | Takip 1: kısa, tek soru |
| 10 | LinkedIn / e-posta | Değer içeriği: katalog PDF ya da "tedarikçiden veri" videosu |
| 17 | Telefon (TR) / e-posta | Takip 2 |
| 25 | E-posta | Son mesaj (kapıyı açık bırak) |

Cevap gelmezse 3 ay sonra yeni bir haberle (yeni özellik, yeni düzenleme) yeniden dene.

### CRM (basit Google Sheets yeter)

Sütunlar:
- Firma, Sektör, Şehir / Ülke
- Kişi, Rol, E-posta / LinkedIn
- Kaynak (birlik / fuar / LinkedIn…)
- Kişiselleştirme notu
- Aşama
- Son temas, Sonraki adım (tarih), Not

Aşamalar: `Araştırıldı → Temas → Cevap → Demo → Pilot teklifi → Pilot → Ücretli → Referans`

### Demo akışı (20 dakika)

1. **Keşif (5 dk):** AB'de kime satıyorsunuz? Müşteriniz ne istiyor? Veri bugün nerede?
2. **Pasaport (3 dk):** Telefonda örnek pasaportu okut, dili Almanca ve Arapça yap.
3. **Panel (5 dk):** Ürün düzenleyici, yayın öncesi eksik kontrolü, seri no ve etiket.
4. **Tedarikçi portalı (4 dk):** Canlı link oluştur, telefondan tedarikçi gibi doldur, panelde aktar.
5. **Karbon ve güven (2 dk):** Tahmin kartı; işlem kaydı, yedek, KVKK/GDPR sayfası.
6. **Kapanış (1 dk):** "Birkaç ürünle pilot yapalım; ilk pasaportu bu hafta yayına alalım."

### Pilot teklifinin özü

- 10 ürün modeli, 3 ay.
- Verileri birlikte giriyoruz.
- Etiketleri hattına uyarlıyoruz.
- Ücretli pakete geçerse pilot ücreti ilk faturadan düşülür.

Fiyatlar teklifle verilir. Önerdiğimiz fiyat bandı daha önce konuşuldu:

| Paket | Fiyat (öneri) |
|---|---|
| Pilot | €390 |
| Başlangıç | €79 / ay |
| İşletme | €290 / ay |
| Kurumsal | €790 / ay'dan |

İlk 10 müşteriye kurucu müşteri indirimi (%30) karşılığında referans izni iste.

---

## 6. E-posta şablonları

Kurallar:
- 120 kelimeyi geçme.
- Tek bir soru sor.
- İlk satır o firmaya özel olsun.
- Ek dosya gönderme: ilk mailde ek spam'e düşer. Link ver.
- [köşeli parantezleri] doldur.

**İmza (TR):**
```
Ercan [Soyad]
QRNot Dijital Ürün Pasaportu
qrnot.com/dpp · WhatsApp +90 543 392 92 30 · sce@scegrup.com
Bu tür e-postaları almak istemiyorsanız yanıtlamanız yeterli; sizi listeden çıkarırım.
```

**İmza (EN):**
```
Ercan [Surname]
QRNot Digital Product Passport
qrnot.com/dpp?lang=en · WhatsApp +90 543 392 92 30 · sce@scegrup.com
If you'd rather not hear from me, just reply and I won't contact you again.
```

### 6.1 Türk üretici — ilk temas (TR)

**Konu seçenekleri:**
- `[Firma] — AB müşterileriniz için dijital ürün pasaportu`
- `AB'ye ihracatta yeni kural: ürün pasaportu`
- `[Ürün grubu] için DPP hazırlığı — 2 dakikalık soru`

```
Merhaba [Ad] Bey/Hanım,

[Kişiselleştirme: örn. "[Fuar]'da [ürün grubu] koleksiyonunuzu gördüm." / "Almanya ve Hollanda'ya ihracatınızı biliyorum."]

AB, Ekotasarım Tüzüğü (ESPR) ile ürünlere kademeli olarak dijital ürün pasaportu zorunluluğu getiriyor: ürün üzerindeki QR okutulunca malzeme, menşe, bakım ve geri dönüşüm bilgisi açılacak. AB'deki alıcılar bu verileri tedarikçilerinden şimdiden istemeye başladı.

QRNot DPP ile pasaportu bir kez giriyorsunuz; 8 dilde yayınlanıyor, QR/NFC etiketi hattınızda basılıyor. Malzeme ve sertifika bilgisini tedarikçinizden bir linkle alabiliyorsunuz.

Telefonunuzdan 30 saniyede bakabilirsiniz: qrnot.com/p/ornekpasaport

AB'deki müşterilerinizden bu konuda bir talep geldi mi?

Saygılarımla,
[İmza]
```

### 6.2 Tekstil üreticisi — kısa ve doğrudan (TR)

**Konu:** `Tedarikçilerinizden malzeme ve sertifika bilgisini toplamak`

```
Merhaba [Ad] Bey/Hanım,

AB'ye giden ürünlerde pasaport için en zor iş, iplik ve kumaş tedarikçilerinizden bileşim ve sertifika (GOTS, OEKO-TEX, GRS) bilgisini toplamak.

Bizde bunu bir linkle yapıyorsunuz: tedarikçiniz giriş yapmadan, kendi dilinde formu doldurup belgesini yüklüyor; siz kontrol edip tek tıkla ürüne aktarıyorsunuz. Pasaport 8 dilde yayınlanıyor, etiketi siz basıyorsunuz.

Birkaç ürünle bir pilot yapalım mı? Önce 20 dakikalık bir görüntülü görüşmede göstereyim.

[İmza]
```

### 6.3 AB markası / ithalatçısı — ilk temas (EN)

**Subject options:**
- `Digital Product Passports from your Turkish suppliers`
- `[Brand] — DPP data from your supply chain in Türkiye`
- `Quick question about ESPR readiness at [Brand]`

```
Hi [First name],

[Personal line: e.g. "I saw [Brand] lists several Turkish mills in its supplier disclosure." / "Your post on ESPR readiness last week was spot on."]

Most brands I speak to say the hardest part of the Digital Product Passport is not publishing it but collecting the data: composition, certificates and facility details from suppliers, in different languages and spreadsheets.

QRNot DPP solves exactly that. You send each supplier a link; they fill in the data in their own language (8 languages, no login) and upload their certificates. You review, approve and publish a versioned passport that opens from a QR or NFC label.

Here's a live sample you can open on your phone: qrnot.com/p/ornekpasaport?lang=en

Would it be useful to try it with two or three of your Turkish suppliers?

Best regards,
[Signature]
```

### 6.4 AB'deki Türk sahipli firma / distribütör (TR veya EN)

```
Merhaba [Ad] Bey/Hanım,

[Şehir]'deki [Firma] olarak Türkiye'den [ürün grubu] getirdiğinizi biliyorum. AB'de dijital ürün pasaportu kademeli olarak zorunlu hale gelirken, bu verinin büyük kısmı Türkiye'deki üreticilerinizden gelecek.

QRNot DPP, Türkiye'de geliştirilmiş bir sistem. Üreticileriniz bilgiyi Türkçe giriyor, pasaport sizin müşterileriniz için Almanca, Felemenkçe ve diğer 6 dilde yayınlanıyor.

Kısa bir görüntülü görüşmede gösterebilirim. Bu ay uygun olduğunuz bir gün var mı?

[İmza]
```

### 6.5 Takip 1 — 5. gün (TR / EN)

```
Merhaba [Ad] Bey/Hanım, geçen hafta dijital ürün pasaportu konusunda yazmıştım. Kısa bir sorum var: bu konu sizde kimin sorumluluğunda? Doğru kişiye yönlendirirseniz çok sevinirim.
```
```
Hi [First name], following up on my note about Digital Product Passports. Who at [Brand] owns ESPR readiness? Happy to send a two-minute overview to the right person.
```

### 6.6 Takip 2 — değer veren (TR / EN)

```
Merhaba [Ad] Bey/Hanım, DPP'yi 8 sayfada anlatan kataloğumuzu bırakıyorum: [katalog linki]. 5. sayfa, tedarikçilerden bilginin nasıl toplandığını gösteriyor; sizin için en ilgili kısmı bu olabilir.
```
```
Hi [First name], here's our 8-page guide to Digital Product Passports: [catalogue link]. Page 5 shows how supplier data is collected through a link, which is usually the biggest time saver.
```

> Katalog PDF'ini ek yerine link olarak ver. Ya kendi sitende yayınla ya da Google Drive'da "bağlantıya sahip herkes görüntüleyebilir" ayarıyla paylaş.

### 6.7 Son mesaj (TR / EN)

```
Merhaba [Ad] Bey/Hanım, sizi daha fazla rahatsız etmeyeyim. DPP gündeminize geldiğinde bu maili yanıtlamanız yeterli; örnek pasaport her zaman burada: qrnot.com/p/ornekpasaport. Kolaylıklar dilerim.
```
```
Hi [First name], I'll stop here so I don't clutter your inbox. When DPP becomes a priority, just reply to this email. The sample passport is always at qrnot.com/p/ornekpasaport?lang=en. All the best.
```

### 6.8 İhracatçı birliği / oda / danışman — iş birliği (TR)

**Konu:** `Üyelerinize "Dijital Ürün Pasaportuna hazırlık" semineri önerisi`

```
Sayın [Ad] Bey/Hanım,

AB'nin Ekotasarım Tüzüğü (ESPR) kapsamındaki dijital ürün pasaportu, [sektör] ihracatçılarının yakında AB alıcılarından en çok duyacağı konulardan biri olacak.

Üyelerinize yönelik 45 dakikalık, satış amaçlı olmayan bir bilgilendirme semineri öneriyoruz:
- DPP nedir, hangi ürün grupları ne zaman etkilenecek (doğrulanmış tarihlerle)
- Bir pasaportta hangi veriler olur
- Tedarikçilerden veri toplamanın pratik yolu
- Canlı örnek: telefonla okutulan 8 dilli pasaport

Seminer ücretsizdir; isteyen üyelere ayrıca pilot imkânı sunabiliriz. Uygun bir tarih için görüşebilir miyiz?

Saygılarımla,
[İmza]
```

### 6.9 Fuar sonrası (TR / EN)

```
Merhaba [Ad] Bey/Hanım, [Fuar]'da standınızda [konu] üzerine konuşmuştuk. Söz verdiğim örnek pasaport: qrnot.com/p/ornekpasaport. [Ürününüz] için bir pilot pasaportu birlikte hazırlamak isterseniz önümüzdeki hafta 20 dakika ayırabilir misiniz?
```
```
Hi [First name], great to meet you at [Fair]. As promised, here's the sample passport: qrnot.com/p/ornekpasaport?lang=en. If you'd like to build a pilot passport for [product] together, could we find 20 minutes next week?
```

---

## 7. LinkedIn: yurt dışı için etkili içerik planı

### 7.1 Önce profil (bir kez, 1 saat)

**Kişisel profil başlığı (EN):**
```
Digital Product Passports for EU exporters | QRNot DPP | Helping brands collect DPP data from their Turkish suppliers
```

**Hakkında (About), ilk 3 satır en önemlisi:**
```
I help manufacturers and brands selling into the EU get their Digital Product Passports ready, together with their suppliers.

QRNot DPP: passports in 8 languages, supplier data collected through a link, versioned publishing, QR/NFC labels.
Live sample: qrnot.com/p/ornekpasaport?lang=en
```

**Öne çıkanlar (Featured):**
1. Örnek pasaport linki
2. İngilizce katalog PDF
3. İngilizce sunum PDF
4. qrnot.com/dpp?lang=en

**QRNot şirket sayfası:**
- Logo, kapak görseli (`sosyal/en/1x1-instagram-facebook/05.png` kırpılabilir).
- Aynı başlık.
- Paylaşımları önce kişisel profilden yap. Kişisel profil, şirket sayfasından çok daha fazla erişim alır. Şirket sayfası yeniden paylaşsın.

### 7.2 İçerik sütunları (5 tema, dönüşümlü)

| Tema | Amaç | Sıklık |
|---|---|---|
| **1. Düzenleme sadeleştirme** | ESPR / DPP'yi anlaşılır anlatmak → güven | Haftada 1 |
| **2. Tedarikçi verisi sorunu** | En büyük acıya dokunmak → ilgi | Haftada 1 |
| **3. Ürün gösterimi** | Kısa video / görsel → "bunu ben de istiyorum" | 2 haftada 1 |
| **4. Türkiye üretim gücü** | AB alıcısına "Türk tedarikçiler hazırlanıyor" → konumlandırma | 2 haftada 1 |
| **5. Kanıt ve hikâye** | Pilot sonuçları, öğrenilenler → satış | Pilot başladıkça |

**Ritim:**
- Haftada 3 gönderi: Salı, Çarşamba, Perşembe, CET 08:30–10:00.
- Her gün 10–15 dakika yorum: ESPR, DPP, sustainability, sourcing konuşanların gönderilerine.

**Format önceliği:**
- Belge (PDF carousel) gönderileri en çok kaydedilen format.
- Sonra kısa dikey video.
- Sonra görselli metin.
- Anket ayda en fazla 1.

**Hashtag:** 3–5 tane.
- Ana set: `#DigitalProductPassport #DPP #ESPR #CircularEconomy`
- Sektöre göre: `#Textiles #Fashion #Sourcing #Sustainability`

### 7.3 Hazır paylaşımlar (EN). Kopyala, tarihine koy.

**Post 1: Problem (Tema 2) · görsel: `sosyal/en/4x5-linkedin-instagram/05.png`**
```
The hardest part of a Digital Product Passport isn't the QR code.

It's the data behind it.

Fibre composition from the spinner. GOTS or OEKO-TEX certificates from the mill. Facility details from the dyehouse. Usually in three languages, five spreadsheets and a lot of follow-up emails.

So we built a supplier data portal into QRNot DPP:
→ You send each supplier a link
→ They fill in materials, certificates and facility details in their own language (8 languages, no login)
→ You review and copy what you approve into the passport in one click

Nothing reaches the passport without your approval.

How are you collecting supplier data for ESPR today?

#DigitalProductPassport #ESPR #Sourcing #Textiles
```

**Post 2: Düzenleme sadeleştirme (Tema 1) · belge gönderisi: `katalog/QRNot-DPP-Katalog-EN.pdf`, başlık: "The Digital Product Passport in 8 pages"**
```
ESPR in one minute for anyone selling physical products into the EU:

1. The Ecodesign for Sustainable Products Regulation entered into force in July 2024.
2. Digital Product Passports are being phased in product group by product group, through delegated acts.
3. The first fixed date: battery passports for certain batteries from February 2027.
4. Textiles, furniture, iron and steel and other groups are next. Dates are set by the upcoming acts.
5. A passport opens from a data carrier on the product (QR / NFC) and must stay available for the product's lifetime.

I put together an 8-page guide: what goes into a passport, who reads it and how to prepare. Swipe through 👇

#DigitalProductPassport #ESPR #Ecodesign #CircularEconomy
```

**Post 3: Ürün gösterimi (Tema 3) · görsel: `sosyal/en/4x5-linkedin-instagram/02.png`**
```
One QR. Eight languages.

A shopper in Munich reads German. A buyer in Lyon reads French. A customer in Dubai reads Arabic, right-to-left.

Same label, no app, just the phone camera.

Open the live sample on your phone and switch the language top right:
qrnot.com/p/ornekpasaport?lang=en

#DigitalProductPassport #DPP #Localization
```

**Post 4: Türkiye üretim gücü (Tema 4) · görsel yok ya da kendi fabrika ziyareti fotoğrafın**
```
Türkiye is one of Europe's closest and largest textile suppliers, and many Turkish mills are already preparing for ESPR.

What I hear from manufacturers in Denizli, Bursa and Istanbul:
• "Our EU customers are starting to ask for composition and certificate data in a structured way."
• "We have the data, but it lives in ERP, Excel and PDFs."
• "We want to show our EU buyers that we're ready, not wait for the deadline."

If you source from Türkiye, your suppliers can be part of your DPP process from day one.

Brands and importers: what's the one piece of supplier data you find hardest to get?

#Sourcing #Textiles #DigitalProductPassport #Türkiye
```
> Not: Alıntıları gerçek görüşmelerden yaz. Uydurma alıntı kullanma; yoksa maddeleri "Common questions we hear:" başlığıyla genel soru olarak yaz.

**Post 5: Karbon (Tema 3) · görsel: `sosyal/en/4x5-linkedin-instagram/06.png`**
```
"We don't have a carbon figure for this product yet."

That's the honest answer for most SMEs, and that's fine.

In QRNot DPP, a carbon estimate helper calculates a range for the raw-material (fibre) stage from material shares and product weight, with sources for every value. The passport labels it clearly as an estimate.

When you have a product-specific LCA, you replace it with your declared value.

Transparency beats false precision.

#DigitalProductPassport #CarbonFootprint #Sustainability #Textiles
```

**Post 6: Güven (Tema 1/3) · görsel: `sosyal/en/4x5-linkedin-instagram/03.png`**
```
Three questions to ask any Digital Product Passport provider:

1. If we update the data, does the QR on our labels change?
   (It shouldn't. Print once, update forever.)

2. Can a published passport be deleted or silently changed?
   (It shouldn't. Every publication should be an immutable version.)

3. Who can see our supplier and facility data?
   (Only authorities and recyclers you authorise, with a key you can rotate.)

We built QRNot DPP around those three answers. Our security and data processing details are public: qrnot.com/dpp/guvenlik?lang=en

#DPP #ESPR #Compliance #DataSecurity
```

**Post 7: Anket (ayda 1)**
```
Quick poll for brands and manufacturers selling into the EU:
Where is your product composition and certificate data today?

○ ERP / PLM
○ Excel files
○ Supplier PDFs and emails
○ Honestly, all of the above

#DigitalProductPassport #Sourcing
```

**Post 8: Pilot çağrısı (Tema 5) · görsel: `sosyal/en/4x5-linkedin-instagram/04.png`**
```
We're opening a small number of pilot spots for Digital Product Passports.

What a pilot looks like:
• 10 product models, 3 months
• We enter the first passports with you
• Your suppliers join through a link, in their own language
• QR / NFC labels fitted to your production line
• Pilot fee credited if you continue

If you sell into the EU and want to tell your customers "we're ready", send me a message.

#DigitalProductPassport #ESPR #Manufacturing
```

**Post 9: Öğrenilen ders (Tema 5, pilottan sonra doldur)**
```
What we learned from our first [N] passport pilots:
1. [Gerçek gözlem]
2. [Gerçek gözlem]
3. [Gerçek gözlem]
The biggest surprise: [gerçek gözlem].
#DigitalProductPassport #LessonsLearned
```

**Kısa video fikirleri (Reels / LinkedIn video, 20–40 sn, dikey):**
1. **"30 saniyede tedarikçi verisi":** Panelde link oluştur → telefonda tedarikçi formu → panelde "aktar" → pasaportta güncel malzeme. Ekran kaydı ve altyazı.
2. **"Bir QR, 8 dil":** Ürün etiketini okut → dil menüsünden Almanca, Arapça.
3. **"Etiketi bir kez bas":** Panelde değişiklik → yayınla → aynı QR yeni sürümü açıyor.

### 7.4 Bağlantı isteği ve DM akışı (EN)

**Bağlantı notu (300 karakter altı):**
```
Hi [First name], I work on Digital Product Passports for brands sourcing from Türkiye. I enjoy your posts on [topic] and would be glad to connect.
```

**Bağlandıktan 2–3 gün sonra (satış yapma, sor):**
```
Thanks for connecting, [First name]. Curious: is DPP / ESPR already on your team's agenda, or still on the horizon?
```

**İlgi gösterirse:**
```
Makes sense. The part most teams find hardest is collecting supplier data. Here's a 60-second look at how we do it with a link your suppliers fill in themselves: [video / catalogue link]. Worth a 20-minute call?
```

### 7.5 Kimi hedefleyeceğiz? (LinkedIn araması)

**Unvanlar:**
- Head of Sustainability, Sustainability Manager, CSR Manager
- Sourcing Director, Head of Sourcing, Supply Chain Manager
- Product Compliance Manager, Quality & Compliance
- Küçük markalarda Founder / CEO

**Sektör ve ülke:**
- Apparel & Fashion, Textiles, Furniture, Retail
- Almanya, Hollanda, Fransa, Belçika, İspanya, İtalya, İskandinavya, Polonya

**Türkiye tarafı:**
- Export Manager, Dış Ticaret Müdürü, Sürdürülebilirlik Uzmanı, Kalite Müdürü
- Tekstil, mobilya, ev tekstili

**Haftalık hedef:** 50 kişiselleştirilmiş bağlantı isteği. LinkedIn sınırlarını aşma.

### 7.6 Türkçe LinkedIn (Türk üreticiler için, haftada 1)

Aynı temaları Türkçe paylaş. Görseller `sosyal/tr/` klasöründe. Hazır metinler `sosyal/PAYLASIM-REHBERI-TR.md` dosyasında; yeni 05 ve 06 gönderileri için Post 1 ve Post 5'i çevir.

**Örnek (05, TR):**
```
Dijital Ürün Pasaportunun en zor kısmı QR kod değil, arkasındaki veri.

İplikçiden bileşim, kumaşçıdan GOTS/OEKO-TEX sertifikası, boyahaneden tesis bilgisi… Genelde Excel'ler ve bitmeyen e-postalar.

QRNot DPP'de tedarikçinize bir link gönderiyorsunuz; giriş yapmadan, kendi dilinde dolduruyor ve belgesini yüklüyor. Siz kontrol edip tek tıkla ürüne aktarıyorsunuz. Onayınız olmadan pasaporta hiçbir şey geçmiyor.

Bugün tedarikçi verisini nasıl topluyorsunuz?

#DijitalÜrünPasaportu #DPP #ESPR #Tekstil #İhracat
```

---

## 8. İlk 90 gün planı ve ölçümler

| Hafta | Hedef |
|---|---|
| 1 | Profil + şirket sayfası hazır; CRM'de 100 firma (60 TR, 40 AB); DPP Türkiye'ye katılım; GS1 Türkiye çözüm ortaklığı başvurusu |
| 2–4 | Haftada 50 ilk temas; haftada 3 LinkedIn gönderisi; 2 ihracatçı birliği / oda ile seminer görüşmesi |
| 4 | İlk 5 demo; ilk 2 pilot |
| 5–8 | İlk seminer; danışman / belgelendirme firması ile 2 referans anlaşması; pilotlarda ilk pasaportlar yayında |
| 8 | İlk pilot vaka hikâyesi (müşteri izniyle); "Post 9" yayında |
| 9–12 | Pilotlardan 2 ücretli müşteri; 1 AB markası ile tedarikçi zinciri pilotu |

**Haftalık ölçümler (CRM'de takip et):**

| Ölçü | Hedef (ilk 90 gün) |
|---|---|
| İlk temas sayısı | 50 / hafta |
| Cevap oranı | %8–15 (kişiselleştirilmiş soğuk temas için gerçekçi aralık) |
| Demo sayısı | 3–5 / hafta (4. haftadan itibaren) |
| Demo → pilot | %30+ |
| Pilot → ücretli | %50+ |
| LinkedIn | Gönderi başına kayıt ve DM sayısı (beğeniden önemli) |
| Örnek pasaport okutmaları | Admin → DPP → QRNot Demo; paylaşım günlerinde artış |

---

## 9. Her zaman doğru konuş (kırmızı çizgiler)

- ✅ "DPP'ye **hazır** altyapı", "bugünden toplamaya ve yayınlamaya başlayın".
- ✅ Kesin tarih olarak sadece:
  - ESPR Temmuz 2024'te yürürlüğe girdi.
  - Belirli bataryalar için batarya pasaportu Şubat 2027.
- ❌ "AB uyumlu / onaylı / sertifikalı" deme. Resmî onay diye bir şey yok.
- ❌ "EN 18216 / 18219 / 18222 uyumlu" ya da "AB DPP Kaydı'na gönderiyoruz" deme. Henüz yapmıyoruz.
- ❌ Karbon için "LCA" ya da "kesin hesap" deme; "kaynaklı tahmin yardımcısı" de.
- ❌ "ISO 27001 / SOC 2 sertifikalıyız" deme; değiliz. Veriler ABD'de (Neon / AWS us-east-1, Vercel). Sorulursa açıkça söyle; AB bölgesi talep üzerine.
- ❌ Rakip kötüleme. "Biz şunu yapıyoruz" de; karşılaştırmayı müşteri yapsın.
- ❌ Uydurma müşteri, uydurma alıntı, uydurma sertifika numarası, gerçek firmaya ait GTIN kullanma.
- ❌ Sözleşme taslağını (`sozlesme/`) avukat okumadan imzaya sunma.

---

## 10. Kaynaklar

**Rakip bilgileri** (kendi sitelerinden, Ekim 2026):
- [NavelCord](https://www.navelcord.com/)
- [DPPVisa](https://www.dppvisa.com/)
- [DPPSkop](https://dppskop.com/en/)
- [epassportify](https://www.epassportify.com/)
- [Cormind DPP](https://dpp.cormind.com.tr/)
- [Mitrotech — DPP yazısı](https://mitrotech.net/tr/haberler/dijital-urun-pasaportu-dpp/)
- [DPP Türkiye](https://www.dppturkiye.org/)
- [AB Döngüsel Ekonomi Paydaş Platformu — DPP](https://circulareconomy.europa.eu/platform/en/sector/digital-product-passport) (DPPSkop ve Cirtrace burada listeli)

**Sektör bağlamı:**
- [Textilegence — DPP Türk hazır giyim için fırsat mı?](https://www.textilegence.com/en/is-digital-product-passport-an-opportunity-for-turkish-apparel-industry/)
- [Sourcing Journal — Texhibition Istanbul](https://wwd.com/sourcing-journal/industry-news/texhibition-istanbul-turkey-textiles-trade-sustainability-technology-1239240203/)

**Kendi materyallerimiz:**
- `katalog/QRNot-DPP-Katalog-TR.pdf`, `katalog/QRNot-DPP-Katalog-EN.pdf` (8 sayfa)
- `sunum/QRNot-DPP-Sunum-TR.pdf`, `sunum/QRNot-DPP-Sunum-EN.pdf` (13 slayt)
- `sosyal/<tr|en>/<format>/01–06.png` (6 gönderi × 3 format × 2 dil)
- `sosyal/PAYLASIM-REHBERI-TR.md`, `sosyal/SHARING-GUIDE-EN.md`
- `SUNUM-METINLERI.md` (konuşma metni, itiraz–cevap)
- `sozlesme/` (KVKK/GDPR veri işleme sözleşmesi taslakları)
- Güvenlik sayfası: qrnot.com/dpp/guvenlik
