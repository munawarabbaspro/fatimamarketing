#!/usr/bin/env bash
# Rebuild all web video + still assets from the client's source videos in the repo root.
# Run from the repo root:  bash website/tools/process_videos.sh
# Needs ffmpeg (FFMPEG env var, or `pip install imageio-ffmpeg` and the default path below) and Python + Pillow.
set -e
FF="${FFMPEG:-$(python -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())' 2>/dev/null)}"
SRC="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$SRC/website/src/static/assets/video"; G="$SRC/website/src/static/assets/gallery"; I="$SRC/website/src/static/assets/img"
mkdir -p "$OUT" "$G" "$I"
q(){ "$FF" -hide_banner -loglevel error -y "$@"; }
ICON="$SRC/WhatsApp Video 2025-10-04 at 7.44.20 AM.mp4"
S2="$SRC/WhatsApp Video 2025-09-15 at 5.17.19 AM (2).mp4"; SST="$SRC/WhatsApp Video 2025-09-15 at 5.17.19 AM.mp4"; S3="$SRC/WhatsApp Video 2026-10-31 at 4.18.29 PM.mp4"

# --- Tower preview loops: muted, 13 s, watermark ticker cropped, 960x516 (≈ source resolution), CRF 21 ---
COVER="scale=960:516:force_original_aspect_ratio=increase,crop=960:516,setsar=1,fps=25"
H264="-an -c:v libx264 -preset slow -tune film -crf 21 -pix_fmt yuv420p -movflags +faststart"
q -ss 9.5 -t 13 -i "$SRC/f.mp4"   -vf "crop=848:456:0:0,$COVER" $H264 "$OUT/hero-pearl.mp4"
q -ss 17  -t 13 -i "$SRC/SOFIA.mp4" -vf "$COVER" $H264 "$OUT/hero-sofia.mp4"
q -ss 4   -t 13 -i "$ICON"           -vf "crop=848:412:0:0,$COVER" $H264 "$OUT/hero-icon.mp4"
q -i "$OUT/hero-pearl.mp4" -ss 0.4 -frames:v 1 "$I/hero-pearl.png"
q -i "$OUT/hero-sofia.mp4" -ss 1.2 -frames:v 1 "$I/hero-sofia.png"
q -i "$OUT/hero-icon.mp4"  -ss 1.2 -frames:v 1 "$I/hero-icon.png"

# --- Full videos with audio (opened on demand): native resolution (≤1280), CRF 21 = no visible re-compression ---
full(){ q -i "$1" -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset slow -tune film -crf 21 -pix_fmt yuv420p -c:a aac -b:a 128k -ac 2 -movflags +faststart "$OUT/$2"; }
full "$SRC/f.mp4" pearl-mumtaz-city.mp4
full "$SRC/SOFIA.mp4" sofia-sapphire-film.mp4
full "$ICON" icon-mumtaz-city.mp4
full "$S2" sofia-sapphire-2-bed.mp4
full "$S3" sofia-sapphire-3-bed.mp4
full "$SST" sofia-sapphire-studio.mp4

# --- Gallery stills (accurate seek: -ss AFTER -i) ---
s(){ q -i "$1" -ss "$2" -frames:v 1 "$G/$3.png"; }
s "$SRC/f.mp4" 9 pearl-tower-day;      s "$SRC/f.mp4" 22 pearl-facade;  s "$SRC/f.mp4" 31 pearl-podium
s "$SRC/f.mp4" 52 pearl-night;         s "$SRC/f.mp4" 41 pearl-sunset-balcony
s "$SRC/SOFIA.mp4" 22 sofia-palace-facade; s "$SRC/SOFIA.mp4" 18.5 sofia-domes; s "$SRC/SOFIA.mp4" 26 sofia-arch-entrance; s "$SRC/SOFIA.mp4" 95 sofia-pool-deck
s "$SST" 11 sofia-victorian-exterior;  s "$SST" 21 sofia-studio-bedroom; s "$SST" 26 sofia-studio-bath; s "$SST" 34 sofia-studio-3d-plan
s "$S2" 22 sofia-2bed-bedroom;         s "$S2" 33 sofia-2bed-3d-plan
s "$S3" 24 sofia-3bed-3d-plan;         s "$S3" 27 sofia-3bed-bath;        s "$S3" 35 sofia-3bed-dining
s "$ICON" 8 icon-aerial; s "$ICON" 17 icon-facade; s "$ICON" 37 icon-lobby; s "$ICON" 57 icon-night

# --- PNG -> WebP (crop watermark tickers; 1280 + 640 widths) ---
python - "$G" "$I" <<'PY'
import os, sys, glob
from PIL import Image
G, I = sys.argv[1], sys.argv[2]
for f in glob.glob(G + '/*.png'):
    im = Image.open(f).convert('RGB'); w, h = im.size; n = f[:-4]
    if (w, h) == (848, 496): im = im.crop((0, 0, w, h - 40))
    elif (w, h) == (848, 448): im = im.crop((0, 0, w, h - 36))
    elif (w, h) == (1280, 720): im = im.crop((0, 0, w, h - 92))
    a = im.copy(); a.thumbnail((1280, 1280)); a.save(n + '.webp', 'WEBP', quality=78, method=6)
    b = im.copy(); b.thumbnail((640, 640)); b.save(n + '-640.webp', 'WEBP', quality=74, method=6)
    os.remove(f)
for f in glob.glob(I + '/hero-*.png'):
    Image.open(f).convert('RGB').save(f[:-4] + '.webp', 'WEBP', quality=76, method=6); os.remove(f)
print('stills converted')
PY
echo "done → $OUT, $G, $I"
