"""Square 240 px thumbnails of each society cover, for the payment-plans society picker and panel headers.
Usage (from website/): python tools/make_thumbs.py  ->  src/static/assets/society/thumb-<slug>.webp
Re-run after changing a cover in src/data/media.mjs."""
import json, os, subprocess
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
ASSETS = os.path.join(SITE, 'src', 'static', 'assets')
covers = json.loads(subprocess.check_output(
    ['node', '-e', "import('./src/data/media.mjs').then(m => console.log(JSON.stringify(m.covers)))"], cwd=SITE, text=True))

for slug, name in covers.items():
    src = next(p for p in (os.path.join(ASSETS, 'society', f'{name}.webp'), os.path.join(ASSETS, 'gallery', f'{name}.webp')) if os.path.exists(p))
    im = Image.open(src).convert('RGB'); w, h = im.size; s = min(w, h)
    x, y = (w - s) // 2, (h - s) // 2
    out = os.path.join(ASSETS, 'society', f'thumb-{slug}.webp')
    im.crop((x, y, x + s, y + s)).resize((240, 240), Image.LANCZOS).save(out, 'WEBP', quality=86, method=6)
    print(f'{slug:24} {os.path.basename(src):32} {os.path.getsize(out) // 1024} KB')
