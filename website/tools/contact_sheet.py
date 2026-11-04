"""Contact sheets of the client's YouTube videos, used to hand-pick sharp, relevant 1080p frames.
python website/tools/contact_sheet.py OUT_DIR id[:start-end] [id ...]   (16 evenly spaced frames per video)
"""
import os, sys, subprocess, json
from concurrent.futures import ThreadPoolExecutor
import yt_dlp
from PIL import Image, ImageDraw, ImageFilter, ImageStat

FF = os.environ.get('FFMPEG') or __import__('imageio_ffmpeg').get_ffmpeg_exe()
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
FMT = '137/270/299/312/bestvideo[height<=1080][ext=mp4]/bestvideo[height<=1080]'

def info(vid):
    with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True, 'format': FMT}) as y:
        i = y.extract_info(f'https://www.youtube.com/watch?v={vid}', download=False)
    return i['url'], i.get('duration') or 60, i.get('height')

def grab(url, t):
    r = subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-ss', f'{t:.2f}', '-i', url, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, timeout=120)
    from io import BytesIO
    return Image.open(BytesIO(r.stdout)).convert('RGB') if r.stdout else None

def sharp(im):
    g = im.convert('L').resize((640, 360)).filter(ImageFilter.FIND_EDGES)
    return ImageStat.Stat(g).var[0]

for arg in sys.argv[2:]:
    vid, _, rng = arg.partition(':')
    url, dur, h = info(vid)
    a, b = (map(float, rng.split('-')) if rng else (2, dur - 3))
    ts = [a + (b - a) * k / 15 for k in range(16)]
    with ThreadPoolExecutor(8) as ex: frames = list(ex.map(lambda t: grab(url, t), ts))
    W = 480; sheet = Image.new('RGB', (W * 4, 270 * 4), 'black'); d = ImageDraw.Draw(sheet)
    for k, (t, f) in enumerate(zip(ts, frames)):
        if f is None: continue
        x, y = (k % 4) * W, (k // 4) * 270
        sheet.paste(f.resize((W, 270)), (x, y))
        d.rectangle([x, y, x + 150, y + 22], fill='black'); d.text((x + 4, y + 4), f'{t:.1f}s  s{sharp(f):.0f}', fill='yellow')
    sheet.save(os.path.join(OUT, f'{vid}.jpg'), quality=82)
    print(vid, h, f'{dur}s', 'ok')
