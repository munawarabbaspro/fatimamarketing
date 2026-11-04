"""Wide 3:1 page-header banners (native 1920 px) for the project covers, so large desktop screens never upscale them.
The 16:9 stills lose their corners to keep channel/developer logos out; a banner keeps the full width and drops the
top part of the frame instead (where those logos sit). Reads the raw 1080p frames cached by build_society_media.py.
Run from repo root:  python website/tools/make_banners.py   (writes assets/society/banner-<name>.webp + -800)
"""
import os, glob
from PIL import Image, ImageEnhance, ImageFilter

ROOT = os.getcwd()
TMP = os.path.join(ROOT, 'website/tools/_media_tmp'); OUT = os.path.join(ROOT, 'website/src/static/assets/society')
C, CAP, BORDER, LOW, T = (0.0, 0.14, 1.0, 0.86), (0.0, 0.13, 1.0, 0.79), (0.025, 0.10, 0.975, 0.86), (0.0, 0.14, 1.0, 0.80), (0.0, 0.19, 1.0, 0.88)
# name: (raw frame time, ticker-free box, vertical position of the 3:1 slice inside the box: 0 = top, 1 = bottom)
BANNERS = {
    'capital-smart-city-1': (54.4, CAP, 1), 'top-city-1-1': (38.0, BORDER, 1), 'mumtaz-city-1': (403.2, T, 1),
    'gandhara-city-1': (132.0, T, 1), 'pechs-islamabad-2': (6.6, LOW, 1), 'airport-green-garden-1': (77.0, (0.0, 0.10, 0.88, 0.78), 0.5),
    'kingdom-valley-2': (126.4, C, 1), 'faisal-town-1': (12.2, CAP, 1), 'faisal-hills-1': (142.6, BORDER, 1),
    'park-view-city-1': (147.0, T, 1), 'blue-world-city-1': (53.8, BORDER, 1), 'multi-gardens-b17-3': (104.4, T, 0),
    'multi-gardens-b17-1': (127.4, T, 1), 'taj-residencia-1': (20.2, (0.0, 0.19, 1.0, 0.83), 1),
}

def save(im, name):
    im = ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(1.05)).enhance(1.03)
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=86, method=6)
    s = im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.1, percent=45, threshold=2))
    s.save(os.path.join(OUT, name + '-800.webp'), 'WEBP', quality=80, method=6)

for name, (t, (l, tp, r, b), pos) in BANNERS.items():
    raw = os.path.join(TMP, f'{name}_{t:.2f}.png')
    if not os.path.exists(raw):
        print('skip (no cached frame, run build_society_media.py stills first):', name); continue
    im = Image.open(raw).convert('RGB'); W, H = im.size
    box = im.crop((round(W * l), round(H * tp), round(W * r), round(H * b))); bw, bh = box.size
    h = min(bh, round(bw / 3)); y = round((bh - h) * pos)
    band = box.crop((0, y, bw, y + h)); save(band, 'banner-' + name)
    print('banner', name, band.size)
