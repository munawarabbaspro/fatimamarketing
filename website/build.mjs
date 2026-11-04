// Static site generator for Fatima Marketing. Zero dependencies (Node 18+).
//   node build.mjs            → production build in ./dist
//   node build.mjs --preview  → same (kept for compatibility; all testimonials are now real Google reviews)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, keyPoints, highlights, faqs, testimonials, googleProfile } from './src/data/site.mjs';
import { projects as baseProjects } from './src/data/projects.mjs';
import { plans, cscTerms } from './src/data/plans.mjs';
import { covers, gallery, extraVideos, posters, homeVideos, heroSlides, showcase } from './src/data/media.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const STATIC = join(ROOT, 'src/static');
const TODAY = new Date().toISOString().slice(0, 10);
const planBySlug = Object.fromEntries(plans.map((p) => [p.slug, p]));

// merge media into projects (extra videos appended, sorted newest first)
const projects = baseProjects.map((p) => ({
  ...p,
  logo: existsSync(join(STATIC, `assets/logos/${p.slug}.webp`)) ? p.slug : p.logo,
  cover: covers[p.slug],
  gallery: gallery[p.slug] || [],
  videos: [...p.videos, ...(extraVideos[p.slug] || [])].sort((a, b) => b.date.localeCompare(a.date)),
}));
const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
const allVideos = Object.fromEntries(projects.flatMap((p) => p.videos.map((v) => [v.yt, { ...v, project: p }])));

// ---------- helpers ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nb = (s = '') => esc(s).replace(/-/g, '‑'); // keep 'B-17', 'Top City-1' on one line
const md = (s = '') => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const abs = (p) => site.url.replace(/\/$/, '') + p;
const waLink = (text) => `https://wa.me/${site.phones.whatsapp.wa}?text=${encodeURIComponent(text)}`;
const iso = (sec) => `PT${Math.floor(sec / 60)}M${sec % 60}S`;
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthYear = (d) => { const t = new Date(d); return `${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`; };
const num = (s) => Number(String(s).split('(')[0].replace(/[^0-9]/g, '')) || 0;
const pkr = (n) => (n >= 1e7 ? `${+(n / 1e7).toFixed(2)} Crore` : `${+(n / 1e5).toFixed(1)} Lac`);
const pkrFull = (n) => 'Rs ' + Math.round(n).toLocaleString('en-PK');
const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const hash = (f) => createHash('md5').update(readFileSync(join(STATIC, f))).digest('hex').slice(0, 8);
const ASSET_V = { js: hash('assets/js/main.js') };
// CSS lives in three source files (base/desktop, tablet, phone) and is merged, minified and inlined into every page:
// no render-blocking stylesheet request (PageSpeed), and each layout layer stays separate in the source.
const CSS_FILES = ['main.css', 'layout-tablet.css', 'layout-mobile.css'];
const CSS = CSS_FILES.map((f) => readFileSync(join(STATIC, 'assets/css', f), 'utf8')).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}').trim();
const has = (p) => existsSync(join(STATIC, p));

// images: native-resolution stills (≤1920 + 800; 4:5 portraits ≤960 + 480) or legacy gallery stills (1280/640).
// Pixel sizes are read from the WebP headers, so srcset widths and width/height (no layout shift) are always exact.
const sizeCache = new Map();
const webpSize = (p) => {
  if (!sizeCache.has(p)) {
    const b = readFileSync(join(STATIC, p)), t = b.toString('ascii', 12, 16), n = b.readUInt32LE(21);
    sizeCache.set(p, t === 'VP8X' ? [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]
      : t === 'VP8L' ? [1 + (n & 0x3fff), 1 + ((n >>> 14) & 0x3fff)]
      : [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]);
  }
  return sizeCache.get(p);
};
const imgSrc = (name) => {
  const [dir, sm] = [['society', 800], ['society', 480], ['gallery', 640]].find(([d, w]) => has(`assets/${d}/${name}-${w}.webp`)) || ['gallery', 640];
  const s = `assets/${dir}/${name}-${sm}.webp`, l = `assets/${dir}/${name}.webp`, [sw] = webpSize(s), [lw, lh] = webpSize(l);
  return { s: '/' + s, l: '/' + l, sw, lw, w: lw, h: lh };
};
// Page-header photo: on screens ≥1181 px a native 1920 px 3:1 banner (tools/make_banners.py), else the 16:9 still.
const heroPic = (name, opts = {}) => {
  if (!has(`assets/society/banner-${name}.webp`)) return pic(name, '', { eager: true, sizes: '100vw', ...opts });
  const b = imgSrc(`banner-${name}`);
  return `<picture><source media="(min-width: 1181px)" srcset="${b.s} ${b.sw}w, ${b.l} ${b.lw}w" sizes="100vw" width="${b.w}" height="${b.h}">${pic(name, '', { eager: true, sizes: '100vw', ...opts })}</picture>`;
};
const heroPreload = (name) => {
  const i = imgSrc(name), b = has(`assets/society/banner-${name}.webp`) ? imgSrc(`banner-${name}`) : null;
  return b ? `<link rel="preload" as="image" media="(max-width: 1180px)" imagesrcset="${i.s} ${i.sw}w, ${i.l} ${i.lw}w" imagesizes="100vw" fetchpriority="high">\n<link rel="preload" as="image" media="(min-width: 1181px)" imagesrcset="${b.s} ${b.sw}w, ${b.l} ${b.lw}w" imagesizes="100vw" fetchpriority="high">\n`
    : `<link rel="preload" as="image" imagesrcset="${i.s} ${i.sw}w, ${i.l} ${i.lw}w" imagesizes="100vw" fetchpriority="high">\n`;
};
// pos: object-position focal point, so a wide or short frame never cuts off the subject
const pic = (name, alt = '', { cls = '', sizes = '(max-width: 700px) 100vw, 50vw', eager = false, pos = '' } = {}) => {
  const i = imgSrc(name);
  return `<img class="${cls}" src="${i.s}" srcset="${i.s} ${i.sw}w, ${i.l} ${i.lw}w" sizes="${sizes}" alt="${esc(alt)}" width="${i.w}" height="${i.h}"${pos ? ` style="object-position:${pos}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
};
const posterOf = (yt, fallback) => posters[yt] || fallback || 'mumtaz-city-1';

// ---------- icons ----------
const P = {
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor" stroke="none"/>',
  quote: '<path d="M10 7H6a2 2 0 0 0-2 2v4h5v5H4M20 7h-4a2 2 0 0 0-2 2v4h5v5h-5" />',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>',
  shieldCheck: '<path d="M12 3 4.5 6v5.6c0 4.5 3.1 8 7.5 9.4 4.4-1.4 7.5-4.9 7.5-9.4V6z"/><path d="m8.8 12.1 2.2 2.2 4.3-4.5"/>',
  calendarPay: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M12 12.6v5.2M13.8 13.4h-2.6a1.1 1.1 0 0 0 0 2.2h1.6a1.1 1.1 0 0 1 0 2.2H10"/>',
  route: '<circle cx="6" cy="18.5" r="2.2"/><path d="M8.2 18.5h7.3a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H13"/><path d="M18 10.5s-3-2.6-3-5a3 3 0 0 1 6 0c0 2.4-3 5-3 5z"/><circle cx="18" cy="5.5" r=".9" fill="currentColor"/>',
  globePin: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.5 3.9 5.5 3.9 9s-1.3 6.5-3.9 9c-2.6-2.5-3.9-5.5-3.9-9S9.4 5.5 12 3z"/>',
  fileCheck: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 14.6 2 2 4-4.1"/>',
  handshake: '<path d="m11 17 2 2a1.5 1.5 0 0 0 2.1-2.1"/><path d="m14 14 2.4 2.4a1.5 1.5 0 0 0 2.1-2.1l-3.8-3.8a2 2 0 0 0-2.8 0l-.9.9a1.5 1.5 0 0 1-2.1-2.1l2.8-2.8a3.5 3.5 0 0 1 4.3-.5l.6.4a2.6 2.6 0 0 0 1.5.4H21"/><path d="M21 4v10h-1.8M3 4v10l6.4 6.4a1.5 1.5 0 0 0 2.1-2.1M3 5h8"/>',
  home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11.5h13V9"/><path d="M10 20.5v-6h4v6"/>',
  building: '<path d="M3 21h18"/><path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h7A1.5 1.5 0 0 1 15 4.5V21"/><path d="M15 9h3.5A1.5 1.5 0 0 1 20 10.5V21"/><path d="M8.5 7h3M8.5 10.5h3M8.5 14h3M10 21v-3.5"/>',
  headset: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19c0 1.5-1.5 2.5-4 2.5h-2"/>',
  hardhat: '<path d="M3 18h18"/><path d="M4.5 18v-2.5A7.5 7.5 0 0 1 12 8a7.5 7.5 0 0 1 7.5 7.5V18"/><path d="M10 8.3V5.5h4v2.8"/><path d="M9 11.5v6.5M15 11.5v6.5"/>',
  clipboard: '<rect x="5" y="4.5" width="14" height="17" rx="2"/><path d="M9 4.5V3.6c0-.3.3-.6.6-.6h4.8c.3 0 .6.3.6.6v.9"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
  wallet: '<path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/><path d="M3 6.5A2.5 2.5 0 0 0 5.5 9h13a1.5 1.5 0 0 1 1.5 1.5V15h-4a2 2 0 0 1 0-4h4"/>',
};
const ico = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;
// Real brand marks (Simple Icons paths, official colours)
const BRAND = {
  wa: '<path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.91-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.11.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.9a11.82 11.82 0 0 0-3.48-8.41"/>',
  fb: '<circle cx="12" cy="12" r="12" fill="#0866FF"/><path fill="#fff" d="M15.6 15.47 16.1 12.2h-3.14v-2.12c0-.9.44-1.77 1.84-1.77h1.43V5.53s-1.3-.22-2.54-.22c-2.59 0-4.28 1.57-4.28 4.4v2.49H6.54v3.27h2.87V24h3.53v-8.53z"/>',
  yt: '<rect x="0" y="3.5" width="24" height="17" rx="5" fill="#FF0000"/><path fill="#fff" d="M9.6 8.4v7.2l6.2-3.6z"/>',
  ig: '<defs><radialGradient id="igg" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset=".05" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".6" stop-color="#d6249f"/><stop offset=".9" stop-color="#285AEB"/></radialGradient></defs><rect width="24" height="24" rx="6.5" fill="url(#igg)"/><rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4" fill="none" stroke="#fff" stroke-width="1.9"/><circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.9"/><circle cx="16.4" cy="7.6" r="1.05" fill="#fff"/>',
  google: '<path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29A12 12 0 0 0 0 12c0 1.94.47 3.76 1.29 5.38z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/>',
};
// Each Instagram mark gets its own gradient id: a shared id breaks when the first copy sits in a hidden element (closed menu).
let brandSeq = 0;
const brand = (n, cls = 'b') => { const id = n === 'ig' ? `igg${++brandSeq}` : '';
  return `<svg class="${cls} ${cls}--${n}" viewBox="0 0 24 24" aria-hidden="true">${id ? BRAND[n].replaceAll('igg', id) : BRAND[n]}</svg>`; };
const stars = (n = 5) => `<span class="stars" role="img" aria-label="${n} out of 5 stars">${'★'.repeat(n)}</span>`;

// ---------- reusable components ----------
const LOGO_PLATE = { 'taj-residencia': 'dark', 'pechs-islamabad': 'photo', 'd-17-islamabad': 'photo', 'kingdom-valley': 'round', 'blue-world-city': 'round' };
const societyBadge = (p, size = 'md') =>
  p.logo
    ? `<span class="badge badge--${size} badge--logo badge--${LOGO_PLATE[p.slug] || 'light'}"><img src="/assets/logos/${p.logo}-160.webp" srcset="/assets/logos/${p.logo}-160.webp 160w, /assets/logos/${p.logo}.webp 320w" sizes="${{ sm: '48px', md: '72px', lg: '104px' }[size] || '72px'}" alt="${esc(p.name)}${LOGO_PLATE[p.slug] === 'photo' ? '' : ' logo'}" width="160" height="160" loading="lazy" decoding="async"></span>`
    : `<span class="badge badge--${size} badge--mono" aria-hidden="true"><span>${esc(p.mono)}</span></span>`;

const projectOptions = () => ['General enquiry', ...projects.flatMap((p) => [p.name, ...(p.sub || []).map((s) => `${s.name} (${p.name})`)])].map((o) => `<option>${esc(o)}</option>`).join('');

let formCount = 0;
const enquiryForm = ({ project = 'General enquiry', title = 'Send an enquiry', sub = 'We usually reply on WhatsApp within working hours.', variant = '' } = {}) => {
  const id = `f${++formCount}`;
  return `<form class="enquiry ${variant}" data-enquiry novalidate aria-labelledby="${id}-t">
  <div class="enquiry__head"><h3 id="${id}-t">${esc(title)}</h3><p>${esc(sub)}</p></div>
  <div class="grid2">
    <label class="fld"><span>Full name *</span><input name="name" autocomplete="name" required minlength="2" placeholder="e.g. Ahmed Raza"></label>
    <label class="fld"><span>Phone / WhatsApp *</span><input name="phone" type="tel" autocomplete="tel" required placeholder="03XX-XXXXXXX or +971…"></label>
  </div>
  <div class="grid2">
    <label class="fld"><span>Email</span><input name="email" type="email" autocomplete="email" placeholder="optional"></label>
    <label class="fld"><span>City / country</span><input name="city" autocomplete="address-level2" placeholder="e.g. Islamabad, Dubai"></label>
  </div>
  <label class="fld"><span>Project</span><select name="project">${projectOptions().replace(`<option>${esc(project)}</option>`, `<option selected>${esc(project)}</option>`)}</select></label>
  <div class="grid2">
    <label class="fld"><span>Interested in</span><select name="interest"><option>Residential plot</option><option>Commercial plot</option><option>House / villa</option><option>Apartment</option><option>Farmhouse</option><option>Latest payment plan</option><option>Resale / file transfer</option><option>Site visit</option><option>Investment advice</option></select></label>
    <label class="fld"><span>Size or budget</span><input name="size" placeholder="e.g. 10 Marla / Rs 50 lac"></label>
  </div>
  <fieldset class="fld fld--radios"><legend>Payment preference</legend>
    <label><input type="radio" name="payment" value="Installments" checked> Installments</label>
    <label><input type="radio" name="payment" value="Cash / lump sum"> Cash / lump sum</label>
    <label><input type="radio" name="payment" value="Not sure yet"> Not sure</label>
  </fieldset>
  <label class="fld"><span>Message</span><textarea name="message" rows="3" placeholder="Anything we should know: preferred block, timeline, questions…"></textarea></label>
  <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
  <p class="fld-error" role="alert" hidden></p>
  <button class="btn btn--wa btn--block" type="submit">${brand('wa', 'i')} Send enquiry on WhatsApp</button>
  <p class="enquiry__note">Or call our UAN <a href="tel:${site.phones.uan.tel}">${site.phones.uan.display}</a>. Your details are only used to answer this enquiry (<a href="/privacy-policy/">privacy</a>).</p>
  <div class="enquiry__done" hidden role="status" aria-live="polite">
    <div class="done-ic">${ico('check')}</div><h3>Thank you! Your enquiry is ready.</h3>
    <p>Reference <strong data-ref></strong>. WhatsApp should have opened with your message: just press <em>Send</em>.</p>
    <p><a class="btn btn--wa" data-wa-retry href="#" target="_blank" rel="noopener">${brand('wa', 'i')} Open WhatsApp again</a> <a class="btn btn--outline" href="tel:${site.phones.uan.tel}">${ico('phone')} Call ${site.phones.uan.display}</a></p>
  </div>
</form>`;
};

// Video card: clean poster frame, glass play button, duration + society chips. Plays the YouTube video inline.
const vcard = (v, { society = v.project?.name, cls = '' } = {}) => `<figure class="vcard ${cls}" data-tags="${v.project?.slug || ''}">
  <button class="vcard__btn" type="button" data-yt="${v.yt}" aria-label="Play video: ${esc(v.title)}${v.dur ? `, ${mmss(v.dur)}` : ''}">
    ${pic(posterOf(v.yt, v.project?.cover), '', { sizes: '(max-width: 700px) 100vw, 33vw' })}
    <span class="vcard__shade"></span>
    ${society ? `<span class="chip chip--glass vcard__soc" aria-hidden="true">${esc(society)}</span>` : ''}${v.dur ? `<span class="chip chip--dark vcard__dur" aria-hidden="true">${ico('play')} ${mmss(v.dur)}</span>` : ''}
    <span class="playbtn" aria-hidden="true"><span class="playbtn__ring"></span>${ico('play')}</span>
  </button>
  <figcaption><strong>${esc(v.title)}</strong><small>${brand('yt', 'i')} Fatima Marketing · ${monthYear(v.date)}</small></figcaption>
</figure>`;

const localVideoTile = ({ src, poster, title, preview = '', cls = '' }) => `<button class="vtile ${cls}" type="button" data-video="/assets/video/${src}" data-title="${esc(title)}" aria-label="Play video: ${esc(title)}" ${preview ? `data-preview="/assets/video/${preview}"` : ''}>
  ${pic(poster, '', { sizes: '(max-width: 980px) 100vw, 50vw' })}<span class="vcard__shade"></span>
  <span class="playbtn playbtn--sm" aria-hidden="true"><span class="playbtn__ring"></span>${ico('play')}</span><span class="vtile__t">${esc(title)}</span></button>`;

// Branded video player: poster + big glass play button + custom control bar (built by main.js).
const player = ({ src, poster, title, label = 'Play video', len = '' }) => `<div class="player" data-player>
  <video playsinline preload="none" aria-label="${esc(title)}"><source src="/assets/video/${src}" type="video/mp4"></video>
  ${poster.startsWith('/') ? `<img class="player__poster" src="${poster}" alt="" width="1920" height="1080" loading="lazy" decoding="async">` : pic(poster, '', { cls: 'player__poster', sizes: '(max-width: 980px) 100vw, 760px' })}
  <button class="player__start" type="button" aria-label="Play: ${esc(title)}"><span class="playbtn playbtn--lg"><span class="playbtn__ring"></span>${ico('play')}</span><span class="player__label">${esc(label)}${len ? ` <b>${len}</b>` : ''}</span></button>
</div>`;

const mapEmbed = (q, title) => `<div class="map">
  <iframe title="Map: ${esc(title)}" src="https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=13&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
  <a class="btn btn--ink map__btn" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}" target="_blank" rel="noopener">${ico('pin')} Get directions</a>
</div>`;

const faqList = (list, id = 'faq-list') => `<div class="faq" id="${id}">${list.map((f, i) => `<details class="faq__item"${i === 0 ? ' open' : ''}><summary><span>${esc(f.q)}</span>${ico('chev', 'i faq__chev')}</summary><div class="faq__a"><p>${md(f.a)}</p></div></details>`).join('')}</div>`;
const breadcrumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([n, u], i) => `<li>${i < items.length - 1 ? `<a href="${u}">${esc(n)}</a>` : `<span aria-current="page">${esc(n)}</span>`}</li>`).join('')}</ol></nav>`;

// ---------- payment plans ----------
const planFrom = (p) => (p.calc?.transposed ? num(p.rows.at(-1)[1]) : Math.min(...p.rows.map((r) => num(r[p.fromCol || p.calc?.price || 1])).filter(Boolean)));
const cell = (row, [, col, , split]) => (split === undefined ? num(row[col]) : num(String(row[col]).split('/')[split]));
const breakdown = (p) => {
  const c = p.calc;
  if (c.transposed) {
    return p.head.slice(1).map((h, k) => {
      const col = k + 1, total = num(p.rows.at(-1)[col]);
      const parts = c.parts.map(([label, ri, count]) => {
        const raw = String(p.rows[ri][col]); const m = raw.match(/\(([\d,]+)\s*×/);
        const each = m ? num(m[1]) : num(raw); return { label, each, count, sum: each * count };
      });
      return { size: h.split('·')[0].trim(), sub: h.split('·')[1]?.trim() || '', total, parts };
    });
  }
  return p.rows.map((r) => {
    const parts = c.parts.map((spec) => { const each = cell(r, spec); return { label: spec[0], each, count: spec[2], sum: each * spec[2] }; });
    return { size: r[0].replace(/\s*\(.*\)/, ''), sub: (r[0].match(/\((.*)\)/) || [])[1] || '', total: num(r[c.price]), parts };
  });
};
const SEG = ['seg1', 'seg2', 'seg3', 'seg4', 'seg5'];
const payBar = (b) => {
  const sum = b.parts.reduce((a, x) => a + x.sum, 0) || 1;
  return `<div class="pbar" role="img" aria-label="Payment split: ${b.parts.map((x) => `${x.label} ${Math.round((x.sum / sum) * 100)}%`).join(', ')}">${b.parts.map((x, i) => `<span class="pbar__s ${SEG[i]}" style="--w:${((x.sum / sum) * 100).toFixed(2)}%"></span>`).join('')}</div>`;
};

const planCard = (p) => {
  const b = breakdown(p); const first = b.reduce((a, x) => (x.total < a.total ? x : a), b[0]);
  const down = Math.round((first.parts[0].sum / first.total) * 100);
  const inst = first.parts.reduce((a, x) => (x.count > a.count ? x : a), first.parts[0]);
  return `<article class="pcard" data-reveal>
  <header class="pcard__h"><span class="chip chip--gold">${esc(p.category)}</span><span class="pcard__ten">${ico('clock')} ${esc(p.tenure)}</span></header>
  <h3>${esc(p.title.split(':')[0])}</h3>
  <p class="pcard__from"><small>Starting from</small><strong>Rs ${pkr(planFrom(p))}</strong><em>${esc(first.size)}${first.sub ? ` · ${esc(first.sub)}` : ''}</em></p>
  ${payBar(first)}
  <ul class="pcard__facts"><li><b>${down}%</b><span>${esc(first.parts[0].label.split(' (')[0].toLowerCase())}</span></li><li><b>${inst.count} ×</b><span>${esc(inst.label.split(' ')[0].toLowerCase())}</span></li><li><b>${b.length}</b><span>${b.length === 1 ? 'size' : 'sizes'}</span></li></ul>
  <footer class="pcard__f"><a class="btn btn--gold btn--sm" href="/payment-plans/#${p.slug}">View full plan ${ico('arrow')}</a><a class="btn btn--icon btn--wa" href="${waLink(`Assalam o Alaikum Fatima Marketing, please share the latest details of: ${p.title} (Capital Smart City).`)}" target="_blank" rel="noopener" aria-label="Ask about ${esc(p.title)} on WhatsApp">${brand('wa', 'i')}</a></footer>
</article>`;
};

const planTable = (p) => `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(p.title)} full schedule"><table class="plan-table">
  <caption>${esc(p.title)}: amounts in PKR</caption>
  <thead><tr>${p.head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
  <tbody>${p.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody>
</table></div>`;

let planUid = 0;
const planBlock = (p, { heading = 'h3' } = {}) => {
  const b = breakdown(p); const uid = `pl${++planUid}`;
  return `<article class="plan" id="${p.slug}" data-reveal>
  <div class="plan__head">
    <div><p class="kicker">${esc(p.category)} · ${esc(p.tenure)}</p><${heading} class="plan__t">${esc(p.title)}</${heading}><p class="plan__offer">${esc(p.offer)}</p>${p.validity ? `<p class="plan__valid">${ico('clock')} ${esc(p.validity)}</p>` : ''}</div>
    <button class="plan__img" type="button" data-lightbox="/assets/plans/${p.img}.webp" data-caption="${esc(p.title)}: original developer schedule" aria-label="Original schedule: ${esc(p.title)} (open image)">
      <img src="/assets/plans/${p.img}-480.webp" alt="" width="480" height="320" loading="lazy" decoding="async"><span>${ico('expand')} Original schedule</span></button>
  </div>
  <div class="sizes-tabs" role="tablist" aria-label="Choose a size">${b.map((x, i) => `<button type="button" role="tab" id="${uid}-t${i}" aria-controls="${uid}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-size-tab="${i}">${esc(x.size)}</button>`).join('')}</div>
  ${b.map((x, i) => {
    const sum = x.parts.reduce((a, y) => a + y.sum, 0) || 1;
    return `<div class="calc" role="tabpanel" id="${uid}-p${i}" aria-labelledby="${uid}-t${i}" data-size-panel="${i}" ${i ? 'hidden' : ''}>
      <div class="calc__total"><small>Total price${x.sub ? ` · ${esc(x.sub)}` : ''}</small><strong>${pkrFull(x.total)}</strong><span>${pkr(x.total)}</span></div>
      <div class="calc__main">${payBar(x)}
        <ol class="steps">${x.parts.map((y, j) => `<li class="step"><span class="dot ${SEG[j]}"></span><span class="step__l">${esc(y.label)}</span><span class="step__v">${y.count > 1 ? `<b>${y.count} ×</b> ` : ''}${pkrFull(y.each)}</span><span class="step__p">${Math.round((y.sum / sum) * 100)}%</span></li>`).join('')}</ol>
      </div>
    </div>`;
  }).join('')}
  ${p.calc.note ? `<p class="plan__note">${esc(p.calc.note)}</p>` : ''}
  <details class="plan__more"><summary>${ico('table')} Full schedule &amp; terms ${ico('chev', 'i chev')}</summary>${planTable(p)}<ul class="plan__notes">${p.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></details>
  <div class="plan__cta"><button class="btn btn--gold" type="button" data-enquire="Capital Smart City" data-interest="Latest payment plan" data-msg="Please confirm current price & availability: ${esc(p.title)}">Check availability</button>
  <a class="btn btn--wa" href="${waLink(`Assalam o Alaikum Fatima Marketing, please share the latest details of: ${p.title} (Capital Smart City).`)}" target="_blank" rel="noopener">${brand('wa', 'i')} Ask on WhatsApp</a></div>
</article>`;
};

// ---------- JSON-LD ----------
const orgId = abs('/#organization');
const ldOrg = () => ({
  '@context': 'https://schema.org', '@type': ['RealEstateAgent', 'LocalBusiness'], '@id': orgId,
  name: site.name, alternateName: ['Fatima Marketing Islamabad', 'FGC Fatima Marketing'], slogan: site.tagline, description: site.description,
  url: abs('/'), logo: abs('/assets/logos/fm-logo.png'), image: abs('/assets/img/og-fatima-marketing.jpg'),
  telephone: site.phones.uan.tel, email: site.email,
  address: { '@type': 'PostalAddress', streetAddress: site.address.street, addressLocality: site.address.city, addressRegion: site.address.region, postalCode: site.address.postal, addressCountry: site.address.country },
  geo: { '@type': 'GeoCoordinates', latitude: site.address.geo.lat, longitude: site.address.geo.lng },
  hasMap: googleProfile.url,
  areaServed: [{ '@type': 'City', name: 'Islamabad' }, { '@type': 'City', name: 'Rawalpindi' }],
  contactPoint: [
    { '@type': 'ContactPoint', telephone: site.phones.uan.tel, contactType: 'sales', areaServed: 'PK', availableLanguage: ['en', 'ur'] },
    { '@type': 'ContactPoint', telephone: '+' + site.phones.whatsapp.wa, contactType: 'customer service', areaServed: 'PK', availableLanguage: ['en', 'ur'] },
  ],
  sameAs: Object.values(site.social).map((s) => s.url),
  parentOrganization: { '@type': 'Organization', name: 'Fatima Group of Companies (FGC)' },
  knowsAbout: projects.map((p) => p.name),
});
const ldWebsite = () => ({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': abs('/#website'), url: abs('/'), name: site.name, publisher: { '@id': orgId }, inLanguage: 'en-PK' });
const ldCrumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: abs(u) })) });
const ldFaq = (list) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/\*\*/g, '') } })) });
const ldYt = (v) => ({ '@context': 'https://schema.org', '@type': 'VideoObject', name: v.title, description: `${v.title}: Fatima Marketing, Islamabad.`, thumbnailUrl: [abs(imgSrc(posterOf(v.yt)).l), `https://i.ytimg.com/vi/${v.yt}/hqdefault.jpg`], uploadDate: v.date, ...(v.dur ? { duration: iso(v.dur) } : {}), embedUrl: `https://www.youtube.com/embed/${v.yt}`, contentUrl: `https://www.youtube.com/watch?v=${v.yt}`, publisher: { '@id': orgId } });
const ldLocalVideo = ({ title, desc, src, poster, date, dur }) => ({ '@context': 'https://schema.org', '@type': 'VideoObject', name: title, description: desc, thumbnailUrl: abs(imgSrc(poster).l), uploadDate: date, duration: iso(dur), contentUrl: abs(`/assets/video/${src}`), publisher: { '@id': orgId } });
// RDA/Taxila/Rawalpindi societies are in Punjab; CDA sectors in the Islamabad Capital Territory
const regionOf = (p) => (/Taxila|Rawalpindi|RDA/.test(`${p.approval} ${p.location}`) ? 'Punjab' : /CDA|ICT|Capital Territory/.test(`${p.approval} ${p.location}`) ? 'Islamabad Capital Territory' : '');
const ldPlace = (p) => ({
  '@context': 'https://schema.org', '@type': 'GatedResidenceCommunity', '@id': abs(`/projects/${p.slug}/#place`), name: p.name, description: p.metaDesc, url: abs(`/projects/${p.slug}/`),
  image: p.gallery.map(([n]) => abs(imgSrc(n).l)),
  address: { '@type': 'PostalAddress', streetAddress: p.area, ...(regionOf(p) ? { addressRegion: regionOf(p) } : {}), addressCountry: 'PK' },
  ...(p.geo ? { geo: { '@type': 'GeoCoordinates', latitude: p.geo.lat, longitude: p.geo.lng } } : {}),
  hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.mapQuery)}`,
  ...(p.logo ? { logo: abs(`/assets/logos/${p.logo}.webp`) } : {}),
  amenityFeature: (p.amenities || []).map((a) => ({ '@type': 'LocationFeatureSpecification', name: a, value: true })),
});

// ---------- layout ----------
const WA_HELLO = 'Assalam o Alaikum Fatima Marketing, I need property information.';
const navProjects = () => projects.map((p) => `<li><a href="/projects/${p.slug}/"><span class="dd__img">${pic(p.cover, '', { sizes: '64px' })}</span><span><strong>${nb(p.name)}</strong><small>${esc(p.area)}</small></span></a></li>`).join('');

const header = (path) => `<a class="skip" href="#main">Skip to content</a>
<div class="topbar"><div class="wrap topbar__in">
  <span>${ico('pin')} ${esc(site.address.line1)}, ${esc(site.address.line2)}</span>
  <span class="topbar__r"><a href="tel:${site.phones.uan.tel}">${ico('phone')} UAN ${site.phones.uan.display}</a><a href="${waLink(WA_HELLO)}" target="_blank" rel="noopener">${brand('wa', 'i')} ${site.phones.whatsapp.display}</a><a href="mailto:${site.email}">${ico('mail')} ${site.email}</a>
  <span class="topbar__soc"><a href="${site.social.facebook.url}" target="_blank" rel="noopener" aria-label="Facebook">${brand('fb', 'i')}</a><a href="${site.social.youtube.url}" target="_blank" rel="noopener" aria-label="YouTube">${brand('yt', 'i')}</a><a href="${site.social.instagram.url}" target="_blank" rel="noopener" aria-label="Instagram">${brand('ig', 'i')}</a></span></span>
</div></div>
<header class="hdr" data-hdr><div class="wrap hdr__in">
  <a class="brand" href="/" aria-label="Fatima Marketing: home"><img src="/assets/logos/fm-logo-320.webp" srcset="/assets/logos/fm-logo-320.webp 320w, /assets/logos/fm-logo.webp 640w" sizes="152px" alt="Fatima Marketing: Real Services for Real Estate" width="282" height="100"></a>
  <nav class="nav" aria-label="Main" data-nav>
    <ul class="nav__list">
      <li><a href="/"${path === '/' ? ' aria-current="page"' : ''}>Home</a></li>
      <li class="has-dd"><button class="nav__dd-btn" type="button" aria-expanded="false" aria-controls="dd-projects" data-dd>Projects ${ico('chev')}</button>
        <div class="dd" id="dd-projects"><ul class="dd__grid">${navProjects()}</ul><a class="dd__all" href="/projects/">View all ${projects.length} projects ${ico('arrow')}</a></div></li>
      <li><a href="/payment-plans/"${path === '/payment-plans/' ? ' aria-current="page"' : ''}>Payment Plans</a></li>
      <li><a href="/about/"${path === '/about/' ? ' aria-current="page"' : ''}>About</a></li>
      <li><a href="/contact/"${path === '/contact/' ? ' aria-current="page"' : ''}>Contact</a></li>
    </ul>
    <div class="nav__mob-cta"><a class="btn btn--gold btn--block" href="tel:${site.phones.uan.tel}">${ico('phone')} Call UAN ${site.phones.uan.display}</a><a class="btn btn--wa btn--block" href="${waLink(WA_HELLO)}" target="_blank" rel="noopener">${brand('wa', 'i')} WhatsApp ${site.phones.whatsapp.display}</a></div>
  </nav>
  <div class="hdr__cta"><a class="hdr__tel" href="tel:${site.phones.uan.tel}"><span class="hdr__tel-ic">${ico('phone')}</span><span><small>Call UAN</small>${site.phones.uan.display}</span></a><button class="btn btn--ink" type="button" data-enquire="General enquiry" data-interest="Site visit">${ico('calendar')} Book a site visit</button></div>
  <button class="burger" type="button" aria-label="Open menu" aria-expanded="false" data-burger>${ico('menu')}</button>
</div></header>`;

const footer = () => `<footer class="ftr"><div class="wrap ftr__grid">
  <div class="ftr__brand"><img src="/assets/logos/fm-logo-white.webp" alt="Fatima Marketing" width="240" height="85" loading="lazy">
    <p>${esc(site.name)} is part of ${esc(site.group.name)}, with ${esc(site.stats[1].value)}+ years of real services for real estate across Islamabad & Rawalpindi.</p>
    <div class="soc"><a href="${site.social.facebook.url}" target="_blank" rel="noopener" aria-label="Facebook: ${site.socialStats.facebook.followersShort} followers">${brand('fb', 'i')}</a><a href="${site.social.youtube.url}" target="_blank" rel="noopener" aria-label="YouTube: ${site.socialStats.youtube.subscribers} subscribers">${brand('yt', 'i')}</a><a href="${site.social.instagram.url}" target="_blank" rel="noopener" aria-label="Instagram">${brand('ig', 'i')}</a><a href="${googleProfile.url}" target="_blank" rel="noopener" aria-label="Google reviews: ${googleProfile.rating} stars">${brand('google', 'i')}</a></div></div>
  <div><h2 class="ftr__h">Projects</h2><ul class="ftr__links ftr__links--2">${projects.map((p) => `<li><a href="/projects/${p.slug}/">${esc(p.name)}</a></li>`).join('')}</ul></div>
  <div><h2 class="ftr__h">Quick links</h2><ul class="ftr__links"><li><a href="/">Home</a></li><li><a href="/projects/">All projects</a></li><li><a href="/payment-plans/">Payment plans</a></li><li><a href="/about/">About FGC</a></li><li><a href="/contact/">Contact & team</a></li><li><a href="/sitemap.xml">Sitemap</a></li><li><a href="/privacy-policy/">Privacy policy</a></li></ul></div>
  <div><h2 class="ftr__h">Contact</h2><ul class="ftr__contact">
    <li>${ico('pin')}<span>${esc(site.address.line1)},<br>${esc(site.address.line2)}</span></li>
    <li>${ico('phone')}<a href="tel:${site.phones.uan.tel}">UAN ${site.phones.uan.display}</a></li>
    <li>${brand('wa', 'i')}<a href="${waLink('Assalam o Alaikum Fatima Marketing')}" target="_blank" rel="noopener">WhatsApp ${site.phones.whatsapp.display}</a></li>
    <li>${ico('mail')}<a href="mailto:${site.email}">${site.email}</a></li>
    ${site.hours ? `<li>${ico('clock')}<span>${esc(site.hours)}</span></li>` : ''}</ul></div>
</div>
<div class="ftr__bar"><div class="wrap ftr__bar-in"><span>© ${new Date().getFullYear()} ${esc(site.name)} · ${esc(site.group.name)}. All rights reserved.</span><span>Prices & payment plans are set by developers and may change without notice.</span></div>
  <p class="ftr__credit">Designed &amp; developed by <b>${esc(site.credit.by)}</b> <span>· ${esc(site.credit.place)}</span></p></div></footer>
<nav class="mbar" aria-label="Quick contact"><a href="tel:${site.phones.uan.tel}">${ico('phone')}<span>Call</span></a><a class="mbar__wa" href="${waLink(WA_HELLO)}" target="_blank" rel="noopener">${brand('wa', 'i')}<span>WhatsApp</span></a><button type="button" data-enquire="General enquiry">${ico('mail')}<span>Enquire</span></button></nav>
<a class="fab-wa" href="${waLink(WA_HELLO)}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${brand('wa', 'i')}</a>
<dialog class="modal" id="enquire-modal" aria-label="Enquiry form"><button class="modal__x" type="button" data-close aria-label="Close">${ico('close')}</button>${enquiryForm({ title: 'Get details & payment plan', sub: 'Tell us what you are looking for. We reply on WhatsApp.', variant: 'enquiry--modal' })}</dialog>
<dialog class="modal modal--media" id="media-modal" aria-label="Media viewer"><button class="modal__x" type="button" data-close aria-label="Close">${ico('close')}</button><div class="media" data-media></div><p class="media__cap" data-media-cap></p></dialog>`;

const page = ({ path, title, desc, body, ld = [], og = '/assets/img/og-fatima-marketing.jpg', cls = '', preload = '', robots = 'index, follow, max-image-preview:large' }) => {
  const full = title.includes('Fatima Marketing') || title.length > 41 ? title : `${title} | Fatima Marketing`;
  return `<!doctype html>
<html lang="en-PK">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(path)}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#0f1115">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="website"><meta property="og:site_name" content="Fatima Marketing"><meta property="og:locale" content="en_PK">
<meta property="og:title" content="${esc(full)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${abs(path)}">
<meta property="og:image" content="${abs(og)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(full)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${abs(og)}">
<meta name="geo.region" content="PK-IS"><meta name="geo.placename" content="Islamabad"><meta name="geo.position" content="${site.address.geo.lat};${site.address.geo.lng}"><meta name="ICBM" content="${site.address.geo.lat}, ${site.address.geo.lng}">
<link rel="icon" href="/assets/icons/favicon.ico" sizes="any"><link rel="icon" type="image/png" href="/assets/icons/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/manrope-latin-var.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/marcellus-latin.woff2" as="font" type="font/woff2" crossorigin>
<script>document.documentElement.classList.add('js')</script>
${preload}<style>${CSS}</style>
${[ldOrg(), ldWebsite(), ...ld].map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('\n')}
${/^G-[A-Z0-9]+$/.test(site.forms.analyticsId) ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.forms.analyticsId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${site.forms.analyticsId}');</script>` : ''}
</head>
<body class="${cls}">
${header(path)}
<main id="main">${body}</main>
${footer()}
<script>window.FM=${JSON.stringify({ wa: site.phones.whatsapp.wa, uan: site.phones.uan.display, email: site.email, web3: site.forms.web3formsKey, site: site.url }).replace(/</g, '\\u003c')};</script>
<script src="/assets/js/main.js?v=${ASSET_V.js}" defer></script>
</body>
</html>`;
};

const secHead = ({ kicker, title, lead = '', light = false, h = 'h2', center = false }) => `<div class="sec__head${light ? ' sec__head--light' : ''}${center ? ' sec__head--center' : ''}" data-reveal><div><p class="kicker">${esc(kicker)}</p><${h} class="h2">${title}</${h}></div>${lead ? `<p class="sec__lead">${lead}</p>` : ''}</div>`;

// ---------- home sections ----------
const hero = () => `<section class="hero" aria-label="Featured societies" data-hero>
  <div class="hero__media"><picture><source media="(max-width: 980px)" srcset="/assets/img/${heroSlides[0].clip}-m-800.webp 800w, /assets/img/${heroSlides[0].clip}-m-1200.webp 1200w" sizes="100vw" width="1200" height="675"><img class="hero__img" src="/assets/img/${heroSlides[0].clip}-800.webp" srcset="/assets/img/${heroSlides[0].clip}-800.webp 800w, /assets/img/${heroSlides[0].clip}.webp 1920w" sizes="135vw" alt="" width="1920" height="713" fetchpriority="high" decoding="async"></picture>${heroSlides.map((s, i) => `<video class="hero__vid${i === 0 ? ' is-on' : ''}" muted loop playsinline preload="none" data-src="/assets/video/${s.clip}.mp4"${has(`assets/video/${s.clip}-m.mp4`) ? ` data-src-m="/assets/video/${s.clip}-m.mp4"` : ''} data-poster="/assets/img/${s.clip}.webp" data-poster-m="/assets/img/${s.clip}-m-800.webp" width="1600" height="900" aria-hidden="true"></video>`).join('')}<div class="hero__shade"></div></div>
  <div class="wrap hero__in">
    <div class="hero__copy">
      <p class="hero__chip"><span class="live"></span> ${site.stats[1].value}+ years · ${site.stats[0].value.toLocaleString()}+ clients · Islamabad &amp; Rawalpindi</p>
      <h1>Plots, villas &amp; apartments in Islamabad’s <em>leading societies</em></h1>
      <p class="hero__lead">Verified projects, the latest developer payment plans and guided site visits, all handled on WhatsApp by Fatima Marketing.</p>
      <div class="hero__btns"><a class="btn btn--gold btn--lg" href="/projects/">Explore projects ${ico('arrow')}</a><a class="btn btn--glass btn--lg" href="${waLink('Assalam o Alaikum Fatima Marketing, please share the latest payment plans.')}" target="_blank" rel="noopener">${brand('wa', 'i')} Get payment plans</a></div>
      <ul class="hero__proof"><li><span class="g">${brand('google', 'i')}</span><b>${googleProfile.rating}</b>${stars(5)}<span>${googleProfile.count} Google reviews</span></li><li>${brand('fb', 'i')}<b>${site.socialStats.facebook.followersShort}</b><span>followers</span></li><li>${brand('yt', 'i')}<b>${site.socialStats.youtube.subscribers}</b><span>subscribers</span></li></ul>
    </div>
  </div>
  <div class="hero__bar"><div class="wrap hero__bar-in">
    <div class="hero__slides">${heroSlides.map((s, i) => `<div class="hslide${i === 0 ? ' is-on' : ''}" data-slide="${i}" ${i ? 'hidden' : ''}>
      <p class="hslide__where">${ico('pin')} ${esc(s.where)}</p><p class="hslide__name">${esc(s.name)}</p>
      <ul>${s.facts.map((f) => `<li>${ico('check')} ${esc(f)}</li>`).join('')}</ul>
      <div class="hslide__btns"><button class="btn btn--glass btn--sm" type="button" data-yt-modal="${s.yt}" data-title="${esc(s.name)}: drone &amp; site visit">${ico('play')} Watch tour</button><a class="btn btn--gold btn--sm" href="/projects/${s.slug}/">View project ${ico('arrow')}</a></div>
    </div>`).join('')}</div>
    <div class="hero__tabs" role="tablist" aria-label="Featured societies">${heroSlides.map((s, i) => `<button role="tab" type="button" aria-selected="${i === 0}" data-go="${i}"><span class="bar"><i></i></span><span class="n">0${i + 1}</span>${esc(s.name)}</button>`).join('')}</div>
  </div></div>
</section>`;

const keyPointsSec = () => `<section class="kp" aria-labelledby="kp-t"><div class="wrap">
  <h2 class="kp__title" id="kp-t" data-reveal>Why buyers choose <span>Fatima Marketing</span></h2>
  <ul class="kp__grid">${keyPoints.map((k, i) => `<li class="kpc" data-reveal style="--d:${i * 80}ms">${pic(k.img, '', { sizes: '(max-width: 640px) 80vw, (max-width: 1180px) 33vw, 20vw', pos: k.pos })}<span class="kpc__shade"></span><div class="kpc__b"><span class="kpc__n">0${i + 1}</span><h3>${esc(k.title)}</h3><p>${esc(k.text)}</p></div></li>`).join('')}</ul>
</div></section>`;

const TYPE_TAGS = { 'Residential plots': 'plots', 'Commercial plots': 'commercial', Commercial: 'commercial', Villas: 'homes', Houses: 'homes', Apartments: 'apartments', Farmhouses: 'farmhouses', 'High-rise plots': 'commercial' };
const scard = (p, { i = 0 } = {}) => `<li data-tags="${[...new Set(p.types.map((t) => TYPE_TAGS[t] || 'plots'))].join(' ')}" data-reveal style="--d:${(i % 4) * 70}ms"><a class="scard" href="/projects/${p.slug}/">
  <span class="scard__media">${pic(p.cover, `${p.name}: ${(p.gallery.find(([n]) => n === p.cover) || [])[1] || 'site view'}`, { sizes: '(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw' })}<span class="scard__shade"></span><span class="chip chip--glass scard__area">${ico('pin')} ${esc(p.area)}</span></span>
  <span class="scard__b">${societyBadge(p, 'sm')}<span class="scard__t"><strong>${nb(p.name)}</strong><small>${esc(p.approval.split(/[;(]/)[0].trim())}</small></span></span>
  <span class="scard__tags">${p.types.slice(0, 3).map((t) => `<em>${esc(t)}</em>`).join('')}</span>
  <span class="scard__go">Explore project <span class="scard__arrow">${ico('arrow')}</span></span>
</a></li>`;
const filterChips = (group) => `<div class="filters" role="group" aria-label="Filter projects" data-filter-group="${group}">${[['all', 'All projects'], ['plots', 'Plots'], ['homes', 'Villas & houses'], ['apartments', 'Apartments'], ['commercial', 'Commercial'], ['farmhouses', 'Farmhouses']].map(([k, l], i) => `<button type="button" data-filter="${k}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>`;

const societiesSec = ({ intro = true } = {}) => `<section class="sec sec--paper" id="societies"><div class="wrap">
  ${intro ? secHead({ kicker: 'Projects we deal in', title: 'Choose your society', lead: 'Real photos from our own site visits. Tap a society for location, plot sizes, videos and the latest payment plan.' }) : ''}
  ${filterChips('soc')}
  <ul class="soc-grid" data-filter-target="soc">${projects.map((p, i) => scard(p, { i })).join('')}</ul>
</div></section>`;

const towersSec = () => {
  const m = bySlug['mumtaz-city'];
  const posterFor = { 'The Pearl': 'pearl-1', 'Sofia Sapphire': 'sofia-palace-facade', 'ICON VIII': 'icon-facade' };
  const previewFor = { 'The Pearl': 'hero-pearl.mp4', 'Sofia Sapphire': 'hero-sofia.mp4', 'ICON VIII': 'hero-icon.mp4' };
  return `<section class="sec towers" id="towers"><div class="wrap">
  ${secHead({ kicker: 'Featured in Mumtaz City', title: 'Apartments & towers', lead: 'Three landmark projects next to the M-1/M-2 interchange, minutes from New Islamabad Airport. Hover to preview, tap to watch.' })}
  <div class="towers__grid">${m.sub.map((s, i) => `<article class="tcard" data-reveal style="--d:${i * 90}ms">
    <button class="tcard__media" type="button" data-video="/assets/video/${s.video}" data-title="${esc(s.name)}: official video" data-preview="/assets/video/${previewFor[s.name]}" aria-label="Play video: ${esc(s.name)}">
      ${pic(posterFor[s.name], `${s.name}, Mumtaz City`, { sizes: '(max-width: 900px) 100vw, 33vw' })}<span class="vcard__shade"></span>
      <span class="playbtn" aria-hidden="true"><span class="playbtn__ring"></span>${ico('play')}</span>
    </button>
    <div class="tcard__b"><p class="kicker">${esc(s.kicker)}</p><h3>${esc(s.name)}</h3><p>${esc(s.text)}</p>
      <div class="tcard__btns"><button class="btn btn--gold btn--sm" type="button" data-enquire="${esc(s.name)} (Mumtaz City)" data-interest="Latest payment plan">Payment plan</button><a class="btn btn--outline btn--sm" href="/projects/mumtaz-city/#${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">Details ${ico('arrow')}</a></div></div>
  </article>`).join('')}</div>
</div></section>`;
};

const FEATURED_PLANS = ['phase-3-pre-launch-residential', 'overseas-prime-ii-residential', 'executive-block-residential', 'overseas-east-residential', 'residential-villas', 'one-capital-residences-jade-tower'];
const plansTeaser = () => `<section class="sec sec--ink plans-sec" id="payment-plans"><div class="wrap">
  ${secHead({ kicker: 'Capital Smart City · live developer schedules', title: 'Payment plans, made simple', lead: 'Pick a plan to see the full split: down payment, confirmation and every installment. Updated from the developer’s official schedules.', light: true })}
  <div class="pcards">${FEATURED_PLANS.map((s) => planCard(planBySlug[s])).join('')}</div>
  <p class="center"><a class="btn btn--gold btn--lg" href="/payment-plans/">See all ${plans.length} payment plans ${ico('arrow')}</a></p>
</div></section>`;

const videosSec = () => {
  const list = homeVideos.map(([slug, id]) => allVideos[id] || { yt: id, project: bySlug[slug], title: bySlug[slug].name, date: TODAY, dur: 0 });
  const f = list[0];
  const tags = [...new Set(list.map((v) => v.project.slug))];
  return `<section class="sec vids" id="development"><div class="wrap">
  ${secHead({ kicker: 'On site, not just on paper', title: 'Site visits &amp; drone tours', lead: `Real footage from our team’s visits. ${site.socialStats.youtube.videos}+ videos on our YouTube channel.` })}
  <div class="vids__grid">
    <div class="vplayer" data-vplayer data-reveal>
      <button class="vplayer__btn" type="button" data-yt="${f.yt}" aria-label="Play video: ${esc(f.title)}">${pic(posterOf(f.yt, f.project.cover), '', { sizes: '(max-width: 900px) 100vw, 60vw' })}<span class="vcard__shade"></span><span class="playbtn playbtn--lg" aria-hidden="true"><span class="playbtn__ring"></span>${ico('play')}</span></button>
      <div class="vplayer__meta"><span class="chip chip--gold" data-vp-soc>${esc(f.project.name)}</span><h3 data-vp-title>${esc(f.title)}</h3><p data-vp-sub>${brand('yt', 'i')} Fatima Marketing · ${monthYear(f.date)}${f.dur ? ` · ${mmss(f.dur)}` : ''}</p></div>
    </div>
    <div class="vlist" data-reveal>
      <div class="vlist__head"><strong>More tours</strong><a href="${site.social.youtube.url}" target="_blank" rel="noopener">${brand('yt', 'i')} Subscribe</a></div>
      <ul>${list.map((v, i) => `<li><button type="button" class="vrow${i === 0 ? ' is-on' : ''}" data-feature="${v.yt}" data-poster="${imgSrc(posterOf(v.yt, v.project.cover)).s}" data-title="${esc(v.title)}" data-soc="${esc(v.project.name)}" data-sub="Fatima Marketing · ${monthYear(v.date)}${v.dur ? ` · ${mmss(v.dur)}` : ''}">
        <span class="vrow__img">${pic(posterOf(v.yt, v.project.cover), '', { sizes: '120px' })}<span class="vrow__play">${ico('play')}</span>${v.dur ? `<span class="vrow__dur">${mmss(v.dur)}</span>` : ''}</span>
        <span class="vrow__t"><small>${esc(v.project.name)}</small><strong>${esc(v.title)}</strong><em>${monthYear(v.date)}</em></span></button></li>`).join('')}</ul>
    </div>
  </div>
</div></section>`;
};

const showcaseSec = () => `<section class="sec sec--paper" id="showcase"><div class="wrap">
  ${secHead({ kicker: 'Project showcase', title: 'See the places for yourself', lead: 'Full-HD frames from our drone and site-visit footage. Tap any photo to enlarge.' })}
  <div class="bento">${showcase.map(([n, cap], i) => `<button class="bento__item${i === 0 ? ' bento__item--xl' : ''}" type="button" data-lightbox="${imgSrc(n).l}" data-caption="${esc(cap)}" data-group="showcase" data-reveal style="--d:${(i % 4) * 60}ms">${pic(n, '', { sizes: i === 0 ? '(max-width: 700px) 100vw, 50vw' : '(max-width: 700px) 50vw, 25vw' })}<span class="bento__cap">${ico('pin')} ${esc(cap)}</span></button>`).join('')}</div>
</div></section>`;

const reviewCard = (t, dup = false) => `<figure class="rcard"${dup ? ' aria-hidden="true"' : ''}>
  <div class="rcard__top">${stars(5)}${brand('google', 'i rcard__g')}</div>
  <blockquote>${esc(t.text)}</blockquote>
  <figcaption><span class="rcard__av" style="--h:${(t.name.charCodeAt(0) * 37) % 360}">${esc(initials(t.name))}</span><span><strong>${esc(t.name)}</strong><small>${esc(t.meta)} · Google review</small></span></figcaption>
</figure>`;
const testimonialsSec = () => `<section class="sec reviews" id="testimonials"><div class="wrap">
  ${secHead({ kicker: 'Customer testimonials', title: 'What our clients say', lead: 'Real, unedited reviews from our Google Business Profile.' })}
  <div class="reviews__grid">
    <div class="rsum" data-reveal>
      <div class="rsum__g">${brand('google', 'i')} <span>Google reviews</span></div>
      <p class="rsum__score"><strong>${googleProfile.rating}</strong>${stars(5)}</p>
      <p class="rsum__count">Based on <b>${googleProfile.count} reviews</b> of Fatima Marketing, F-10 Markaz</p>
      <div class="rsum__bars">${[5, 4, 3, 2, 1].map((n) => `<span><i>${n}</i><b style="--w:${n === 5 ? 100 : 0}%"></b></span>`).join('')}</div>
      <a class="btn btn--outline btn--block" href="${googleProfile.url}" target="_blank" rel="noopener">Read all reviews on Google ${ico('arrow')}</a>
    </div>
    <div class="marquee" data-marquee aria-label="Customer reviews"><div class="marquee__track">${testimonials.map((t) => reviewCard(t)).join('')}</div></div>
  </div>
  <div class="social">
    <a class="social__card social__card--fb" href="${site.social.facebook.url}" target="_blank" rel="noopener" data-reveal>${brand('fb', 'i social__logo')}<span><strong><span data-count="11257">${site.socialStats.facebook.followers}</span></strong><em>Facebook followers</em><small>${site.socialStats.facebook.checkins} check-ins at our office</small></span><span class="social__go">Follow ${ico('arrow')}</span></a>
    <a class="social__card social__card--yt" href="${site.social.youtube.url}" target="_blank" rel="noopener" data-reveal style="--d:80ms">${brand('yt', 'i social__logo')}<span><strong>${site.socialStats.youtube.subscribers}</strong><em>YouTube subscribers</em><small>${site.socialStats.youtube.videos} videos · ${site.socialStats.youtube.views} views</small></span><span class="social__go">Subscribe ${ico('arrow')}</span></a>
    <a class="social__card social__card--ig" href="${site.social.instagram.url}" target="_blank" rel="noopener" data-reveal style="--d:160ms">${brand('ig', 'i social__logo')}<span><strong>${site.socialStats.instagram.posts}</strong><em>Instagram posts</em><small>${site.social.instagram.handle}</small></span><span class="social__go">Follow ${ico('arrow')}</span></a>
  </div>
</div></section>`;

const contactSec = () => `<section class="sec contact" id="contact"><div class="contact__bg">${pic('mumtaz-city-2', '', { sizes: '100vw' })}</div><div class="wrap contact__grid">
  <div class="contact__info" data-reveal>
    <p class="kicker">Let’s talk</p><h2 class="h2">Talk to a property advisor today</h2>
    <p>Tell us your budget and preferred society. We will send the latest plan, available plots and a site-visit slot.</p>
    <ul class="contact__list">
      <li><span class="ci">${ico('phone')}</span><span><small>UAN / call</small><a href="tel:${site.phones.uan.tel}">${site.phones.uan.display}</a></span></li>
      <li><span class="ci ci--wa">${brand('wa', 'i')}</span><span><small>WhatsApp</small><a href="${waLink('Assalam o Alaikum Fatima Marketing')}" target="_blank" rel="noopener">${site.phones.whatsapp.display}</a></span></li>
      <li><span class="ci">${ico('mail')}</span><span><small>Email us</small><a href="mailto:${site.email}">${site.email}</a></span></li>
      <li><span class="ci">${ico('pin')}</span><span><small>Visit our office</small>${esc(site.address.line1)}, ${esc(site.address.line2)}</span></li>
    </ul>
  </div>
  ${enquiryForm({ title: 'Send an enquiry', sub: 'Name, phone and project are enough to get started.' })}
</div></section>`;

const highlightsSec = () => `<section class="sec sec--paper hl" id="highlights"><div class="wrap">
  ${secHead({ kicker: 'Highlights nearby', title: 'Why the airport–motorway corridor', lead: 'Most of the societies we deal in sit between New Islamabad International Airport and the M-1/M-2 motorways, where Islamabad is growing fastest.' })}
  <ul class="hl__grid">${highlights.map((h, i) => `<li class="hcard" data-tilt data-reveal style="--d:${i * 70}ms">${pic(h.img, h.title, { sizes: '(max-width: 700px) 100vw, 20vw' })}<span class="hcard__shade"></span>
    <span class="chip chip--gold hcard__chip">${esc(h.chip)}</span><div class="hcard__b"><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p><small>${esc(h.credit)}</small></div></li>`).join('')}</ul>
</div></section>`;

const filmSec = () => `<section class="film" id="brand-film" aria-labelledby="film-t"><div class="wrap film__in">
  <div class="film__copy" data-reveal><p class="kicker">Fatima Marketing film</p><h2 class="h2" id="film-t">Real services for real estate, in 42 seconds</h2><p>Our projects, our numbers and how to reach us: The Pearl, Mumtaz City, Capital Smart City, a guided site visit and the ${projects.length} societies we deal in.</p></div>
  <div class="film__player" data-reveal>${player({ src: 'fatima-marketing-brand-film.mp4', poster: 'mumtaz-city-1', title: 'Fatima Marketing brand film', label: 'Watch the film', len: '0:42' })}</div>
</div></section>`;

const trustSec = () => `<section class="trust" aria-label="Fatima Marketing in numbers"><div class="trust__bg">${pic('team-taj', '', { sizes: '100vw' })}</div><div class="wrap trust__in">
  <blockquote class="trust__q" data-reveal>${ico('quote', 'i trust__qi')}<p>The trust of our clients is our asset.</p><cite>Fatima Group of Companies · on site with developers and clients</cite></blockquote>
  <div class="trust__stats">${site.stats.map((s, i) => `<div class="stat" data-reveal style="--d:${i * 80}ms"><strong><span data-count="${s.value}">${s.value.toLocaleString()}</span>${s.suffix}</strong><span>${esc(s.label)}</span></div>`).join('')}</div>
</div></section>`;

const faqSec = (list, title = 'Have questions in your mind?') => `<section class="sec" id="faqs"><div class="wrap faq-wrap">
  <div data-reveal><p class="kicker">FAQ</p><h2 class="h2">${esc(title)}</h2><p class="sec__lead">Straight answers to what buyers ask us most. Still unsure? Talk to us.</p>
    <div class="faq-help"><span class="ci">${ico('phone')}</span><span><small>Still have questions?</small><a href="tel:${site.phones.uan.tel}">${site.phones.uan.display}</a></span></div></div>
  ${faqList(list)}
</div></section>`;

const officeSec = () => `<section class="sec sec--paper" id="location"><div class="wrap office">
  <div class="office__info" data-reveal><p class="kicker">Live location</p><h2 class="h2">Visit our office in F-10 Markaz</h2>
    <div class="office__photos"><figure>${pic('office-studio', 'Fatima Marketing studio at the F-10 office', { sizes: '(max-width: 980px) 50vw, 560px' })}<figcaption>Our F-10 office</figcaption></figure><figure>${pic('team-site-visit', 'Fatima Marketing team on a site visit with clients', { sizes: '(max-width: 980px) 50vw, 560px' })}<figcaption>On site with clients</figcaption></figure></div>
    <p class="office__addr">${ico('pin')} <span>${esc(site.address.line1)},<br>${esc(site.address.line2)}</span></p>
    <p class="office__btns"><a class="btn btn--ink" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.address.mapQuery)}" target="_blank" rel="noopener">${ico('pin')} Get directions</a><a class="btn btn--outline" href="tel:${site.phones.uan.tel}">${ico('phone')} ${site.phones.uan.display}</a></p></div>
  <div data-reveal>${mapEmbed(site.address.mapQuery, 'Fatima Marketing office, F-10 Markaz Islamabad')}</div>
</div></section>`;

const ctaBand = (text = 'Ready to book or need advice?') => `<section class="cta-band"><div class="wrap cta-band__in"><h2>${esc(text)}</h2><div><a class="btn btn--ink" href="tel:${site.phones.uan.tel}">${ico('phone')} ${site.phones.uan.display}</a><a class="btn btn--wa" href="${waLink('Assalam o Alaikum Fatima Marketing, I would like to book / get advice.')}" target="_blank" rel="noopener">${brand('wa', 'i')} WhatsApp us</a></div></div></section>`;

// ---------- pages ----------
rmSync(DIST, { recursive: true, force: true });
const out = [];
// Cache busting: assets are served "immutable" for a year, so every /assets/ URL in a page carries a content hash.
// Replacing an image or video under the same name then reaches every visitor immediately.
const vCache = new Map();
const fingerprint = (html) => html.replace(/\/assets\/[\w./-]+\.(?:webp|png|jpe?g|svg|ico|mp4|woff2)(?![\w?])/g, (u) => {
  if (!vCache.has(u)) vCache.set(u, has(u.slice(1)) ? `${u}?v=${hash(u.slice(1))}` : u);
  return vCache.get(u);
});
const write = (path, html) => { const f = join(DIST, path, /\.(xml|txt|html|webmanifest)$/.test(path) ? '' : 'index.html'); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, /\.(xml|txt|webmanifest)$/.test(path) ? html : fingerprint(html)); out.push(path); };

// Home
write('/', page({
  path: '/', title: 'Fatima Marketing: Islamabad Real Estate & Payment Plans',
  desc: '17+ years in Islamabad real estate: plots, villas & apartments in Capital Smart City, Mumtaz City, Top City-1 & more. Latest payment plans: 0331-1111057.',
  preload: '<link rel="preload" as="image" media="(max-width: 980px)" imagesrcset="/assets/img/hero-mumtaz-m-800.webp 800w, /assets/img/hero-mumtaz-m-1200.webp 1200w" imagesizes="100vw" fetchpriority="high">\n<link rel="preload" as="image" media="(min-width: 981px)" imagesrcset="/assets/img/hero-mumtaz-800.webp 800w, /assets/img/hero-mumtaz.webp 1920w" imagesizes="135vw" fetchpriority="high">\n', cls: 'home',
  ld: [ldFaq(faqs), ldLocalVideo({ title: 'Fatima Marketing: Real Services for Real Estate (brand film)', desc: 'Fatima Marketing in 42 seconds: The Pearl, Mumtaz City, Capital Smart City, a guided site visit, our numbers and contact details.', src: 'fatima-marketing-brand-film.mp4', poster: 'mumtaz-city-1', date: '2026-11-03', dur: 42 })],
  body: hero() + keyPointsSec() + societiesSec() + towersSec() + plansTeaser() + videosSec() + showcaseSec() + testimonialsSec() + highlightsSec() + contactSec() + filmSec() + faqSec(faqs) + trustSec() + officeSec(),
}));

// Projects index
write('/projects/', page({
  path: '/projects/', title: 'Housing Societies in Islamabad & Rawalpindi',
  preload: heroPreload('mumtaz-city-1'),
  desc: '14 housing societies we deal in: Capital Smart City, Top City-1, Mumtaz City, Kingdom Valley, Blue World City, Park View City, Faisal Town & more.',
  ld: [ldCrumbs([['Home', '/'], ['Projects', '/projects/']]), { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/projects/${p.slug}/`), name: p.name })) }],
  body: `<section class="phero phero--img"><div class="phero__bg">${heroPic('mumtaz-city-1')}</div><div class="wrap phero__in">${breadcrumbs([['Home', '/'], ['Projects', '/projects/']])}<h1>Housing societies we deal in</h1><p>${projects.length} projects across Islamabad and Rawalpindi: leading societies near New Islamabad International Airport, the M-1/M-2 motorways and inside CDA sectors.</p></div></section>`
    + societiesSec({ intro: false }) + plansTeaser() + ctaBand(),
}));

// Project pages
const localMeta = { 'The Pearl': ['2026-10-31', 62], 'Sofia Sapphire': ['2025-09-15', 155], 'ICON VIII': ['2025-10-04', 59] };
for (const p of projects) {
  const path = `/projects/${p.slug}/`;
  const crumbs = [['Home', '/'], ['Projects', '/projects/'], [p.name, path]];
  const planList = (p.plans || []).map((s) => planBySlug[s]);
  const ld = [ldCrumbs(crumbs), ldPlace(p), ldFaq(p.faqs), ...p.videos.map(ldYt)];
  if (p.sub) p.sub.forEach((s) => ld.push(ldLocalVideo({ title: `${s.name}, ${p.name} Islamabad`, desc: s.text, src: s.video, poster: s.poster, date: localMeta[s.name][0], dur: localMeta[s.name][1] })));
  const subnav = [['overview', 'Overview'], ['photos', 'Photos'], ['location', 'Location'], ...(p.sub ? [['towers', 'Towers']] : []), ['plots', 'Plots'], ['plans', 'Payment plans'], ...(p.videos.length ? [['videos', 'Videos']] : []), ['faq', 'FAQ'], ['enquire', 'Enquire']];
  const body = `<section class="phero phero--project phero--img"><div class="phero__bg">${heroPic(p.cover)}</div><div class="wrap phero__in">
    ${breadcrumbs(crumbs)}
    <div class="phero__row">${societyBadge(p, 'lg')}<div><p class="kicker">${esc(p.area)}</p><h1>${esc(p.name)}${/Islamabad|Taxila/.test(p.name) ? '' : /Taxila/.test(p.area) ? ', Taxila' : ' Islamabad'}</h1><p class="phero__loc">${ico('pin')} ${esc(p.location)}</p></div></div>
    <ul class="chips">${[['Developer', p.developer], ['Approval', p.approval]].map(([k, v]) => `<li><small>${k}</small>${esc(v)}</li>`).join('')}<li><small>Available</small>${esc(p.types.join(' · '))}</li></ul>
    <div class="phero__btns"><button class="btn btn--gold btn--lg" type="button" data-enquire="${esc(p.name)}" data-interest="Latest payment plan">Get payment plan</button><a class="btn btn--wa btn--lg" href="${waLink(`Assalam o Alaikum Fatima Marketing, I am interested in ${p.name}. Please share details, availability and the latest payment plan.`)}" target="_blank" rel="noopener">${brand('wa', 'i')} WhatsApp</a><a class="btn btn--glass btn--lg" href="tel:${site.phones.uan.tel}">${ico('phone')} ${site.phones.uan.display}</a></div>
  </div></section>
  <nav class="subnav" aria-label="On this page"><div class="wrap"><ul>${subnav.map(([id, n]) => `<li><a href="#${id}">${n}</a></li>`).join('')}</ul></div></nav>
  <div class="wrap pgrid">
    <div class="pgrid__main">
      <section id="overview" class="psec"><h2 class="h2">About ${esc(p.name)}</h2>${p.intro.map((t) => `<p>${md(t)}</p>`).join('')}
        <dl class="facts">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>
      <section id="photos" class="psec"><h2 class="h2">${esc(p.name)} photos</h2><p class="muted">Frames from Fatima Marketing’s own site-visit and drone videos.</p>
        <div class="pgal pgal--${Math.min(p.gallery.length, 4)}">${p.gallery.map(([n, cap], i) => `<button type="button" class="pgal__item${i === 0 ? ' pgal__item--xl' : ''}" data-lightbox="${imgSrc(n).l}" data-caption="${esc(p.name)}: ${esc(cap)}" data-group="${p.slug}">${pic(n, `${p.name}: ${cap}`, { sizes: i === 0 ? '(max-width: 900px) 100vw, 50vw' : '(max-width: 900px) 50vw, 25vw' })}<span class="pgal__cap">${esc(cap)}</span></button>`).join('')}</div></section>
      <section id="location" class="psec"><h2 class="h2">Location & access</h2><p>${esc(p.location)}.</p>
        <ul class="ticks">${p.access.map((a) => `<li>${ico('check')} ${esc(a)}</li>`).join('')}</ul>${mapEmbed(p.mapQuery, p.name)}</section>
      ${p.sub ? `<section id="towers" class="psec"><h2 class="h2">Projects inside ${esc(p.name)}</h2>${p.sub.map((s) => `<article class="tower" id="${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">
          <div class="tower__media">${localVideoTile({ src: s.video, poster: s.name === 'The Pearl' ? 'pearl-1' : s.name === 'Sofia Sapphire' ? 'sofia-palace-facade' : s.poster, title: `${s.name}: official video` })}</div>
          <div class="tower__b"><p class="kicker">${esc(s.kicker)}</p><h3 class="h3">${esc(s.name)}</h3><p>${esc(s.text)}</p>
          ${s.units ? `<div class="units">${s.units.map((u) => localVideoTile({ src: u.video, poster: u.poster, title: `${s.name}: ${u.name}`, cls: 'vtile--sm' })).join('')}</div>` : ''}
          <div class="tower__gal">${(s.name === 'The Pearl' ? ['pearl-1', 'pearl-2', ...s.images.slice(2)] : s.images).map((n) => `<button type="button" data-lightbox="${imgSrc(n).l}" data-caption="${esc(s.name)}" data-group="${esc(s.name)}">${pic(n, `${s.name}, ${p.name}`, { sizes: '160px' })}</button>`).join('')}</div>
          <div class="tower__btns"><button class="btn btn--gold" type="button" data-enquire="${esc(s.name)} (${esc(p.name)})" data-interest="Latest payment plan">${esc(s.name)} payment plan</button><a class="btn btn--wa" href="${waLink(`Assalam o Alaikum Fatima Marketing, please share ${s.name} (${p.name}) floor plans and payment plan.`)}" target="_blank" rel="noopener">${brand('wa', 'i')} Ask on WhatsApp</a></div></div>
        </article>`).join('')}</section>` : ''}
      <section id="plots" class="psec"><h2 class="h2">Plot sizes${p.blocks ? ' & blocks' : ''}</h2>
        <div class="sizes">${Object.entries(p.sizes).map(([k, v]) => `<div class="sizes__g"><h3>${esc(k)}</h3><ul>${v.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
        ${p.blocks ? `<h3 class="h3 mt">Blocks & sub-projects</h3><ul class="pills">${p.blocks.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        <h3 class="h3 mt">Amenities</h3><ul class="ticks ticks--2">${p.amenities.map((a) => `<li>${ico('check')} ${esc(a)}</li>`).join('')}</ul></section>
      ${planList.length ? `<section id="plans" class="psec"><h2 class="h2">${esc(p.name)} payment plans</h2><p class="muted">${planList.length} developer schedules on file. Pick a plan, then a size, to see the exact split.</p>
        <ul class="plan-jump">${planList.map((pl) => `<li><a href="#${pl.slug}">${esc(pl.title.split(':')[0])}<small>from Rs ${pkr(planFrom(pl))}</small></a></li>`).join('')}</ul>
        ${planList.map((pl) => planBlock(pl)).join('')}
        <div class="terms"><h3>General terms (Future Developments Holdings)</h3><ul>${cscTerms.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div></section>`
      : `<section id="plans" class="psec plan-cta" data-reveal><span class="plan-cta__img">${pic(p.cover, '', { sizes: '160px' })}</span><div><h2 class="h2">${esc(p.name)} payment plan</h2><p>Developers revise ${esc(p.name)} prices and offers often. Get the <strong>current payment plan, available plots and prime-location charges</strong> on WhatsApp in minutes.</p><div class="plan__cta"><button class="btn btn--gold" type="button" data-enquire="${esc(p.name)}" data-interest="Latest payment plan">Request payment plan</button><a class="btn btn--wa" href="${waLink(`Assalam o Alaikum Fatima Marketing, please send the latest ${p.name} payment plan.`)}" target="_blank" rel="noopener">${brand('wa', 'i')} Get it on WhatsApp</a></div></div></section>`}
      ${p.videos.length ? `<section id="videos" class="psec"><h2 class="h2">${esc(p.name)} videos & site visits</h2><p class="muted">Recorded by Fatima Marketing on site.</p><div class="vgrid">${p.videos.map((v) => vcard({ ...v, project: p }, { society: null })).join('')}</div></section>` : ''}
      <section id="faq" class="psec"><h2 class="h2">${esc(p.name)} FAQs</h2>${faqList(p.faqs, `faq-${p.slug}`)}</section>
      <section class="psec related"><h2 class="h2">Related projects</h2><ul class="soc-grid soc-grid--3">${p.related.map((s, i) => scard(bySlug[s], { i })).join('')}</ul></section>
    </div>
    <aside class="pgrid__side" id="enquire"><div class="sticky">${enquiryForm({ project: p.name, title: `Enquire about ${p.name}`, sub: 'Get availability, prices and the latest payment plan on WhatsApp.' })}
      <div class="agent"><span class="ci">${ico('phone')}</span><span><small>Talk to an advisor</small><a href="tel:${site.phones.uan.tel}">${site.phones.uan.display}</a></span></div></div></aside>
  </div>
  ${ctaBand(`Interested in ${p.name}?`)}`;
  write(path, page({ path, title: p.seoTitle, desc: p.metaDesc, ld, body, cls: 'project', og: '/assets/img/og-fatima-marketing.jpg', preload: heroPreload(p.cover) }));
}

// Payment plans hub
write('/payment-plans/', page({
  path: '/payment-plans/', title: 'Capital Smart City Payment Plans 2026 (All Blocks)',
  desc: 'All 13 Capital Smart City payment plans on file: Overseas East, Prime, West, Executive, Phase 3, villas, Jade Tower & commercial plots.',
  ld: [ldCrumbs([['Home', '/'], ['Payment plans', '/payment-plans/']])],
  body: `<section class="phero phero--img"><div class="phero__bg">${pic('hero-plans', '', { eager: true, sizes: '100vw', pos: '50% 55%' })}</div><div class="wrap phero__in">${breadcrumbs([['Home', '/'], ['Payment plans', '/payment-plans/']])}<h1>Payment plans</h1><p>${plans.length} Capital Smart City schedules on file. Pick a plan and a size to see the exact split. For every other society we deal in, ask for the latest plan on WhatsApp; developers update them often.</p>
    <div class="phero__btns"><a class="btn btn--wa btn--lg" href="${waLink('Assalam o Alaikum Fatima Marketing, please share the latest payment plans.')}" target="_blank" rel="noopener">${brand('wa', 'i')} Plans for other societies</a></div></div></section>
  <div class="wrap pgrid"><div class="pgrid__main">
    <ul class="plan-jump plan-jump--wide">${plans.map((pl) => `<li><a href="#${pl.slug}">${esc(pl.title.split(':')[0])}<small>${esc(pl.category)} · from Rs ${pkr(planFrom(pl))}</small></a></li>`).join('')}</ul>
    ${plans.map((pl) => planBlock(pl, { heading: 'h2' })).join('')}
    <div class="terms"><h2 class="h3">General terms (Future Developments Holdings)</h2><ul>${cscTerms.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
    <section class="psec"><h2 class="h2">Payment plans for other societies</h2><ul class="soc-grid soc-grid--3">${projects.filter((p) => !p.plans).map((r, i) => scard(r, { i })).join('')}</ul></section>
  </div><aside class="pgrid__side" id="enquire"><div class="sticky">${enquiryForm({ project: 'Capital Smart City', title: 'Confirm a plan & availability', sub: 'Prices change often. We confirm the current rate before you pay.' })}</div></aside></div>`,
}));

// About
// Leadership: name, title and a one-line description (text only).
const teamList = () => `<ul class="leaders">${site.leadership.map((m, i) => `<li class="leader" data-reveal style="--d:${i * 70}ms"><strong>${esc(m.name)}</strong><small>${esc(m.role)}</small><p>${esc(m.about)}</p></li>`).join('')}</ul>`;
write('/about/', page({
  path: '/about/', title: 'About Fatima Marketing (FGC): 17+ Years in Islamabad',
  desc: 'Fatima Marketing is part of Fatima Group of Companies (FGC) with Fatima Associates and Fatima Construction & Builders: 17+ years in Islamabad real estate.',
  ld: [ldCrumbs([['Home', '/'], ['About', '/about/']])],
  body: `<section class="phero phero--img"><div class="phero__bg">${pic('hero-about', '', { eager: true, sizes: '100vw', pos: '60% 12%' })}</div><div class="wrap phero__in">${breadcrumbs([['Home', '/'], ['About', '/about/']])}<h1>Real services for real estate</h1><p>${esc(site.name)} is the real estate marketing company of ${esc(site.group.name)}, serving buyers, investors and overseas Pakistanis in Islamabad and Rawalpindi for ${site.stats[1].value}+ years.</p></div></section>
  <section class="sec"><div class="wrap about">
    <div data-reveal><p class="kicker">Who we are</p><h2 class="h2">Housing, construction & real estate marketing under one group</h2>
      <p>Fatima Group of Companies (FGC) is an emerging housing, construction and real estate marketing group in Pakistan. Through Fatima Marketing we work with Capital Smart City, Blue World City, Kingdom Valley, Park View City, Mumtaz City, Top City-1 and other leading societies of Islamabad and Rawalpindi.</p>
      <p>Our professional team uses the latest marketing techniques, from digital media to on-site drone video, to keep clients informed. We follow the changing trends of the real estate industry and share honest updates so our clients can make valuable investments. Our YouTube channel has published more than ${site.socialStats.youtube.videos} project videos since ${site.socialStats.youtube.since}.</p></div>
    <div class="about__img" data-reveal>${pic('team-taj', 'Fatima Marketing team with developers at Taj Residencia', { sizes: '(max-width: 900px) 100vw, 1100px' })}</div>
  </div></section>
  ${trustSec()}
  <section class="sec sec--paper"><div class="wrap">${secHead({ kicker: 'FGC: Fatima Group of Companies', title: 'Three companies, one promise' })}
    <ul class="cards3">${site.group.companies.map((c, i) => `<li class="card card--photo" data-reveal style="--d:${i * 80}ms"><span class="card__img">${pic(['team-training', 'fa-office', 'capital-smart-city-3'][i], ['Fatima Marketing team meeting', 'Fatima Associates office and signboard', 'Construction work at Capital Smart City'][i], { sizes: '(max-width: 980px) 100vw, 33vw', pos: ['50% 45%', '50% 40%', '50% 50%'][i] })}</span><div class="card__b"><h3 class="h3">${esc(c.name)}</h3><p>${esc(c.text)}</p></div></li>`).join('')}</ul></div></section>
  <section class="sec"><div class="wrap">${secHead({ kicker: 'Leadership', title: 'The people behind Fatima Marketing', lead: 'Our sales, technical and accounts teams are on the <a href="/contact/">contact page</a>.' })}${teamList()}</div></section>
  ${testimonialsSec()}${ctaBand()}`,
}));

// Contact
write('/contact/', page({
  path: '/contact/', title: 'Contact Fatima Marketing: UAN 0331-1111057',
  desc: 'Contact Fatima Marketing, Office No. 01, Allied Plaza, F-10 Markaz Islamabad. UAN 0331-1111057 · WhatsApp 0335-7777901 · fatimamarketing.isb@gmail.com.',
  ld: [ldCrumbs([['Home', '/'], ['Contact', '/contact/']])],
  body: `<section class="phero phero--img"><div class="phero__bg">${pic('blue-world-city-3', '', { eager: true, sizes: '100vw', pos: '50% 55%' })}</div><div class="wrap phero__in">${breadcrumbs([['Home', '/'], ['Contact', '/contact/']])}<h1>Contact us</h1><p>Call, WhatsApp, email or visit our office in F-10 Markaz. We answer every enquiry.</p></div></section>
  ${contactSec()}
  <section class="sec"><div class="wrap">${secHead({ kicker: 'Our team', title: 'Team members', lead: `${site.stats[2].value}+ people across sales, technical and accounts.` })}
    ${teamList()}
    <ul class="cards3 mt">${site.departments.map((d, i) => `<li class="card card--photo" data-reveal style="--d:${i * 80}ms"><span class="card__img">${pic(['team-site-visit', 'pechs-islamabad-1', 'office-desk'][i], '', { sizes: '(max-width: 980px) 100vw, 33vw' })}</span><div class="card__b"><h3 class="h3">${esc(d.name)}</h3><p>${esc(d.text)}</p></div></li>`).join('')}</ul></div></section>
  ${officeSec()}`,
}));

// Privacy
write('/privacy-policy/', page({
  path: '/privacy-policy/', title: 'Privacy Policy',
  desc: 'How Fatima Marketing uses the details you share through our website enquiry forms, WhatsApp and phone calls, and how to ask us to update or delete them.',
  body: `<section class="phero"><div class="wrap phero__in">${breadcrumbs([['Home', '/'], ['Privacy policy', '/privacy-policy/']])}<h1>Privacy policy</h1></div></section>
  <section class="sec"><div class="wrap prose">
    <p>Last updated: 4 November 2026.</p>
    <h2>What we collect</h2><p>When you send an enquiry we receive the details you type: name, phone/WhatsApp number, optional email, city, project of interest, budget and message.</p>
    <h2>How we use it</h2><p>Only to answer your enquiry: sending payment plans, availability, site-visit times and related updates. We do not sell or rent your details.</p>
    <h2>How it is sent</h2><p>Enquiries open WhatsApp with your message addressed to our official number (${site.phones.whatsapp.display}). If email delivery is enabled, a copy is sent to ${site.email} through a form-delivery service.</p>
    <h2>Third-party content</h2><p>Videos are embedded from YouTube (privacy-enhanced mode) and maps from Google Maps; these load only when you view them and are subject to their own policies. Customer reviews are quoted from our public Google Business Profile.</p>
    <h2>Your choices</h2><p>To update or delete your details, contact us at ${site.email} or ${site.phones.uan.display}.</p>
  </div></section>`,
}));

// 404
write('/404.html', page({ path: '/404.html', title: 'Page not found', robots: 'noindex', desc: 'The page you were looking for has moved. Browse our projects or contact Fatima Marketing.', body: `<section class="phero"><div class="wrap phero__in"><h1>Page not found</h1><p>This page may have moved since our new website launched. Try one of these:</p><div class="phero__btns"><a class="btn btn--gold" href="/projects/">All projects</a><a class="btn btn--glass" href="/payment-plans/">Payment plans</a><a class="btn btn--wa" href="${waLink('Assalam o Alaikum Fatima Marketing')}" target="_blank" rel="noopener">${brand('wa', 'i')} WhatsApp</a></div></div></section>${societiesSec()}` }));

// ---------- SEO files ----------
const urls = out.filter((u) => u.endsWith('/'));
const pri = (u) => (u === '/' ? '1.0' : u.startsWith('/projects/') || u === '/payment-plans/' ? '0.9' : u === '/privacy-policy/' ? '0.3' : '0.7');
const imgsFor = (u) => { const p = projects.find((x) => u === `/projects/${x.slug}/`); return p ? p.gallery.map(([n, cap]) => `<image:image><image:loc>${abs(imgSrc(n).l)}</image:loc><image:title>${esc(p.name)}: ${esc(cap)}</image:title></image:image>`).join('') : ''; };
write('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.map((u) => `  <url><loc>${abs(u)}</loc><lastmod>${TODAY}</lastmod><changefreq>${u === '/' || u === '/payment-plans/' ? 'weekly' : 'monthly'}</changefreq><priority>${pri(u)}</priority>${imgsFor(u)}</url>`).join('\n')}\n</urlset>\n`);
write('/robots.txt', `User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${abs('/sitemap.xml')}\n`);
write('/site.webmanifest', JSON.stringify({ name: 'Fatima Marketing', short_name: 'Fatima Mkt', description: site.tagline, start_url: '/', display: 'standalone', background_color: '#0f1115', theme_color: '#0f1115', icons: [{ src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 1));

// ---------- copy static + hosting config ----------
cpSync(STATIC, DIST, { recursive: true });
rmSync(join(DIST, 'assets/css'), { recursive: true, force: true }); // inlined into each page
const redirects = [
  ['/about-us/', '/about/'], ['/fatima-marketing/', '/about/'], ['/fatima-associates/', '/about/'], ['/fatima-construction-builders/', '/about/'],
  ['/top-city/', '/projects/top-city-1/'], ['/mumtaz-city/', '/projects/mumtaz-city/'], ['/gandhara-city/', '/projects/gandhara-city/'], ['/kingdom-valley/', '/projects/kingdom-valley/'],
  ['/park-view-city/', '/projects/park-view-city/'], ['/blue-world-city-plot-for-sale-in-blue-word-city-islamabad/', '/projects/blue-world-city/'], ['/taj-residencia/', '/projects/taj-residencia/'],
  ['/b17-multi-gardens/', '/projects/multi-gardens-b17/'], ['/capital-smart-city-islmabad/', '/projects/capital-smart-city/'], ['/2022/02/02/capital-smart-city-islamabad/', '/projects/capital-smart-city/'],
  ['/residential-projects/', '/projects/'], ['/commercial-projects/', '/projects/'], ['/property/', '/projects/'], ['/plot-for-sale-in-islamabad-on-installments/', '/projects/'],
  ['/2022/02/02/cda-approved-housing-societies/', '/projects/'], ['/2022/02/02/cda-issues-tenders-for-the-development-works-of-sector-e-12-4/', '/'], ['/blog/', '/'],
  ['/7-wonders-city/', '/projects/'], ['/eighteen-islamabad/', '/projects/'], ['/gulberg-islamabad/', '/projects/'], ['/ichs-town/', '/projects/'], ['/kmk-tower/', '/projects/'], ['/rose-heights/', '/projects/'], ['/rudn-enclave/', '/projects/'], ['/university-town/', '/projects/'],
];
writeFileSync(join(ROOT, '..', 'vercel.json'), JSON.stringify({
  $schema: 'https://openapi.vercel.sh/vercel.json',
  // generated by website/build.mjs: edit the redirects list there, not here
  framework: null, installCommand: '', buildCommand: 'node website/build.mjs', outputDirectory: 'website/dist',
  cleanUrls: true, trailingSlash: true,
  redirects: [
    { source: '/:path(.*)', has: [{ type: 'host', value: 'fgoc.pk' }], destination: `${site.url}/:path`, permanent: true },
    { source: '/:path(.*)', has: [{ type: 'host', value: 'www.fgoc.pk' }], destination: `${site.url}/:path`, permanent: true },
    ...redirects.map(([s, d]) => ({ source: s, destination: d, permanent: true })),
  ],
  headers: [
    { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }, { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }] },
  ],
}, null, 1) + '\n');

// ---------- report ----------
const size = (d) => readdirSync(d).reduce((a, f) => { const p = join(d, f); const s = statSync(p); return a + (s.isDirectory() ? size(p) : s.size); }, 0);
console.log(`Built ${out.length} files → dist (${(size(DIST) / 1048576).toFixed(1)} MB)`);
const missing = [...new Set([...projects.flatMap((p) => [p.cover, ...p.gallery.map(([n]) => n)]), ...showcase.map(([n]) => n), ...Object.values(posters), ...highlights.map((h) => h.img)])].filter((n) => !has(`assets/society/${n}-800.webp`) && !has(`assets/gallery/${n}-640.webp`));
if (missing.length) console.log('⚠ Missing images:', missing.join(', '));
if (!site.forms.web3formsKey) console.log('ℹ Email delivery off (forms → WhatsApp only). Add a Web3Forms key in src/data/site.mjs to also receive emails.');
if (!site.hours) console.log('ℹ Office hours not set (hidden).');
