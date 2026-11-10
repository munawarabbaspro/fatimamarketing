/* Fatima Marketing: site behaviour (v2). No dependencies. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const FM = window.FM || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverable = matchMedia('(hover: hover)').matches;
  const conn = navigator.connection || {};
  const lowData = reduce || conn.saveData || /(^|-)(2g|3g)$/.test(conn.effectiveType || '');
  const track = (event, data = {}) => { (window.dataLayer = window.dataLayer || []).push({ event, ...data }); if (window.gtag) window.gtag('event', event, data); };
  const ytSrc = (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  const ytFrame = (id, title) => { const f = document.createElement('iframe'); f.src = ytSrc(id); f.title = title || 'YouTube video'; f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen'; f.allowFullscreen = true; return f; };

  // ---------- header ----------
  const hdr = $('[data-hdr]');
  const onScroll = () => hdr && hdr.classList.toggle('is-scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); requestAnimationFrame(onScroll);

  $$('[data-dd]').forEach((btn) => {
    const li = btn.closest('.has-dd');
    const set = (open) => { li.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open); };
    const hoverMode = matchMedia('(hover: hover) and (min-width: 981px)');
    // On hover devices the menu is already open when the pointer arrives, so a click must not toggle it shut.
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(hoverMode.matches ? true : !li.classList.contains('is-open')); });
    if (hoverMode.matches) {
      let t; li.addEventListener('mouseenter', () => { clearTimeout(t); set(true); });
      li.addEventListener('mouseleave', () => { t = setTimeout(() => set(false), 180); });
    }
    document.addEventListener('click', (e) => { if (!li.contains(e.target)) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  });

  const burger = $('[data-burger]'), nav = $('[data-nav]');
  if (burger && nav) {
    const set = (open) => { nav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); document.body.classList.toggle('no-scroll', open); };
    burger.addEventListener('click', () => set(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }

  // ---------- hero: 1080p aerial loops ----------
  const hero = $('[data-hero]');
  if (hero) {
    const vids = $$('.hero__vid', hero), slides = $$('.hslide', hero), tabs = $$('[data-go]', hero);
    const DUR = 9000, small = matchMedia('(max-width: 760px)').matches; let i = 0, timer = null, visible = true;
    hero.style.setProperty('--slide', DUR / 1000 + 's');
    const load = (v, pre = 'auto') => { if (v !== vids[0] && !v.poster && v.dataset.poster) v.poster = (small && v.dataset.posterM) || v.dataset.poster; // slide 1 sits on the responsive hero image
      if (!lowData && !v.src && v.dataset.src) { v.preload = pre; v.src = (small && v.dataset.srcM) || v.dataset.src; } };
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      vids.forEach((v, k) => { const on = k === i; v.classList.toggle('is-on', on); if (on) { load(v); if (!lowData) v.play().catch(() => {}); } else v.pause(); });
      slides.forEach((s, k) => { s.hidden = k !== i; s.classList.toggle('is-on', k === i); });
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); const b = t.querySelector('.bar i'); if (b) { b.style.animation = 'none'; b.offsetWidth; b.style.animation = ''; } });
      schedule();
    };
    const schedule = () => { clearTimeout(timer); if (!reduce && visible && !document.hidden) timer = setTimeout(() => show(i + 1), DUR); };
    tabs.forEach((t) => t.addEventListener('click', () => { show(+t.dataset.go); track('hero_tab', { slide: t.textContent.trim() }); }));
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; hero.classList.toggle('is-paused', !visible); const v = vids[i]; if (visible) { if (!lowData && v.src) v.play().catch(() => {}); } else v.pause(); schedule(); }, { threshold: 0.2 }).observe(hero);
    document.addEventListener('visibilitychange', schedule);
    // The first frame is already on screen as the hero image (the LCP), so motion is a progressive enhancement:
    // the loop starts on the first interaction or after ~3 s of quiet, never during the initial load.
    let started = false;
    const start = () => { if (started) return; started = true; EV.forEach((t) => removeEventListener(t, start, opt));
      load(vids[0]); if (!lowData) vids[0].play().catch(() => {}); setTimeout(() => vids.slice(1).forEach((v) => load(v, 'metadata')), 3000); };
    const EV = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'], opt = { passive: true };
    EV.forEach((t) => addEventListener(t, start, opt));
    const later = () => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1500 }) : start()), 3000);
    if (document.readyState === 'complete') later(); else addEventListener('load', later);
    schedule();
  }

  // ---------- reveal, counters ----------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach((el) => io.observe(el));
    const co = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      const el = e.target, to = +el.dataset.count; if (reduce) return;
      const t0 = performance.now(), d = 1500;
      const step = (t) => { const p = Math.min(1, (t - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString(); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: 0.6 });
    $$('[data-count]').forEach((el) => co.observe(el));
  } else $$('[data-reveal]').forEach((el) => el.classList.add('is-in'));

  // ---------- review marquee: add the looping copy only when it scrolls into view (keeps the initial DOM small) ----------
  $$('[data-marquee]').forEach((m) => {
    if (reduce || !('IntersectionObserver' in window)) return;
    const mo = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; mo.disconnect();
      const t = m.querySelector('.marquee__track');
      [...t.children].forEach((c) => { const d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); d.inert = true; t.appendChild(d); });
      m.classList.add('is-looping'); }, { rootMargin: '300px' });
    mo.observe(m);
  });

  // ---------- 3D tilt (photo cards) ----------
  if (!reduce && hoverable) {
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg) translateY(-4px)`;
        el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // ---------- filters (society type) ----------
  $$('[data-filter-group]').forEach((g) => {
    const list = $(`[data-filter-target="${g.dataset.filterGroup}"]`); if (!list) return;
    g.addEventListener('click', (e) => {
      const b = e.target.closest('[data-filter]'); if (!b) return;
      $$('[data-filter]', g).forEach((x) => x.setAttribute('aria-pressed', x === b));
      const k = b.dataset.filter;
      [...list.children].forEach((li) => { const on = k === 'all' || (li.dataset.tags || '').split(' ').includes(k); li.classList.toggle('is-out', !on); if (on) { li.classList.remove('is-in'); requestAnimationFrame(() => li.classList.add('is-in')); } });
      track('filter', { value: k });
    });
  });

  // deep link from the "available units" tiles: /projects/mumtaz-city/?units=the-pearl-studio#units
  const wantUnits = new URLSearchParams(location.search).get('units');
  if (wantUnits) {
    const g = $('[data-filter-group="units"]'), list = $('[data-filter-target="units"]');
    if (g && list) {
      const b = $(`[data-filter="${CSS.escape(wantUnits)}"]`, g);
      if (b) b.click();
      else { $$('[data-filter]', g).forEach((x) => x.setAttribute('aria-pressed', 'false')); [...list.children].forEach((li) => li.classList.toggle('is-out', !(li.dataset.tags || '').split(' ').includes(wantUnits))); }
    }
  }

  // ---------- payment plan size tabs ----------
  $$('.plan').forEach((plan) => {
    const tabs = $$('[data-size-tab]', plan), panels = $$('[data-size-panel]', plan);
    const select = (n, focus) => {
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === n); t.tabIndex = k === n ? 0 : -1; });
      panels.forEach((p, k) => { p.hidden = k !== n; });
      if (focus) tabs[n].focus();
    };
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => select(k));
      t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); select((k + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length, true); } });
    });
  });

  // ---------- YouTube: inline facade (cards), featured player, modal ----------
  const toFrame = (el, id, title) => { let host = el; if (el.tagName === 'BUTTON') { host = document.createElement('div'); host.className = el.className; el.replaceWith(host); } host.replaceChildren(ytFrame(id, title)); return host; };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-yt]'); if (!b) return;
    const id = b.dataset.yt;
    toFrame(b, id, b.getAttribute('aria-label'));
    track('video_play', { source: 'youtube', id });
  });
  const vp = $('[data-vplayer]');
  if (vp) {
    document.addEventListener('click', (e) => {
      const r = e.target.closest('[data-feature]'); if (!r) return;
      $$('.vrow').forEach((x) => x.classList.toggle('is-on', x === r));
      const btn = $('.vplayer__btn', vp);
      toFrame(btn, r.dataset.feature, r.dataset.title);
      $('[data-vp-title]', vp).textContent = r.dataset.title; $('[data-vp-soc]', vp).textContent = r.dataset.soc;
      const sub = $('[data-vp-sub]', vp); sub.lastChild.textContent = ' ' + r.dataset.sub;
      if (innerWidth < 980) vp.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      track('video_play', { source: 'youtube-featured', id: r.dataset.feature });
    });
  }

  // ---------- tower hover previews (muted loops) ----------
  if (hoverable && !lowData) {
    $$('[data-preview]').forEach((m) => {
      let v;
      m.addEventListener('mouseenter', () => {
        if (!v) { v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.src = m.dataset.preview; v.setAttribute('aria-hidden', 'true'); m.insertBefore(v, m.children[1]); }
        v.play().then(() => m.classList.add('is-previewing')).catch(() => {});
      });
      m.addEventListener('mouseleave', () => { if (v) { v.pause(); m.classList.remove('is-previewing'); } });
    });
  }

  // ---------- branded video player (custom controls) ----------
  const SVG = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${d}</svg>`;
  const IC = {
    play: SVG('<path d="M8 5.5v13l10.5-6.5z"/>'), pause: SVG('<rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/>'),
    vol: SVG('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
    mute: SVG('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
    full: SVG('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
    back: SVG('<path d="M12 5V2L7.5 6 12 10V7a5 5 0 1 1-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><text x="12" y="15.2" font-size="6.5" text-anchor="middle" font-family="sans-serif" font-weight="700">10</text>'),
  };
  const fmt = (t) => (!isFinite(t) ? '0:00' : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`);
  function mountPlayer(w, { autoplay = false } = {}) {
    if (w._p) return w._p;
    const v = $('video', w); v.removeAttribute('controls');
    const bar = document.createElement('div'); bar.className = 'player__bar';
    bar.innerHTML = `<button type="button" class="pb pb--play" aria-label="Play">${IC.play}</button><button type="button" class="pb pb--back" aria-label="Back 10 seconds">${IC.back}</button>
      <span class="player__time"><b data-cur>0:00</b> / <span data-dur>0:00</span></span>
      <div class="player__track"><div class="player__buf"></div><div class="player__fill"></div><input type="range" min="0" max="1000" step="1" value="0" aria-label="Seek"></div>
      <button type="button" class="pb pb--mute" aria-label="Mute">${IC.vol}</button><button type="button" class="pb pb--full" aria-label="Full screen">${IC.full}</button>`;
    w.appendChild(bar);
    const start = $('.player__start', w), bPlay = $('.pb--play', bar), bMute = $('.pb--mute', bar), range = $('input', bar), fill = $('.player__fill', bar), buf = $('.player__buf', bar);
    let hideT;
    const showBar = () => { w.classList.add('is-active'); clearTimeout(hideT); if (!v.paused) hideT = setTimeout(() => w.classList.remove('is-active'), 2400); };
    const toggle = () => { if (v.paused || v.ended) { w.classList.add('is-started'); v.play().catch(() => {}); } else v.pause(); };
    const sync = () => { const p = v.duration ? v.currentTime / v.duration : 0; fill.style.transform = `scaleX(${p})`; range.value = Math.round(p * 1000); $('[data-cur]', bar).textContent = fmt(v.currentTime); };
    v.addEventListener('loadedmetadata', () => { $('[data-dur]', bar).textContent = fmt(v.duration); });
    v.addEventListener('timeupdate', sync);
    v.addEventListener('progress', () => { try { buf.style.transform = `scaleX(${v.buffered.end(v.buffered.length - 1) / v.duration})`; } catch (_) {} });
    v.addEventListener('play', () => { w.classList.add('is-playing', 'is-started'); bPlay.innerHTML = IC.pause; bPlay.setAttribute('aria-label', 'Pause'); showBar(); track('video_play', { source: 'player', src: v.currentSrc }); });
    v.addEventListener('pause', () => { w.classList.remove('is-playing'); bPlay.innerHTML = IC.play; bPlay.setAttribute('aria-label', 'Play'); w.classList.add('is-active'); clearTimeout(hideT); });
    v.addEventListener('ended', () => { w.classList.remove('is-started'); });
    v.addEventListener('waiting', () => w.classList.add('is-loading')); v.addEventListener('playing', () => w.classList.remove('is-loading'));
    v.addEventListener('click', toggle); v.addEventListener('dblclick', () => $('.pb--full', bar).click());
    start.addEventListener('click', toggle); bPlay.addEventListener('click', toggle);
    $('.pb--back', bar).addEventListener('click', () => { v.currentTime = Math.max(0, v.currentTime - 10); });
    bMute.addEventListener('click', () => { v.muted = !v.muted; bMute.innerHTML = v.muted ? IC.mute : IC.vol; bMute.setAttribute('aria-label', v.muted ? 'Unmute' : 'Mute'); });
    $('.pb--full', bar).addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else (w.requestFullscreen ? w.requestFullscreen() : v.webkitEnterFullscreen && v.webkitEnterFullscreen()); });
    range.addEventListener('input', () => { if (v.duration) { v.currentTime = (range.value / 1000) * v.duration; sync(); } });
    w.addEventListener('pointermove', showBar); w.addEventListener('focusin', showBar);
    w.addEventListener('keydown', (e) => {
      if (e.target === range && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
      const k = e.key.toLowerCase();
      if (k === ' ' && e.target.closest('button')) return;
      if (k === ' ' || k === 'k') { e.preventDefault(); toggle(); } else if (k === 'arrowright') v.currentTime += 5; else if (k === 'arrowleft') v.currentTime -= 5;
      else if (k === 'm') bMute.click(); else if (k === 'f') $('.pb--full', bar).click(); else return; showBar();
    });
    w._p = { v, toggle };
    if (autoplay) toggle();
    return w._p;
  }
  // mount lazily on first interaction (keeps start-up work off the main thread)
  document.addEventListener('click', (e) => { const s = e.target.closest('.player__start'); if (!s) return; const w = s.closest('[data-player]'); if (!w._p) { e.stopImmediatePropagation(); mountPlayer(w, { autoplay: true }); const pb = $('.pb--play', w); if (pb) pb.focus({ preventScroll: true }); } }, true);

  // ---------- dialogs ----------
  const openDlg = (d) => { if (!d.open) { d.showModal(); document.body.classList.add('no-scroll'); } };
  $$('dialog.modal').forEach((d) => {
    d.addEventListener('close', () => { document.body.classList.remove('no-scroll'); const m = $('[data-media]', d); if (m) m.replaceChildren(); });
    let downOnBackdrop = false;
    d.addEventListener('pointerdown', (e) => { downOnBackdrop = e.target === d; });
    d.addEventListener('click', (e) => { if ((e.target === d && downOnBackdrop) || e.target.closest('[data-close]')) d.close(); });
  });

  const mDlg = $('#media-modal'), mBox = mDlg && $('[data-media]', mDlg), mCap = mDlg && $('[data-media-cap]', mDlg);
  let group = [], gi = 0;
  const showImg = () => { const b = group[gi]; const im = new Image(); im.src = b.dataset.lightbox; im.alt = b.dataset.caption || ''; mBox.replaceChildren(im); mCap.textContent = (b.dataset.caption || '') + (group.length > 1 ? `  (${gi + 1} / ${group.length}: use ← → keys)` : ''); };
  document.addEventListener('click', (e) => {
    const y = e.target.closest('[data-yt-modal]');
    if (y && mDlg) { mBox.replaceChildren(ytFrame(y.dataset.ytModal, y.dataset.title)); mCap.textContent = y.dataset.title || ''; openDlg(mDlg); track('video_play', { source: 'youtube-modal', id: y.dataset.ytModal }); return; }
    const v = e.target.closest('[data-video]');
    if (v && mDlg) {
      const w = document.createElement('div'); w.className = 'player player--modal'; w.dataset.player = '';
      w.innerHTML = `<video playsinline preload="auto"></video><button class="player__start" type="button" aria-label="Play"><span class="playbtn playbtn--lg"><span class="playbtn__ring"></span>${IC.play}</span></button>`;
      $('video', w).src = v.dataset.video;
      mBox.replaceChildren(w); mCap.textContent = v.dataset.title || ''; openDlg(mDlg); mountPlayer(w, { autoplay: true }); return;
    }
    const l = e.target.closest('[data-lightbox]');
    if (l && mDlg) { const g = l.dataset.group; group = g ? $$(`[data-lightbox][data-group="${CSS.escape(g)}"]`) : [l]; gi = Math.max(0, group.indexOf(l)); showImg(); openDlg(mDlg); }
  });
  document.addEventListener('keydown', (e) => {
    if (!mDlg || !mDlg.open || group.length < 2 || !$('img', mBox)) return;
    if (e.key === 'ArrowRight') { gi = (gi + 1) % group.length; showImg(); }
    if (e.key === 'ArrowLeft') { gi = (gi - 1 + group.length) % group.length; showImg(); }
  });

  const eDlg = $('#enquire-modal');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-enquire]'); if (!b || !eDlg) return;
    const f = $('form', eDlg); resetForm(f);
    const sel = f.elements.project, want = b.dataset.enquire || 'General enquiry';
    if (![...sel.options].some((o) => o.value === want)) sel.add(new Option(want, want), 1);
    sel.value = want;
    if (b.dataset.interest) { const it = f.elements.interest; if ([...it.options].some((o) => o.value === b.dataset.interest)) it.value = b.dataset.interest; }
    f.elements.message.value = b.dataset.msg || '';
    openDlg(eDlg); setTimeout(() => f.elements.name.focus(), 60); track('enquiry_open', { project: want });
  });

  // ---------- enquiry forms ----------
  const normPhone = (raw) => {
    const s = raw.replace(/[^\d+]/g, '');
    if (/^03\d{9}$/.test(s)) return s.slice(0, 4) + '-' + s.slice(4);
    if (/^(\+?92|0092)3\d{9}$/.test(s)) return '+92 ' + s.slice(-10, -7) + '-' + s.slice(-7);
    if (/^(\+|00)\d{7,15}$/.test(s)) return s.replace(/^00/, '+');
    return null;
  };
  const ref = () => { const d = new Date(); return `FM-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`; };
  function resetForm(f) { f.classList.remove('is-done'); const dn = $('.enquiry__done', f); if (dn) dn.hidden = true; f.reset(); $$('[aria-invalid]', f).forEach((x) => x.removeAttribute('aria-invalid')); const er = $('.fld-error', f); er.hidden = true; }

  $$('[data-enquiry]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (n) => (f.elements[n] && f.elements[n].value || '').trim();
    const err = $('.fld-error', f), errors = [];
    const name = v('name'), phone = normPhone(v('phone')), email = v('email');
    if (name.length < 2) { f.elements.name.setAttribute('aria-invalid', 'true'); errors.push('your name'); } else f.elements.name.removeAttribute('aria-invalid');
    if (!phone) { f.elements.phone.setAttribute('aria-invalid', 'true'); errors.push('a valid phone number (e.g. 0300-1234567 or +971…)'); } else f.elements.phone.removeAttribute('aria-invalid');
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { f.elements.email.setAttribute('aria-invalid', 'true'); errors.push('a valid email (or leave it empty)'); } else f.elements.email.removeAttribute('aria-invalid');
    if (errors.length) { err.textContent = 'Please enter ' + errors.join(', ') + '.'; err.hidden = false; const bad = $('[aria-invalid="true"]', f); bad && bad.focus(); return; }
    err.hidden = true;
    if (f.elements.botcheck && f.elements.botcheck.checked) return; // bot

    const id = ref(), page = location.href.split('#')[0];
    const payment = (f.querySelector('input[name="payment"]:checked') || {}).value || '-';
    const lines = [
      '*New property enquiry: Fatima Marketing website*', `Ref: ${id}`, '',
      `*Project:* ${v('project') || 'General enquiry'}`, `*Interested in:* ${v('interest') || '-'}`, `*Size / budget:* ${v('size') || '-'}`, `*Payment:* ${payment}`, '',
      `*Name:* ${name}`, `*Phone:* ${phone}`, `*Email:* ${email || '-'}`, `*City / country:* ${v('city') || '-'}`, '',
      `*Message:* ${v('message') || '-'}`, '', `Page: ${page}`,
    ];
    const text = lines.join('\n');
    const wa = `https://wa.me/${FM.wa}?text=${encodeURIComponent(text)}`;
    window.open(wa, '_blank', 'noopener');

    if (FM.web3) {
      fetch('https://api.web3forms.com/submit', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: FM.web3, subject: `New enquiry ${id}: ${v('project')} (${name})`, from_name: 'Fatima Marketing website', replyto: email || undefined,
          'Reference': id, 'Project': v('project'), 'Interested in': v('interest'), 'Size / budget': v('size'), 'Payment': payment, 'Name': name, 'Phone': phone, 'Email': email || '-', 'City / country': v('city') || '-', 'Message': v('message') || '-', 'Page': page }),
      }).catch(() => {});
    }
    $('[data-ref]', f).textContent = id;
    $('[data-wa-retry]', f).href = wa;
    f.classList.add('is-done'); const done = $('.enquiry__done', f); done.hidden = false; done.tabIndex = -1; done.focus({ preventScroll: true });
    track('generate_lead', { project: v('project'), interest: v('interest'), ref: id });
  }));

  // ---------- project sub-nav active state ----------
  const sub = $$('.subnav a');
  if (sub.length && 'IntersectionObserver' in window) {
    const map = new Map(sub.map((a) => [a.hash.slice(1), a]));
    const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { sub.forEach((a) => a.classList.remove('is-active')); const a = map.get(e.target.id); if (a) { a.classList.add('is-active'); const ul = a.closest('ul'); ul.scrollTo({ left: a.offsetLeft - ul.clientWidth / 2 + a.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' }); /* scroll only the tab strip, never the page */ } } }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); s && so.observe(s); });
  }

  // outbound contact tracking
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="tel:"], a[href*="wa.me"], a[href^="mailto:"]'); if (!a) return;
    track('contact_click', { method: a.href.startsWith('tel:') ? 'call' : a.href.includes('wa.me') ? 'whatsapp' : 'email' });
  });
})();
