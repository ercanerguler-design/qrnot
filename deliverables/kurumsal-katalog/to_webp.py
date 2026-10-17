"""Kurumsal katalog PNG sayfalarını site için WebP'ye çevirir (public/katalog/kurumsal/<tr|en>/)."""

import glob
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

for lang in ('tr', 'en'):
    out = os.path.join(ROOT, 'public', 'katalog', 'kurumsal', lang)
    os.makedirs(out, exist_ok=True)
    for png in sorted(glob.glob(os.path.join(HERE, lang, '*.png'))):
        name = os.path.splitext(os.path.basename(png))[0]
        Image.open(png).convert('RGB').save(os.path.join(out, name + '.webp'), 'WEBP', quality=88, method=6)
        print(lang, name)
