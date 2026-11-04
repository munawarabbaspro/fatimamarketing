"""Responsive audit: every page × 16 viewport widths. Run with the dev server on :4173.
   python tools/uat/responsive.py [--shots DIR]
Checks per page/width:
  overflow   document wider than the viewport (sideways scroll)
  offender   visible element sticking out of the viewport and not clipped by a scroll/overflow container
  clipped    text cut off inside its box (overflow hidden) that is not an intentional ellipsis chip
  tiny       visible text smaller than 12px (mobile/tablet widths)
  tap        links/buttons smaller than 24×24 (WCAG 2.2 target size; mobile widths)
  stretch    image drawn with object-fit:fill at a different aspect ratio than the file (distorted)
"""
import sys, os, json
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://localhost:4173')
PAGES = ['/', '/projects/', '/projects/capital-smart-city/', '/projects/mumtaz-city/', '/projects/faisal-hills/', '/projects/d-17-islamabad/',
         '/payment-plans/', '/about/', '/contact/', '/privacy-policy/', '/404.html']
WIDTHS = [320, 360, 375, 390, 414, 430, 540, 600, 768, 820, 1024, 1180, 1280, 1366, 1440, 1920]
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
SHOT_W = {320, 375, 768}

JS = r"""
(mob) => {
  const vw = document.documentElement.clientWidth, out = {overflow: document.documentElement.scrollWidth > vw + 1, offender: [], clipped: [], tiny: [], tap: [], stretch: []};
  const name = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '')).slice(0, 70);
  const visible = (e) => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const hiddenAncestor = (e) => { for (let a = e; a; a = a.parentElement) { const s = getComputedStyle(a); if (s.display === 'none' || s.visibility === 'hidden') return true; if (a.matches && a.matches('dialog:not([open]), [hidden], .nav:not(.is-open), .dd')) { if (!(a.matches('.dd') && a.closest('.has-dd.is-open'))) return a.matches('.dd') || !a.matches('.nav') || getComputedStyle(a).visibility === 'hidden'; } } return false; };
  const clippedBy = (e) => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (s.overflowX !== 'visible' || s.overflow !== 'visible') { const r = a.getBoundingClientRect(); if (r.right <= vw + 1 && r.left >= -1) return a; } } return null; };
  const all = [...document.querySelectorAll('body *')];
  for (const e of all) {
    if (['SCRIPT', 'STYLE', 'svg', 'path', 'circle', 'rect', 'defs', 'stop', 'radialGradient', 'OPTION', 'BR'].includes(e.tagName)) continue;
    if (e.closest('svg') && e.tagName !== 'svg') continue;
    if (!visible(e) || hiddenAncestor(e)) continue;
    if (e.closest('details:not([open])') && !e.closest('summary')) continue;   // collapsed content is not on screen
    if (e.matches('.skip')) continue;                                           // off-screen until keyboard focus, by design
    const r = e.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !clippedBy(e) && !e.closest('.marquee__track')) out.offender.push(`${name(e)} [${Math.round(r.left)}→${Math.round(r.right)} of ${vw}]`);
    const s = getComputedStyle(e);
    const ownText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (ownText) {
      if ((s.overflow === 'hidden' || s.overflowX === 'hidden') && e.scrollWidth > e.clientWidth + 1 && s.textOverflow !== 'ellipsis' && !e.closest('.btn, .marquee')) out.clipped.push(`${name(e)} "${e.textContent.trim().slice(0, 40)}"`);
      if (s.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) out.clipped.push(`(ellipsis) ${name(e)} "${e.textContent.trim().slice(0, 40)}"`);
      if (mob && parseFloat(s.fontSize) < 12 && !e.closest('.ftr__bar, caption')) out.tiny.push(`${name(e)} ${s.fontSize} "${e.textContent.trim().slice(0, 30)}"`);
    }
    if (mob && e.matches('a, button, select, input:not([type=checkbox]):not([type=radio]):not(.hp), summary, label:has(> input[type=radio])') && !e.closest('.crumbs, .enquiry__note, p, .faq__a, .plan__notes, .terms, .prose')) {
      if ((r.width < 24 || r.height < 24) && r.top < document.documentElement.scrollHeight) out.tap.push(`${name(e)} ${Math.round(r.width)}×${Math.round(r.height)} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 25)}"`);
    }
    if (e.tagName === 'IMG' && e.naturalWidth && s.objectFit === 'fill') {
      const ra = r.width / r.height, na = e.naturalWidth / e.naturalHeight;
      if (Math.abs(ra - na) / na > 0.04) out.stretch.push(`${name(e)} ${e.currentSrc.split('/').pop()} drawn ${ra.toFixed(2)} vs file ${na.toFixed(2)}`);
    }
  }
  for (const k of ['offender', 'clipped', 'tiny', 'tap', 'stretch']) out[k] = [...new Set(out[k])];
  return out;
}
"""

report = {}
with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge', headless=True)
    for w in WIDTHS:
        mob = w < 1024
        ctx = b.new_context(viewport={'width': w, 'height': 900 if w >= 768 else 820}, is_mobile=w < 768, has_touch=w < 1024, device_scale_factor=1)
        for path in PAGES:
            pg = ctx.new_page()
            pg.goto(BASE + path, wait_until='load'); pg.wait_for_timeout(400)
            pg.add_style_tag(content='*{content-visibility:visible!important;animation-duration:0s!important;transition-duration:0s!important}')
            pg.evaluate("document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-in')); document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
            pg.wait_for_timeout(700)
            r = pg.evaluate(JS, mob)
            report[f'{path} @{w}'] = r
            if SHOTS and w in SHOT_W:
                os.makedirs(SHOTS, exist_ok=True)
                pg.screenshot(path=os.path.join(SHOTS, f"{(path.strip('/').replace('/', '_').replace('.html', '') or 'home')}_{w}.png"), full_page=True)
            pg.close()
        ctx.close()
    b.close()

totals = {k: 0 for k in ['overflow', 'offender', 'clipped', 'tiny', 'tap', 'stretch']}
for key, r in report.items():
    issues = {k: (r[k] if k != 'overflow' else ([True] if r[k] else [])) for k in totals}
    n = sum(len(v) for v in issues.values())
    for k in totals: totals[k] += len(issues[k])
    if n:
        print(f'\n## {key}')
        for k, v in issues.items():
            for x in v[:8]: print(f'  {k:8} {x}')
            if len(v) > 8: print(f'  {k:8} … +{len(v) - 8} more')
print('\nTOTALS', totals, f'({len(PAGES)} pages × {len(WIDTHS)} widths = {len(report)} views)')
json.dump(report, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'responsive-results.json'), 'w'), indent=1)
sys.exit(1 if any(totals.values()) else 0)
