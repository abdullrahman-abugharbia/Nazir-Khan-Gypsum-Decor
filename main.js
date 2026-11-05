(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Gallery items: the client's own photos and video ---------- */
  const items = [
    { video: 'assets/video/frame-strength-test.mp4', poster: 'assets/video/frame-strength-test-poster.jpg', cap: 'اختبار الهيكل: الفريق يتعلّق بالهيكل الحديدي قبل إغلاقه بالألواح' },
    { src: 'assets/img/crew-boarding-ceiling.webp', cap: 'الفريق يثبّت ألواح السقف الوردية فوق السلالم' },
    { src: 'assets/img/pink-board-ceiling.webp', cap: 'سقف بمستويات من ألواح وردية مقاومة للحريق، قبل المعجون' },
    { src: 'assets/img/pink-partitions-warehouse.webp', cap: 'قواطع جبس بورد وردية تقسم مستودعاً إلى غرف' },
    { src: 'assets/img/tv-frame-wall-progress.webp', cap: 'جدار تلفزيون بإطارات جبس متدرجة، أثناء التركيب' },
    { src: 'assets/img/office-fluted-wall.webp', cap: 'عمود مكسو بالمضلّع في مكتب بواجهات زجاجية، أثناء العمل' },
    { src: 'assets/img/wall-panels-protected.webp', cap: 'بانوهات جدارية ما زالت بغلافها الواقي، وسقف بإنارة مدفونة' },
    { src: 'assets/img/fluted-oak-tv-wall.webp', cap: 'جدار مضلّع بلون البلوط وإطار للتلفزيون' },
    { src: 'assets/img/tv-wall-white-walnut.webp', cap: 'جدار تلفزيون بوحدة معلقة وإضاءة سفلية، بين بانوهين بلون الجوز' },
    { src: 'assets/img/cove-ceiling-dark-panels.webp', cap: 'سقف بمستويين وإضاءة مخفية، وجدار ببانوهات داكنة' },
    { src: 'assets/img/hallway-cove-light.webp', cap: 'ممر بأسقف جبس معلقة على عدة مستويات، وإضاءة مخفية دافئة' },
  ];

  /* ---------- Lightbox ---------- */
  const box = document.getElementById('box');
  const media = document.getElementById('boxMedia');
  const cap = document.getElementById('boxCap');
  const count = document.getElementById('boxCount');
  let current = 0, opener = null;
  function show(i) {
    current = (i + items.length) % items.length;
    const it = items[current];
    media.replaceChildren();
    let el;
    if (it.video) {
      el = document.createElement('video');
      Object.assign(el, { src: it.video, poster: it.poster, muted: true, loop: true, playsInline: true, autoplay: !reduce, controls: true });
    } else {
      el = document.createElement('img'); el.src = it.src; el.alt = it.cap;
    }
    media.append(el);
    cap.textContent = it.cap;
    count.textContent = `${current + 1} / ${items.length}`;
  }
  function open(i, from) {
    opener = from || null; show(i);
    if (typeof box.showModal === 'function') box.showModal(); else box.setAttribute('open', '');
    document.getElementById('boxClose').focus();
  }
  box.addEventListener('close', () => { media.replaceChildren(); opener && opener.focus(); });
  document.getElementById('boxClose').addEventListener('click', () => box.close());
  document.getElementById('boxPrev').addEventListener('click', () => show(current - 1));
  document.getElementById('boxNext').addEventListener('click', () => show(current + 1));
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current + 1);
    if (e.key === 'ArrowRight') show(current - 1);
  });
  box.addEventListener('click', (e) => { if (e.target === box || e.target === media) box.close(); });
  document.querySelectorAll('[data-index]').forEach((b) => b.addEventListener('click', () => open(Number(b.dataset.index), b)));

  /* ---------- Drag row: buttons, progress, mouse drag ---------- */
  const row = document.getElementById('row');
  const prev = document.getElementById('rowPrev');
  const next = document.getElementById('rowNext');
  const bar = document.getElementById('rowBar');
  const pos = () => Math.abs(row.scrollLeft);          // RTL: scrollLeft runs negative
  const max = () => Math.max(0, row.scrollWidth - row.clientWidth);
  function syncRow() {
    const m = max();
    const p = m ? pos() / m : 1;
    bar.style.transform = `scaleX(${clamp(0.08 + p * 0.92, 0, 1)})`;
    prev.disabled = pos() < 4;
    next.disabled = m - pos() < 4;
  }
  const step = () => (row.querySelector('.moment')?.offsetWidth || 280) + 32;
  prev.addEventListener('click', () => row.scrollBy({ left: step() * 2, behavior: reduce ? 'auto' : 'smooth' }));
  next.addEventListener('click', () => row.scrollBy({ left: -step() * 2, behavior: reduce ? 'auto' : 'smooth' }));
  let rq = false;
  row.addEventListener('scroll', () => { if (rq) return; rq = true; requestAnimationFrame(() => { syncRow(); rq = false; }); }, { passive: true });
  addEventListener('resize', syncRow);
  syncRow();
  let down = false, moved = false, sx = 0, ss = 0;
  row.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; ss = row.scrollLeft; });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (!moved && Math.abs(dx) > 6) { moved = true; row.classList.add('is-dragging'); }
    if (moved) row.scrollLeft = ss - dx;
  });
  addEventListener('pointerup', () => { if (!down) return; down = false; requestAnimationFrame(() => row.classList.remove('is-dragging')); });
  row.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

  /* ---------- Entrances and the shutter ---------- */
  const groups = new Map();
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    const sec = el.closest('section') || document.body;
    const n = groups.get(sec) || 0;
    el.style.setProperty('--d', `${n * 80}ms`);
    groups.set(sec, n + 1);
  });
  const revealables = document.querySelectorAll('[data-reveal], .shutter');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    revealables.forEach((el) => io.observe(el));
  } else revealables.forEach((el) => el.classList.add('is-in'));

  /* ---------- Row video plays only while visible ---------- */
  const rowVid = row.querySelector('video');
  if (rowVid && !reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((en) => (en.isIntersecting ? rowVid.play().catch(() => {}) : rowVid.pause())), { threshold: 0.3 }).observe(rowVid);
  }

  /* ---------- Film: scroll-scrubbed frames on a canvas ---------- */
  const film = document.getElementById('film');
  const canvas = document.getElementById('filmCanvas');
  const ctx = canvas.getContext('2d');
  const steps = [...document.querySelectorAll('#filmSteps li')];
  const filmBar = document.getElementById('filmBar');
  const N = 72;
  let set = '', frames = [], shown = -1, wantFrame = 0;

  if (reduce) {
    film.classList.add('no-scrub');
  } else {
    const pickSet = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      return r.width / Math.max(1, r.height) < 1.05 ? 'tall' : 'wide';
    };
    const loadSet = (name) => {
      set = name; frames = new Array(N); shown = -1;
      const order = [0, N - 1];
      for (let s = 8; s >= 1; s = Math.floor(s / 2)) for (let i = 0; i < N; i += s) if (!order.includes(i)) order.push(i);
      order.forEach((i, k) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { frames[i] = img; if (Math.abs(i - wantFrame) < 3 || shown < 0) draw(); };
        // all frames together are well under 1 MB, so request them at once; the key frames go first
        if (k >= 6) img.fetchPriority = 'low';
        img.src = `assets/film/${name}/f${String(i + 1).padStart(3, '0')}.webp`;
      });
    };
    const size = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      const want = pickSet();
      if (want !== set) loadSet(want);
      shown = -1; draw();
    };
    const nearest = (i) => {
      for (let d = 0; d < N; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    };
    function draw() {
      const img = frames[wantFrame] || nearest(wantFrame);
      if (!img) return;
      const key = frames[wantFrame] ? wantFrame : -2;
      if (key === shown && key !== -2) return;
      shown = key;
      const cw = canvas.width, ch = canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    }
    const update = () => {
      const r = film.getBoundingClientRect();
      const total = film.offsetHeight - innerHeight;
      const p = clamp(-r.top / Math.max(1, total), 0, 1);
      wantFrame = Math.round(p * (N - 1));
      const t = 1 + p * 120;                        // the Blender timeline
      const active = t < 42 ? 0 : t < 82 ? 1 : t < 97 ? 2 : 3;
      steps.forEach((li, i) => li.classList.toggle('is-on', i === active));
      filmBar.style.transform = `scaleX(${p})`;
      draw();
    };
    size();
    addEventListener('resize', size);
    // update on every scroll event: it only reads one rect and redraws when the frame changes
    addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- Rising triptych ---------- */
  const trip = document.querySelector('.trip');
  const mid = trip.querySelector('.trip__mid');
  const sides = trip.querySelectorAll('.trip__side');
  const head = trip.querySelector('.trip__head');
  // Size the three photos to the screen so the finished set always fits under the heading.
  let L = null;
  function tripLayout() {
    const vh = innerHeight, vw = document.documentElement.clientWidth;
    const phone = vw <= 720;
    const endTop = head.offsetTop + head.offsetHeight + 32;          // just below the sentence
    const avail = vh - endTop - 24;                                    // room left above the bottom edge
    const portrait = vh > vw * 1.1;                                    // phones and upright tablets
    const maxW = phone ? vw * 0.84 : portrait ? vw * 0.56 : Math.min(vw * 0.4, 640);
    const midW = Math.max(160, Math.min(maxW, avail * (portrait ? 0.68 : 0.8)));
    const midH = portrait ? Math.min(avail, midW * 1.45) : midW * 1.25; // a taller print fills an upright screen
    const drop = phone ? 28 : 48;                                      // side photos hang a little lower
    let sideH = Math.min(midH * 0.86, avail - drop);
    let sideW = sideH * 360 / 530;
    const gap = phone ? 8 : 12;
    const midLeft = (vw - midW) / 2;
    const place = (el, left, w, h) => {
      Object.assign(el.style, { left: `${left}px`, right: 'auto', width: `${w}px`, height: `${h}px`, margin: '0', aspectRatio: 'auto' });
    };
    place(mid, midLeft, midW, midH);
    place(sides[0], midLeft + midW + gap, sideW, sideH);              // right of the centre
    place(sides[1], midLeft - gap - sideW, sideW, sideH);             // left of the centre
    L = { endTop, midH, drop };
  }
  function tripUpdate() {
    if (!L) tripLayout();
    const vh = innerHeight;
    const r = trip.getBoundingClientRect();
    const total = trip.offsetHeight - vh;
    const p = reduce ? 1 : clamp(-r.top / Math.max(1, total), 0, 1);
    const q = clamp(p / 0.72, 0, 1);                                   // arrive by 72%, then hold
    const e = 1 - Math.pow(1 - q, 3);
    const startY = -L.midH * 0.5;                                      // the top half of the centre shows
    const endY = -(vh - L.endTop);
    const y = startY + (endY - startY) * e;
    const sc = 0.84 + 0.16 * e;
    mid.style.transformOrigin = '50% 0';
    mid.style.transform = `translateY(${y}px) scale(${sc})`;
    sides.forEach((s, i) => {
      const k = Math.pow(e, i === 0 ? 1.15 : 1.3);                     // each side rises at its own speed
      const sy = startY * 0.6 + (endY - startY * 0.6) * k + L.drop;
      s.style.transform = `translateY(${sy}px)`;
    });
  }
  addEventListener('scroll', tripUpdate, { passive: true });
  addEventListener('resize', () => { tripLayout(); tripUpdate(); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { tripLayout(); tripUpdate(); });
  tripUpdate();

  /* ---------- Sticky bar, current section, phone dock (from option 3) ---------- */
  const barEl = document.getElementById('bar');
  const dock = document.getElementById('dock');
  const heroEl = document.querySelector('.hero');
  const navLinks = [...document.querySelectorAll('.bar__links a')];
  const nearEnd = new Set();
  const syncDock = () => dock.classList.toggle('is-on', barEl.classList.contains('is-stuck') && nearEnd.size === 0);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { barEl.classList.toggle('is-stuck', !en.isIntersecting); syncDock(); },
      { rootMargin: '-60% 0px 0px 0px' }).observe(heroEl);
    // hide the dock while the contact row or the footer is on screen: it would repeat them
    const endIO = new IntersectionObserver((es) => {
      es.forEach((en) => (en.isIntersecting ? nearEnd.add(en.target) : nearEnd.delete(en.target)));
      syncDock();
    });
    [document.getElementById('contact'), document.querySelector('.foot')].forEach((el) => el && endIO.observe(el));
    const spy = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false'));
    }), { rootMargin: '-45% 0px -50% 0px' });
    navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean).forEach((t) => spy.observe(t));
  }
  // the fixed bar steps aside while scrolling down (so it never covers the pinned film or photos)
  // and comes back as soon as the visitor scrolls up
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY, dy = y - lastY;
    if (Math.abs(dy) > 6) { barEl.classList.toggle('is-away', dy > 0 && barEl.classList.contains('is-stuck')); lastY = y; }
  }, { passive: true });
  barEl.addEventListener('focusin', () => barEl.classList.remove('is-away'));

  /* ---------- Footer wordmark fit ---------- */
  const word = document.getElementById('word');
  function fit() {
    const holder = word.parentElement;
    holder.style.fontSize = '';
    const avail = holder.clientWidth, w = word.getBoundingClientRect().width;
    if (w > 0) holder.style.fontSize = `${Math.floor(parseFloat(getComputedStyle(holder).fontSize) * (avail / w) * 0.94)}px`;
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
  addEventListener('resize', fit);
})();
