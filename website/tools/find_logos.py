"""Collect official society logos from each society's own website (or official Facebook page) with a real browser.
python website/tools/find_logos.py <outdir>  → <outdir>/<slug>/cand_*.png + _sheet.jpg contact sheet"""
import os, sys, re, io
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

OUT = sys.argv[1]
SITES = {
    'capital-smart-city': ['https://www.smartcitypk.com/'],
    'park-view-city': ['https://parkviewcity.com.pk/', 'https://parkviewcity.com.pk/islamabad/downtown/'],
    'blue-world-city': ['https://www.blueworldcity-official.com/', 'https://blueworldcity.com.pk/'],
    'kingdom-valley': ['https://kingdomvalleypvtltd.com/'],
}
only = sys.argv[2:]

JS = r"""() => {
  const out = [];
  const add = (u, why, w, h) => { if (u && !u.startsWith('data:image/gif')) out.push({u, why, w, h}); };
  document.querySelectorAll('img, image').forEach((i) => {
    const s = i.currentSrc || i.src || i.getAttribute('href') || i.getAttribute('data-src') || '';
    const hay = (s + ' ' + (i.alt || '') + ' ' + (i.className && i.className.baseVal !== undefined ? i.className.baseVal : i.className) + ' ' + (i.id || '') + ' ' + (i.closest('header, nav, .logo, [class*=logo], [id*=logo], .navbar-brand, .site-branding') ? 'INHEADER' : '')).toLowerCase();
    const r = i.getBoundingClientRect();
    if (/logo|brand|inheader/.test(hay) && r.top < 400) add(s, 'img:' + hay.slice(0, 60), Math.round(r.width), Math.round(r.height));
  });
  document.querySelectorAll('meta[property="og:image"], link[rel*=icon], link[rel=apple-touch-icon]').forEach((m) => add(m.content || m.href, m.getAttribute('property') || m.rel, 0, 0));
  return out;
}"""

with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge', headless=True)
    ctx = b.new_context(viewport={'width': 1366, 'height': 900}, locale='en-US', ignore_https_errors=True)
    for slug, urls in SITES.items():
        if only and slug not in only: continue
        d = os.path.join(OUT, slug); os.makedirs(d, exist_ok=True)
        cands = []
        for url in urls:
            pg = ctx.new_page()
            try:
                pg.goto(url, wait_until='domcontentloaded', timeout=45000); pg.wait_for_timeout(4500)
                found = pg.evaluate(JS)
                # also screenshot the header area for reference
                pg.screenshot(path=os.path.join(d, f'_header_{len(cands)}.png'), clip={'x': 0, 'y': 0, 'width': 1366, 'height': 220})
                for f in found:
                    u = urljoin(pg.url, f['u'])
                    if u in [c[0] for c in cands]: continue
                    try:
                        r = pg.request.get(u, timeout=30000)
                        if r.ok: cands.append((u, f['why'], r.body(), r.headers.get('content-type', '')))
                    except Exception as e:
                        print(slug, 'dl fail', u[:80], str(e)[:60])
                print(slug, url, '->', len(found), 'candidates')
            except Exception as e:
                print(slug, url, 'ERR', str(e)[:100])
            pg.close()
        thumbs = []
        for i, (u, why, body, ct) in enumerate(cands):
            ext = 'svg' if ('svg' in ct or u.split('?')[0].endswith('.svg')) else 'img'
            path = os.path.join(d, f'cand_{i}.{ext}')
            open(path, 'wb').write(body)
            if ext == 'svg':
                sp = b.new_page(viewport={'width': 600, 'height': 300})
                sp.set_content(f'<html><body style="margin:0;background:transparent"><img id=x src="data:image/svg+xml;base64,{__import__("base64").b64encode(body).decode()}" style="max-width:580px;max-height:280px"></body></html>')
                sp.wait_for_timeout(300)
                try: sp.locator('#x').screenshot(path=path.replace('.svg', '.png'), omit_background=True)
                except Exception: pass
                sp.close(); path = path.replace('.svg', '.png')
            try:
                im = Image.open(path if path.endswith('.png') else io.BytesIO(body)); im.load()
                im = im.convert('RGBA'); im.save(os.path.join(d, f'cand_{i}.png'))
                thumbs.append((i, im, why, u))
            except Exception as e:
                print(slug, 'not an image', u[:80])
        if thumbs:
            W, H = 260, 150
            sh = Image.new('RGB', (W * min(len(thumbs), 6), (H + 30) * ((len(thumbs) + 5) // 6)), (200, 200, 200))
            dr = ImageDraw.Draw(sh)
            for k, (i, im, why, u) in enumerate(thumbs):
                t = im.copy(); t.thumbnail((W - 10, H - 10)); x, y = (k % 6) * W, (k // 6) * (H + 30)
                bg = Image.new('RGBA', (W - 4, H), (255, 255, 255, 255)); bg.alpha_composite(t, ((W - 4 - t.width) // 2, (H - t.height) // 2))
                sh.paste(bg.convert('RGB'), (x, y)); dr.text((x + 3, y + H + 2), f'#{i} {im.size[0]}x{im.size[1]} {u.split("/")[-1][:28]}', fill='black')
            sh.save(os.path.join(OUT, f'_{slug}.jpg'), quality=85)
        print(slug, len(thumbs), 'images')
    b.close()
