# SEO and Competitor Audit: Fatima Marketing

Date: 2 Nov 2026 · Scope: on-page and technical SEO of the new site, competitor benchmark, and an off-page plan.

## 1. Competitor benchmark (pages ranking for our target societies)

Each page was fetched and parsed on 2 Nov 2026 (`tools`: Python + BeautifulSoup).

| Competitor page | Title (chars) | H1 | Schema types | Words | HTML | Notes |
|---|---|---|---|---|---|---|
| theleadmarketing.com/capital-smart-city-islamabad | 60 | ✓ | Article, Breadcrumb, Org | 11,232 | 251 KB | Very long, payment plans as **images** |
| theleadmarketing.com/kingdom-valley-islamabad | 50 | ✓ | Article, Breadcrumb, Org | 6,890 | 209 KB | 42 H2s, no FAQ schema |
| manahilestate.com/pechs-islamabad | 61 | ✓ | **FAQPage**, Breadcrumb, GeoCoordinates | 4,104 | 244 KB | Only competitor with FAQ + geo schema |
| zameen.com/blog/airport-green-garden | 76 (truncated) | ✓ | Article, Breadcrumb | 2,430 | 265 KB | 10 of 22 images missing alt |
| estateland.com.pk/park-view-city-islamabad | 63 | **✗ none** | Breadcrumb only | 3,277 | 274 KB | 5 of 5 images missing alt |
| skymarketing.com.pk, gondalgroupofmarketing.com | n/a | n/a | n/a | n/a | n/a | DNS failures at audit time (unreliable hosting) |

**Common pattern:** title format "*Society* Islamabad | Payment Plan | Location | NOC". The H2 skeleton is Developer → NOC → Location/Map → Accessibility → Master plan/Blocks → Payment plan → Development status → FAQ.

**Gaps we exploit:**
1. Payment plans are **images** everywhere, so Google can't read them. Ours are **HTML tables** (13 Capital Smart City schedules), with the original image in a lightbox.
2. Almost nobody uses `RealEstateAgent`/`LocalBusiness`, `FAQPage`, `VideoObject` or `GatedResidenceCommunity` schema. We use all of them.
3. Competitor pages are 200–275 KB of HTML and slow (2–4 s just to fetch). Ours are 27–95 KB uncompressed (about 7–16 KB gzipped).
4. Competitors are written by agents who never visited the site. We embed Fatima Marketing's **own on-site YouTube footage** (34 videos, from a 4.33K-subscriber channel). That is a first-hand E-E-A-T signal no competitor has.
5. Missing alt text and missing H1s on competitor pages; we have 0 issues.

## 2. Keyword → page map

| Page | Primary query | Secondary |
|---|---|---|
| `/` | real estate Islamabad / property dealer F-10 Markaz | Fatima Marketing, FGC Islamabad, plots on installments Islamabad |
| `/payment-plans/` | capital smart city payment plan 2026 | overseas east / executive block / phase 3 payment plan |
| `/projects/capital-smart-city/` | capital smart city islamabad | jade tower, hamilton hills, harmony park, district one |
| `/projects/mumtaz-city/` | mumtaz city islamabad | the pearl mumtaz city, sofia sapphire, icon viii |
| `/projects/top-city-1/` | top city 1 islamabad | top city plots near new airport |
| `/projects/kingdom-valley/` | kingdom valley islamabad | kingdom valley 3.5 marla, file exchange |
| `/projects/blue-world-city/` | blue world city islamabad | overseas block, downtown |
| `/projects/park-view-city/` | park view city islamabad | J block possession |
| `/projects/faisal-town/` | faisal town islamabad | faisal town phase 2 |
| `/projects/faisal-hills/` | faisal hills taxila | faisal hills phase 2 |
| `/projects/airport-green-garden/` | airport green garden islamabad | AGG green homes |
| `/projects/pechs-islamabad/` | pechs islamabad | pechs m block possession |
| `/projects/gandhara-city/` | gandhara city islamabad | gandhara city reality check |
| `/projects/taj-residencia/` | taj residencia islamabad | taj residencia lotus block |
| `/projects/multi-gardens-b17/` | b17 multi gardens | mpchs phase 2 |
| `/projects/d-17-islamabad/` | d-17 islamabad | margalla view housing society |

## 3. Technical SEO (implemented and verified)

Verified by `website/tools/uat/audit.py` across all 22 pages: **0 issues**.

- Unique `<title>` (≤ 60 chars) and meta description (≤ 160 chars) on every page
- Exactly one H1 per page, semantic H2/H3 structure, breadcrumb navigation
- `rel=canonical`, Open Graph and Twitter cards with a custom 1200×630 share image, `geo.*` meta for Islamabad
- JSON-LD on every page: `RealEstateAgent`+`LocalBusiness` (name, address, geo, phone, email, sameAs → FB/YT/IG, parentOrganization FGC), `WebSite`, `BreadcrumbList`, `FAQPage` (home plus every project), `GatedResidenceCommunity` with amenities and geo, `VideoObject` (YouTube and self-hosted, with real upload dates and durations), `ItemList`
- `sitemap.xml` (20 URLs) with an **image sitemap** of every society photo (helps Google Images for searches like “Kingdom Valley Islamabad”), `robots.txt`, `site.webmanifest`, `404.html` (noindex)
- Society pages carry real photos with descriptive alt text and captions, plus `GatedResidenceCommunity.image`
- **301 redirects from all 29 old fgoc.pk URLs** to their new equivalents (`vercel.json` + `_redirects`), so the old domain's links aren't lost
- All images have alt text (decorative ones use `alt=""`); WebP throughout, responsive `srcset`, lazy loading, explicit dimensions (CLS = 0)
- Self-hosted subset fonts (39 KB), no render-blocking third parties; YouTube and Maps load only on demand
- Lighthouse (redesign, 3 Nov 2026): **SEO 100, Accessibility 100, Best Practices 100 on every page**; Performance mobile 79–96 (the home page opens on a full-HD drone video), desktop 93–98; CLS 0 everywhere

## 4. Off-page plan (needs the client's accounts; in priority order)

1. **Google Business Profile already exists** (5.0 ★, 22 reviews; website field = fatimamarketing.com). Keep name, address and UAN identical to the site, confirm the office address (see notes: Allied Plaza vs Capital Business Center), add photos and ask every closed client for a review. New reviews can be added to the site’s testimonials in `site.mjs`.
2. **Google Search Console + Bing Webmaster Tools**: verify the domain, submit `/sitemap.xml`, and request indexing of `/payment-plans/` and the project pages.
3. **Own-channel backlinks (free, immediate):** add the matching project-page URL to the description of each of the 1,200+ YouTube videos (start with the 34 embedded on the site), plus the Facebook "Website" field, Instagram bio and WhatsApp Business profile.
4. **Portal profiles:** agency profiles on Zameen.com, Graana.com and OLX Property linking to the site; listings link back to the relevant project page.
5. **Developer dealer listings:** ask Capital Smart City (FDH), Mumtaz City, Kingdom Valley, etc. to list Fatima Marketing with a link on their "authorised dealers" pages.
6. **Local citations:** consistent name, address and phone on Pakistani business directories (e.g. Hamariweb, Brownbook PK, Cybo, Yellow Pages PK).
7. **Content cadence:** publish a payment-plan update (as an HTML table) whenever a developer revises prices, and refresh `lastmod`. Avoid "News & Events" (removed per the brief); keep updates inside project pages.

## 5. Domain

**fatimamarketing.com** is the domain on Fatima Marketing’s Google Business Profile and on their video tickers since 2023. It resolves today but serves no site (HTTP 403), so it is the canonical domain in `site.url`. `fgoc.pk`, FGC’s old site with 2022–2023 pages in the Wayback archive, is listed in `sameAs`. The hosting config 301-redirects any request on fgoc.pk to fatimamarketing.com, including all 29 old page paths, which keeps the old links working. ⚠ Confirm the client controls both domains. If the site should live elsewhere, change `site.url` and rebuild.
