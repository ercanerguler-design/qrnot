# TARİFNAME

## Buluş Başlığı
QR kod tabanlı sesli mesaj aracılı kayıp eşya geri bildirim ve güvenli sahiplik doğrulama sistemi ve yöntemi

## Teknik Alan
Buluş; fiziksel eşyaya iliştirilen makinece okunabilir kod (QR kod) üzerinden, bulan kişi ile eşya sahibi arasında kontrollü iletişim kurulmasına, sesli/çoklu ortam mesajının güvenli şekilde alınmasına, sahiplik doğrulaması yapılmasına ve teslim sürecinin kayıt altına alınmasına yönelik bilgisayar uygulamalı bir sistem ve yönteme ilişkindir.

## Tekniğin Bilinen Durumu
Mevcut kayıp eşya çözümlerinde genellikle:
1. Sabit bir iletişim bilgisi etikete doğrudan yazılır.
2. Bulan kişi yalnızca telefon veya metinle iletişim kurabilir.
3. Sahiplik doğrulaması manuel ve güvensizdir.
4. İletişim kayıtları sistematik değildir.
5. Kötüye kullanım ve spam riski yüksektir.

Bu yapı, kişisel verinin ifşasına ve düşük geri dönüş oranına neden olmaktadır.

## Buluşun Amacı
Bu buluşun amacı:
1. Eşya sahibinin kişisel verisini ifşa etmeden iletişim kurulmasını sağlamak,
2. Bulan kişinin sesli mesaj bırakabilmesini sağlamak,
3. Sahiplik doğrulamasını kod-temelli güvenli bir akış ile gerçekleştirmek,
4. Süreç boyunca işlem kayıtlarını yönetmektir.

## Buluşun Özeti
Buluş; en az bir sunucu, bir veri tabanı, bir istemci arayüzü ve fiziksel etikete bağlı tekil QR kimliği içeren bir yapıdır. QR okutulduğunda istemci, sistem tarafından sağlanan yönetimli bir sayfaya yönlendirilir. Bu sayfada bulan kişi sesli mesaj, metin veya medya bırakabilir. Sistem, eşya sahibine anonimize edilmiş bildirim üretir. Sahiplik doğrulaması için tek kullanımlık veya süreli doğrulama akışı kullanılır. Onay sonrası teslim adımları kayıt altına alınır.

## Şekillerin Kısa Açıklaması
- Şekil 1: Genel sistem mimarisi
- Şekil 2: QR okutma ve mesaj bırakma akışı
- Şekil 3: Sahiplik doğrulama akışı
- Şekil 4: Bildirim ve teslim kapanış akışı

## Referans Numaraları
- 10: Fiziksel etiket/anahtarlık
- 20: QR kimlik verisi
- 30: Mobil istemci
- 40: Uygulama sunucusu
- 50: Veri tabanı
- 60: Medya depolama birimi
- 70: Bildirim modülü
- 80: Doğrulama modülü
- 90: Yönetim paneli

## Buluşun Detaylı Açıklaması
10 numaralı fiziksel etiket üzerinde 20 numaralı tekil QR kimliği bulunur. 30 numaralı mobil istemci, 20 numaralı kimliği okuyarak 40 numaralı uygulama sunucusuna istek gönderir. 40 numaralı sunucu, 50 numaralı veri tabanından ilgili eşya kaydını alır ve bulan kişi için etkileşimli bir arayüz üretir.

Bulan kişi, arayüz üzerinden sesli mesaj kaydı başlatır. Ses verisi 60 numaralı depolama birimine yüklenir; meta veriler 50 numaralı veri tabanına işlenir. 70 numaralı bildirim modülü, eşya sahibine doğrudan kişisel veri paylaşmadan bildirim üretir.

Eşya sahibinin geri dönüş talebi halinde 80 numaralı doğrulama modülü devreye girer. Bu modül, tek kullanımlık bağlantı, süreli doğrulama belirteci, işlem geçmişi ve gerektiğinde ek doğrulama adımları ile sahiplik doğrulaması sağlar. Doğrulama sonrası 90 numaralı yönetim paneli üzerinden süreç kapanışı ve kayıt yönetimi yapılır.

## Tercihli Uygulama Biçimleri
1. Sesli mesaj + metin mesaj kombinasyonu.
2. Coğrafi bölge/ülke bazlı bildirim dil seçimi.
3. Kötüye kullanım önleme için oran sınırlama (rate limit).
4. Silme, arşivleme, geri alma politikaları.

## Sanayiye Uygulanabilirlik
Buluş; e-ticaret, lojistik, kurumsal envanter, bireysel kullanım, pet tag, valiz etiketi ve anahtarlık ürünlerinde doğrudan uygulanabilir niteliktedir. SaaS modeli ve fiziksel ürün modeli birlikte çalışabilir.
