"""Turn official society logos into uniform square badge images (transparent, trimmed, 320×320 WebP).
Sources: each society's official website / official Facebook page (collected with tools/find_logos.py) and,
where a society publishes no logo (PECHS, Margalla View D-17), a real photo of the society.
python website/tools/process_logos.py <logo source dir>"""
import os, sys
from PIL import Image, ImageDraw, ImageChops
SRC = sys.argv[1]
ROOT = os.getcwd()
OUT = os.path.join(ROOT, 'website/src/static/assets/logos')
SOC = os.path.join(ROOT, 'website/src/static/assets/society')
S = 320

def trim(im, pad=0.08):
    bb = im.getbbox()
    if bb: im = im.crop(bb)
    w, h = im.size; side = int(max(w, h) * (1 + pad * 2))
    c = Image.new('RGBA', (side, side), (0, 0, 0, 0)); c.alpha_composite(im, ((side - w) // 2, (side - h) // 2))
    return c.resize((S, S), Image.LANCZOS)

def knock_white(im, thr=236):
    px = im.load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            m = min(r, g, b)
            if m >= thr and max(r, g, b) - m < 14: px[x, y] = (r, g, b, 0)
            elif m >= thr - 25 and max(r, g, b) - m < 14: px[x, y] = (r, g, b, int(a * (thr - m) / 25))
    return im

def flood_bg(im, tol=34):
    """Make the outer background transparent by flood-filling from the corners (textured grey backgrounds)."""
    rgb = im.convert('RGB'); w, h = rgb.size
    mask = Image.new('L', (w, h), 0)
    marker = (255, 0, 255)
    work = rgb.copy()
    for pt in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        ImageDraw.floodfill(work, pt, marker, thresh=tol)
    diff = ImageChops.difference(work, Image.new('RGB', (w, h), marker)).convert('L')
    mask = diff.point(lambda v: 0 if v < 8 else 255)
    out = im.convert('RGBA'); out.putalpha(mask)
    return out

def photo_badge(src, focus=(0.5, 0.5)):
    im = Image.open(src).convert('RGB'); w, h = im.size; side = min(w, h)
    cx, cy = int(w * focus[0]), int(h * focus[1])
    l = max(0, min(w - side, cx - side // 2)); t = max(0, min(h - side, cy - side // 2))
    return im.crop((l, t, l + side, t + side)).resize((S, S), Image.LANCZOS).convert('RGBA')

L2, L3, L4, L5 = (os.path.join(SRC, d) for d in ('logos2', 'logos3', 'logos4', 'logos5'))
from PIL import ImageFont

def circle(im):
    """Keep only the inscribed circle (round logos on a square background)."""
    im = im.convert('RGBA'); w, h = im.size; side = min(w, h)
    im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2)).resize((S * 2, S * 2), Image.LANCZOS)
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).ellipse((6, 6, im.width - 6, im.height - 6), fill=255)
    im.putalpha(Image.composite(im.getchannel('A'), m, m)); return im.resize((S, S), Image.LANCZOS)

def hexagon(im):
    """AGG: keep the hexagon (green border) and drop the textured background around it."""
    rgb = im.convert('RGB'); w, h = rgb.size; px = rgb.load()
    xs, ys = [], []
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            r, g, b = px[x, y]
            if g > r + 45 and g > b + 20: xs.append(x); ys.append(y)
    l, t, r_, b_ = min(xs), min(ys), max(xs), max(ys); cx = (l + r_) / 2; hh = b_ - t
    poly = [(cx, t - 2), (r_ + 2, t + hh * .25), (r_ + 2, t + hh * .75), (cx, b_ + 2), (l - 2, t + hh * .75), (l - 2, t + hh * .25)]
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    out = im.convert('RGBA'); out.putalpha(m); return out

def bwc_mark():
    """Blue World City: white disc with the navy serif wordmark, as shown on BWC's own branding (redrawn crisp)."""
    big = S * 3; im = Image.new('RGBA', (big, big), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse((6, 6, big - 6, big - 6), fill=(255, 255, 255, 255), outline=(29, 60, 143, 255), width=10)
    f = ImageFont.truetype('C:/Windows/Fonts/timesbd.ttf', 210); f2 = ImageFont.truetype('C:/Windows/Fonts/timesbd.ttf', 160)
    for txt, fnt, y in [('BLUE', f, 215), ('WORLD', f, 425), ('CITY', f2, 640)]:
        tw = d.textlength(txt, font=fnt); d.text(((big - tw) / 2, y), txt, font=fnt, fill=(29, 60, 143, 255))
    return im.resize((S, S), Image.LANCZOS)
jobs = {
    'top-city-1': lambda: trim(knock_white(Image.open(os.path.join(L2, 'top-city-1/cand_1.png')).convert('RGBA'))),
    'mumtaz-city': lambda: trim(knock_white(Image.open(os.path.join(L2, 'mumtaz-city/cand_0.png')).convert('RGBA'))),
    'gandhara-city': lambda: trim(knock_white(Image.open(os.path.join(L2, 'gandhara-city/cand_0.png')).convert('RGBA'))),
    'airport-green-garden': lambda: trim(hexagon(Image.open(os.path.join(L3, 'agg-fb_4.png'))), pad=0.04),
    'capital-smart-city': lambda: trim(knock_white(Image.open(os.path.join(L5, 'capital-smart-city/cand_0.png')).convert('RGBA')), pad=0.05),
    'park-view-city': lambda: trim(knock_white(Image.open(os.path.join(L5, 'park-view-city/cand_19.png')).convert('RGBA')), pad=0.12),
    'kingdom-valley': lambda: circle(Image.open(os.path.join(L5, 'kingdom-valley/cand_4.png'))),
    'blue-world-city': bwc_mark,
    'faisal-town': lambda: trim(knock_white(Image.open(os.path.join(L2, 'faisal-town/cand_0.png')).convert('RGBA').crop((760, 0, 1024, 307)))),
    'multi-gardens-b17': lambda: trim(knock_white(Image.open(os.path.join(L2, 'multi-gardens-b17/cand_0.png')).convert('RGBA')), pad=0.05),
    'taj-residencia': lambda: trim(Image.open(os.path.join(L4, 'taj-logo.png')).convert('RGBA'), pad=0.06),
    'pechs-islamabad': lambda: photo_badge(os.path.join(L3, 'pechs-fb_4.png'), (0.5, 0.42)),
    'd-17-islamabad': lambda: photo_badge(os.path.join(L3, 'd17-fb1_1.png')),
}
for slug, fn in jobs.items():
    im = fn()
    im.save(os.path.join(OUT, f'{slug}.webp'), 'WEBP', quality=90, method=6)
    print(slug, im.size)

# preview sheet on both plate colours
names = ['capital-smart-city', 'top-city-1', 'mumtaz-city', 'gandhara-city', 'pechs-islamabad', 'airport-green-garden', 'kingdom-valley',
         'faisal-town', 'park-view-city', 'blue-world-city', 'd-17-islamabad', 'multi-gardens-b17', 'taj-residencia']
sheet = Image.new('RGB', (len(names) * 130, 260), (230, 230, 230))
for i, n in enumerate(names):
    for row, bg in enumerate([(255, 255, 255), (15, 17, 21)]):
        x = Image.open(os.path.join(OUT, f'{n}.webp')).convert('RGBA').resize((120, 120))
        c = Image.new('RGBA', (120, 120), bg + (255,)); c.alpha_composite(x)
        sheet.paste(c.convert('RGB'), (i * 130 + 5, row * 130 + 5))
sheet.save(os.path.join(SRC, 'logo_badges.jpg'), quality=88)
print('sheet ok')
