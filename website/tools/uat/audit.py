"""Static SEO + integrity audit of ./dist. python tools/uat/audit.py"""
import os, re, json, glob, sys
from html.parser import HTMLParser
from bs4 import BeautifulSoup

DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'dist')
DIST = os.path.normpath(DIST)
pages = {}
for f in glob.glob(DIST + '/**/*.html', recursive=True):
    rel = '/' + os.path.relpath(f, DIST).replace('\\', '/')
    url = rel[:-len('index.html')] if rel.endswith('index.html') else rel
    if '_maptest' in rel: continue
    pages[url] = BeautifulSoup(open(f, encoding='utf-8').read(), 'html.parser')

issues, rows = [], []
ids = {u: {t.get('id') for t in s.find_all(id=True)} for u, s in pages.items()}
for url, s in sorted(pages.items()):
    title = s.title.string if s.title else ''
    desc = (s.find('meta', attrs={'name': 'description'}) or {}).get('content', '')
    h1 = s.find_all('h1'); can = s.find('link', rel='canonical')
    robots = (s.find('meta', attrs={'name': 'robots'}) or {}).get('content', '')
    lds = s.find_all('script', type='application/ld+json'); types = []
    for l in lds:
        try:
            d = json.loads(l.string); types.append(d.get('@type') if isinstance(d.get('@type'), str) else '/'.join(d.get('@type')))
        except Exception as e:
            issues.append(f'{url}: invalid JSON-LD {e}')
    if url != '/404.html':
        if not (30 <= len(title) <= 65): issues.append(f'{url}: title length {len(title)} "{title}"')
        if not (110 <= len(desc) <= 165): issues.append(f'{url}: description length {len(desc)}')
        if not can: issues.append(f'{url}: no canonical')
    if len(h1) != 1: issues.append(f'{url}: {len(h1)} H1')
    # heading order: no h3 before first h2 inside main
    for img in s.find_all('img'):
        if img.get('alt') is None: issues.append(f'{url}: img without alt {img.get("src")}')
        src = img.get('src', '')
        if src.startswith('/') and not os.path.exists(DIST + src.split('?')[0]): issues.append(f'{url}: missing image {src}')
    for tag, attr in [('a', 'href'), ('link', 'href'), ('script', 'src'), ('source', 'src'), ('video', 'src'), ('video', 'poster'), ('button', 'data-video'), ('button', 'data-lightbox'), ('video', 'data-src')]:
        for t in s.find_all(tag):
            v = t.get(attr)
            if not v or not v.startswith('/') or v.startswith('//'): continue
            path, _, frag = v.split('?')[0].partition('#')
            target = path if path.endswith('/') or '.' in os.path.basename(path) else path + '/'
            fs = DIST + (target + 'index.html' if target.endswith('/') else target)
            if not os.path.exists(fs): issues.append(f'{url}: broken {tag}[{attr}] {v}')
            elif frag and target in ids and frag not in ids[target]: issues.append(f'{url}: missing anchor {v}')
    for a in s.find_all('a', href=True):
        h = a['href']
        if h.startswith('#') and len(h) > 1 and h[1:] not in ids[url]: issues.append(f'{url}: missing in-page anchor {h}')
        if a.get('target') == '_blank' and 'noopener' not in (a.get('rel') or []): issues.append(f'{url}: target=_blank without noopener {h[:50]}')
    words = len(s.find('main').get_text(' ').split()) if s.find('main') else 0
    rows.append((url, len(title), len(desc), len(h1), words, ','.join(types), round(os.path.getsize(DIST + (url + 'index.html' if url.endswith('/') else url)) / 1024, 1)))

# JavaScript must parse (a syntax error silently disables menus, forms and players)
import subprocess
for js in glob.glob(DIST + '/assets/js/*.js'):
    r = subprocess.run(['node', '--check', js], capture_output=True, text=True)
    if r.returncode: issues.append(f'JS syntax error in {os.path.basename(js)}: {r.stderr.strip().splitlines()[-1]}')

# sitemap coverage
sm = open(DIST + '/sitemap.xml', encoding='utf-8').read()
locs = re.findall(r'<loc>([^<]+)</loc>', sm)
for u in pages:
    if u.endswith('/') and not any(l.endswith(u) for l in locs): issues.append(f'sitemap missing {u}')

print(f'{"page":45} {"title":>5} {"desc":>5} {"h1":>3} {"words":>6} {"KB":>6}  schema')
for r in rows: print(f'{r[0]:45} {r[1]:>5} {r[2]:>5} {r[3]:>3} {r[4]:>6} {r[6]:>6}  {r[5]}')
print(f'\nSitemap URLs: {len(locs)}')
print(f'Issues: {len(issues)}'); [print(' -', i) for i in issues]
sys.exit(1 if issues else 0)
