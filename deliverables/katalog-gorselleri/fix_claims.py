"""Katalog görsellerindeki iddiaları QRNot'un gerçek özelliklerine göre düzeltir.

Kullanım:  python deliverables/katalog-gorselleri/fix_claims.py [dosya-adı-parçası]
Girdi:     deliverables/katalog-gorselleri/orijinal/*
Çıktı:     public/katalog/*.webp  (sitedeki katalog bu dosyaları kullanır)
           deliverables/katalog-gorselleri/duzeltilmis/*.png  (kontrol için tam kalite)

Yöntem: düzeltilecek yazının bulunduğu kutuda parlak (yazı) pikselleri maskelenir, OpenCV inpaint ile arka plan
çevresinden doldurulur, ardından doğru metin benzer yazı tipiyle aynı yere yazılır.
"""

import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(HERE, 'orijinal')
OUT_PNG = os.path.join(HERE, 'duzeltilmis')
OUT_WEB = os.path.join(ROOT, 'public', 'katalog')

FONT_DIR = 'C:/Windows/Fonts'
FONTS = {
    'regular': os.path.join(FONT_DIR, 'segoeui.ttf'),
    'semibold': os.path.join(FONT_DIR, 'seguisb.ttf'),
    'bold': os.path.join(FONT_DIR, 'segoeuib.ttf'),
    # Dar, kalın başlıklar (İngilizce altın temalı görsel) için Bahnschrift varyantı
    'condensed': (os.path.join(FONT_DIR, 'bahnschrift.ttf'), 'SemiBold SemiCondensed'),
}

WHITE = (240, 240, 248)
GRAY = (205, 205, 220)
EN = (226, 228, 236)


def L(text, size, weight='regular', color=GRAY, spacing=0):
    """Tek satır metin tanımı."""
    return {'text': text, 'size': size, 'weight': weight, 'color': color, 'spacing': spacing}


def erase(img_bgr, box, thresh=110, dilate=3):
    x0, y0, x1, y1 = box
    region = img_bgr[y0:y1, x0:x1]
    bright = region.max(axis=2) > thresh
    mask = np.zeros(img_bgr.shape[:2], np.uint8)
    mask[y0:y1, x0:x1][bright] = 255
    if dilate:
        mask = cv2.dilate(mask, np.ones((dilate, dilate), np.uint8), iterations=2)
    return cv2.inpaint(img_bgr, mask, 5, cv2.INPAINT_TELEA)


def draw_lines(pil_img, box, lines, align='left', line_gap=1.28, valign='top'):
    draw = ImageDraw.Draw(pil_img)
    x0, y0, x1, y1 = box
    heights = [int(l['size'] * line_gap) for l in lines]
    total = sum(heights)
    y = y0 if valign == 'top' else y0 + ((y1 - y0) - total) // 2
    for line, h in zip(lines, heights):
        spec = FONTS[line['weight']]
        if isinstance(spec, tuple):
            font = ImageFont.truetype(spec[0], line['size'])
            font.set_variation_by_name(spec[1])
        else:
            font = ImageFont.truetype(spec, line['size'])
        text = line['text']
        if line['spacing']:
            # harf aralığı (büyük harf başlıklar için)
            width = sum(draw.textlength(ch, font=font) + line['spacing'] for ch in text) - line['spacing']
        else:
            width = draw.textlength(text, font=font)
        if align == 'center':
            x = x0 + ((x1 - x0) - width) / 2
        elif align == 'right':
            x = x1 - width
        else:
            x = x0
        if line['spacing']:
            for ch in text:
                draw.text((x, y), ch, font=font, fill=line['color'])
                x += draw.textlength(ch, font=font) + line['spacing']
        else:
            draw.text((x, y), text, font=font, fill=line['color'])
        y += h


def apply(name, patches):
    path = os.path.join(SRC, name)
    # cv2.imread Türkçe karakterli yolları okuyamaz; PIL ile açıp BGR'ye çevir
    img = cv2.cvtColor(np.array(Image.open(path).convert('RGB')), cv2.COLOR_RGB2BGR)
    for p in patches:
        img = erase(img, p['erase'], p.get('thresh', 110), p.get('dilate', 3))
    pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    for p in patches:
        if p.get('lines'):
            draw_lines(pil, p.get('text_box', p['erase']), p['lines'], p.get('align', 'left'), p.get('line_gap', 1.28), p.get('valign', 'top'))
    base = os.path.splitext(name)[0]
    os.makedirs(OUT_PNG, exist_ok=True)
    os.makedirs(OUT_WEB, exist_ok=True)
    pil.save(os.path.join(OUT_PNG, base + '.png'))
    pil.save(os.path.join(OUT_WEB, base + '.webp'), 'WEBP', quality=86, method=6)
    print('ok', base)


# ------------------------------------------------------------------------------------------------
# Düzeltmeler — her biri: hangi iddia neden değişti
# ------------------------------------------------------------------------------------------------
PATCHES = {
    'neon-anahtarlik-tr.jpg': [
        # "Ömür boyu aktif" → böyle bir taahhüt yok. ∞ ikonu "QR hiç değişmez" anlamıyla korunur.
        {
            'erase': (212, 733, 368, 802),
            'text_box': (212, 740, 368, 808),
            'align': 'center',
            'lines': [L('QR HİÇ DEĞİŞMEZ', 15, 'semibold', WHITE), L('İçeriğini güncelle,', 13, color=GRAY), L('QR aynı kalır.', 13, color=GRAY)],
            'line_gap': 1.45,
        },
        # "Dayanıklı malzeme / suya ve darbelere dayanıklı" → test edilmiş iddia değil. Damla ikonu = epoksi damla baskı.
        {
            'erase': (688, 733, 852, 802),
            'text_box': (688, 740, 852, 808),
            'align': 'center',
            'lines': [L('DAMLA BASKI', 15, 'semibold', WHITE), L('Parlak, kabarık epoksi', 13, color=GRAY), L('neon yüzey.', 13, color=GRAY)],
            'line_gap': 1.45,
        },
        # "Konumunuzu paylaşın" → canlı konum yok; girilen adres haritada açılır.
        {
            'erase': (968, 585, 1240, 632),
            'lines': [L('Adresinizi ekleyin, haritada', 14.5, color=GRAY), L('tek dokunuşla açılsın.', 14.5, color=GRAY)],
            'line_gap': 1.5,
        },
        # "Kan grubu, alerji…" → acil durum alanı telefon ve adres alır.
        {
            'erase': (968, 673, 1240, 720),
            'lines': [L('Telefon ve adresinizi ekleyin;', 14.5, color=GRAY), L('bulan kişi tek dokunuşla arasın.', 14.5, color=GRAY)],
            'line_gap': 1.5,
        },
    ],
    'neon-anahtarlik-sticker.jpg': [
        # İkon satırı: "Suya dayanıklı" (test edilmiş iddia değil) → damla ikonu = neon damla baskı
        {'erase': (392, 396, 512, 434), 'text_box': (392, 398, 502, 434), 'align': 'center', 'line_gap': 1.4,
         'lines': [L('NEON DAMLA', 13.5, 'regular', GRAY, 1.2), L('BASKI', 13.5, 'regular', GRAY, 1.2)]},
        # "Dilediğin kadar mesaj" → 3 içerik kaydı dahil; ∞ ikonu = QR hiç değişmez
        {'erase': (526, 396, 672, 434), 'text_box': (526, 398, 672, 434), 'align': 'center', 'line_gap': 1.4,
         'lines': [L('QR HİÇ', 13.5, 'regular', GRAY, 1.2), L('DEĞİŞMEZ', 13.5, 'regular', GRAY, 1.2)]},
        # "Çantanı bulan sana mesaj bıraksın" → bulan kişinin mesaj bırakma özelliği yok; "Ara" butonu var
        {'erase': (696, 774, 872, 830), 'text_box': (692, 778, 884, 830), 'align': 'center', 'line_gap': 1.45,
         'lines': [L('Çantanı bulan kişi', 14.5, color=WHITE), L('seni tek dokunuşla arasın.', 14.5, color=WHITE)]},
        # "Mesajların sana özel" → QR'ı okutan herkes içeriği görür
        {'erase': (94, 906, 282, 962), 'text_box': (97, 912, 282, 962), 'line_gap': 1.45,
         'lines': [L('Verilerin güvende,', 15.5, color=GRAY), L('QR’ın senin hesabında.', 15.5, color=GRAY)]},
        # "Sınırsız kayıt / dilediğin kadar mesaj" → 3 içerik kaydı dahil
        {'erase': (960, 880, 1146, 914), 'text_box': (965, 884, 1146, 914),
         'lines': [L('QR HİÇ DEĞİŞMEZ', 16.5, 'semibold', WHITE, 0.6)]},
        {'erase': (960, 912, 1146, 962), 'text_box': (965, 914, 1146, 962), 'line_gap': 1.45,
         'lines': [L('Mesajını güncelle,', 15.5, color=GRAY), L('QR aynı kalır.', 15.5, color=GRAY)]},
    ],
    'neon-sticker-modelleri.jpg': [
        # "Suya dayanıklı" → test edilmiş iddia değil; damla ikonu = neon damla baskı
        {'erase': (1184, 408, 1350, 442), 'text_box': (1190, 413, 1350, 442),
         'lines': [L('NEON DAMLA BASKI', 16, 'semibold', WHITE, 0.8)]},
        # "Sınırsız kayıt / Dilediğin kadar mesaj" → 3 içerik kaydı dahil
        {'erase': (1184, 682, 1354, 712), 'text_box': (1190, 686, 1354, 712),
         'lines': [L('QR HİÇ DEĞİŞMEZ', 16, 'semibold', WHITE, 0.8)]},
        {'erase': (1184, 712, 1354, 742), 'text_box': (1190, 714, 1354, 742),
         'lines': [L('Mesajını güncelle', 14.5, color=GRAY)]},
        # "Yapıştır, koruma al" → koruma garantisi gibi okunuyor; gerçek işlev: bulan kişi ulaşır
        {'erase': (78, 1050, 250, 1082), 'text_box': (45, 1054, 280, 1082), 'align': 'center',
         'lines': [L('Yapıştır, bulan sana ulaşsın', 16, color=WHITE)]},
    ],
    'neon-koleksiyon-en.png': [
        # "Add your own private messages" → QR'ı okutan herkes içeriği görür
        {'erase': (784, 848, 1004, 898), 'text_box': (784, 853, 1004, 898), 'align': 'center', 'line_gap': 1.35,
         'lines': [L('Add a short note for', 17, color=(226, 226, 232)), L('whoever scans.', 17, color=(226, 226, 232))]},
        # "Cloud backup" → bulutta saklama var, ayrı yedekleme taahhüdü yok
        {'erase': (364, 1388, 442, 1434), 'text_box': (368, 1393, 442, 1434), 'line_gap': 1.3,
         'lines': [L('CLOUD', 15.5, 'condensed', (240, 240, 244)), L('STORAGE', 15.5, 'condensed', (240, 240, 244))]},
    ],
    'dijital-profil-en.png': [
        # "Share your real-time location" → canlı konum yok; girilen adres haritada açılır
        {'erase': (17, 924, 152, 990), 'text_box': (22, 927, 152, 990), 'line_gap': 1.32,
         'lines': [L('Share your address;', 15.5, color=EN), L('it opens in Maps', 15.5, color=EN), L('with one tap.', 15.5, color=EN)]},
        # Otel: "taxi requests" → otel panelinde concierge talebi var, taksi yok
        {'erase': (23, 1194, 174, 1283), 'text_box': (26, 1196, 174, 1283), 'line_gap': 1.3,
         'lines': [L('Room-based QR,', 15, color=EN), L('housekeeping/technical/', 15, color=EN), L('concierge requests and', 15, color=EN), L('live operations.', 15, color=EN)]},
    ],
    'dijital-ozellikler-en.png': [
        # "Update Anytime" → 3 içerik kaydı dahil; sınırsız güncelleme ima edilmesin
        {'erase': (110, 502, 302, 537), 'text_box': (116, 503, 302, 537),
         'lines': [L('Easy to Update', 23.5, color=(236, 236, 242))]},
        {'erase': (446, 1148, 514, 1195), 'text_box': (450, 1150, 514, 1195), 'line_gap': 1.25,
         'lines': [L('Easy', 17, color=(236, 236, 242)), L('Updates', 17, color=(236, 236, 242))]},
        # Otel: "taxi requests" → concierge
        {'erase': (42, 1012, 222, 1115), 'text_box': (45, 1013, 222, 1115), 'line_gap': 1.25,
         'lines': [L('Room-based QR,', 16, color=EN), L('housekeeping/technical/', 16, color=EN), L('concierge requests and', 16, color=EN), L('live operation', 16, color=EN), L('management.', 16, color=EN)]},
    ],
}


if __name__ == '__main__':
    only = sys.argv[1] if len(sys.argv) > 1 else ''
    for name, patches in PATCHES.items():
        if only in name:
            apply(name, patches)
