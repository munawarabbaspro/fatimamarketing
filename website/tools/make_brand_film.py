"""Generate the Fatima Marketing brand film (≈45 s, 1920x1080) from the client's own 1080p YouTube footage.

Text overlays are rendered with PIL (exact brand typography), composited over video
scenes with ffmpeg, joined with cross-fades, and scored with a synthesized ambient pad
(generated here, so it is royalty-free). Run from the repo root:
    python website/tools/make_brand_film.py
"""
import os, subprocess, shutil, math, wave, struct
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.getcwd()
FF = os.environ.get('FFMPEG') or r'C:\Users\user\AppData\Local\Programs\Python\Python312\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe'
T = os.path.join(ROOT, 'website/tools')
WORK = os.path.join(T, '_film_work'); os.makedirs(WORK, exist_ok=True)
OUT_DIR = os.path.join(ROOT, 'website/src/static/assets/video')
S = 1.5                      # layout below is designed on a 1280x720 grid and scaled by S
W, H, FPS = 1920, 1080, 30
z = lambda v: int(round(v * S))
YEL, INK, WHITE = (242, 222, 42), (14, 14, 16), (255, 255, 255)

def font(name, size, wght=None):
    f = ImageFont.truetype(os.path.join(T, 'fonts', name), z(size))
    if wght:
        try: f.set_variation_by_axes([wght])
        except Exception: pass
    return f
SERIF = lambda s: font('Marcellus-Regular.ttf', s)
SANS = lambda s, w=600: font('Manrope[wght].ttf', s, w)
LOGO_W = Image.open(os.path.join(T, 'src-assets/fm-logo-hd-white.png')).convert('RGBA')

def ff(*args):
    subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)

def canvas():
    return Image.new('RGBA', (W, H), (0, 0, 0, 0))

def lower_third(title, sub, kicker):
    im = canvas(); d = ImageDraw.Draw(im)
    # gradient scrim
    scrim = Image.new('L', (W, H), 0); sd = ImageDraw.Draw(scrim)
    for y in range(H // 2, H): sd.line([(0, y), (W, y)], fill=int(215 * ((y - H / 2) / (H / 2)) ** 1.4))
    im.paste((10, 10, 12, 255), (0, 0), scrim)
    d.rectangle((z(72), z(500), z(78), z(640)), fill=YEL)
    d.text((z(100), z(498)), kicker.upper(), font=SANS(22, 700), fill=YEL)
    d.text((z(98), z(528)), title, font=SERIF(60), fill=WHITE)
    d.text((z(100), z(606)), sub, font=SANS(26, 500), fill=(225, 225, 225))
    lg = LOGO_W.copy(); lg.thumbnail((z(210), z(80)), Image.LANCZOS); im.alpha_composite(lg, (W - lg.width - z(48), z(40)))
    return im

def title_card(lines, logo=True, logo_w=520, y0=None):
    im = canvas(); d = ImageDraw.Draw(im); y = z(y0 or 150)
    if logo:
        lg = LOGO_W.copy(); lg.thumbnail((z(logo_w), z(400)), Image.LANCZOS); im.alpha_composite(lg, ((W - lg.width) // 2, y)); y += lg.height + z(40)
    for text, f, col in lines:
        tw = d.textlength(text, font=f); d.text(((W - tw) / 2, y), text, font=f, fill=col); y += f.size + z(18)
    return im

def stats_card():
    im = canvas(); d = ImageDraw.Draw(im)
    head = 'Trusted across Islamabad & Rawalpindi'
    d.text(((W - d.textlength(head, font=SERIF(46))) / 2, z(120)), head, font=SERIF(46), fill=WHITE)
    stats = [('3000+', 'Global customers'), ('100+', 'Projects completed'), ('50+', 'Expert team'), ('17+', 'Years experience')]
    cw = z(270); x0 = (W - cw * 4 - z(30) * 3) // 2
    for i, (n, l) in enumerate(stats):
        x = x0 + i * (cw + z(30))
        d.rounded_rectangle((x, z(250), x + cw, z(470)), z(18), outline=(242, 222, 42, 160), width=z(2), fill=(255, 255, 255, 14))
        d.text((x + (cw - d.textlength(n, font=SERIF(62))) / 2, z(298)), n, font=SERIF(62), fill=YEL)
        d.text((x + (cw - d.textlength(l, font=SANS(24, 600))) / 2, z(400)), l, font=SANS(24, 600), fill=WHITE)
    s = 'Facebook 11K+ followers  ·  YouTube 4.3K+ subscribers  ·  1,200+ project videos'
    d.text(((W - d.textlength(s, font=SANS(24, 600))) / 2, z(540)), s, font=SANS(24, 600), fill=(210, 210, 210))
    return im

def projects_card():
    im = canvas(); d = ImageDraw.Draw(im)
    head = 'Projects we deal in'
    d.text(((W - d.textlength(head, font=SERIF(52))) / 2, z(70)), head, font=SERIF(52), fill=WHITE)
    names = ['Capital Smart City', 'Mumtaz City', 'Top City-1', 'Kingdom Valley', 'Blue World City', 'Park View City',
             'Faisal Town', 'Faisal Hills', 'Airport Green Garden', 'PECHS Islamabad', 'Gandhara City', 'Taj Residencia',
             'Multi Gardens B-17', 'D-17 Islamabad']
    f = SANS(27, 650); cols = 2; colw = z(470); x0 = (W - colw * cols - z(60)) // 2
    for i, n in enumerate(names):
        c, r = i % cols, i // cols; x = x0 + c * (colw + z(60)); y = z(175 + r * 64)
        d.ellipse((x, y + z(12), x + z(12), y + z(24)), fill=YEL); d.text((x + z(28), y), n, font=f, fill=WHITE)
        d.line((x + z(28), y + z(50), x + colw, y + z(50)), fill=(255, 255, 255, 40), width=z(1))
    return im

def cta_card():
    return title_card([
        ('Book a free site visit today', SERIF(54), WHITE),
        ('UAN 0331-1111057   ·   WhatsApp 0335-7777901', SANS(34, 750), YEL),
        ('Office 111, 1st Floor, Capital Business Center, F-10 Markaz, Islamabad', SANS(24, 500), (220, 220, 220)),
    ], logo_w=430, y0=95)

def save(im, name):
    p = os.path.join(WORK, name + '.png'); im.save(p); return p

# ---------- scenes ----------
SRC = ROOT
scenes = []  # (name, duration)

def yt(vid):
    """1080p stream of one of the client's own YouTube uploads."""
    import yt_dlp
    with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True, 'format': '137/270/299/312/bestvideo[height<=1080]'}) as y:
        return y.extract_info(f'https://www.youtube.com/watch?v={vid}', download=False)['url']

def box(l, t, r, b):
    """Crop away the channel's logo strip / ticker (fractions of the frame)."""
    return f'crop=trunc(iw*{r - l:.3f}/2)*2:trunc(ih*{b - t:.3f}/2)*2:iw*{l:.3f}:ih*{t:.3f},'

def scene_video(name, src, ss, dur, crop, overlay_png):
    """Video background, gentle push-in, darkened, overlay fades in."""
    vf = (f"[0:v]{crop}scale={int(W*1.08)}:{int(H*1.08)}:force_original_aspect_ratio=increase,"
          f"crop={W}:{H}:'(iw-{W})/2+ (iw-{W})/2*sin(t/{dur}*1.2)*0.4':'(ih-{H})/2',"
          f"eq=brightness=-0.04:saturation=1.05,fps={FPS},setsar=1[bg];"
          f"[1:v]format=rgba,fade=t=in:st=0.5:d=0.7:alpha=1[ov];[bg][ov]overlay=0:0,format=yuv420p")
    ff('-ss', str(ss), '-t', str(dur), '-i', src if src.startswith('http') else os.path.join(SRC, src), '-loop', '1', '-t', str(dur), '-i', overlay_png,
       '-filter_complex', vf, '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', str(FPS), os.path.join(WORK, name + '.mp4'))
    scenes.append((name, dur))

def scene_card(name, overlay_png, dur, bg_still=None):
    """Brand background (blurred still or ink gradient), overlay fades in, slow zoom."""
    bgp = os.path.join(WORK, name + '_bg.png')
    if bg_still:
        b = Image.open(bg_still).convert('RGB').resize((W, H)).filter(ImageFilter.GaussianBlur(10))
        b = Image.blend(b, Image.new('RGB', (W, H), INK), 0.78)
    else:
        b = Image.new('RGB', (W, H), INK); dr = ImageDraw.Draw(b)
        for r in range(520, 0, -8):
            a = int(26 * (1 - r / 520)); dr.ellipse((W * 0.78 - r, -r * 0.6, W * 0.78 + r, r * 1.4), fill=(14 + a, 14 + a, 16))
    b.save(bgp)
    vf = (f"[0:v]scale={W*2}:{H*2},zoompan=z='1+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={dur*FPS}:s={W}x{H}:fps={FPS}[bg];"
          f"[1:v]format=rgba,fade=t=in:st=0.3:d=0.8:alpha=1[ov];[bg][ov]overlay=0:0,format=yuv420p")
    ff('-loop', '1', '-t', str(dur), '-i', bgp, '-loop', '1', '-t', str(dur), '-i', overlay_png,
       '-filter_complex', vf, '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', str(FPS), '-t', str(dur), os.path.join(WORK, name + '.mp4'))
    scenes.append((name, dur))

G = os.path.join(ROOT, 'website/src/static/assets/gallery')
scene_card('s1_intro', save(title_card([('17+ years of Real Services for Real Estate', SERIF(40), WHITE),
                                        ('Islamabad · Rawalpindi', SANS(26, 600), YEL)], logo_w=600, y0=170), 's1'), 5,
           bg_still=os.path.join(G, 'pearl-night.webp'))
scene_video('s2_pearl', yt('_YIQRRaqIq8'), 6, 5.5, box(0.0, 0.17, 1.0, 1.0),
            save(lower_third('The Pearl', 'Pre-launch high-rise · near M-1/M-2 & New Islamabad Airport', 'Mumtaz City, Islamabad'), 's2'))
scene_video('s3_mumtaz', yt('SmxT7aHchFI'), 392, 5.5, box(0.0, 0.20, 1.0, 0.86),
            save(lower_third('Mumtaz City', 'Home of The Pearl, Sofia Sapphire & ICON VIII · on the M-1/M-2', 'Islamabad'), 's3'))
scene_video('s4_csc', yt('42svBBAaCHI'), 52, 5.5, box(0.03, 0.18, 0.97, 0.79),
            save(lower_third('Capital Smart City', 'Development progress you can see on site', 'M-2 Motorway, Islamabad'), 's4'))
scene_video('s5_visit', yt('Y3byZtHBwqE'), 41, 5.5, box(0.0, 0.10, 1.0, 0.74),
            save(lower_third('Guided site visits', 'See the location and real progress before you invest', 'Fatima Marketing'), 's5'))
scene_card('s6_stats', save(stats_card(), 's6'), 6)
scene_card('s7_projects', save(projects_card(), 's7'), 6, bg_still=os.path.join(G, 'sofia-palace-facade.webp'))
scene_card('s8_cta', save(cta_card(), 's8'), 7)

# ---------- join with cross-fades ----------
XF = 0.6
inputs, fc, prev, offset = [], [], '0:v', 0.0
for i, (n, d) in enumerate(scenes):
    inputs += ['-i', os.path.join(WORK, n + '.mp4')]
for i in range(1, len(scenes)):
    offset += scenes[i - 1][1] - XF
    out = f'v{i}'
    fc.append(f'[{prev}][{i}:v]xfade=transition={"fade" if i % 2 else "smoothleft"}:duration={XF}:offset={offset:.2f}[{out}]')
    prev = out
total = sum(d for _, d in scenes) - XF * (len(scenes) - 1)

# ---------- synthesized ambient pad (royalty-free) ----------
sr = 44100; n = int(sr * (total + 0.5)); wav = os.path.join(WORK, 'pad.wav')
chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (196.0, 246.94, 293.66), (164.81, 207.65, 246.94)]
seg = n // len(chords)
with wave.open(wav, 'w') as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr)
    frames = bytearray()
    for i in range(n):
        t = i / sr; c = chords[min(i // seg, len(chords) - 1)]
        env = min(1, t / 2.5) * min(1, (total + 0.5 - t) / 3)
        trem = 0.85 + 0.15 * math.sin(2 * math.pi * 0.25 * t)
        v = sum(math.sin(2 * math.pi * f * t) + 0.3 * math.sin(2 * math.pi * f * 2 * t + 0.5) for f in c)
        sub = 0.6 * math.sin(2 * math.pi * c[0] / 2 * t)
        s = (v / 4 + sub) * 0.16 * env * trem
        l = int(max(-1, min(1, s * (1 + 0.1 * math.sin(t)))) * 32767); r = int(max(-1, min(1, s * (1 - 0.1 * math.sin(t)))) * 32767)
        frames += struct.pack('<hh', l, r)
    wf.writeframes(bytes(frames))

out = os.path.join(OUT_DIR, 'fatima-marketing-brand-film.mp4')
ff(*inputs, '-i', wav, '-filter_complex', ';'.join(fc) + f';[{len(scenes)}:a]lowpass=f=2400,aecho=0.8:0.7:60:0.25,afade=t=out:st={total-2.5:.2f}:d=2.5[a]',
   '-map', f'[{prev}]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-tune', 'film', '-crf', '21', '-pix_fmt', 'yuv420p',
   '-c:a', 'aac', '-b:a', '128k', '-t', f'{total:.2f}', '-movflags', '+faststart', out)
# (the site uses the clean Mumtaz City drone still as the player poster, so no poster file is written)
print('brand film:', out, f'{total:.1f}s', os.path.getsize(out) // 1024, 'KB')
shutil.rmtree(WORK, ignore_errors=True)
