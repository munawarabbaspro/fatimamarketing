# User Acceptance Testing (UAT) Report: Fatima Marketing Website

Date: 2 Nov 2026 · Build: `website/dist` (production) · Browsers: Microsoft Edge (Chromium) headless via Playwright, desktop 1440×900 and mobile 390×844 (touch).
Re-run anytime: `npm run serve` (in one terminal) → `python tools/uat/uat.py` · `python tools/uat/audit.py`.

## 1. Result summary

| Suite | Result |
|---|---|
| Functional customer journeys (`uat.py`) | **51 / 51 pass** (phase 2 redesign, 3 Nov 2026) |
| Payment-plan arithmetic (`check_plans.mjs`) | **72 / 72 rows add up** |
| Static integrity + SEO audit, 22 pages (`audit.py`) | **0 issues**: no broken links, anchors or assets; all titles and descriptions within limits; 1 H1 per page; valid JSON-LD |
| JavaScript errors (desktop + mobile) | **0** |
| Horizontal overflow at 390 px | **None** (all 7 page types) |
| Lighthouse desktop (home) | Performance 93–98 · Accessibility 100 · Best Practices 100 · SEO 100 |
| Lighthouse mobile (7 pages, simulated slow 4G + 4× CPU) | Performance 79–96 · **Accessibility 100 · Best Practices 100 · SEO 100** on every page · CLS 0 |
| JavaScript syntax (`audit.py` now runs `node --check`) | Pass |

Lighthouse HTML reports: `website/tools/uat/lighthouse/*.report.html`.


## 2. Customer journeys tested

| # | Persona | Journey | Result |
|---|---|---|---|
| J1 | Any visitor | Logo → home; Projects dropdown opens (hover **and** click), lists 14 societies, closes on Esc | ✅ |
| J2 | Buyer browsing | Hero plays The Pearl clip; tab switches to Sofia Sapphire (video and text); "Watch video" opens the full film with sound; Esc closes | ✅ |
| J3 | Interested buyer | Hero "Payment plan" → enquiry modal opens with **Sofia Sapphire (Mumtaz City)** and **Latest payment plan** preselected, cursor in Name | ✅ |
| J4 | Careless typist | Empty submit → clear message; "12345" phone rejected; "bad@" email rejected | ✅ |
| J5 | Local buyer | Valid submit → WhatsApp opens to **0335-7777901** with the structured message below; success panel shows a reference ID | ✅ |
| J6 | Overseas Pakistani | +971 number accepted and normalised (`+971501234567`) | ✅ |
| J7 | Investor (CSC) | Project form preselects Capital Smart City; 13 payment plans render as tables; original plan opens full-size; YouTube facade swaps to the privacy-enhanced player; map loads; "Get directions" targets the CSC pin | ✅ |
| J8 | Apartment buyer | Mumtaz City shows The Pearl, Sofia Sapphire and ICON VIII; 2-Bed walkthrough plays; gallery lightbox steps with ← → | ✅ |
| J9 | Any visitor | Fatima Marketing brand film plays | ✅ |
| M1–M9 | **Mobile user** | Bottom bar (Call / WhatsApp / Enquire) visible; Call dials **+92 331 1111057**; closed menu hidden from keyboard; burger opens; Projects accordion lists 14; tap → Kingdom Valley page; no sideways scroll; Enquire opens the form; every primary button ≥ 44 px | ✅ |

### Lead message the business receives (captured from the test)
```
*New property enquiry: Fatima Marketing website*
Ref: FM-261102-5998

*Project:* Sofia Sapphire (Mumtaz City)
*Interested in:* Latest payment plan
*Size / budget:* 2 Bed apartment
*Payment:* Cash / lump sum

*Name:* Ahmed Raza
*Phone:* 0300-1234567
*Email:* ahmed@example.com
*City / country:* Dubai, UAE

*Message:* Please share floor plan.

Page: http://localhost:4173/
```
(The `Page:` line is the URL the visitor was on; in the test that was the local server. On the live site it reads e.g. `https://fgoc.pk/projects/mumtaz-city/`.)
WhatsApp renders `*text*` as bold. The reference ID lets the team match WhatsApp chats with email copies once Web3Forms is enabled.

## 3. Defects found during UAT and fixed

| # | Defect | Impact | Fix |
|---|---|---|---|
| 1 | Desktop: hovering opened "Projects", then the click **closed** it | Visitors couldn't reach project pages from the menu | Click always opens on hover devices |
| 2 | "One Capital Residences: From Rs 0 Lac" | Wrong price shown | Price column set per plan (`fromCol`) |
| 3 | Mobile page scrolled sideways (off-canvas menu) | Broken mobile layout | `overflow-x: clip`; closed menu set `visibility:hidden` (also hides its links from keyboard/screen readers) |
| 4 | **Map pins wrong** for Capital Smart City, Kingdom Valley, Blue World City, Taj Residencia; PECHS landed on "Fateh Jang Rd" | Customers sent to the wrong place | Verified all 15 maps visually; switched to OSM coordinates, a Google plus code (Kingdom Valley) or exact place names; office uses the exact "Capital Business Centre" pin |
| 5 | Sofia Sapphire poster showed a man with a Rolls-Royce instead of the building | Off-brand first impression | Re-extracted frames with accurate seeking; hero loop re-cut on the façade |
| 6 | The Pearl hero opened on a motorway shot with a tiny tower | Weak first impression | Clip now starts on the tower |
| 7 | White text on WhatsApp green: contrast 3.1 : 1 | Hard to read (WCAG fail) | Darker WhatsApp green: 5.1 : 1 |
| 8 | Gold labels on dark sections: 2.9 : 1 | WCAG fail | Yellow labels on dark backgrounds (14 : 1) |
| 9 | Hero auto-rotation created a late LCP (13 s) | Poor Core Web Vitals | All hero clips and posters normalised to 960×516; slides 2–3 posters deferred |
| 10 | Heavy blur effects and 14 GPU layers on cards | Janky scrolling on low-end phones | Removed `backdrop-filter`/`will-change`; `content-visibility` on long sections; mobile CSC page 67 → 84 under real (DevTools) throttling, 94 in the standard simulated test |
| 11 | Footer links 20 px tall | Tap-target fail | ≥ 26 px |
| 12 | Plan thumbnails showed the empty white header of each schedule | Looked blank | Thumbnails crop to the table area |
| 13 | Highlight cards' 3D icons popped out of the cards at rest | Visual glitch | 3D depth now only on hover |

## 4. Content-accuracy checks done before go-live

- WhatsApp number confirmed by slowing the call recording: speaker says "zero, double-three, five, double-seven, double-seven, nine-zero-one" = **0335-7777901**, matching the handwritten note.
- UAN **0331-1111057** matches the notes, the call and the watermark on every project video.
- All 13 payment-plan tables transcribed from the source PDFs/images and **arithmetic-verified row by row** (`node tools/uat/check_plans.mjs`): **72/72 rows add up** (down payment + confirmation + installments = price; e.g. Jade Tower studio: 505,700 + 1,013,500 + 40×126,500 + 8×316,600 + 1,019,000 = 10,131,000).
- Facts that sources disagreed on (e.g. Top City-1 area 5,906 vs 9,081 Kanal) were **omitted, not guessed**.
- Video upload dates and durations come from YouTube; social counts were read live on 2 Nov 2026.

## 5. Accepted / open items (need the client)

| Item | Status |
|---|---|
| Real customer testimonials | **Done:** 5 real Google reviews (5.0 ★ / 22) quoted verbatim. Add new ones in `site.mjs` as they arrive. |
| The "5 key points" wording | Placeholder copy written; client said the wording is pending |
| Faisal Town link (voice note) | Not received; page uses verified Phase 1/2 facts |
| Society bios / documents / site photos | Client promised; pages are ready to take them |
| D-17 vs Multi Gardens | Built as two pages; client to confirm D-17 was intended |
| Office hours | Hidden until provided |
| Email copies of leads | Add a free Web3Forms access key (5 minutes, see README) |
| Team list | From FGC's 2023 site; confirm current titles |
| Domain | Default `fatimamarketing.com` (from their Google profile); fgoc.pk redirects to it. Confirm both are controlled by the client |
| Office address | **Resolved:** Office No. 01, 1st Floor, Allied Plaza, F-10 Markaz (user-confirmed). Client to update Google Business Profile |


## 6. Phase 2 redesign: new checks and defects fixed (3 Nov 2026)

New journeys added to `uat.py`: hero Watch tour opens the YouTube tour; only one hero slide visible; society filter (Apartments → matching societies, All → 14); the video list swaps the featured player; 5 real Google reviews and a 5.0 rating shown; social cards link to the real profiles; plan size tabs show the exact split (Executive 1 Kanal = Rs 11,200,000, 12 × Rs 746,667); project tabs land below the sticky header and highlight.

| # | Defect found while testing the redesign | Fix |
|---|---|---|
| 14 | All 4 hero slides showed at once (CSS `display` beat the `hidden` attribute) | Global `[hidden]{display:none!important}` |
| 15 | That rule then hid the form’s “Thank you” panel | Panel visibility now set by script on submit/reset |
| 16 | Off-screen rendering skip (`content-visibility`) made in-page jumps land in the wrong place | Removed from pages with anchors; kept only on the home page, which has no in-page links |
| 17 | Clicking a project tab could stop the page scroll midway (tab-strip `scrollIntoView` cancelled it) | Only the tab strip scrolls sideways now |
| 18 | A stray `//` comment broke the whole script (menus, forms, players) | Fixed; `audit.py` now fails on any JS syntax error |
| 19 | Mobile home: always-running animations forced layout/paint every frame (progress bar `width`, pulsing `box-shadow`) | Rewritten as transform/opacity animations; responsive 800/1600 px hero image as LCP |
| 20 | Logo fragments and phone chips at the edges of some video frames | Per-frame crops tightened; every still checked visually |
| 21 | The Pearl card showed a presenter frame (inaccurate keyframe seek) | Exact-frame seek for that video |
| 22 | Reviewer avatar contrast 3.7:1; star rating `aria-label` without a role | Darker avatar colours; `role="img"` |
| 23 | Sticky header 97% opaque: large numbers ghosted through while scrolling | Header and tab bar fully opaque |

## 7. Phase 3 (3 Nov 2026): photos, video quality, responsiveness, PageSpeed

New checks in `uat.py`: the brand film plays in the branded player; the custom control bar is mounted (native controls off) and pause and seek work; 5 photo key-point cards load; the contact page shows 5 leadership text cards (no photos). `responsive.py` now covers 11 pages × 16 widths (320–1920 px). `tools/uat/lighthouse/run.py` runs Lighthouse (the PageSpeed engine) on 8 pages, mobile and desktop.

| # | Defect found in phase 3 | Fix |
|---|---|---|
| 24 | Stills were extracted at 1600 px from frames that had been cropped and scaled, so some were soft | All stills re-extracted at native 1080p (never upscaled), sharpest frame within ±0.4 s, no scene-cut frames |
| 25 | Hero loops were 1600×900 re-scaled from a cropped strip (upscaled), CRF 28 | Native 1920 px crops at CRF 20 (capped at 5 Mbps) plus a 1280 px phone version |
| 26 | Brand film was 1280×720 from 848 px sources | Re-rendered at 1920×1080 from the client's 1080p YouTube uploads, CRF 21 |
| 27 | Local client videos re-encoded at 960 px, CRF 28 | Native resolution (≤1280), CRF 21 |
| 28 | On phones the hero showed a narrow slice of a wide frame, blown up several times | Phones/tablets: the loop sits in a 2:1 / 16:9 panel at full sharpness, copy below on ink; `<picture>` serves a 16:9 crop (800/1200 px) |
| 29 | Same on page heroes (About, Contact, Plans, Projects, every project) | Phones: the photo is a sharp 2:1 band; text starts on its faded edge |
| 30 | Wider stills brought back corner logos (channel and developer logos) that the old 16:9 trim used to remove | 16:9 centre window restored at native resolution; extra top trims where a logo reached further in (all 63 stills checked edge by edge) |
| 31 | Two department photos still carried a channel logo and a lower-third chip | Re-cropped |
| 32 | Long content could widen a grid column past the screen (e.g. the map at 320 px) | Every `fr`-only grid track is now `minmax(0, fr)`; the map is `width:100%` |
| 33 | Address line cut off in the contact panel at 320 px | The text column can shrink (`min-width:0`) and wraps long words |
| 34 | Blank Instagram icon in the footer: all copies shared one gradient id and the first copy sits in the hidden menu | Each Instagram icon gets its own gradient id |
| 35 | Text under 12 px on phones/tablets (chips, table headers, captions) | 12 px floor on ≤980 px |
| 36 | “Subscribe” link 22 px tall (WCAG 2.2 tap target) | 32 px |
| 37 | Chips and photo credits cut off with “…” | They wrap now |
| 38 | Lighthouse picked the hero video as the largest paint (LCP 4.3 s on mobile) | Video starts after the first interaction or ~3 s of idle; the hero image is sized so it stays the LCP |
| 39 | Brand-film poster (148 KB) downloaded at load although far below the fold | Poster is a lazy `<img>` (the clean Mumtaz City drone still) |
| 40 | Header logo 36 KB for a 152 px logo; society badges 320 px for 48–72 px badges | 320 px logo and 160 px badge files with `srcset` |
| 41 | Review marquee doubled its DOM at load; star ratings were 5 SVGs each | The loop copy is added when the marquee scrolls into view; stars are one text element |

**About Lighthouse on this PC:** a fresh Edge on Windows spends 100–300 ms initialising system fonts in its first layout. Lighthouse's 4× CPU simulation multiplies that, which costs every page about 0.5 s of simulated first paint locally. The same page loaded in an already-running browser lays out in 5–18 ms. `run.py` therefore has a `WARM=1` mode: one long-running Edge, which is closer to how PageSpeed Insights' Linux servers behave. PageSpeed Insights can only be run on the public URL after deployment, and field data (real-user Core Web Vitals) appears once the site has traffic.

**Results (4 Nov 2026, local Lighthouse 12.8, the PageSpeed engine, simulated throttling):**

| Check | Result |
|---|---|
| `uat.py` customer journeys | 54/54 pass |
| `audit.py` (SEO tags, links, assets, JS syntax) | 0 issues |
| `check_plans.mjs` | 72/72 plan rows add up |
| `responsive.py`, 11 pages × 16 widths (320–1920 px) | 0 sideways scroll, 0 elements outside the screen, 0 clipped text, 0 text under 12 px, 0 small tap targets, 0 stretched images |
| Accessibility · Best Practices · SEO | **100 · 100 · 100 on all 8 pages, mobile and desktop** |
| Performance, desktop | 93–99 (warm browser), 94–100 (fresh browser) |
| Performance, mobile | 80–96 locally; first paint 0.8–1.3 s with a warm browser |

Mobile performance before Phase 3 was 69–95 (home 69: the hero video was being counted as the largest paint at 4.3 s). On this PC the remaining gap to 100 is main-thread time that Lighthouse measures in each fresh renderer process: Windows font start-up plus tracing overhead. A warm, unthrottled load of the Capital Smart City page does its whole first style and layout pass in 27 ms, with no forced layouts from JavaScript. The definitive mobile number must come from PageSpeed Insights on the deployed URL.

## 8. Final pre-launch audit (4 audits run in parallel)

| Audit | Result |
|---|---|
| Customer journeys (`uat.py`) | 54/54 pass |
| SEO tags, structured data, links, JS syntax (`audit.py`) | 0 issues |
| Payment-plan maths (`check_plans.mjs`) | 72/72 rows add up |
| Layout, 11 pages × 16 widths (`responsive.py`) | 0 overflow, 0 off-screen, 0 clipped, 0 text < 12 px, 0 small tap targets, 0 stretched |
| Picture/video sharpness on 5 devices (`media_audit.py`) | Worst stretch on phones 1.9× (was 7.4×); full-HD desktop 95th percentile 1.00× (was 1.21×) |
| Content and SEO review (every page read) | Fixed: expired July 2026 schedule labelled as expired; "approved societies only" claim softened to "approval status checked first" (some societies are still pending); outdated Eid 2025 / mid-2026 lines; photo badges no longer called "logo"; D-17 card alt; Faisal Hills is now "Faisal Hills, Taxila"; footer wording; "Sep" month; per-project addressRegion and dead fgoc.pk removed from structured data; other phone numbers removed from the Fatima Associates signboard photo |
| Code, security and deploy review | Fixed: Vercel config now at the repository root (build `node website/build.mjs`, output `website/dist`); all 29 old-URL redirects and the fgoc.pk host redirect corrected; content stays visible if JavaScript fails; YouTube player no longer nested in a button; Space on player buttons; dialogs don't close when a text selection ends on the backdrop; focus moves to the thank-you panel; inline JSON escaped; dev server bound to localhost with path-traversal guard; every image/video URL fingerprinted so replaced media reaches visitors immediately |

New media fixes: native 1920 px 3:1 page-header banners on large screens (`tools/make_banners.py`); the enquiry section's background photo is hidden on phones/tablets and the trust photo becomes a sharp band; two hazy gallery frames removed.

Decided without the client (see `01-requirements-notes.md` §9): address = Allied Plaza (user-confirmed); hours hidden until known; Harmony Park kept and labelled expired; leadership and key-point wording kept.
