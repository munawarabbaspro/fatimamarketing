"""Real society photos, people portraits and 1080p hero loops, taken from Fatima Marketing's OWN YouTube videos.
Every still is cropped to remove the channel's tickers/logos (ticker bands, then a centred 16:9 window that
leaves the corner logos out). No upscaling: native 1080p pixels, and the sharpest
frame within ±0.4 s of the chosen moment. Saved as WebP (up to 1920 wide + 800). Key-point portraits
are 4:5 crops around a focus point (or a detected face). Hero loops: 1080p CRF 20 + a 1280 mobile version.
Run from repo root:  python website/tools/build_society_media.py [stills|portraits|hero|all] [name ...]
Needs: pip install yt-dlp imageio-ffmpeg pillow  (opencv-python-headless<5 only for face-centred crops)
"""
import os, sys, subprocess, json
from concurrent.futures import ThreadPoolExecutor
import yt_dlp
from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageStat

FF = os.environ.get('FFMPEG') or __import__('imageio_ffmpeg').get_ffmpeg_exe()
ROOT = os.getcwd()
OUT = os.path.join(ROOT, 'website/src/static/assets/society')
VID = os.path.join(ROOT, 'website/src/static/assets/video')
TMP = os.path.join(ROOT, 'website/tools/_media_tmp')
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)

# name: (youtube id, second, crop box as fractions (left, top, right, bottom))
C = (0.0, 0.14, 1.0, 0.86)          # default: drop top logo strip + bottom ticker
CAP = (0.0, 0.13, 1.0, 0.79)        # frames with a caption line near the bottom
BORDER = (0.025, 0.10, 0.975, 0.86) # frames with a yellow border
LOW = (0.0, 0.14, 1.0, 0.80)        # frames with a phone chip near the bottom
T = (0.0, 0.19, 1.0, 0.88)          # larger logo in the top corner
STILLS = {
    # Mumtaz City (drone view + Jhelum block)
    'mumtaz-city-1': ('SmxT7aHchFI', 403, T), 'mumtaz-city-2': ('SmxT7aHchFI', 146, T),
    'mumtaz-city-3': ('SmxT7aHchFI', 339, T), 'mumtaz-city-4': ('SmxT7aHchFI', 18, T),
    # Capital Smart City (development progress)
    'capital-smart-city-1': ('42svBBAaCHI', 54, CAP), 'capital-smart-city-2': ('42svBBAaCHI', 83, CAP),
    'capital-smart-city-3': ('42svBBAaCHI', 40, CAP), 'capital-smart-city-4': ('7wu-zwemdhc', 25, CAP),
    # Top City-1
    'top-city-1-1': ('NAdEO9cpo9A', 38, BORDER), 'top-city-1-2': ('NAdEO9cpo9A', 45, BORDER),
    'top-city-1-3': ('UDAqThgpoEI', 25, T), 'top-city-1-4': ('UDAqThgpoEI', 171, T),
    # Gandhara City
    'gandhara-city-1': ('qEgCEVpTqMM', 132, T), 'gandhara-city-2': ('qEgCEVpTqMM', 101, T),
    'gandhara-city-3': ('qEgCEVpTqMM', 116, T), 'gandhara-city-4': ('Hv9Q_igcp-M', 123, (0.0, 0.08, 1.0, 0.92)),
    # PECHS
    'pechs-islamabad-1': ('kLc1sFKDuzw', 104, LOW), 'pechs-islamabad-2': ('kLc1sFKDuzw', 7, LOW),
    'pechs-islamabad-3': ('kLc1sFKDuzw', 187, C), 'pechs-islamabad-4': ('WaeXrbisdNY', 52, LOW),
    # Airport Green Garden
    'airport-green-garden-1': ('BMoVvPLnMwo', 77, (0.0, 0.10, 0.88, 0.78)), 'airport-green-garden-2': ('BMoVvPLnMwo', 18, (0.0, 0.08, 1.0, 0.85)),
    'airport-green-garden-3': ('BMoVvPLnMwo', 147, (0.0, 0.08, 1.0, 0.85)), 'airport-green-garden-4': ('Wy3X8OvwMFc', 11, C),
    # Kingdom Valley
    'kingdom-valley-1': ('5AViGuA5SOQ', 5, (0.0, 0.15, 1.0, 0.84)), 'kingdom-valley-2': ('gKPLt7zOamw', 126, C),
    'kingdom-valley-3': ('gKPLt7zOamw', 115, LOW),
    # Faisal Town
    'faisal-town-1': ('aEFAsGMfRtw', 12, CAP), 'faisal-town-2': ('aEFAsGMfRtw', 46, CAP),
    'faisal-town-3': ('aEFAsGMfRtw', 39, CAP), 'faisal-town-4': ('jsa_XQ541h4', 65, BORDER),
    # Faisal Hills
    'faisal-hills-1': ('nT_MnXdVkLI', 143, BORDER), 'faisal-hills-2': ('hGcIYvLic9M', 243, BORDER),
    # Park View City
    'park-view-city-1': ('6fxBJU9we0M', 147, T), 'park-view-city-2': ('6fxBJU9we0M', 115, C),
    'park-view-city-3': ('6fxBJU9we0M', 310, C), 'park-view-city-4': ('6fxBJU9we0M', 83, T),
    # Blue World City
    'blue-world-city-1': ('1RX50ATLSfs', 54, BORDER), 'blue-world-city-2': ('1RX50ATLSfs', 64, BORDER),
    'blue-world-city-3': ('1RX50ATLSfs', 82, BORDER), 'blue-world-city-4': ('ZYlmNakimhk', 2, (0.0, 0.10, 1.0, 0.74)),
    # Multi Gardens B-17 (drive through Sector B-17)
    'multi-gardens-b17-1': ('LVxpv-XTea4', 127, T), 'multi-gardens-b17-2': ('LVxpv-XTea4', 311, T),
    'multi-gardens-b17-3': ('LVxpv-XTea4', 104, T),
    # Taj Residencia
    'taj-residencia-1': ('MJEI5pMTjwE', 20, (0.0, 0.19, 1.0, 0.83)), 'taj-residencia-2': ('MJEI5pMTjwE', 16, T),
    'taj-residencia-3': ('MJEI5pMTjwE', 27, C), 'taj-residencia-4': ('MJEI5pMTjwE', 30, C),
    # The Pearl, Mumtaz City (1080p upload of the official render)
    'pearl-1': ('_YIQRRaqIq8', 6.5, (0.0, 0.17, 1.0, 1.0)), 'pearl-2': ('_YIQRRaqIq8', 9.5, (0.0, 0.17, 1.0, 1.0)),
    # Highlights + office + trust
    'hl-motorway': ('NAdEO9cpo9A', 38, BORDER), 'hl-school': ('42svBBAaCHI', 83, CAP),
    'hl-mall': ('MJEI5pMTjwE', 5, C), 'hl-hospital': ('jsa_XQ541h4', 89, BORDER),
    'team-site-visit': ('Y3byZtHBwqE', 41, (0.0, 0.135, 1.0, 0.72)), 'team-taj': ('IQHajpruFj4', 14, (0.0, 0.18, 1.0, 0.86)),
    'office-studio': ('NAdEO9cpo9A', 17, (0.025, 0.10, 0.975, 0.80)), 'office-desk': ('qEgCEVpTqMM', 55, (0.0, 0.215, 1.0, 0.86)),
}
# hero loops: name -> (youtube id, start, seconds, crop)
HERO = {
    'hero-mumtaz': ('SmxT7aHchFI', 392, 9, (0.0, 0.20, 1.0, 0.86)),
    'hero-csc': ('42svBBAaCHI', 52, 6, (0.03, 0.18, 0.97, 0.79)),
    'hero-kingdom': ('gKPLt7zOamw', 112, 9, LOW),
    'hero-bwc': ('1RX50ATLSfs', 50, 8, BORDER),
}


# ---- people & key-point portraits (4:5), cropped around a face or a focus x ----
# name: (youtube id, second, safe box (no logos/tickers), 'face' | focus-x fraction)
PORTRAITS = {
    # Key points: each photo shows exactly what the point promises
    'kp-approved': ('uNWSTJro_tM', 36.9, (0.0, 0.0, 1.0, 0.89), 0.42),        # PECHS Islamabad main gate
    'kp-installments': ('HLFlTCXRPW4', 284.4, (0.0, 0.12, 1.0, 0.90), 0.6),   # finished villas, Blue World City
    'kp-site-visits': ('Y3byZtHBwqE', 44.1, (0.0, 0.10, 1.0, 0.74), 0.5),    # buyers on a Faisal Town site visit
    'kp-paperwork': ('Eg69fjWiTtg', 10.4, (0.0, 0.12, 1.0, 1.0), 0.53),       # open balloting, Park View City
}
# portraits from local photos: name -> (file in tools/src-assets, crop box as fractions)
LOCAL_PORTRAITS = {
    # "Islamabad International Airport 2022", Pr0pulsion 123, Wikimedia Commons, CC0: framed on the lit sign
    'kp-overseas': ('isb-airport-2022.jpg', (0.437, 0.0, 0.957, 0.8655)),
}
# wide page-hero stills (kept at native 1080p width)
STILLS.update({
    'hero-about': ('Y3byZtHBwqE', 75.7, (0.0, 0.135, 1.0, 0.88)),      # Fatima Marketing site visit
    'hero-plans': ('BFXzWp4ax8g', 62.5, (0.006, 0.16, 0.985, 0.86)),      # Capital Smart City aerial
    'team-training': ('cQIPSbpFQGk', 590.5, (0.0, 0.16, 1.0, 0.88)),  # team training session
    'fa-office': ('03xNB3_qwBw', 28.0, (0.0, 0.10, 1.0, 0.72)),      # Fatima Associates office & signboard
})

_urls = {}
def stream(vid):
    if vid not in _urls:
        with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True, 'format': '137/270/299/312/bestvideo[height<=1080][ext=mp4]/bestvideo[height<=1080]'}) as y:
            _urls[vid] = y.extract_info(f'https://www.youtube.com/watch?v={vid}', download=False)['url']
    return _urls[vid]

def frame(vid, t, tag):
    raw = os.path.join(TMP, f'{tag}_{t:.2f}.png')
    if not os.path.exists(raw):
        subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{max(t, 0):.2f}', '-i', stream(vid), '-frames:v', '1', raw], timeout=300, check=True)
    return Image.open(raw).convert('RGB')

def edge(im):
    g = im.convert('L'); g.thumbnail((960, 960))
    return ImageStat.Stat(g.filter(ImageFilter.FIND_EDGES)).var[0]

def sharpest(name, vid, t, box):
    """Least motion-blurred frame within ±0.4 s of t, judged inside the crop box."""
    best = None; ref = None
    for dt in (0, -0.4, -0.2, 0.2, 0.4):
        im = frame(vid, t + dt, name); W, H = im.size; l, tp, r, b = box
        c = im.crop((int(W * l), int(H * tp), int(W * r), int(H * b)))
        thumb = c.convert('L').resize((64, 36))
        if ref is None: ref = thumb
        # same shot only: skip candidates across a cut (big change against the chosen moment)
        elif sum(ImageStat.Stat(ImageChops.difference(ref, thumb)).mean) > 18: continue
        s = edge(c)
        if not best or s > best[0]: best = (s, c, t + dt)
    return best[1], best[2]

def save(im, name, big=1920, small=800):
    im = ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(1.05)).enhance(1.03)
    for width, q in [(big, 84), (small, 80)]:
        x = im.copy()
        if x.width > width: x = x.resize((width, round(x.height * width / x.width)), Image.LANCZOS)
        x = x.filter(ImageFilter.UnsharpMask(radius=1.1, percent=45 if width == small else 35, threshold=2))
        x.save(os.path.join(OUT, f'{name}{"" if width == big else "-" + str(small)}.webp'), 'WEBP', quality=q, method=6)

# Stills are trimmed to a centred 16:9 window: the channel logo and the developers' logos sit in the frame corners,
# outside that window. A few logos reach further in, so those frames lose a little more from the top (or shift).
KEEP_WIDE = {'hero-about', 'hero-plans', 'team-taj', 'team-site-visit', 'office-desk', 'office-studio'}
EXTRA = {  # name: (top trim fraction, horizontal shift of the 16:9 window as a fraction of width)
    'capital-smart-city-1': (0.045, 0), 'capital-smart-city-2': (0.045, 0), 'capital-smart-city-3': (0.045, 0), 'hl-school': (0.045, 0),
    'faisal-town-1': (0.045, 0), 'faisal-town-2': (0.045, 0), 'faisal-town-3': (0.045, 0),
    'park-view-city-1': (0.07, 0), 'park-view-city-2': (0.11, 0), 'park-view-city-3': (0.07, 0), 'park-view-city-4': (0.07, 0),
    'blue-world-city-4': (0.10, 0), 'faisal-town-4': (0.10, 0), 'hl-hospital': (0.10, 0), 'fa-office': (0.06, 0),
    'team-training': (0.03, 0), 'airport-green-garden-1': (0.025, -0.04), 'airport-green-garden-3': (0, 0.01),
    'gandhara-city-4': (0.08, 0), 'hl-mall': (0.07, 0), 'taj-residencia-3': (0.07, 0), 'taj-residencia-4': (0.07, 0), 'faisal-hills-2': (0, -0.02),
}

def frame16x9(im, name):
    if name in KEEP_WIDE: return im
    W, H = im.size; top, shift = EXTRA.get(name, (0, 0)); t = round(H * top); h = H - t
    tw = min(W, round(h * 16 / 9)); l = min(max(0, (W - tw) // 2 + round(W * shift)), W - tw)
    return im.crop((l, t, l + tw, t + min(h, round(tw * 9 / 16))))

def still(item):
    name, (vid, t, box) = item
    im, used = sharpest(name, vid, t, box)
    im = frame16x9(im, name)
    save(im, name)
    return name, im.size, round(used, 2)

def portrait(item):
    name, (vid, t, box, focus) = item
    im, used = sharpest(name, vid, t, box)
    W, H = im.size; ch = H; cw = round(ch * 4 / 5)
    if focus == 'face':
        import cv2, numpy as np  # pip install "opencv-python-headless<5"
        g = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2GRAY)
        f = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml').detectMultiScale(g, 1.1, 6, minSize=(60, 60))
        x, y, w, h = sorted(f, key=lambda r: -r[2] * r[3])[0]
        cx = x + w / 2
        # head and shoulders: face centre ~32% from the top, frame about 3.4 face widths wide
        cw = min(cw, max(round(w * 3.4), 420)); ch = round(cw * 5 / 4)
        top = min(max(0, round(y + h / 2 - ch * 0.32)), H - ch)
    else:
        cx = W * focus; top = 0
    left = min(max(0, round(cx - cw / 2)), W - cw)
    im = im.crop((left, top, left + cw, top + ch))
    save(im, name, big=960, small=480)
    return name, im.size, round(used, 2)

def hero(item):
    name, (vid, ss, dur, (l, tp, r, b)) = item
    crop = f'crop=trunc(iw*{r - l:.3f}/2)*2:trunc(ih*{b - tp:.3f}/2)*2:iw*{l:.3f}:ih*{tp:.3f}'
    base = f'{crop},fps=25,eq=saturation=1.05'
    # desktop: native 1080p crop (never upscaled); mobile: 1280 wide. Bitrate capped near YouTube's own 1080p source
    # (more bits than the source carries adds weight, not detail).
    for suffix, width, crf, cap, buf in [('', 1920, 20, '5M', '10M'), ('-m', 1280, 23, '2500k', '5M')]:
        vf = f"{base},scale=w='min({width},iw)':h=-2:flags=lanczos,unsharp=5:5:0.4:5:5:0"
        subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(ss), '-t', str(dur), '-i', stream(vid), '-vf', vf,
                        '-an', '-c:v', 'libx264', '-preset', 'slow', '-tune', 'film', '-crf', str(crf), '-maxrate', cap, '-bufsize', buf,
                        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(VID, f'{name}{suffix}.mp4')], timeout=900, check=True)
    poster = os.path.join(TMP, name + '-poster.png')
    subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-i', os.path.join(VID, name + '.mp4'), '-ss', '0.3', '-frames:v', '1', poster], check=True)
    p = Image.open(poster).convert('RGB'); IMG = os.path.join(ROOT, 'website/src/static/assets/img'); W, H = p.size
    # desktop poster: full wide frame (native 1920 + 800)
    for width, q, sfx in [(1920, 80, ''), (800, 76, '-800')]:
        x = p if width >= W else p.resize((width, round(H * width / W)), Image.LANCZOS)
        x.save(os.path.join(IMG, name + sfx + '.webp'), 'WEBP', quality=q, method=6)
    # phones/tablets: centre 16:9 crop, so the stacked hero panel is never upscaled
    cw = min(W, round(H * 16 / 9)); l = (W - cw) // 2; c = p.crop((l, 0, l + cw, round(cw * 9 / 16)))
    for width, q in [(1200, 78), (800, 76)]:
        x = c.resize((width, round(width * 9 / 16)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1, percent=30, threshold=2))
        x.save(os.path.join(IMG, f'{name}-m-{width}.webp'), 'WEBP', quality=q, method=6)
    return name, os.path.getsize(os.path.join(VID, name + '.mp4')) // 1024

mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
only = sys.argv[2:]
if mode in ('stills', 'all'):
    items = [i for i in STILLS.items() if not only or i[0] in only]
    for vid in {v[0] for _, v in items}: stream(vid)
    with ThreadPoolExecutor(6) as ex:
        for n, s, t in ex.map(still, items): print('still', n, s, t)
if mode in ('portraits', 'all'):
    items = [i for i in PORTRAITS.items() if not only or i[0] in only]
    for vid in {v[0] for _, v in items}: stream(vid)
    with ThreadPoolExecutor(4) as ex:
        for n, s, t in ex.map(portrait, items): print('portrait', n, s, t)
    for name, (f, (l, tp, r, b)) in LOCAL_PORTRAITS.items():
        if only and name not in only: continue
        im = Image.open(os.path.join(ROOT, 'website/tools/src-assets', f)).convert('RGB'); W, H = im.size
        im = im.crop((round(W * l), round(H * tp), round(W * r), round(H * b))); save(im, name, big=960, small=480)
        print('portrait', name, im.size, f)
if mode in ('hero', 'all'):
    items = [i for i in HERO.items() if not only or i[0] in only]
    with ThreadPoolExecutor(2) as ex:
        for n, kb in ex.map(hero, items): print('hero', n, kb, 'KB')
