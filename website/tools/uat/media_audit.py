"""Media quality audit: are the site's pictures and videos sharp on real screens?  (dev server on :4173)
   python tools/uat/media_audit.py [--sheet DIR]

1. Files: every image/video under dist/assets: pixel size, bytes, bits per pixel, a sharpness score
   (variance of the Laplacian at a fixed 800 px width), and for videos the bitrate and bits per pixel per frame.
2. On screen: every page is opened on 5 devices (phone DPR 3, tablet DPR 2, laptop DPR 1 and 2, full-HD DPR 1),
   scrolled top to bottom, and for every visible picture/video the stretch factor is measured:
       stretch = (CSS size the content is drawn at, incl. object-fit cover) × DPR ÷ real pixels of the file used
   stretch ≤ 1 means every screen pixel has real detail. On DPR 1 screens anything above 1.15 looks soft.
   On retina (DPR ≥ 2) screens up to 2 is the normal web standard (it looks like a sharp 1x photo).
3. Flags: stretched on a DPR 1 screen (> 1.15), stretched > 2 on retina, sharpness in the bottom range,
   low bits per pixel (visible compression), videos under 0.06 bits/pixel/frame.
Writes tools/uat/media-audit.json; --sheet DIR saves a contact sheet of the flagged stills."""
import json, os, re, subprocess, sys
from PIL import Image, ImageDraw
import numpy as np, cv2
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DIST = os.path.join(ROOT, 'dist'); BASE = os.environ.get('BASE', 'http://localhost:4173')
FF = os.environ.get('FFMPEG') or __import__('imageio_ffmpeg').get_ffmpeg_exe()
PAGES = ['/', '/projects/', '/projects/capital-smart-city/', '/projects/mumtaz-city/', '/projects/kingdom-valley/', '/projects/faisal-town/',
         '/projects/gandhara-city/', '/projects/pechs-islamabad/', '/payment-plans/', '/about/', '/contact/']
DEVICES = [('phone', 390, 844, 3, True), ('tablet', 820, 1180, 2, True), ('laptop', 1440, 900, 1, False), ('retina', 1440, 900, 2, False), ('fullhd', 1920, 1080, 1, False)]
SHEET = sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else None

def sharp(gray):
    g = cv2.resize(gray, (800, max(1, round(gray.shape[0] * 800 / gray.shape[1]))), interpolation=cv2.INTER_AREA)
    return float(cv2.Laplacian(g, cv2.CV_64F).var())

def probe(path):
    out = subprocess.run([FF, '-hide_banner', '-i', path], capture_output=True, text=True).stderr
    w, h = map(int, re.search(r'Video:.*?(\d{3,4})x(\d{3,4})', out).groups())
    dur = re.search(r'Duration: (\d+):(\d+):([\d.]+)', out); dur = int(dur[1]) * 3600 + int(dur[2]) * 60 + float(dur[3])
    fps = float(re.search(r'([\d.]+) fps', out).group(1)); kbps = os.path.getsize(path) * 8 / 1000 / dur
    frames = []
    for t in (0.2, 0.5, 0.8):
        r = subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-ss', f'{dur * t:.2f}', '-i', path, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True)
        a = cv2.imdecode(np.frombuffer(r.stdout, np.uint8), cv2.IMREAD_GRAYSCALE)
        if a is not None: frames.append(sharp(a))
    return {'w': w, 'h': h, 'fps': fps, 'kbps': round(kbps), 'bpp': round(kbps * 1000 / (w * h * fps), 3), 'sharp': round(float(np.median(frames)), 1) if frames else None}

# ---------- 1. files ----------
files = {}
for d in ('society', 'img', 'gallery'):
    for f in sorted(os.listdir(os.path.join(DIST, 'assets', d))):
        if not f.endswith(('.webp', '.jpg', '.png')): continue
        p = os.path.join(DIST, 'assets', d, f); im = Image.open(p); w, h = im.size
        g = cv2.cvtColor(np.array(im.convert('RGB')), cv2.COLOR_RGB2GRAY)
        files[f'/assets/{d}/{f}'] = {'w': w, 'h': h, 'kb': os.path.getsize(p) // 1024, 'bpp': round(os.path.getsize(p) * 8 / (w * h), 2), 'sharp': round(sharp(g), 1)}
for f in sorted(os.listdir(os.path.join(DIST, 'assets', 'video'))):
    if f.endswith('.mp4'): files[f'/assets/video/{f}'] = {**probe(os.path.join(DIST, 'assets', 'video', f)), 'kb': os.path.getsize(os.path.join(DIST, 'assets', 'video', f)) // 1024}

# ---------- 2. on screen ----------
JS = r"""() => { const out = [];
  for (const el of document.querySelectorAll('img, video')) {
    const r = el.getBoundingClientRect(); if (r.width < 40 || r.height < 30) continue;
    const s = getComputedStyle(el); if (s.visibility === 'hidden' || +s.opacity === 0 || s.display === 'none') continue;
    let p = el; let hidden = false; while (p) { const ps = getComputedStyle(p); if (ps.display === 'none' || ps.visibility === 'hidden') { hidden = true; break; } p = p.parentElement; } if (hidden) continue;
    const src = el.tagName === 'VIDEO' ? (el.currentSrc || (el.readyState ? el.src : '')) : el.currentSrc;
    if (!src || src.startsWith('data:')) continue;
    out.push({tag: el.tagName.toLowerCase(), src: new URL(src).pathname, w: r.width, h: r.height, fit: s.objectFit,
      vw: el.videoWidth || 0, vh: el.videoHeight || 0, where: (el.closest('[class]') || el).className.toString().split(' ')[0]});
  }
  return out; }"""
rows = []
with sync_playwright() as pw:
    b = pw.chromium.launch(channel='msedge', headless=True)
    for dev, W, H, dpr, mob in DEVICES:
        ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=dpr, is_mobile=mob, has_touch=mob)
        pg = ctx.new_page()
        for path in PAGES:
            pg.goto(BASE + path, wait_until='load')
            pg.add_style_tag(content='main>section{content-visibility:visible!important}[data-reveal]{opacity:1!important;transform:none!important}')
            seen = {}
            hgt = pg.evaluate('document.documentElement.scrollHeight')
            for y in range(0, hgt, H):
                pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(220)
                for it in pg.evaluate(JS): seen[(it['src'], it['where'], round(it['w']), round(it['h']))] = it
            pg.evaluate('scrollTo(0,0)'); pg.wait_for_timeout(4500)  # hero video starts
            for it in pg.evaluate(JS): seen[(it['src'], it['where'], round(it['w']), round(it['h']))] = it
            for it in seen.values():
                meta = files.get(it['src'])
                fw, fh = (it['vw'], it['vh']) if it['vw'] else ((meta['w'], meta['h']) if meta else (0, 0))
                if not fw: continue
                k = (max if it['fit'] == 'cover' else min)(it['w'] / fw, it['h'] / fh) if it['fit'] in ('cover', 'contain') else max(it['w'] / fw, it['h'] / fh)
                rows.append({'device': dev, 'dpr': dpr, 'page': path, 'src': it['src'], 'where': it['where'], 'css': [round(it['w']), round(it['h'])],
                             'file': [fw, fh], 'stretch': round(k * dpr, 2)})
        ctx.close()
    b.close()

# ---------- 3. flags ----------
imgs = {k: v for k, v in files.items() if not k.endswith('.mp4')}
sharp_vals = sorted(v['sharp'] for k, v in imgs.items() if '/society/' in k or '/img/hero' in k)
soft_cut = sharp_vals[max(0, len(sharp_vals) // 10 - 1)] if sharp_vals else 0
flags = []
for r in rows:
    if r['dpr'] == 1 and r['stretch'] > 1.15: flags.append(('stretched on a standard screen', r))
    elif r['dpr'] >= 2 and r['stretch'] > 2.0: flags.append(('stretched > 2x on retina', r))
for k, v in files.items():
    if k.endswith('.mp4') and v['bpp'] < 0.06: flags.append(('video bits/pixel low (compression)', {'src': k, **v}))
    if not k.endswith('.mp4') and ('/society/' in k or '/img/hero' in k) and not re.search(r'-(?:800|480|m-800)\.webp$', k) and v['sharp'] <= soft_cut:
        flags.append(('among the softest 10% of stills', {'src': k, **v}))

worst = {}
for why, r in flags:
    key = (why, r['src'])
    if key not in worst or r.get('stretch', 0) > worst[key][1].get('stretch', 0): worst[key] = (why, r)
json.dump({'files': files, 'onscreen': rows, 'flags': [dict(why=w, **r) for w, r in worst.values()]}, open(os.path.join(os.path.dirname(__file__), 'media-audit.json'), 'w'), indent=1)

print(f'files: {len(imgs)} images, {len(files) - len(imgs)} videos | on-screen measurements: {len(rows)} on {len(PAGES)} pages x {len(DEVICES)} devices')
print('\nvideos:'); [print(f"  {k.split('/')[-1]:34} {v['w']}x{v['h']} {v['kbps']:>5} kbps  {v['bpp']:.3f} bpp  sharp {v['sharp']}") for k, v in files.items() if k.endswith('.mp4')]
by_dev = {}
for r in rows: by_dev.setdefault(r['device'], []).append(r['stretch'])
print('\nstretch by device (median / 95th pct / max):')
for d, v in by_dev.items(): v = sorted(v); print(f"  {d:7} {v[len(v) // 2]:.2f} / {v[int(len(v) * .95)]:.2f} / {v[-1]:.2f}  ({len(v)} items)")
print(f'\nflags: {len(worst)}')
for why, r in sorted(worst.values(), key=lambda x: (x[0], -x[1].get('stretch', 0))):
    print(f"  [{why}] {r['src'].split('/')[-1]}" + (f"  x{r['stretch']} on {r['device']} {r['page']} ({r['where']} {r['css'][0]}x{r['css'][1]} css, file {r['file'][0]}x{r['file'][1]})" if 'stretch' in r else f"  sharp={r.get('sharp')} {r.get('w')}x{r.get('h')}"))
if SHEET:
    os.makedirs(SHEET, exist_ok=True)
    soft = [r['src'] for w, r in worst.values() if w.startswith('among')]
    if soft:
        tiles = []
        for s in soft:
            im = Image.open(os.path.join(DIST, s.lstrip('/'))).convert('RGB'); im.thumbnail((480, 300)); t = Image.new('RGB', (480, 318), 'white'); t.paste(im, (0, 18))
            ImageDraw.Draw(t).text((3, 3), f"{s.split('/')[-1]}  sharp {files[s]['sharp']}", fill='red'); tiles.append(t)
        S = Image.new('RGB', (480 * 4, 318 * ((len(tiles) + 3) // 4)), 'white')
        for i, t in enumerate(tiles): S.paste(t, ((i % 4) * 480, (i // 4) * 318))
        S.save(os.path.join(SHEET, 'softest.jpg'), quality=85)
