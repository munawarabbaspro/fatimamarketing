# Fatima Marketing Website: Consolidated Requirements

Sources studied (2026-11-02):
- 4 handwritten note pages (`WhatsApp Image 2026-11-02 at 5.59.1x PM*.jpeg`)
- Client call recording (`Downloads/Client Recording fatima.mp4`, 13:28, Urdu, transcribed with Whisper)
- 8 payment-plan PDFs + 7 payment-plan images (all **Capital Smart City / FDH**)
- 7 project videos (The Pearl, ICON VIII, Sofia Sapphire: all in **Mumtaz City**)
- Template: Homeify by KodeSolution (`html.kodesolution.com/2026/homeify-html/`)
- Web research: archived fgoc.pk (Dec 2023), YouTube @fatimamarketing, Facebook /fatimamarketingisb

---

## 1. Who the client is (verified)

| Item | Value | Source |
|---|---|---|
| Brand | **Fatima Marketing**, "Real Services for Real Estate" | fgoc.pk logo, videos |
| Parent | **FGC: Fatima Group of Companies** (Fatima Marketing, Fatima Associates, Fatima Construction & Builders) | fgoc.pk |
| CEO | Ejaz Khokhar | fgoc.pk/about-us (2023) |
| CFO | Riaz Khokhar | " |
| Directors | Mudasar Khokhar (Coordination), Ayyan Khokhar (HR), Haris Aziz (IT) | " |
| Office | **Office No. 01, 1st Floor, Allied Plaza, F-10 Markaz, Islamabad** | Confirmed by the user (Nov 2026); matches the Sept 2026 video ticker. The old address (Office 111, Capital Business Center) came from fgoc.pk and Google |
| UAN / Call | **0331-1111057** (also 0331-1111058) | notes, client call, every video watermark |
| WhatsApp | **0335-7777901**, confirmed: notes, slowed call audio, and their Sept 2026 video ticker (“Contact us 0335-7777-901”) | notes / call / video |
| Gmail | **fatimamarketing.isb@gmail.com** | fgoc.pk footer + mailto links |
| Other email | hello@fgoc.pk (domain is currently down) | fgoc.pk |
| Facebook | facebook.com/fatimamarketingisb: **11,257 followers** · 2,996 check-ins (live page, 2 Nov 2026; the search index showed an older 2.2K) | Facebook |
| YouTube | youtube.com/@fatimamarketing: 4.33K subscribers · 1.2K videos · 420,060 views · joined 2 Oct 2021 | YouTube, Nov 2026 |
| Instagram | instagram.com/fatimamarketingisb: 523 posts · 86 followers | Instagram, Nov 2026 |
| Google Business Profile | “Fatima Marketing”, **5.0 ★ from 22 reviews**, website listed: **fatimamarketing.com**, address Office 111 Capital Business Center (Souq-al-Hashir Plaza), opens 9 AM | Google Maps, 3 Nov 2026 |
| Website domain | **fatimamarketing.com**: listed on Google and printed on their video tickers since 2023; resolves but serves no site (403). Used as canonical; fgoc.pk 301-redirects to it | Google, videos, DNS |
| Experience | "Serving Islamabad/Rawalpindi for 15 years" (2021) → **17+ years** (client) | fgoc.pk + client |
| Brand colours | Black + lemon yellow (#F2E02A) + white | official logo |
| Old slogan | "The Trust Of Our Clients Is Our Asset" | fgoc.pk |

⚠ `fatimarealestate.pk` / FB "Fatima Real Estate & Marketing" is a **different business in Shikarpur, Sindh**. Do NOT link it.
⚠ fgoc.pk is offline (403/404 + wrong SSL cert). It redirects to fatimamarketing.com in the hosting config.
✅ **Address resolved:** Office No. 01, 1st Floor, Allied Plaza, F-10 Markaz (confirmed by the user). Action for the client: update the Google Business Profile address to match, because name, address and phone must be identical everywhere for local SEO.

## 2. Template → Fatima Marketing mapping (notes + call)

| # | Homeify section | Instruction | Decision |
|---|---|---|---|
| 1 | Logo "Homeify" | → Fatima Marketing + logo | Official logo extracted from FGC asset (light + dark variants) |
| 2 | Menu "Property" (grid/single/single v2) | ✗ Property → **Projects ▼** dropdown | 14 project pages (list §3) |
| 3 | Hero slider "Luxury Living with a Modern Touch" | Remove the luxury line; use **videos + details + payment plan** | Video hero: The Pearl, Sofia Sapphire, ICON VIII, with project facts and CTA |
| 4 | 5 feature icons (Smart Home, Solar, A/C, Security, Price) | "These 5 stay": keep 5 points; wording pending from client | Rewritten for a real-estate dealer; editable in data |
| 5 | "Living Quarters & Splendid Suite Sanctuaries" | → **Society logo + name**; click opens the detail page and query form | Society grid → `/projects/<slug>/` with enquiry form |
| 6 | "Apartment Plan" tabs (Living/Dining/Kitchen…) | **Remove** | Removed |
| 7 | Six-image gallery | **Development / society pictures**: show work underway | "On-site progress" gallery; slots ready for client's real site photos |
| 8 | "Discover Rooms" / 360 tour | Remove (call 05:00) | Removed |
| 9 | Customer Testimonials | Keep; Pakistani names; client says use the Google profile | Real reviews only (see §6) |
| 10 | Contact block + form | Same form: Name, Phone, Email, Message; UAN + WhatsApp + email | Done, with formatted lead message |
| 11 | "Highlights Nearby" (School, Airport, Mall, **Temple**) | Remove "Temple"; 3D effects on highlights | Corridor highlights with 3D tilt cards (Airport, Motorway, Schools, Malls, Hospitals) |
| 12 | Video section | Below highlights: **Fatima Marketing (AI) video** | Brand film generated from their own footage + logo |
| 13 | FAQ "Have questions in your mind?" | Same questions → web-researched answers about Fatima Marketing | Real-estate buyer FAQs + FAQPage schema |
| 14 | Counters | **3000+ Global Customers, 17+ Years Experience, 50+ Team, 100+ Projects Completed** | Done |
| 15 | (new) | Facebook / social info with follower counts | Social proof band with real counts |
| 16 | News & Events | **Remove** (notes) | Removed |
| 17 | (new) | Live location on map; show it properly; pin the point | Office map + per-project map pin + "Get directions" |
| 18 | (new) | Society detail pages with shared site pictures | Per-project gallery |
| 19 | Footer | Social links + sitemap | Done + `sitemap.xml` |
| 20 | Contact page | Team members | CEO, directors, team (from FGC 2023; client to confirm) |

## 3. Projects dropdown (client order)

1. Top City-1 · 2. Mumtaz City (The Pearl, ICON VIII, Sofia Sapphire) · 3. Gandhara City · 4. PECHS Islamabad · 5. Airport Green Garden (AGG) · 6. Kingdom Valley · 7. Faisal Town · 8. Faisal Hills · 9. Park View City · 10. Blue World City · 11. D-17 Islamabad · 12. Multi Gardens B-17 · 13. Taj Residencia
\+ **Capital Smart City**: not in the handwritten list, but all 15 payment plans supplied are CSC and FGC lists it as a core partner, so it is included.

⚠ Pending from the client: the "Faisal Town link" (voice note), society bios/documents, site photos, and the 5 key-point wording.
⚠ "D-17" vs "Multi Garden": the call says "D17 Multigarden" (likely B-17 Multi Gardens); the notes list both. Built as two pages; client to confirm.

## 4. Payment plans on file (all Capital Smart City, FDH)

Residential Villas (CSC + Lahore Smart City) · Harmony Park "The Villas" · District One Commercial (2y + 3y) · Overseas West · Overseas Central Lake View Commercial · Hamilton Hills by Axis · One Capital Residences (Jade Tower) · Phase 3 Pre-Launch · Overseas East · Overseas Prime (residential + commercial) · Overseas Prime II · Executive Block.
Transcribed into HTML tables (indexable by Google) + original image in a lightbox.

## 5. Technical decisions

- **Static site** (pre-rendered HTML from one data file, zero runtime dependencies). Free hosting (Vercel/Netlify/Cloudflare Pages), fastest load, best SEO.
- **Forms**: WhatsApp click-to-chat with a structured, pre-filled lead message (works with no backend) + optional email delivery through Web3Forms (owner adds a free access key). Every form carries the project name and page URL.
- **SEO**: unique title/meta per page, canonical, Open Graph, JSON-LD (RealEstateAgent, LocalBusiness, Organization, WebSite, BreadcrumbList, FAQPage, VideoObject, Place), `sitemap.xml`, `robots.txt`, semantic headings, alt text, lazy media, compressed WebP/MP4.

## 6. Integrity rules (applied)

- No invented facts: unknown numbers are marked "on request" rather than guessed.
- **Testimonials:** the notes ask for written ones with Pakistani names. Made-up reviews on a property site mislead buyers making large financial decisions, so the site ships with a real-review pipeline: drafts are flagged `verified:false` and excluded from production until replaced with real client feedback (Google/WhatsApp).
- Prices are labelled with their plan validity and "subject to change by developer".


## 7. Phase 2 (3 Nov 2026): user feedback and what changed

| Feedback | Done |
|---|---|
| Key-points strip: wrong emojis, merged into the video, same colour | Own section below the hero with a warm gold background; Microsoft Fluent **3D** icons (MIT): shield, money bag, car (site visit), airplane (overseas), clipboard |
| Need real pictures of Mumtaz City, Gandhara City, Faisal Town etc. | 55 full-HD frames from **Fatima Marketing’s own YouTube site-visit and drone videos**, tickers and logos cropped out (`tools/build_society_media.py`). Every society card, project hero and gallery uses them |
| Payment plans looked like a newspaper | Designed plan cards (price, split bar, key facts) and an interactive **size selector** per plan with an animated payment split and step list; the full table and original schedule sit behind “Full schedule & terms” |
| More relevant videos | “Site visits & drone tours” player with 12 tours and an inline featured player; 9 extra videos added to project pages; clean frame posters, glass play buttons with pulse ring |
| Sofia/pool pictures zoomed in and blurry | Showcase rebuilt from 1080p drone frames plus The Pearl’s 1080p render; Sofia shown only at native shape |
| Testimonials UI | **Real Google reviews** (5 shown, 5.0 ★ / 22), auto-scrolling marquee and rating summary card. No invented reviews |
| Facebook / YouTube / Instagram icons look fake | Official brand marks and colours (Simple Icons paths); brand-coloured social cards |
| “Book a site visit” colour, overall palette | Palette moved to charcoal plus warm gold; “Book a site visit” is now an ink button with a gold calendar icon |
| Airport/motorway emoji cards | Photo cards with 3D tilt: the airport (Wikimedia Commons, **CC0**), the Top City-1 interchange, CSC Smart STEM School, The Centaurus, the Faisal Town hospital render |
| Office and “trust” sections need pictures | Office: studio and site-visit photos plus map; trust banner over the team-with-developers photo, with animated stats |
| Hero background unclear; text panels take over | 4 **1080p** aerial loops (Mumtaz City, Capital Smart City, Kingdom Valley, Blue World City); slim info bar instead of the big panel; Watch tour opens the YouTube tour |
| Better animations | Scroll reveals, staggered entrances, image zooms, Ken Burns page heroes, counters, animated payment bars, marquee, tilt, hover video previews on the tower cards |

Image and asset credits: society and team photos are frames from Fatima Marketing’s own YouTube channel; the airport photo is “Islamabad International Airport 2022” by Pr0pulsion 123, Wikimedia Commons, CC0; 3D icons are Microsoft Fluent Emoji (MIT); brand icons follow official brand colours.

## 8. Phase 3 (3 Nov 2026): user feedback and what changed

| Feedback | Done |
|---|---|
| Key-point icons look like cartoons / "feels AI" | No icons at all: each of the 5 points is a **photo card** with the text over it. PECHS main gate (approved societies), finished villas (installments), a Faisal Town site visit (guided visits), Islamabad International Airport (overseas support, CC0), open balloting at Park View City (transparent paperwork) |
| "Overseas Pakistani" photo was an unrelated man | Replaced by the airport photo above |
| Society badges had no pictures | Official logos for all 14 societies (developer sites or official Facebook pages; Taj Residencia via the Wayback Machine). PECHS and D-17 have no usable logo, so they use a photo badge |
| Basic video player | Branded player: poster frame, gold play button with "Watch the film 0:42", auto-hiding control bar (play/pause, back 10 s, time, gold progress/seek, mute, fullscreen), keyboard shortcuts. Used for the brand film and every local video in the pop-up |
| Low picture quality / quality dropping on videos | Every still re-extracted at **native 1080p** (up to 1920 px, never upscaled), sharpest frame within ±0.4 s, no re-compression artefacts. Hero loops re-cut at 1920×1080 (plus a 1280 px phone version). Brand film re-rendered at **1920×1080** from 1080p sources. Local client videos re-encoded at their own resolution without visible loss |
| Video or picture clipped | Page heroes use per-image focal points; chips and photo credits wrap instead of being cut with "…" |
| Team photos unreliable | Dropped by the client: leadership shows **name, title and a one-line description** only. Descriptions are drafts for the client to confirm |
| Every pixel must fit on mobile | Grid tracks hardened (`minmax(0,1fr)`) so long content can no longer widen a column; responsive audit over 11 pages × 16 widths (320–1920 px); 12 px minimum text on phones and tablets; tap targets ≥ 24 px |
| PageSpeed 100 on all four categories | See `03-uat-report.md` §7 for the scores and what was changed |

Photo sources added in this phase: "Islamabad International Airport 2022" (Pr0pulsion 123, Wikimedia Commons, CC0; original kept in `website/tools/src-assets/`); the Fatima Associates office and signboard (client's video `03xNB3_qwBw`); the team meeting (client's video `cQIPSbpFQGk`).

## 9. Decisions taken without the client (user: "decide on your own")

| Item | Decision |
|---|---|
| Office address | Office No. 01, 1st Floor, Allied Plaza, F-10 Markaz, Islamabad (user-confirmed). Site, structured data, maps and the brand film's end card updated. The Google Business Profile still shows the old address and should be updated by the client |
| Office hours | Not shown: no verified source; publishing wrong hours is worse than none. Add `hours` in `src/data/site.mjs` when known |
| Harmony Park schedule (July 2026) | Kept, clearly labelled as expired with "ask us for the current rate"; the plan structure is still useful to buyers |
| 5 key points wording | Kept the current wording |
| Leadership titles and descriptions | Kept as published (titles from fgoc.pk; descriptions factual and modest) |
| D-17 vs Multi Gardens B-17 | Both pages kept |
| Faisal Town link / society bios | Pages use the verified facts already researched |
| Email copies of enquiries (Web3Forms) | Left off: needs a key created with the client's Gmail. Enquiries go to WhatsApp, which always works |

## 10. Available units: The Pearl & ICON VIII (owner's list, 10 Nov 2026)

The owner sent 16 unit sheets ("New List" folder): ICON VIII 713, 715, 717, 719 (1 bedroom, 7th floor, Rs 15,400/sq ft) and The Pearl A-1340, A-1316, A-1341, A-1241, A-941, A-1125 (studios), A-1335, A-1315 (1 bedroom), A-945, A-1014, A-1004, A-843 (2 bedroom). All on the developer's 5-year plan: 25% booking, 10% possession, 65% in 60 monthly or 20 quarterly instalments.

- Data: `website/src/data/inventory.mjs` (one row per unit). Remove a row when a unit sells; add rows for new units. Every figure is checked by `tools/uat/check_plans.mjs`.
- Home: "Apartments you can book today", 4 tiles (Pearl studio from Rs 80.3 Lac · ICON 1 bed from Rs 87.5 Lac · Pearl 1 bed Rs 1.63 Crore · Pearl 2 bed from Rs 2.23 Crore), each linking to the filtered list.
- Mumtaz City page: "Available units" section with filters (tower, type) and one card per unit (floor, size, rate, total, payment split, monthly/quarterly, "Book this unit" WhatsApp message with the unit number, and the original sheet in the lightbox). Also in the page's structured data (ItemList of Offers).
- Payment plans page: the same 4 tiles under "Mumtaz City: The Pearl & ICON VIII".
- Floors (decided): on 14 of 16 sheets the unit number matches the floor (A-945 = 9th). A-1341 ("10th") and A-1125 ("13th") repeat the floor of the sheet they were copied from, so the unit-number floor is shown (13th, 11th).
- Developers, from the sales sheets themselves: The Pearl is "a project of SA Global"; ICON VIII is "by Mumtaz Construction Company (Pvt) Ltd" with M Realtors as sales partner, amenities security/water/electricity/gas/elevator/parking, "Registry upon possession". MCC as ICON VIII's developer is also confirmed by its Zameen listing. "Serviced residences" (no source) was removed from the ICON VIII copy.
- The Mumtaz City FAQ (and FAQPage data) now answers which units are available, the 5-year plan with a worked example, and who develops each tower; these answers are generated from `inventory.mjs`, so they never drift from the unit cards.
