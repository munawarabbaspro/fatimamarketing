# Fatima Marketing: Website

Static, pre-rendered website for **Fatima Marketing (FGC: Fatima Group of Companies)**, F-10 Markaz Islamabad.
22 pages · 14 project pages · 13 Capital Smart City payment plans · zero runtime dependencies · builds in under a second.

```
website/
  build.mjs                 ← page templates + generator (HTML, sitemap, robots, redirects)
  src/data/site.mjs         ← phones, email, address, socials, stats, key points, FAQ, testimonials, form keys
  src/data/projects.mjs     ← the 14 society pages (facts, sizes, videos, map pin, FAQs)
  src/data/plans.mjs        ← payment-plan tables (Capital Smart City)
  src/static/assets/        ← css, js, fonts, images, videos (copied as-is)
  tools/                    ← asset scripts, dev server, UAT/SEO test suites
  dist/                     ← generated site (deploy this folder)
```

## Everyday tasks

| I want to… | Do this |
|---|---|
| Build the site | `node build.mjs` (writes `dist/`) |
| Preview locally | `node tools/serve.mjs` → http://localhost:4173 |
| Change phone / WhatsApp / email / address | `src/data/site.mjs` → `phones`, `email`, `address` |
| Change the 5 key points, FAQ, highlights | `src/data/site.mjs` → `keyPoints`, `faqs`, `highlights` |
| Edit a society page | `src/data/projects.mjs` (text, sizes, blocks, amenities, videos, FAQs) |
| Add a YouTube video to a project | add `{ yt: 'VIDEO_ID', title, date: 'YYYY-MM-DD', dur: seconds }` to that project's `videos` |
| Update / add a payment plan | edit `src/data/plans.mjs`, put the image in `src/static/assets/plans/<img>.webp` (+ `-480.webp`), list its slug in the project's `plans`, then run `node tools/uat/check_plans.mjs` to verify the arithmetic |
| Add more real reviews | copy new Google reviews into `src/data/site.mjs` → `testimonials` (name, meta, exact text) and update `googleProfile.count` |
| Show office hours | `src/data/site.mjs` → `hours: 'Mon – Sat, 10:00 am – 7:00 pm'` |
| Change domain | `src/data/site.mjs` → `url` (default `https://fatimamarketing.com`; canonicals, sitemap, schema and the fgoc.pk redirect follow) |

## Enquiry forms: how leads arrive

1. **WhatsApp (always on):** every form opens WhatsApp to **0335-7777901** with a structured message (project, interest, size/budget, payment, name, phone, email, city, message, page URL and a reference such as `FM-261102-4821`).
2. **Email copy (optional, free):** create an access key at https://web3forms.com using `fatimamarketing.isb@gmail.com`, paste it into `site.forms.web3formsKey`, then rebuild. Every enquiry is then also emailed with the same reference.
3. **Analytics (optional):** put a GA4 ID in `site.forms.analyticsId`. Events sent: `generate_lead`, `contact_click` (call/WhatsApp/email), `video_play`, `enquiry_open`.

## Deploy (Vercel, free tier)

```
cd website
node build.mjs
npx vercel deploy dist --prod      # first time: log in and link the project
```
`dist/vercel.json` already has clean URLs, long-cache headers for `/assets`, security headers and **301 redirects from every old fgoc.pk URL**. Netlify/Cloudflare Pages work too (`dist/_redirects`, `dist/_headers`). Then point the domain's DNS to the host, and submit `https://<domain>/sitemap.xml` in Google Search Console.

## Quality checks (run before every release)

```
node tools/serve.mjs &                       # dev server on :4173
python tools/uat/uat.py                      # 51 customer-journey checks (desktop + mobile)
python tools/uat/audit.py                    # SEO, broken links/assets, JS syntax (22 pages)
node tools/uat/check_plans.mjs               # payment-plan arithmetic
npx lighthouse http://localhost:4173/ --view # performance / accessibility / SEO
```
Python checks need `pip install playwright beautifulsoup4` (Playwright uses the Edge already on Windows).

## Rebuilding media (only if source files change)

Source videos, PDFs and photos live in the repo root (`../`).
- `bash tools/process_videos.sh`: re-encode the client's own MP4s at their native resolution (CRF 21, no visible re-compression), cut the tower preview loops, extract stills (needs ffmpeg; `pip install imageio-ffmpeg` provides one)
- `python tools/process_images.py`: payment plans → WebP, logos, favicons, share image
- `python tools/make_brand_film.py`: renders the 42-second Fatima Marketing brand film at **1920×1080** from the client's own 1080p YouTube footage (The Pearl, Mumtaz City, Capital Smart City, a guided site visit), logo, stats and contact cards; synthesized royalty-free music
- `python tools/build_society_media.py [stills|portraits|hero|all] [names…]`: pulls frames and hero loops from **Fatima Marketing’s own YouTube videos** (needs `pip install yt-dlp imageio-ffmpeg pillow`). Never upscales: stills keep native 1080p pixels (up to 1920 wide + an 800 version), and the sharpest frame within ±0.4 s of the chosen moment is used (never across a scene cut). Key-point photos are 4:5 crops (`PORTRAITS`, `LOCAL_PORTRAITS`). Hero loops are 1080p (CRF 20, capped at 5 Mbps) plus a 1280 px phone version (`-m.mp4`). Edit the `STILLS` / `PORTRAITS` / `HERO` tables to change a shot.
- `python tools/contact_sheet.py <outdir> <youtube-id>[:start-end] …`: 16-frame contact sheets with a sharpness score per frame, for picking new shots
- `python tools/grab_site_frames.py <outdir> [slug…]`: contact sheets of candidate frames per society

### Testing (dev server on :4173: `node tools/serve.mjs 4173`)
- `python tools/uat/uat.py`: 54 customer-journey checks (menus, hero, forms → WhatsApp message, players, filters, plans, mobile)
- `python tools/uat/audit.py`: SEO tags, structured data, broken links/assets, JS syntax
- `node tools/uat/check_plans.mjs`: every payment-plan row adds up
- `python tools/uat/responsive.py [--shots DIR]`: 11 pages × 16 widths (320–1920 px); overflow, clipped text, text < 12 px, tap targets, stretched images
- `python tools/uat/lighthouse/run.py [mobile|desktop|both] [/path …]`: Lighthouse (PageSpeed engine) scores; `WARM=1` measures in one warmed-up Edge (a cold Edge on Windows adds font start-up time to every run)

### Swapping photos or adding a society photo
1. Find a frame: `python tools/grab_site_frames.py ./frames kingdom-valley`, then open `frames/_kingdom-valley.jpg`.
2. Add it to `STILLS` in `tools/build_society_media.py` (video id, second, crop), then run `python tools/build_society_media.py stills <name>`.
3. Reference it in `src/data/media.mjs` (`covers`, `gallery`, `posters`, `showcase`) and rebuild.

### Credits
Society, site-visit, team and office photos and every video are from Fatima Marketing’s own YouTube channel and files. Airport photo (home key point “Overseas Pakistani support” and highlights): “Islamabad International Airport 2022”, Pr0pulsion 123, Wikimedia Commons, **CC0** (original in `tools/src-assets/isb-airport-2022.jpg`). Society logos: each developer’s official site or official Facebook page (see `docs/01-requirements-notes.md`). Fonts: Marcellus, Manrope (SIL OFL). Customer reviews are quoted verbatim from the public Google Business Profile. Leadership is shown as names, titles and one-line descriptions only (no photos), by client decision.

## Content sources

See `../docs/01-requirements-notes.md` (every fact and where it came from), `../docs/02-seo-competitor-audit.md` and `../docs/03-uat-report.md`.
