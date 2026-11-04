"""Screenshot pages at desktop + mobile widths and report console errors. Usage: python shots.py <outdir> [paths...]"""
import sys, os
from playwright.sync_api import sync_playwright
from PIL import Image
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
paths = sys.argv[2:] or ['/']
BASE = os.environ.get('BASE', 'http://localhost:4173')
with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge', headless=True)
    for vw, vh, tag in [(1440, 900, 'desk'), (390, 844, 'mob')]:
        ctx = b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=1, is_mobile=(tag == 'mob'), has_touch=(tag == 'mob'))
        for path in paths:
            pg = ctx.new_page(); errs = []
            pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(BASE + path, wait_until='load', timeout=60000); pg.wait_for_timeout(1500)
            h = pg.evaluate('document.documentElement.scrollHeight')
            for y in range(0, h, 700): pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(120)
            pg.add_style_tag(content='*{content-visibility:visible!important}'); pg.evaluate("document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-in'))");  # full-page capture can't paint skipped sections pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(900)
            ow = pg.evaluate('document.documentElement.scrollWidth')
            name = (path.strip('/').replace('/', '_') or 'home') + f'_{tag}'
            pg.screenshot(path=f'{out}/{name}.png', full_page=True)
            im = Image.open(f'{out}/{name}.png'); W, H = im.size
            scale = 720 / W if tag == 'desk' else 1
            n = 0
            for y in range(0, H, 2600 if tag == 'desk' else 1800):
                c = im.crop((0, y, W, min(H, y + (2600 if tag == 'desk' else 1800))))
                if scale != 1: c = c.resize((int(c.width * scale), int(c.height * scale)))
                c.convert('RGB').save(f'{out}/{name}_{n}.jpg', quality=78); n += 1
            print(f'{path} [{tag}] height={h} overflowX={ow > vw} parts={n} errors={errs[:5]}')
            pg.close()
        ctx.close()
    b.close()
