"""Convert source images (payment plans, logos) into web-ready WebP/PNG/ICO. Run from repo root."""
import os, pymupdf
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = os.getcwd()
A = os.path.join(ROOT, 'website/src/static/assets')
S = os.path.join(ROOT, 'website/tools/src-assets')

def webp(im, path, maxw, q=80):
    im = im.copy(); im.thumbnail((maxw, maxw * 4)); im.save(path, 'WEBP', quality=q, method=6); return im.size

# 1) Payment plans: PDFs (embedded image) + loose images, de-duplicated
plans = {
  'csc-lsc-residential-villas': 'Payment Plan.pdf',
  'csc-harmony-park-the-villas': 'Payment Plan (1).pdf',
  'csc-district-one-commercial': 'Payment Plan (2).pdf',
  'csc-overseas-west-residential': 'Payment Plan (3).pdf',
  'csc-overseas-central-lake-view-commercial': 'Payment Plan (4).pdf',
  'csc-hamilton-hills-by-axis': 'Payment Plan (5).pdf',
  'csc-one-capital-residences-jade-tower': 'Payment Plan (6).pdf',
  'csc-phase-3-pre-launch-residential': 'Payment Plan (7).pdf',
  'csc-overseas-east-residential': 'pt-i-cdxlrevnmvhfrdl2x9zpyq.jpg.jpeg',
  'csc-overseas-prime-ii-residential': 'pt-i-lst3raebh5qwvwf8chpcif.jpeg',
  'csc-overseas-prime-residential-commercial': 'pt-i-ni8brl2ad0y1icfgsytxkd.jpg.jpeg',
  'csc-executive-block-residential': 'pt-i-xp0zkewv8oucuhyfosmyto.jpg.jpeg',
}
for slug, src in plans.items():
    p = os.path.join(ROOT, src)
    if src.endswith('.pdf'):
        d = pymupdf.open(p); pix = pymupdf.Pixmap(d, d[0].get_images()[0][0])
        if pix.n - pix.alpha > 3: pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        im = Image.frombytes('RGB' if pix.alpha == 0 else 'RGBA', (pix.width, pix.height), pix.samples).convert('RGB')
    else:
        im = Image.open(p).convert('RGB')
    s1 = webp(im, f'{A}/plans/{slug}.webp', 1600, 82)
    s2 = webp(im, f'{A}/plans/{slug}-480.webp', 480, 72)
    print('plan', slug, s1, s2)

# 2) Brand logo (official, extracted from FGC group artwork)
for n in ['fm-logo', 'fm-logo-white']:
    im = Image.open(f'{S}/{n}.png').convert('RGBA')
    im.save(f'{A}/logos/{n}.png', optimize=True)
    im.save(f'{A}/logos/{n}.webp', 'WEBP', quality=90, lossless=False, method=6)
    print(n, im.size)
Image.open(f'{S}/fgc-mark.png').convert('RGBA').save(f'{A}/logos/fgc-mark.webp', 'WEBP', quality=90)

# 3) Society logos available from the old FGC site
for src, slug in [('KV.png', 'kingdom-valley'), ('bwc1.png', 'blue-world-city'), ('PVC.png', 'park-view-city'), ('CSC.png', 'capital-smart-city')]:
    im = Image.open(f'{S}/{src}').convert('RGBA'); im.thumbnail((240, 240))
    im.save(f'{A}/logos/{slug}.webp', 'WEBP', quality=88, method=6); print('logo', slug, im.size)

# 4) Favicon / app icons: roof mark cropped from the logo on brand black
logo = Image.open(f'{S}/fm-logo.png').convert('RGBA')
roof = logo.crop((int(logo.width * 0.27), 0, int(logo.width * 0.73), int(logo.height * 0.56)))
bb = roof.getbbox(); roof = roof.crop(bb)
def icon(size, pad=0.14, bg=(14, 14, 16, 255)):
    c = Image.new('RGBA', (size, size), bg)
    r = roof.copy()
    # white roof lines on black
    px = r.load()
    for y in range(r.height):
        for x in range(r.width):
            R, G, B, Al = px[x, y]
            if Al and R < 110 and G < 110 and B < 110: px[x, y] = (255, 255, 255, Al)
    inner = int(size * (1 - 2 * pad)); r.thumbnail((inner, inner), Image.LANCZOS)
    c.alpha_composite(r, ((size - r.width) // 2, (size - r.height) // 2 + int(size * 0.02)))
    return c
icon(512).save(f'{A}/icons/icon-512.png'); icon(192).save(f'{A}/icons/icon-192.png')
icon(180, 0.12).convert('RGB').save(f'{A}/icons/apple-touch-icon.png')
icon(48, 0.06).save(f'{A}/icons/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
icon(32, 0.06).save(f'{A}/icons/favicon-32.png')

# 5) Open Graph share image 1200x630
F = 'C:/Windows/Fonts/'
def font(name, size):
    for n in name:
        try: return ImageFont.truetype(F + n, size)
        except OSError: pass
    return ImageFont.load_default()
og = Image.new('RGB', (1200, 630), (14, 14, 16))
bg = Image.open(f'{ROOT}/website/src/static/assets/gallery/pearl-night.webp').convert('RGB').resize((1200, 646)).crop((0, 28, 1200, 618))
bg = bg.filter(ImageFilter.GaussianBlur(1)); dark = Image.new('RGB', bg.size, (14, 14, 16))
og.paste(Image.blend(bg, dark, 0.62), (0, 0))
dr = ImageDraw.Draw(og)
dr.rectangle((0, 590, 1200, 630), fill=(242, 222, 42))
wl = Image.open(f'{S}/fm-logo-white.png').convert('RGBA'); wl.thumbnail((560, 220))
og.paste(wl, (60, 70), wl)
dr.text((62, 330), 'Plots, villas & apartments across Islamabad', font=font(['segoeuib.ttf', 'arialbd.ttf'], 42), fill=(255, 255, 255))
dr.text((62, 390), 'Capital Smart City · Mumtaz City · Top City-1 · Kingdom Valley · Blue World City', font=font(['segoeui.ttf', 'arial.ttf'], 25), fill=(220, 220, 220))
dr.text((62, 470), 'UAN 0331-1111057   ·   WhatsApp 0335-7777901', font=font(['segoeuib.ttf', 'arialbd.ttf'], 32), fill=(242, 222, 42))
dr.text((62, 598), '17+ years · F-10 Markaz, Islamabad · Real Services for Real Estate', font=font(['segoeuib.ttf', 'arialbd.ttf'], 22), fill=(14, 14, 16))
og.save(f'{A}/img/og-fatima-marketing.jpg', quality=86); print('og ok')

# 6) Islamabad banner (from old FGC site)
webp(Image.open(f'{S}/ISB.jpg').convert('RGB'), f'{A}/img/islamabad-aerial.webp', 1366, 76)
print('done')
