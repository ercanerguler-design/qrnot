# QRNot DPP — Sunum ve Satış Metinleri

Bu dosya, Dijital Ürün Pasaportu (DPP) için toplantı, e-posta ve sosyal medyada kullanılacak metinleri içerir.
Görseller bu klasörde; hepsi `node deliverables/dpp/build-dpp.mjs` ile yeniden üretilir.

---

## 0. Klasörde ne var, nerede kullanılır?

| Klasör | Ne | Nerede kullanılır |
|---|---|---|
| `katalog/QRNot-DPP-Katalog-TR.pdf` · `-EN.pdf` | 7 sayfa A4 broşür | Görüşme sonrası e-postayla gönder, fuarda bastır |
| `katalog/tr/` · `katalog/en/` | Katalog sayfaları tek tek (PNG) | Web, WhatsApp, LinkedIn belge gönderisi |
| `sunum/QRNot-DPP-Sunum-TR.pdf` · `-EN.pdf` | 11 slaytlık sunum (16:9) | Yüz yüze / online toplantı, ekran paylaşımı |
| `sunum/tr/` · `sunum/en/` | Slaytlar tek tek (PNG) | PowerPoint / Keynote / Canva'ya görsel olarak eklemek için |
| `sosyal/<tr\|en>/4x5-linkedin-instagram/` | 1080×1350, 4 gönderi | LinkedIn gönderisi, Instagram akış gönderisi |
| `sosyal/<tr\|en>/1x1-instagram-facebook/` | 1080×1080, 4 gönderi | Instagram kare, Facebook, LinkedIn kare |
| `sosyal/<tr\|en>/9x16-story-reels-tiktok/` | 1080×1920, 4 kare | Instagram / Facebook Story, Reels kapağı, TikTok, YouTube Shorts |
| `assets/` | Canlı sistemden gerçek ekran görüntüleri | Teklif dosyası, web sitesi, basın |

**Dil kuralı:** `tr` klasörlerindeki her görsel Türkçe, `en` klasörlerindeki her görsel İngilizce içeriklidir. Çok dilli pasaportu göstermek için kullanılan telefonlar bilerek farklı dillerdedir (TR setinde TR/DE/AR, EN setinde EN/DE/AR) ve altlarında dil etiketi yazar. Firma paneli arayüzü şu an Türkçe olduğu için **İngilizce materyallerde panel ekran görüntüsü yoktur**; onun yerine dilden bağımsız gerçek çıktılar (etiket sayfası, yayın geçmişi, JSON veri) kullanılır ve İngilizce katalogda "panel arayüzü şu an Türkçe" notu açıkça yazar.

**Ekran görüntüleri:** Canlı sistemden, örnek bir firma ("Anadolu Tekstil A.Ş.", "Anadolu Wear") ve örnek verilerle alındı. Bu firma ve markalar gerçek değildir; katalogda "örnek verilerle, görseller temsilidir" notu vardır.

---

## 1. Söylerken dikkat — her zaman doğru konuş

**Söyle:**
- "DPP'ye **hazır** bir altyapı", "pasaport verinizi bugünden toplayıp yayınlayabilirsiniz"
- "AB'nin teknik standartları kesinleştikçe veri modelini güncelliyoruz"
- "Pasaportlar 8 dilde, sürümlü, QR / NFC ile açılıyor"
- Kesin tarih olarak sadece: **ESPR Temmuz 2024'te yürürlüğe girdi**, **batarya pasaportu Şubat 2027**

**Söyleme:**
- "AB uyumlu / sertifikalı / onaylı" — henüz böyle bir resmî onay yok.
- Tekstil, mobilya vb. için kesin tarih — bu tarihler ikincil düzenlemelerle belirlenecek. "Sizin ürün grubunuz için güncel takvimi birlikte netleştiriyoruz" de.
- "Uyumluluk sorumluluğunu biz alıyoruz" — sorumluluk üreticidedir; biz süreci kolaylaştırıyoruz.
- Fiyat — paketler ürün sayısıyla tanımlı, fiyat teklifle verilir.
- "Panel İngilizce" — panel şu an Türkçe. Pasaportlar 8 dilde.

---

## 2. Kısa tanıtımlar

### 30 saniyelik (asansör) — TR
> AB'de satılan ürünlere kademeli olarak dijital ürün pasaportu zorunlu hale geliyor: ürünün üzerindeki QR okutulunca malzemesi, menşei, çevresel etkisi, bakım ve geri dönüşüm bilgisi açılacak. QRNot DPP ile bu pasaportu firmanız bir kez panele giriyor, 8 dilde yayınlıyor, etiketini basıyor. Bilgi değişse bile QR hiç değişmiyor. Birkaç ürünle pilot yapalım, AB'deki müşterinize "hazırız" diyebilin.

### 30-second pitch — EN
> Digital product passports are being phased in for products sold in the EU: scanning the QR on a product will show its materials, origin, environmental impact, care and recycling information. With QRNot DPP your team enters this data once, publishes it in 8 languages and prints the label. The information can change; the QR never does. Let's run a pilot with a few products so you can tell your EU customers you are ready.

### 2 dakikalık tanıtım — TR
1. **Durum:** ESPR ile AB pazarındaki ürünlere dijital pasaport geliyor. İlk somut adım Şubat 2027'de belirli bataryalar; tekstil, demir-çelik, mobilya sırada.
2. **Sorun:** Veriyi toplamak, doğru formatta yayınlamak, 8 dilde sunmak, etikete basmak ve ürün ömrü boyunca erişilebilir tutmak — çoğu üretici için yeni bir iş.
3. **Çözüm:** QRNot DPP. Sekmeli panelde veriyi girersiniz (ya da CSV ile yüzlerce ürünü tek seferde), yapay zekâ ile 7 dile çevirirsiniz, "Yayınla" dersiniz. Model düzeyinde tek QR ya da her ürün için seri numaralı QR basarsınız.
4. **Güven:** Her yayın bir sürüm olarak saklanır, yayınlanmış pasaport silinemez. Tedarikçi gibi hassas bilgiler sadece denetim ve geri dönüşüm için verdiğiniz anahtarla görünür. GTIN varsa GS1 Digital Link adresi de çalışır.
5. **Teklif:** Pilotla başlayalım: birkaç ürünü birlikte hazırlayalım, etiketi üretim hattınıza uyarlayalım.

---

## 3. Sunum konuşmacı notları (11 slayt)

**1 · Kapak — "Ürünleriniz Avrupa'ya pasaportuyla gitsin."**
Kendini tanıt. "Bugün 20 dakikada AB'nin dijital ürün pasaportunu, sizi nasıl etkilediğini ve bunu nasıl kolayca hazırlayabileceğinizi göstereceğim." Telefondaki gerçek pasaport ekranını göster.

**2 · Değişen kural**
Dört maddeyi oku. Takvimde sadece ESPR (2024) ve batarya pasaportu (Şubat 2027) kesin; diğerleri için "tarihler ilgili düzenlemelerle kesinleşecek, sizin ürün grubunuzu birlikte takip ederiz" de. Soru sor: *"AB'deki müşterileriniz bu konuda sizden bir şey istemeye başladı mı?"*

**3 · Kimleri etkiliyor?**
Karşıdaki firmanın sektörünü işaret et. Mesaj: erken başlayan öne geçer; AB alıcısı "hazır" tedarikçiyi tercih eder.

**4 · Bir pasaportta neler var?**
8 veri başlığını hızlı geç. Alt satırdaki üç okuyucuyu vurgula: tüketici, denetim, geri dönüşüm. *"Bu bilgilerin ne kadarı bugün sizde derli toplu duruyor?"* — keşif sorusu.

**5 · Çözüm: Girin, yayınlayın, etiketleyin**
Üç adımı anlat. Burada canlı demoya geçebilirsin: qrnot.com/p/ornekpasaport (telefondan okut, dili değiştir).

**6 · Tüketici deneyimi**
Uygulama yok; 8 dil; Arapça sağdan sola. Tekil üründe seri no, parti, üretim tarihi. Canlı demoda dili değiştirerek göster.

**7 · Firma paneli**
TR sunumda: panel ekranlarını göster — genel bakış, sekmeli düzenleyici, yayın öncesi eksik kontrolü (%100 kuralı). EN sunumda: yayın geçmişi ve JSON veri; "panel arayüzü Türkçe, pasaportlar 8 dilde" notunu söyle.

**8 · Üretimden rafa**
Seri numarası üretimi (tek seferde 2.000'e kadar), etiket baskısı (25–50 mm) ya da CSV ile lazer / etiket yazılımı. GS1 Digital Link: mevcut barkodlu ürünlerde standart adres de pasaportu açar.

**9 · Güven altyapısı**
Sürümlü yayın, yetkili erişim, silinmez arşiv, makine okunur veri. "Açık konuşalım" notunu mutlaka oku — dürüstlük güven verir.

**10 · Nasıl başlarız / Paketler**
4 adım: tanışma → pilot → etiket → yaygınlaştırma. Paketler ürün modeli sayısına göre; seri numarası sınırsız. Fiyatı burada verme; "ürün sayınıza göre teklif hazırlıyoruz" de.

**11 · İletişim**
QR'ı okutturup örnek pasaportu açtır. Net bir sonraki adım iste: *"Önümüzdeki hafta 2–3 ürününüzle pilotu başlatalım mı?"*

---

## 4. Keşif soruları (ilk görüşmede sor)

1. Hangi ürün gruplarını, hangi AB ülkelerine satıyorsunuz?
2. AB'deki müşterileriniz / ithalatçınız DPP veya sürdürülebilirlik verisi istedi mi?
3. Malzeme, menşe, sertifika bilgileri bugün nerede duruyor (ERP, Excel, tedarikçi belgeleri)?
4. Kaç ürün modeliniz var? Seri / parti takibi yapıyor musunuz?
5. Ürünlerinizde GTIN / EAN barkod kullanıyor musunuz?
6. Etiketleri nasıl basıyorsunuz (etiket yazıcısı, lazer, matbaa)?
7. Bu konudan firmada kim sorumlu (kalite, ihracat, sürdürülebilirlik)?

---

## 5. İtirazlar ve cevaplar

**"Daha zorunlu değil, bekleyelim."**
> Doğru, ürün grubunuz için tarih henüz kesin olmayabilir. Ama veriyi toplamak zaman alıyor ve AB'deki alıcılar tedarikçilerinden bu bilgileri şimdiden istemeye başlıyor. Pilotla küçük başlayıp süreci öğrenmek, son dakikaya kalmaktan çok daha ucuz.

**"Standartlar belli değil, yanlış şeye yatırım yapmayalım."**
> Bu yüzden "uyumlu" değil "hazır" diyoruz. Toplayacağınız veriler (malzeme, menşe, bakım, geri dönüşüm, sertifikalar) her senaryoda gerekecek. Standartlar kesinleştikçe veri modelini biz güncelliyoruz; QR adresiniz değişmiyor.

**"Bunu kendi web sitemizde yaparız."**
> Yapılabilir; ama sürümleme, silinmezlik, 8 dil, yetkili erişim, seri numarası bazında sayfa, GS1 Digital Link ve etiket üretimi ayrı ayrı geliştirme demek. Bizde bunlar hazır ve çalışıyor.

**"Verilerimiz güvende mi? Tedarikçi bilgilerimiz görünür mü?"**
> Hassas bilgiler "yetkili erişim" alanında durur; sadece sizin verdiğiniz anahtarla görünür ve anahtarı istediğiniz an yenileyebilirsiniz. Taslaktaki değişiklikler siz yayınlamadan görünmez. Okutmalarda kişisel veri tutulmaz.

**"Panel İngilizce mi?"**
> Panel arayüzü şu an Türkçe; pasaportlar 8 dilde yayınlanıyor. Ekibinizde yabancı kullanıcı varsa bunu konuşalım.

**"Ne kadar?"**
> Ürün modeli sayısına ve hizmet kapsamına göre teklif hazırlıyoruz. Seri numarası sınırsız. Önce pilotla ihtiyacınızı netleştirelim.

---

## 6. E-posta ve mesaj şablonları

### İlk temas e-postası — TR
**Konu:** AB'ye ihracatınız için Dijital Ürün Pasaportu

Merhaba [Ad Soyad],

AB'nin ESPR düzenlemesiyle AB pazarındaki ürünlere kademeli olarak dijital ürün pasaportu zorunlu hale geliyor: ürünün üzerindeki QR okutulduğunda malzeme, menşe, çevresel etki, bakım ve geri dönüşüm bilgileri gösterilecek.

QRNot DPP ile bu pasaportları panelden hazırlayıp 8 dilde yayınlıyor, QR / NFC etiketlerini üretim hattınızda basabiliyorsunuz. Bilgi güncellendiğinde QR değişmiyor; her yayın sürüm olarak saklanıyor.

Örnek bir pasaportu buradan görebilirsiniz: https://qrnot.com/p/ornekpasaport

[Firma] için birkaç ürünle pilot hazırlamak isteriz. Bu hafta 20 dakikalık bir görüşme uygun olur mu?

Saygılarımla,
[Ad Soyad] · QRNot
qrnot.com/dpp · WhatsApp +90 543 392 92 30

### First-contact email — EN
**Subject:** Digital Product Passport for your EU exports

Hello [Name],

Under the EU ESPR, digital product passports are being phased in for products on the EU market: scanning the QR on a product will show its materials, origin, environmental impact, care and recycling information.

With QRNot DPP you prepare these passports in one panel, publish them in 8 languages and print QR / NFC labels on your line. When information changes, the QR stays the same, and every publication is kept as a version.

You can see a sample passport here: https://qrnot.com/p/ornekpasaport

We would be glad to prepare a pilot with a few of your products. Would a 20-minute call this week work for you?

Best regards,
[Name] · QRNot
qrnot.com/dpp · WhatsApp +90 543 392 92 30

### Görüşme sonrası takip — TR
> Merhaba [Ad], bugünkü görüşme için teşekkürler. Konuştuğumuz katalog ekte (QRNot-DPP-Katalog-TR.pdf). Pilot için [ürün 1, ürün 2] ile başlamayı önermiştik; bu ürünlerin malzeme ve sertifika bilgilerini paylaşırsanız firma hesabınızı açıp pasaportları birlikte hazırlayalım.

### LinkedIn bağlantı mesajı — TR (300 karakter altı)
> Merhaba [Ad], AB'ye ihracat yapan üreticilerle Dijital Ürün Pasaportu hazırlığı üzerine çalışıyoruz. [Firma]'nın ürün grubunda bu konunun gündeminizde olup olmadığını merak ettim. Bağlantıda kalalım.

### LinkedIn connection note — EN
> Hi [Name], we help manufacturers exporting to the EU prepare for the Digital Product Passport. I was curious whether this is on your agenda at [Company]. Happy to connect.

---

## 7. Pilot teklif metni

> **QRNot DPP Pilot**
> - Firma hesabınız ve panel girişiniz açılır.
> - Seçtiğiniz ürünler için pasaport verilerini birlikte gireriz (malzeme, menşe, çevre, bakım, onarım, uygunluk).
> - Pasaportlar seçtiğiniz dillerde yayınlanır.
> - Model QR'ı ya da seri numaralı QR etiketleri üretim hattınıza uyarlanır.
> - Pilot sonunda koleksiyonun tamamı CSV ile aktarılabilir.
>
> Kapsam ve ücret, ürün sayınıza göre teklifte belirtilir.

---

## 8. Sosyal medya metinleri

Görsel sırası her formatta aynıdır: **01** geliyor · **02** 8 dil · **03** QR değişmez · **04** pilot.

### LinkedIn — TR

**01**
> AB'ye ihracat yapıyorsanız bu konu yakında masanızda olacak: Dijital Ürün Pasaportu.
>
> ESPR ile AB pazarındaki ürünlere kademeli olarak dijital pasaport geliyor. Ürünün üzerindeki QR okutulduğunda malzemesi, menşei, çevresel etkisi, bakım ve geri dönüşüm bilgisi görünecek.
>
> QRNot DPP ile bu pasaportu bir kez hazırlıyor, 8 dilde yayınlıyor, etiketini basıyorsunuz.
> 👉 qrnot.com/dpp
>
> #DijitalÜrünPasaportu #DPP #ESPR #İhracat #Sürdürülebilirlik #Tekstil

**02**
> Bir QR, 8 dil. Almanya'daki müşteriniz Almanca, Fransa'daki Fransızca okur. Arapça sağdan sola gösterilir. Uygulama gerekmez.
> Örnek pasaportu telefonunuzdan açın: qrnot.com/p/ornekpasaport
>
> #DPP #DijitalÜrünPasaportu #İhracat

**03**
> Etiketi bir kez basın. Bilgi güncellenir, QR hiç değişmez.
> Her güncelleme yeni bir sürüm olarak yayınlanır, eski sürümler kayıtta kalır. Yayınlanmış pasaport silinmez; ürün üretimden kalksa bile erişilebilir kalır.
>
> #DPP #ESPR #Uyum #Tedarikzinciri

**04**
> AB'deki müşterinize "hazırız" demek için büyük bir proje gerekmez. Birkaç ürünle başlayın: verileri birlikte girelim, QR / NFC etiketlerini üretim hattınıza uyarlayalım.
> Pilot için yazın: WhatsApp +90 543 392 92 30 · qrnot.com/dpp
>
> #DPP #DijitalÜrünPasaportu #İhracat #KOBİ

### LinkedIn — EN

**01**
> If you export to the EU, this will soon be on your desk: the Digital Product Passport.
>
> Under ESPR, digital passports are being phased in for products on the EU market. Scanning the QR on a product will show its materials, origin, environmental impact, care and recycling information.
>
> With QRNot DPP you prepare the passport once, publish it in 8 languages and print the label.
> 👉 qrnot.com/dpp
>
> #DigitalProductPassport #DPP #ESPR #Sustainability #CircularEconomy #Textiles

**02**
> One QR, 8 languages. Your customer in Germany reads German, in France French. Arabic is shown right-to-left. No app needed.
> Open the sample passport on your phone: qrnot.com/p/ornekpasaport
>
> #DPP #DigitalProductPassport #Export

**03**
> Print the label once. The information updates; the QR never changes.
> Every update is published as a new version and earlier versions stay on record. Published passports cannot be deleted and stay available even after a product is discontinued.
>
> #DPP #ESPR #Compliance #SupplyChain

**04**
> Telling your EU customers "we are ready" does not need a big project. Start with a few products: we enter the data together and fit the QR / NFC labels to your line.
> Message us for a pilot: WhatsApp +90 543 392 92 30 · qrnot.com/dpp
>
> #DPP #DigitalProductPassport #Manufacturing

### Instagram (akış + kare) — TR
Kısa tut; ilk satır görselin başlığını tekrar etmesin.

- **01** — "AB'ye ihracat yapan üreticiler için yeni dönem başlıyor. Ürününüz artık dijital pasaportuyla dolaşacak. Detaylar biyografideki linkte. #dpp #ihracat #sürdürülebilirlik #tekstil #üretim"
- **02** — "Aynı QR, 8 farklı dil. Örnek pasaportu açmak için biyografideki linke dokunun. #dpp #qrkod #ihracat"
- **03** — "Bilgi değişir, QR değişmez. Etiketleri yeniden basmanız gerekmez. #dpp #etiket #üretim"
- **04** — "İlk pasaportlarınızı birlikte hazırlayalım. DM'den yazın. #dpp #kobi #ihracat"

### Instagram (feed + square) — EN
- **01** — "A new era for manufacturers exporting to the EU: your product will travel with its digital passport. Link in bio. #dpp #digitalproductpassport #sustainability #manufacturing"
- **02** — "Same QR, 8 languages. Tap the link in bio to open the sample passport. #dpp #qrcode #export"
- **03** — "The information changes, the QR doesn't. No reprinting. #dpp #labels #manufacturing"
- **04** — "Let's prepare your first passports together. Send us a DM. #dpp #smallbusiness #export"

### Story / Reels / TikTok (9:16)
Story'de görselin üstüne şu etkileşim ögelerini ekleyin:
- **01** üzerine anket: "AB müşteriniz DPP sordu mu?" — Evet / Henüz değil
- **02** üzerine link etiketi: qrnot.com/p/ornekpasaport
- **04** üzerine "Mesaj gönder" etiketi

#### 30 saniyelik Reels / TikTok senaryosu — TR
| Süre | Görüntü | Ses / altyazı |
|---|---|---|
| 0–3 sn | Tişörtün etiketi yakın plan, telefon kamerası açılıyor | "AB'ye ürün satıyorsanız bunu bilmeniz lazım." |
| 3–8 sn | QR okutuluyor, pasaport açılıyor (canlı örnek: qrnot.com/p/ornekpasaport) | "Ürünün dijital pasaportu: malzeme, menşe, bakım, geri dönüşüm." |
| 8–14 sn | Dil menüsünden Almanca, sonra Arapça seçiliyor | "8 dilde. Arapça sağdan sola." |
| 14–20 sn | Malzeme ve çevre bölümüne kaydırma | "Organik pamuk %95, karbon ayak izi, geri dönüştürülebilirlik." |
| 20–26 sn | Etiket sayfası yazıcıdan çıkıyor (ya da 9x16/04 görseli) | "Etiketi bir kez basın; bilgi güncellenir, QR değişmez." |
| 26–30 sn | Logo + qrnot.com/dpp | "QRNot DPP. Pilot için bize yazın." |

#### 30-second Reels / TikTok script — EN
| Time | Visual | Voice / caption |
|---|---|---|
| 0–3 s | Close-up of the T-shirt label, phone camera opens | "Selling into the EU? You need to know this." |
| 3–8 s | QR scanned, passport opens (live sample: qrnot.com/p/ornekpasaport) | "The product's digital passport: materials, origin, care, recycling." |
| 8–14 s | Language menu → German, then Arabic | "8 languages. Arabic right-to-left." |
| 14–20 s | Scroll to materials and environment | "Organic cotton 95%, carbon footprint, recyclability." |
| 20–26 s | Label sheet coming out of the printer (or 9x16/04 image) | "Print the label once; the data updates, the QR doesn't." |
| 26–30 s | Logo + qrnot.com/dpp | "QRNot DPP. Message us for a pilot." |

---

## 9. Görselleri yeniden üretmek

```bash
node deliverables/dpp/build-dpp.mjs
```

- Metinler `build-dpp.mjs` içindeki `T.tr` ve `T.en` nesnelerindedir.
- Ekran görüntüleri `assets/` klasöründedir. Dosya adı kuralı: `passport-<materyal dili>-<arayüz dili>.png` ve `panel-tr-*.png`.
- Panel İngilizce arayüze kavuşursa `panel-en-*.png` görüntüleri eklenip İngilizce materyallere panel ekranları da konabilir.
