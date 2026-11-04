"""Lighthouse (same engine as PageSpeed Insights, simulated throttling) for every key page, mobile + desktop.
Run with the dev server on :4173:   python tools/uat/lighthouse/run.py [mobile|desktop|both] [/path ...]
WARM=1 attaches Lighthouse to one long-running, warmed-up Edge (like PageSpeed's servers) instead of a cold browser per run;
on Windows a cold Edge spends 100-300 ms initialising system fonts in its first layout, which the 4x CPU simulation multiplies.
Writes <form>_<page>.report.json/html here and prints a score table (Perf/A11y/BP/SEO + Core Web Vitals)."""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('BASE', 'http://localhost:4173')
EDGE = os.environ.get('CHROME_PATH', r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
PAGES = ['/', '/projects/', '/projects/capital-smart-city/', '/projects/mumtaz-city/', '/payment-plans/', '/about/', '/contact/', '/privacy-policy/']
forms = {'mobile': [], 'desktop': ['--preset=desktop']}
which = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ('mobile', 'desktop', 'both') else 'both'
pages = [a for a in sys.argv[1:] if a.startswith('/')] or PAGES
rows = []
port = None
if os.environ.get('WARM'):
    import time, urllib.request
    port = 9333
    # start on about:blank: Lighthouse opens/closes its own tab, and the blank tab keeps the headless browser alive
    subprocess.Popen([EDGE, '--headless=new', f'--remote-debugging-port={port}', '--user-data-dir=' + os.path.join(HERE, '_warm_profile'), '--no-first-run', 'about:blank'])
    for _ in range(50):
        try: urllib.request.urlopen(f'http://127.0.0.1:{port}/json/version', timeout=1); break
        except Exception: time.sleep(0.3)
    from playwright.sync_api import sync_playwright
    def cdp(fn):
        with sync_playwright() as p:
            b = p.chromium.connect_over_cdp(f'http://127.0.0.1:{port}'); fn(b)
    def warm(b):  # one visit per page, so fonts and caches are initialised before measuring
        for path in pages:
            pg = b.contexts[0].new_page(); pg.goto(BASE + path, wait_until='load'); pg.close()
    cdp(warm)
for form in (['mobile', 'desktop'] if which == 'both' else [which]):
    for path in pages:
        slug = path.strip('/').replace('/', '_')
        out = os.path.join(HERE, f'{form}_{slug}')
        cmd = ['npx', '--no-install', 'lighthouse', BASE + path, '--quiet', *([f'--port={port}'] if port else [f'--chrome-path={EDGE}', '--chrome-flags=--headless=new']),
               '--only-categories=performance,accessibility,best-practices,seo', '--output=json', '--output=html', f'--output-path={out}', *forms[form]]
        subprocess.run(' '.join(f'"{c}"' if ' ' in c else c for c in cmd), shell=True, check=False)
        try:
            r = json.load(open(out + '.report.json', encoding='utf-8'))
        except FileNotFoundError:
            rows.append((form, path, 'ERROR')); continue
        c = {k: round((v['score'] or 0) * 100) for k, v in r['categories'].items()}
        a = r['audits']; m = lambda k: a[k]['displayValue'].replace('\xa0', ' ')
        failing = [k for k, v in a.items() if v.get('score') is not None and v['score'] < 0.9 and v.get('scoreDisplayMode') in ('binary', 'numeric', 'metricSavings')]
        rows.append((form, path, c, {x: m(x) for x in ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index']}, failing[:8]))
if port:
    try: cdp(lambda b: b.new_browser_cdp_session().send('Browser.close'))  # graceful shutdown via DevTools
    except Exception: pass  # the browser drops the connection as it closes
print(f"\n{'form':8}{'page':34}{'perf':>5}{'a11y':>5}{'bp':>5}{'seo':>5}   FCP / LCP / TBT / CLS / SI")
for row in rows:
    if row[2] == 'ERROR': print(f'{row[0]:8}{row[1]:34} ERROR'); continue
    form, path, c, m, failing = row
    print(f"{form:8}{path:34}{c['performance']:>5}{c['accessibility']:>5}{c['best-practices']:>5}{c['seo']:>5}   " + ' / '.join(m.values()))
    if failing: print(' ' * 42 + 'below 90: ' + ', '.join(failing))
json.dump([r for r in rows if r[2] != 'ERROR'], open(os.path.join(HERE, 'summary.json'), 'w'), indent=1)
