"""Grab full-HD still frames from Fatima Marketing's own YouTube site-visit / drone videos.
Frames are sampled evenly; a contact sheet per society is written for picking the clean shots.
python website/tools/grab_site_frames.py <outdir> [slug ...]"""
import os, sys, json, subprocess
from concurrent.futures import ThreadPoolExecutor
import yt_dlp
from PIL import Image, ImageDraw

FF = os.environ.get('FFMPEG') or __import__('imageio_ffmpeg').get_ffmpeg_exe()
OUT = sys.argv[1]
# society -> client's own videos (site visits, drone views, development updates)
VIDEOS = {
    'mumtaz-city': ['SmxT7aHchFI', 's-53UPyWeNM'],
    'capital-smart-city': ['42svBBAaCHI', '7wu-zwemdhc'],
    'top-city-1': ['UDAqThgpoEI', 'NAdEO9cpo9A'],
    'gandhara-city': ['p5YGlNuQV2Q', 'qEgCEVpTqMM'],
    'pechs-islamabad': ['kLc1sFKDuzw', 'WaeXrbisdNY'],
    'airport-green-garden': ['BMoVvPLnMwo', 'Wy3X8OvwMFc'],
    'kingdom-valley': ['gKPLt7zOamw', 'WfvKjI5u9GA'],
    'faisal-town': ['Y3byZtHBwqE', '7y6ilGc7wo0'],
    'faisal-hills': ['9Rx41mG5QdA', 'nT_MnXdVkLI'],
    'park-view-city': ['6fxBJU9we0M', 'Eg69fjWiTtg'],
    'blue-world-city': ['ZYlmNakimhk', '1RX50ATLSfs'],
    'multi-gardens-b17': ['aYcr7uEkEiw'],
    'taj-residencia': ['IQHajpruFj4', 'MJEI5pMTjwE'],
}
only = sys.argv[2:]
if os.environ.get('VIDEOS_JSON'): VIDEOS = json.loads(os.environ['VIDEOS_JSON'])
N = 14


def stream(vid):
    with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True, 'format': '137/136/bestvideo[height<=1080][ext=mp4]/bestvideo[height<=1080]/best'}) as y:
        info = y.extract_info(f'https://www.youtube.com/watch?v={vid}', download=False)
        return info['url'], info.get('duration') or 60, info.get('height')


def grab(args):
    url, t, path = args
    subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{t:.1f}', '-i', url, '-frames:v', '1', '-q:v', '2', path], timeout=120)
    return path if os.path.exists(path) else None


for slug, vids in VIDEOS.items():
    if only and slug not in only: continue
    d = os.path.join(OUT, slug); os.makedirs(d, exist_ok=True)
    jobs = []
    for vid in vids:
        try:
            url, dur, h = stream(vid)
        except Exception as e:
            print(slug, vid, 'ERR', e); continue
        for k in range(N):
            t = dur * (0.04 + 0.92 * k / (N - 1))
            jobs.append((url, t, os.path.join(d, f'{vid}_{int(t):04d}.jpg')))
        print(slug, vid, f'{dur}s {h}p')
    with ThreadPoolExecutor(6) as ex:
        got = [p for p in ex.map(grab, jobs) if p]
    # contact sheet with labels
    W, H = 320, 180; cols = 7; rows = (len(got) + cols - 1) // cols
    sheet = Image.new('RGB', (W * cols, (H + 16) * max(rows, 1)), 'white'); dr = ImageDraw.Draw(sheet)
    for i, p in enumerate(sorted(got)):
        im = Image.open(p).convert('RGB'); im.thumbnail((W, H)); x, y = (i % cols) * W, (i // cols) * (H + 16)
        sheet.paste(im, (x, y)); dr.text((x + 3, y + H + 2), os.path.basename(p)[:-4], fill='black')
    sheet.save(os.path.join(OUT, f'_{slug}.jpg'), quality=82)
    print(slug, len(got), 'frames')
