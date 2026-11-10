"""Functional UAT for the Fatima Marketing site (customer journeys). Run with the dev server on :4173.
   python tools/uat/uat.py  -> prints PASS/FAIL per check and writes tools/uat/uat-results.json"""
import json, re, sys, urllib.parse, os
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://localhost:4173')
results = []


def check(name, ok, detail=''):
    results.append({'check': name, 'pass': bool(ok), 'detail': detail})
    print(('PASS ' if ok else 'FAIL ') + name + (f' | {detail}' if detail else ''))


JS_ON_VIDEO = "(()=>{const v=document.querySelector('.hero__vid.is-on');return {src:v.currentSrc, paused:v.paused}})()"

with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge', headless=True)
    # ---------- Desktop journeys ----------
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page()
    popups = []
    ctx.on('page', lambda np: popups.append(np))
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/', wait_until='load')
    pg.wait_for_timeout(1200)

    # J1 header + dropdown
    check('Logo links home', pg.locator('a.brand').get_attribute('href') == '/')
    pg.click('[data-dd]'); pg.wait_for_timeout(300)
    check('Projects dropdown opens', 'is-open' in pg.locator('.has-dd').get_attribute('class'))
    n = pg.locator('#dd-projects .dd__grid a').count()
    check('Dropdown lists all 14 projects', n == 14, f'{n} links')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    check('Dropdown closes on Escape', 'is-open' not in pg.locator('.has-dd').get_attribute('class'))

    # J2 hero video slider
    v0 = pg.evaluate(JS_ON_VIDEO)
    check('Hero 1080p aerial 1 playing (Mumtaz City)', v0['src'].split('?')[0].endswith('hero-mumtaz.mp4') and not v0['paused'], str(v0))
    pg.click('[data-go="1"]'); pg.wait_for_timeout(1500)
    v1 = pg.evaluate(JS_ON_VIDEO)
    check('Hero tab switches to Capital Smart City video', v1['src'].split('?')[0].endswith('hero-csc.mp4') and not v1['paused'], str(v1))
    check('Hero slide text switches', pg.locator('.hslide.is-on .hslide__name').inner_text() == 'Capital Smart City')
    check('Only one hero slide visible', pg.locator('.hslide:visible').count() == 1)
    pg.click('.hslide.is-on [data-yt-modal]'); pg.wait_for_timeout(2000)
    ytm = pg.evaluate("(()=>{const d=document.getElementById('media-modal');const f=d.querySelector('iframe');return {open:d.open, src:f&&f.src}})()")
    check('Hero Watch tour opens YouTube tour in modal', ytm['open'] and 'youtube-nocookie.com/embed/42svBBAaCHI' in (ytm['src'] or ''), str(ytm))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.locator('#towers .tcard').nth(1).locator('[data-video]').click(); pg.wait_for_timeout(2500)
    mv = pg.evaluate("(()=>{const d=document.getElementById('media-modal');const v=d.querySelector('video');return {open:d.open, src:v&&v.currentSrc, t:v&&v.currentTime}})()")
    check('Watch video opens modal and plays full film', mv['open'] and mv['src'].split('?')[0].endswith('sofia-sapphire-film.mp4') and (mv['t'] or 0) > 0, str(mv))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('Media modal closes on Escape', not pg.evaluate("document.getElementById('media-modal').open"))

    # J3 hero "Payment plan" -> enquiry modal prefilled
    pg.locator('#towers .tcard').nth(1).locator('[data-enquire]').click(); pg.wait_for_timeout(400)
    st = pg.evaluate("(()=>{const d=document.getElementById('enquire-modal');const f=d.querySelector('form');return {open:d.open, project:f.project.value, interest:f.interest.value, focus:document.activeElement.name}})()")
    check('Payment plan button opens prefilled enquiry', st['open'] and st['project'] == 'Sofia Sapphire (Mumtaz City)' and st['interest'] == 'Latest payment plan', str(st))
    check('Name field focused for fast entry', st['focus'] == 'name')

    # J4 validation
    m = pg.locator('#enquire-modal form')
    m.locator('button[type=submit]').click(); pg.wait_for_timeout(200)
    e1 = m.locator('.fld-error').inner_text()
    check('Empty submit shows clear error', 'your name' in e1 and 'phone' in e1, e1)
    m.locator('[name=name]').fill('Ahmed Raza'); m.locator('[name=phone]').fill('12345')
    m.locator('button[type=submit]').click(); pg.wait_for_timeout(200)
    check('Invalid phone rejected', 'phone' in m.locator('.fld-error').inner_text())
    m.locator('[name=phone]').fill('0300 1234567'); m.locator('[name=email]').fill('bad@')
    m.locator('button[type=submit]').click(); pg.wait_for_timeout(200)
    check('Invalid email rejected', 'email' in m.locator('.fld-error').inner_text())

    # J5 valid submit -> WhatsApp with formatted message
    m.locator('[name=email]').fill('ahmed@example.com'); m.locator('[name=city]').fill('Dubai, UAE')
    m.locator('[name=size]').fill('2 Bed apartment')
    m.locator('input[name=payment][value="Cash / lump sum"]').check()
    m.locator('[name=message]').fill('Please share floor plan.')
    before = len(popups)
    m.locator('button[type=submit]').click(); pg.wait_for_timeout(2500)
    url = popups[-1].url if len(popups) > before else ''
    check('Submit opens WhatsApp in new tab', len(popups) > before, url[:90])
    href = m.locator('[data-wa-retry]').get_attribute('href')
    text = urllib.parse.unquote(href.split('text=')[1]) if 'text=' in href else ''
    exp = ['*Project:* Sofia Sapphire (Mumtaz City)', '*Interested in:* Latest payment plan', '*Size / budget:* 2 Bed apartment',
           '*Payment:* Cash / lump sum', '*Name:* Ahmed Raza', '*Phone:* 0300-1234567', '*Email:* ahmed@example.com',
           '*City / country:* Dubai, UAE', '*Message:* Please share floor plan.', 'Ref: FM-']
    missing = [e for e in exp if e not in text]
    check('WhatsApp message carries every field correctly', not missing and href.startswith('https://wa.me/923357777901'), 'missing=' + str(missing))
    print('----- WhatsApp message sample -----\n' + text + '\n-----------------------------------')
    ref = m.locator('[data-ref]').inner_text()
    check('Success panel with reference shown', m.locator('.enquiry__done').is_visible() and re.match(r'FM-\d{6}-\d{4}', ref) is not None, ref)
    for pp in popups:
        pp.close()
    popups.clear()
    pg.keyboard.press('Escape')

    # J6 international number accepted
    pg.goto(BASE + '/contact/', wait_until='load')
    f = pg.locator('main form[data-enquiry]').first
    f.locator('[name=name]').fill('Sana Malik'); f.locator('[name=phone]').fill('+971 50 123 4567')
    f.locator('button[type=submit]').click(); pg.wait_for_timeout(1500)
    href = urllib.parse.unquote(f.locator('[data-wa-retry]').get_attribute('href') or '')
    check('Overseas (+971) number accepted & normalised', '*Phone:* +971501234567' in href, href[href.find('*Phone'):href.find('*Phone') + 30])
    # contact team section: leadership as text cards (name, title, description; no photos)
    tm = pg.evaluate("""(()=>{const c=[...document.querySelectorAll('.leader')];return {cards:c.length,
      complete:c.every(l=>l.querySelector('strong').textContent&&l.querySelector('small').textContent&&l.querySelector('p').textContent.length>20),
      imgs:document.querySelectorAll('.leader img').length}})()""")
    check('Contact: 5 leadership text cards, no photos', tm['cards'] == 5 and tm['complete'] and tm['imgs'] == 0, str(tm))
    for pp in popups:
        pp.close()
    popups.clear()

    # J7 project page: preselected project, plans, lightbox, YouTube facade, map
    pg.goto(BASE + '/projects/capital-smart-city/', wait_until='load'); pg.wait_for_timeout(800)
    check('Project form preselects project', pg.locator('#enquire form [name=project]').input_value() == 'Capital Smart City')
    check('One H1 on project page', pg.locator('h1').count() == 1, pg.locator('h1').first.inner_text())
    nplans = pg.locator('article.plan').count()
    check('CSC page shows all 13 payment plans', nplans == 13, str(nplans))
    pg.locator('.plan__img').first.click(); pg.wait_for_timeout(1000)
    lb = pg.evaluate("(()=>{const i=document.querySelector('#media-modal img');return i&&{src:i.src, w:i.naturalWidth}})()")
    check('Original plan opens in lightbox at full size', lb and lb['w'] >= 1000, str(lb))
    pg.keyboard.press('Escape')
    pg.locator('#videos').scroll_into_view_if_needed(); pg.wait_for_timeout(1500)
    thumbs_ok = pg.evaluate("[...document.querySelectorAll('#videos .vcard__btn img')].every(i=>i.complete&&i.naturalWidth>0)")
    check('Video posters (clean frames) load', thumbs_ok)
    pg.locator('#videos [data-yt]').first.click(); pg.wait_for_timeout(1200)
    src = pg.evaluate("document.querySelector('#videos iframe') && document.querySelector('#videos iframe').src")
    check('YouTube facade swaps to privacy-enhanced player', bool(src) and 'youtube-nocookie.com/embed/42svBBAaCHI' in src, str(src))
    pg.locator('#location .map').scroll_into_view_if_needed(); pg.wait_for_timeout(5000)
    fr = [x.url for x in pg.frames if 'google.com/maps' in x.url]
    check('Location map loads (Google Maps frame)', len(fr) >= 1, fr[0][:80] if fr else '')
    dir_href = pg.locator('#location .map__btn').get_attribute('href')
    check('Get directions points to project pin', 'destination=33.4407844' in dir_href, dir_href)

    # J7b in-page tabs land below the sticky header and highlight
    pg.evaluate('scrollTo(0,0)'); pg.wait_for_timeout(300)
    pg.click('.subnav a[href="#faq"]'); pg.wait_for_timeout(2200)
    top = pg.evaluate("Math.round(document.getElementById('faq').getBoundingClientRect().top)")
    act = pg.evaluate("(document.querySelector('.subnav a.is-active')||{}).hash")
    check('Project tab "FAQ" scrolls to section and highlights', 100 <= top <= 170 and act == '#faq', f'top={top} active={act}')
    # J8 Mumtaz City towers + unit videos + gallery
    pg.goto(BASE + '/projects/mumtaz-city/', wait_until='load')
    check('Mumtaz City shows The Pearl / Sofia / ICON', pg.locator('article.tower').count() == 3)
    pg.locator('#sofia-sapphire .units [data-video]').nth(1).click(); pg.wait_for_timeout(2000)
    mv = pg.evaluate("(()=>{const v=document.querySelector('#media-modal video');return v&&{src:v.currentSrc,t:v.currentTime}})()")
    check('2-Bed walkthrough video plays', mv and mv['src'].split('?')[0].endswith('sofia-sapphire-2-bed.mp4') and mv['t'] > 0, str(mv))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.locator('#sofia-sapphire .tower__gal button').first.click(); pg.wait_for_timeout(500)
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(400)
    cap = pg.locator('[data-media-cap]').inner_text()
    check('Gallery lightbox navigates with arrow keys', '(2 / 6' in cap, cap)
    pg.keyboard.press('Escape')

    # J8b available units: home tiles, Mumtaz City cards, filters, deep link, WhatsApp message, sheet lightbox
    pg.goto(BASE + '/', wait_until='load')
    tl = pg.evaluate("[...document.querySelectorAll('#units .utile')].map(a=>({href:a.getAttribute('href'), t:a.querySelector('.utile__type').textContent, p:a.querySelector('.utile__price').textContent}))")
    check('Home: 4 available-unit tiles with prices', len(tl) == 4 and all('Rs' in t['p'] for t in tl) and tl[0]['p'].endswith('80.3 Lac'), str(tl[:2]))
    pg.goto(BASE + '/projects/mumtaz-city/', wait_until='load'); pg.locator('#units').scroll_into_view_if_needed()
    vis = lambda: pg.evaluate("[...document.querySelectorAll('[data-filter-target=units]>li')].filter(l=>!l.classList.contains('is-out')).length")
    n_all = vis(); pg.click('[data-filter-group=units] [data-filter="studio"]'); pg.wait_for_timeout(200); n_studio = vis()
    pg.click('[data-filter-group=units] [data-filter="icon-viii"]'); pg.wait_for_timeout(200); n_icon = vis()
    check('Mumtaz City: 16 unit cards; Studio filter 6; ICON VIII filter 4', (n_all, n_studio, n_icon) == (16, 6, 4), str((n_all, n_studio, n_icon)))
    pg.goto(BASE + '/projects/mumtaz-city/?units=the-pearl-1-bed#units', wait_until='load'); pg.wait_for_timeout(400)
    deep = pg.evaluate("[...document.querySelectorAll('[data-filter-target=units]>li')].filter(l=>!l.classList.contains('is-out')).map(l=>l.querySelector('.ucard__t span').textContent)")
    check('Tile deep link filters to The Pearl 1 Bedroom units', sorted(deep) == ['Unit A-1315', 'Unit A-1335'], str(deep))
    wa = urllib.parse.unquote(pg.locator('[data-filter-target=units]>li:not(.is-out) .ucard a.btn--wa').first.get_attribute('href'))
    check('Book-this-unit WhatsApp message names the unit and price', 'unit A-13' in wa and 'Rs 16,280,890' in wa, wa[wa.find('text=') + 5:][:140])
    pg.locator('[data-filter-target=units]>li:not(.is-out) .ucard [data-lightbox]').first.click(); pg.wait_for_timeout(700)
    lb = pg.evaluate("(()=>{const i=document.querySelector('#media-modal img');return i&&{src:i.src.split('/').pop(), w:i.naturalWidth}})()")
    check('View sheet opens the developer sheet', lb and lb['src'].startswith('unit-') and lb['w'] > 700, str(lb))
    pg.keyboard.press('Escape')

    # J9 brand film plays
    pg.goto(BASE + '/', wait_until='load')
    pg.locator('#brand-film').scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    pg.evaluate("document.querySelector('#brand-film video').muted=true"); pg.click('#brand-film .player__start')
    pg.wait_for_timeout(2500)
    t = pg.evaluate("document.querySelector('#brand-film video').currentTime")
    check('Brand film plays in the branded player', t > 0.5, f'{t:.1f}s')
    # custom controls: bar mounted, native controls off, pause + seek work
    pc = pg.evaluate("""(()=>{const w=document.querySelector('#brand-film .player'),v=w.querySelector('video');
      w.querySelector('.pb--play').click(); const paused=v.paused;
      const r=w.querySelector('.player__track input'); r.value=500; r.dispatchEvent(new Event('input',{bubbles:true}));
      return {bar:!!w.querySelector('.player__bar'), native:v.controls, paused, t:v.currentTime, d:v.duration}})()""")
    check('Player: custom bar, pause and seek', pc['bar'] and not pc['native'] and pc['paused'] and abs(pc['t'] - pc['d'] / 2) < 3, str(pc))
    # key points + leadership use real photos
    kp = pg.evaluate("[...document.querySelectorAll('.kpc>img')].map(i=>i.complete&&i.naturalWidth>0?i.naturalWidth:0)")
    check('Key points: 5 photo cards', len(kp) == 5, str(kp))
    # filters
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(500)
    pg.locator('#societies').scroll_into_view_if_needed()
    pg.click('[data-filter="apartments"]'); pg.wait_for_timeout(300)
    vis = pg.evaluate("[...document.querySelectorAll('[data-filter-target=soc]>li')].filter(l=>!l.classList.contains('is-out')).map(l=>l.querySelector('strong').textContent)")
    check('Society filter: Apartments shows only matching societies', 0 < len(vis) < 14 and any('Mumtaz' in v for v in vis), str(vis))
    pg.click('[data-filter="all"]'); pg.wait_for_timeout(200)
    check('Society filter: All restores 14', pg.evaluate("[...document.querySelectorAll('[data-filter-target=soc]>li')].filter(l=>!l.classList.contains('is-out')).length") == 14)
    # featured player swap
    pg.locator('#development').scroll_into_view_if_needed(); pg.wait_for_timeout(500)
    pg.locator('.vrow').nth(1).click(); pg.wait_for_timeout(1500)
    fp = pg.evaluate("(()=>{const f=document.querySelector('.vplayer__btn iframe');return {src:f&&f.src,title:document.querySelector('[data-vp-title]').textContent}})()")
    check('Video list swaps the featured player (Kingdom Valley)', 'gKPLt7zOamw' in (fp['src'] or '') and 'Kingdom' in fp['title'], str(fp))
    # reviews + social
    pg.locator('#testimonials').scroll_into_view_if_needed(); pg.wait_for_timeout(600)
    n_rev = pg.locator('.marquee .rcard:not([aria-hidden])').count()
    rating = pg.locator('.rsum__score strong').text_content().strip()
    check('Real Google reviews shown (5) + rating 5.0', n_rev == 5 and rating == '5.0', f'{n_rev} reviews, rating {rating}')
    check('Social cards link to real profiles', pg.locator('.social__card--fb').get_attribute('href').endswith('fatimamarketingisb/') and 'youtube.com/@fatimamarketing' in pg.locator('.social__card--yt').get_attribute('href'))
    # plan size tabs on payment plans page
    pg.goto(BASE + '/payment-plans/', wait_until='load'); pg.wait_for_timeout(500)
    plan = pg.locator('#executive-block-residential')
    plan.scroll_into_view_if_needed(); plan.locator('[data-size-tab="4"]').click(); pg.wait_for_timeout(300)
    tot = plan.locator('[data-size-panel="4"] .calc__total strong').inner_text()
    check('Plan size tab shows exact split (Executive 1 Kanal = Rs 11,200,000)', tot.replace(chr(160), ' ') == 'Rs 11,200,000' and plan.locator('[data-size-panel="0"]').is_hidden(), tot)
    q = plan.locator('[data-size-panel="4"] .step').nth(2).inner_text()
    check('Installment line correct (12 × Rs 746,667)', '12' in q and '746,667' in q, q.replace(chr(10), ' '))
    check('No JS errors (desktop)', not errs, str(errs[:3]))
    ctx.close()

    # ---------- Mobile journeys ----------
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/', wait_until='load'); pg.wait_for_timeout(800)
    check('Mobile: bottom action bar visible', pg.locator('.mbar').is_visible())
    check('Mobile: call button dials UAN', pg.locator('.mbar a[href^="tel:"]').get_attribute('href') == 'tel:+923311111057')
    check('Mobile: menu hidden from keyboard when closed', pg.evaluate("getComputedStyle(document.querySelector('[data-nav]')).visibility") == 'hidden')
    pg.tap('[data-burger]'); pg.wait_for_timeout(500)
    check('Mobile: burger opens menu', pg.locator('[data-nav]').is_visible() and pg.locator('[data-burger]').get_attribute('aria-expanded') == 'true')
    pg.tap('[data-dd]'); pg.wait_for_timeout(300)
    check('Mobile: projects accordion lists 14', pg.locator('#dd-projects .dd__grid a:visible').count() == 14)
    with pg.expect_navigation(wait_until='load'):
        pg.locator('#dd-projects a[href="/projects/kingdom-valley/"]').tap()
    pg.wait_for_timeout(500)
    check('Mobile: navigates to Kingdom Valley page', pg.url.endswith('/projects/kingdom-valley/'))
    ow = pg.evaluate('document.documentElement.scrollWidth')
    check('Mobile: no horizontal scroll', ow <= 390, str(ow))
    pg.tap('.mbar button[data-enquire]'); pg.wait_for_timeout(400)
    check('Mobile: Enquire opens form modal', pg.evaluate("document.getElementById('enquire-modal').open"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    small = pg.evaluate("[...document.querySelectorAll('main a.btn, main button.btn, .mbar a, .mbar button')].filter(e=>e.offsetParent).filter(e=>e.getBoundingClientRect().height<44).map(e=>e.textContent.trim().slice(0,30))")
    check('Mobile: primary tap targets >= 44px', not small, str(small[:5]))
    check('No JS errors (mobile)', not errs, str(errs[:3]))
    ctx.close()
    b.close()

passed = sum(r['pass'] for r in results)
print(f'\n{passed}/{len(results)} checks passed')
json.dump(results, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uat-results.json'), 'w'), indent=1)
sys.exit(0 if passed == len(results) else 1)
