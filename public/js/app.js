/* 物理道 — student-facing SPA (hash router, no build step) */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const egp = (n) => `${Number(n || 0).toLocaleString()} EGP`;
const fmtDate = (s) => (s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const GRADES = ['1st Secondary', '2nd Secondary', '3rd Secondary'];

const state = { me: null, cleanups: [] };
window.state = state;

async function api(path, opts = {}) {
  if (window.DEMO_API) return window.DEMO_API(path, opts); // static preview (GitHub Pages)
  const r = await fetch('/api' + path, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'Something went wrong'), { status: r.status });
  return d;
}

function toast(msg, ok = false) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'show' + (ok ? ' ok' : '');
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = ''), 3200);
}

function modal(html, onMount) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="modal-bg"><div class="modal card">${html}</div></div>`;
  const bg = $('.modal-bg', root);
  const close = () => (root.innerHTML = '');
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) close(); });
  $$('[data-close]', root).forEach((b) => b.addEventListener('click', close));
  onMount?.($('.modal', root), close);
  return close;
}

/* Generic form modal: fields = [{k,label,type,options,required,placeholder}] */
function formModal(title, fields, values = {}, onSubmit) {
  const f = (x) => {
    const v = values[x.k] ?? x.default ?? '';
    if (x.type === 'checkbox') return `<label class="check"><input type="checkbox" name="${x.k}" ${+v ? 'checked' : ''}> ${esc(x.label)}</label>`;
    let input;
    if (x.type === 'textarea') input = `<textarea name="${x.k}" placeholder="${esc(x.placeholder || '')}">${esc(v)}</textarea>`;
    else if (x.type === 'select') input = `<select name="${x.k}">${x.options.map(([ov, ol]) => `<option value="${esc(ov)}" ${String(ov) === String(v) ? 'selected' : ''}>${esc(ol)}</option>`).join('')}</select>`;
    else input = `<input name="${x.k}" type="${x.type || 'text'}" value="${esc(v)}" placeholder="${esc(x.placeholder || '')}" ${x.required ? 'required' : ''}>`;
    return `<div class="field"><label>${esc(x.label)}</label>${input}${x.hint ? `<small class="muted">${esc(x.hint)}</small>` : ''}</div>`;
  };
  modal(`<h3>${esc(title)}</h3><form>${fields.map(f).join('')}<p class="err"></p>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost sm" data-close>Cancel</button><button class="btn shu sm">Save</button></div></form>`,
  (el, close) => {
    $('form', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {};
      fields.forEach((x) => {
        const inp = e.target.elements[x.k];
        data[x.k] = x.type === 'checkbox' ? (inp.checked ? 1 : 0) : x.type === 'number' ? (inp.value === '' ? null : +inp.value) : inp.value;
      });
      try { await onSubmit(data); close(); } catch (err) { $('.err', el).textContent = err.message; }
    });
    $('input,textarea,select', el)?.focus();
  });
}

function confirmBox(msg, yes = 'Delete') {
  return new Promise((resolve) => {
    modal(`<h3>Are you sure?</h3><p>${esc(msg)}</p><div class="row" style="justify-content:flex-end">
      <button class="btn ghost sm" data-close>Cancel</button><button class="btn danger sm" id="yes">${esc(yes)}</button></div>`,
    (el, close) => { $('#yes', el).onclick = () => { close(); resolve(true); }; $$('[data-close]', el).forEach((b) => b.addEventListener('click', () => resolve(false))); });
  });
}

/* ---------- video embed ---------- */
function embedVideo(url) {
  if (!url) return null;
  let m = url.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  if (m) return `<iframe src="https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `<iframe src="https://player.vimeo.com/video/${m[1]}" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m) return `<iframe src="https://drive.google.com/file/d/${m[1]}/preview" allow="fullscreen" allowfullscreen></iframe>`;
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return `<video controls controlsList="nodownload" disablePictureInPicture oncontextmenu="return false" src="${esc(url)}"></video>`;
  return `<iframe src="${esc(url)}" allow="fullscreen" allowfullscreen></iframe>`;
}

/* ---------- nav ---------- */
function renderNav() {
  const me = state.me;
  const r = (location.hash.slice(1) || '/').split('?')[0];
  const items = [
    ['/', 'Home', '家'],
    ['/courses', 'Courses', '講'],
    ...(me ? [['/dashboard', 'My progress', '進'], ['/wallet', 'Wallet', '財'], ['/profile', 'Profile', '人']] : [['/login', 'Login', '入'], ['/register', 'Join now', '始']]),
    ...(me?.role === 'admin' ? [['/admin', 'Admin', '管']] : []),
  ];
  $('#links').innerHTML = `<div class="menu-in">${items.map(([h, l, k], i) => `<a href="#${h}" class="mlink ${(h === '/' ? r === '/' : r.startsWith(h)) ? 'active' : ''}" style="--i:${i}">
      <span class="mono mi">0${i + 1}</span><span class="ml">${l}</span><span class="mk">${k}</span></a>`).join('')}
    ${me ? `<button class="mlink linkbtn" id="logout" style="--i:${items.length}"><span class="mono mi">0${items.length + 1}</span><span class="ml">Logout</span><span class="mk">出</span></button>` : ''}</div>
    <div class="menu-foot mono">${me ? `SIGNED IN AS ${esc(me.name.toUpperCase())}` : 'MR. AHMED ALAA · PHYSICS'}<span>物理道</span></div>`;
  $('#navright').innerHTML = me
    ? `<a href="#/wallet" class="wallet-chip mono">財 <b>${egp(me.balance)}</b></a>`
    : `<a href="#/login" class="nav-login mono">LOGIN</a><a href="#/register" class="btn shu sm">Join</a>`;
  $('#logout')?.addEventListener('click', async () => { await api('/auth/logout', { method: 'POST' }); state.me = null; location.hash = '/'; toast('See you soon — またね', true); });
}
$('#burger').addEventListener('click', () => {
  const open = !$('#links').classList.contains('open');
  $('#burger').classList.toggle('open', open); $('#links').classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
});
addEventListener('scroll', () => {
  $('#nav').classList.toggle('scrolled', scrollY > 10);
  $('#totop').classList.toggle('show', scrollY > innerHeight * .8);
}, { passive: true });
/* ---------- light / dark mode ---------- */
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('theme', t); } catch (e) { /* storage blocked: theme still applies for this visit */ }
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'light' ? '#f6f0e6' : '#0b0a0d');
}
setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
$('#themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'));
$('#totop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------- reveal & counters ---------- */
function animateIn(root = document) {
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    if (e.target.dataset.count != null) countUp(e.target);
    io.unobserve(e.target);
  }), { threshold: .15 });
  $$('.reveal, [data-count]', root).forEach((el) => io.observe(el));
  state.cleanups.push(() => io.disconnect());
  requestAnimationFrame(() => $$('.progress > i[data-w]', root).forEach((i) => (i.style.width = i.dataset.w + '%')));
}
function countUp(el) {
  const target = +el.dataset.count, t0 = performance.now(), dur = 1600;
  const tick = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString(); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

/* ---------- sakura petals (landing only) ---------- */
function startPetals() {
  const box = $('#petals');
  const spawn = () => {
    if (document.hidden || box.childElementCount > 18) return;
    const p = document.createElement('i');
    p.className = 'petal';
    const dur = 9 + Math.random() * 8;
    p.style.cssText = `left:${Math.random() * 100}%;--dx:${(Math.random() * 2 - 1) * 220}px;--rot:${Math.random() * 720}deg;animation-duration:${dur}s;scale:${.6 + Math.random() * .8}`;
    box.appendChild(p); setTimeout(() => p.remove(), dur * 1000);
  };
  for (let i = 0; i < 5; i++) setTimeout(spawn, i * 500);
  const iv = setInterval(spawn, 900);
  state.cleanups.push(() => { clearInterval(iv); box.innerHTML = ''; });
}

/* ---------- views ---------- */
const TORII = `<svg class="torii" viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg"><g fill="#c8241f"><path d="M2 8 Q60 -2 118 8 L116 16 Q60 8 4 16Z"/><rect x="12" y="22" width="96" height="7"/><rect x="24" y="14" width="9" height="76"/><rect x="87" y="14" width="9" height="76"/><rect x="56" y="16" width="8" height="12"/></g><rect x="20" y="86" width="17" height="4" fill="#1b1714"/><rect x="83" y="86" width="17" height="4" fill="#1b1714"/></svg>`;

/* Original hero artwork (night version): red sun with orbiting electrons, Mt. Fuji, swinging pendulum, seigaiha waves */
const HERO_ART = `<svg class="art" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Red sun with orbiting electrons above Mount Fuji at night, a swinging pendulum and ocean waves">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0a14"/><stop offset=".55" stop-color="#2a1022"/><stop offset="1" stop-color="#4a1418"/></linearGradient>
    <radialGradient id="sunG" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ff5a45"/><stop offset="1" stop-color="#c41d16"/></radialGradient>
    <radialGradient id="glowG"><stop offset="0" stop-color="#ff4a3a" stop-opacity=".55"/><stop offset="1" stop-color="#ff4a3a" stop-opacity="0"/></radialGradient>
    <pattern id="seigaiha" width="28" height="14" patternUnits="userSpaceOnUse">
      <g fill="none" stroke="#d6a24a" stroke-width="1.2"><circle cx="14" cy="14" r="13"/><circle cx="14" cy="14" r="9"/><circle cx="14" cy="14" r="5"/>
      <circle cx="0" cy="7" r="13"/><circle cx="0" cy="7" r="9"/><circle cx="0" cy="7" r="5"/><circle cx="28" cy="7" r="13"/><circle cx="28" cy="7" r="9"/><circle cx="28" cy="7" r="5"/></g>
    </pattern>
    <path id="orb1" d="M150 168 m-112 0 a112 38 0 1 0 224 0 a112 38 0 1 0 -224 0"/>
  </defs>
  <rect width="300" height="420" fill="url(#sky)"/>
  <g class="art-stars" fill="#efe8dc">${Array.from({ length: 34 }, (_, i) => `<circle cx="${(i * 89) % 300}" cy="${(i * 53) % 230}" r="${i % 5 ? .7 : 1.3}" style="animation-delay:${-(i % 7) * .6}s"/>`).join('')}</g>
  <g class="art-eq" font-family="DM Mono, monospace" fill="#efe8dc" opacity=".22" font-size="12">
    <text x="18" y="40">F = ma</text><text x="200" y="60">E = mc²</text><text x="24" y="300">v = λf</text><text x="214" y="282">V = IR</text>
  </g>
  <circle cx="150" cy="168" r="120" fill="url(#glowG)"/>
  <circle class="art-sun" cx="150" cy="168" r="66" fill="url(#sunG)"/>
  <g fill="none" stroke="#efe8dc" stroke-width="1.1" stroke-dasharray="3 5" opacity=".45">
    <ellipse cx="150" cy="168" rx="112" ry="38" transform="rotate(-24 150 168)"/>
    <ellipse cx="150" cy="168" rx="112" ry="38" transform="rotate(24 150 168)"/>
  </g>
  <g transform="rotate(-24 150 168)"><circle r="5" fill="#efe8dc"><animateMotion dur="5s" repeatCount="indefinite"><mpath href="#orb1"/></animateMotion></circle></g>
  <g transform="rotate(24 150 168)"><circle r="5" fill="#f5d17e"><animateMotion dur="7s" begin="-2s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#orb1"/></animateMotion></circle></g>
  <g class="art-pendulum"><line x1="150" y1="0" x2="150" y2="196" stroke="#efe8dc" stroke-width="1.3" opacity=".8"/><circle cx="150" cy="204" r="11" fill="#0d0a14" stroke="#f5d17e" stroke-width="2"/></g>
  <path d="M-10 330 L96 238 Q112 222 128 230 L150 218 L172 230 Q188 222 204 238 L310 330 Z" fill="#08070a"/>
  <path d="M96 238 Q112 222 128 230 L150 218 L172 230 Q188 222 204 238 L190 252 L176 242 L163 256 L150 244 L137 258 L124 242 L110 254 Z" fill="#efe8dc"/>
  <path d="M-10 330 L60 290 L110 318 L170 286 L240 316 L310 292 L310 340 L-10 340 Z" fill="#1a1520"/>
  <g class="art-waves"><rect x="-28" y="330" width="356" height="100" fill="#0d0a10"/><rect x="-28" y="330" width="356" height="100" fill="url(#seigaiha)" opacity=".55"/></g>
</svg>`;

const PATH = [
  ['力', 'Mechanics', 'Motion · forces · energy', '1st Sec'],
  ['波', 'Waves & Sound', 'Oscillation · resonance', '2nd Sec'],
  ['光', 'Light & Optics', 'Reflection · lenses · interference', '2nd Sec'],
  ['熱', 'Heat', 'Gases · thermodynamics', '2nd Sec'],
  ['電', 'Electricity', 'Current · Ohm · Kirchhoff', '3rd Sec'],
  ['磁', 'Magnetism', 'Fields · induction · AC', '3rd Sec'],
  ['原', 'Modern Physics', 'Quantum · atom · laser', '3rd Sec'],
];

async function viewLanding(app) {
  const [stats, cats] = await Promise.all([api('/public-stats').catch(() => null), api('/categories').catch(() => [])]);
  const split = (w, d0) => [...w].map((ch, i) => `<span class="ch" style="animation-delay:${d0 + i * .05}s">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  const go = state.me ? 'courses' : 'register';
  app.innerHTML = `
  <section class="hero" id="hero">
    <div class="beams" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
    <div class="hero-bgk" aria-hidden="true">物理</div>
    <div class="hero-side left">GRADES 1—3 · SECONDARY</div>
    <div class="hero-side right">物理を学ぶ · 道を極める</div>
    <div class="hero-center">
      <div class="tcard hero-card" id="heroCard"><div class="tcard-in">${HERO_ART}</div><span class="seal">先生</span></div>
      <h1 class="mega"><span class="line">${split('PHYSICS', 1.2)}</span><span class="line red">${split('BYTES', 1.55)}</span></h1>
      <p class="sub mono">WITH MR. AHMED ALAA <span class="dot"></span> 物理の道</p>
      <div class="cta">
        <a class="btn shu" href="#/${go}">${state.me ? 'Continue learning' : 'Start your path'} →</a>
        <a class="btn ghost" href="#/courses">Browse courses</a>
      </div>
    </div>
    <div class="scroll-hint mono">SCROLL<i></i></div>
  </section>

  <section class="hpath" id="hpath">
    <div class="hpath-sticky">
      <h2 class="hpath-title" aria-hidden="true">THE PATH · 道</h2>
      <div class="hpath-label mono"><span>THE PATH</span><span id="hpCount">01 / 0${PATH.length}</span></div>
      <div class="hpath-track" id="hpTrack">
        ${PATH.map(([k, t, d, g], i) => `<div class="hp-item" style="--y:${i % 2 ? 9 : -6}vh">
          <div class="tcard"><div class="tcard-in kart"><span class="spark"></span><span class="kk">${k}</span><span class="tc-grade mono">${g}</span></div></div>
          <h3 class="mono">${t}</h3><p class="mono">${d}</p><span class="hp-num">0${i + 1}</span></div>`).join('')}
      </div>
      <div class="ruler" aria-hidden="true">${Array.from({ length: 61 }, (_, i) => `<i class="${i % 10 ? '' : 'big'}"></i>`).join('')}</div>
    </div>
  </section>

  <section class="dots-band" aria-hidden="true">
    <div class="mrow" data-dir="1"><span>物理を学ぶ PHYSICS BYTES 物理を学ぶ PHYSICS BYTES</span></div>
    <div class="mrow" data-dir="-1"><span>UNDERSTAND · DON'T MEMORIZE · UNDERSTAND · DON'T MEMORIZE</span></div>
    <div class="mrow" data-dir="1"><span>道を極める MASTER THE WAY 道を極める MASTER THE WAY</span></div>
  </section>

  <section class="quote" id="quote">
    <div class="stack reveal">${['力', '光', '電'].map((k, i) => `<div class="scard s${i}"><span>${k}</span></div>`).join('')}</div>
    <div class="qmark">“ ”</div>
    <h2 class="mega-q reveal">PHYSICS IS NOT<br>MEMORIZED. IT IS<br>UNDERSTOOD.</h2>
    <p class="reveal" style="--d:.2s">More than equations, more than grades, more than the exam itself. Learn to see the laws behind everything that moves.</p>
  </section>

  <section class="band"><div class="wrap">
    <div class="section-title reveal"><span class="eyebrow">01 — FEATURES</span><h2>Everything in one dojo</h2></div>
    <div class="grid g3">
      ${[['映', 'HD video lessons', 'Organized by chapter and lesson, with a protected player and view limits.'],
        ['問', 'Quizzes & exams', 'Chapter quizzes and full exams with a timer, auto-grading and explanations.'],
        ['進', 'Progress tracking', 'See completed lessons, scores and what to study next — at a glance.'],
        ['財', 'Wallet & codes', 'Recharge with a code and unlock any course instantly.'],
        ['章', 'Organized curriculum', 'Every grade split into courses, chapters and lessons — nothing lost.'],
        ['師', 'Direct from the teacher', 'Content made and updated by Mr. Ahmed Alaa himself.']]
        .map(([k, t, d], i) => `<div class="card feature reveal" data-k="${k}" style="--d:${(i % 3) * .1}s"><span class="mono fnum">0${i + 1}</span><span class="fk">${k}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div></section>

  ${stats ? `  <section class="band"><div class="wrap">
    <div class="stats-band reveal"><div class="grid g4">
      ${[['students', 'Students'], ['courses', 'Courses'], ['lessons', 'Lessons'], ['exams', 'Quizzes & Exams']]
        .map(([k, l]) => `<div class="stat"><div class="stat-n" data-count="${stats[k] || 0}">0</div><div class="stat-l mono">${l}</div></div>`).join('')}
    </div></div>
  </div></section>
` : ''}

  <section class="band"><div class="wrap">
    <div class="section-title reveal"><span class="eyebrow">02 — GRADES</span><h2>Choose your year</h2></div>
    <div class="grid g3">
      ${cats.map((c, i) => `<a class="card grade-card reveal" style="--d:${i * .12}s" href="#/courses?cat=${c.id}"><span class="gk">${esc(c.kanji || '学')}</span>
        <span class="mono small muted">0${i + 1} — ${c.course_count} COURSE${c.course_count === 1 ? '' : 'S'}</span><h3>${esc(c.name)}</h3><p class="muted">${esc(c.description || '')}</p><span class="arrow">→</span></a>`).join('')}
    </div>
  </div></section>

  <section class="cta-band reveal">
    <div class="beams soft" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
    ${TORII}
    <span class="eyebrow">一期一会 · ONE CHANCE, ONE MEETING</span>
    <h2 class="mega small-mega">STEP THROUGH<br><span class="red">THE GATE.</span></h2>
    <a class="btn shu" href="#/${go}">${state.me ? 'Go to courses' : 'Create free account'}</a>
  </section>
  ${footer()}`;

  // hero card tilt
  const hero = $('#hero'), card = $('#heroCard');
  hero.addEventListener('mousemove', (e) => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    card.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
    $('.hero-bgk', hero).style.translate = `${x * -30}px ${y * -20}px`;
  });
  hero.addEventListener('mouseleave', () => (card.style.transform = ''));

  // scroll-driven: horizontal path + marquee rows + quote stack
  const sec = $('#hpath'), track = $('#hpTrack'), rows = $$('.mrow'), count = $('#hpCount');
  const size = () => { sec.style.height = `${track.scrollWidth - innerWidth + innerHeight}px`; };
  const onScroll = () => {
    const max = sec.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, (scrollY - sec.offsetTop) / (max || 1)));
    track.style.transform = `translate3d(${-p * (track.scrollWidth - innerWidth)}px,0,0)`;
    $('.hpath-title').style.transform = `translate3d(${-p * 30}vw,0,0)`;
    count.textContent = `0${Math.min(PATH.length, 1 + Math.floor(p * PATH.length))} / 0${PATH.length}`;
    rows.forEach((r) => { const top = r.getBoundingClientRect().top; r.firstElementChild.style.transform = `translate3d(${(+r.dataset.dir) * (top - innerHeight) * .35 - 200}px,0,0)`; });
  };
  size(); onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', size);
  document.fonts?.ready.then(() => { size(); onScroll(); });
  state.cleanups.push(() => { removeEventListener('scroll', onScroll); removeEventListener('resize', size); });
  startPetals();
  animateIn(app);
}

const footer = () => `<footer class="foot"><div class="wrap">
  <div class="foot-big" aria-hidden="true">AHMED ALAA</div>
  <div class="row between mono small">
    <span class="row"><span class="hanko" style="width:30px;height:30px;font-size:.7rem">物理</span> MR. AHMED ALAA · PHYSICS</span>
    <span class="row"><a href="#/courses">COURSES</a><a href="#/${state.me ? 'dashboard' : 'register'}">${state.me ? 'MY PROGRESS' : 'JOIN'}</a></span>
    <span>© ${new Date().getFullYear()} · 物理道</span></div></div></footer>`;

function authShell(kanji, title, text, formHtml) {
  return `<div class="auth"><div class="auth-art"><div class="sun"></div><div class="bigk">${kanji}</div><h2>${title}</h2><p>${text}</p></div>
    <div class="auth-form"><div class="card">${formHtml}</div></div></div>`;
}

function viewLogin(app) {
  app.innerHTML = authShell('入', 'Welcome back', 'Enter the dojo and continue where you left off.', `
    <span class="eyebrow">ログイン</span><h2>Login</h2>
    <form id="f"><div class="field"><label>Email or phone</label><input name="login" required autocomplete="username"></div>
    <div class="field"><label>Password</label><input name="password" type="password" required autocomplete="current-password"></div>
    <p class="err"></p><button class="btn shu" style="width:100%">Login</button></form>
    <p class="muted small" style="text-align:center;margin-top:1rem">New here? <a href="#/register">Create an account</a></p>`);
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      state.me = await api('/auth/login', { body: Object.fromEntries(new FormData(e.target)) });
      toast(`おかえり, ${state.me.name.split(' ')[0]}!`, true);
      location.hash = state.me.role === 'admin' ? '/admin' : (sessionStorage.getItem('next') || '/dashboard');
      sessionStorage.removeItem('next');
    } catch (err) { $('.err').textContent = err.message; }
  });
}

function viewRegister(app) {
  app.innerHTML = authShell('始', 'Begin your path', 'One account for lessons, exams, your wallet and your progress.', `
    <span class="eyebrow">新規登録</span><h2>Create account</h2>
    <form id="f"><div class="field"><label>Full name</label><input name="name" required></div>
    <div class="two"><div class="field"><label>Phone</label><input name="phone" required inputmode="tel" placeholder="01xxxxxxxxx"></div>
    <div class="field"><label>Parent's phone</label><input name="parent_phone" inputmode="tel"></div></div>
    <div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"></div>
    <div class="two"><div class="field"><label>Grade</label><select name="grade">${GRADES.map((g) => `<option>${g}</option>`).join('')}</select></div>
    <div class="field"><label>Password</label><input name="password" type="password" minlength="6" required autocomplete="new-password"></div></div>
    <p class="err"></p><button class="btn shu" style="width:100%">Create account</button></form>
    <p class="muted small" style="text-align:center;margin-top:1rem">Already have one? <a href="#/login">Login</a></p>`);
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { state.me = await api('/auth/register', { body: Object.fromEntries(new FormData(e.target)) }); toast('ようこそ! Account created.', true); location.hash = '/courses'; }
    catch (err) { $('.err').textContent = err.message; }
  });
}

function courseCard(c, i = 0) {
  return `<a class="card course-card reveal" style="--d:${(i % 3) * .1}s" href="#/course/${c.id}">
    <div class="cover"><span class="sun"></span><span class="ck">${esc(c.kanji || '力')}</span></div>
    <div class="course-body"><div class="row"><span class="tag">${esc(c.category || 'General')}</span>${c.enrolled ? '<span class="tag green">Enrolled</span>' : ''}</div>
    <h3>${esc(c.title)}</h3><p>${esc(c.description || '')}</p>
    <div class="row between"><span class="muted small">${c.chapter_count} chapters · ${c.lesson_count} lessons</span>
    <span class="price">${c.price ? `${c.price} <small>EGP</small>` : '<span style="color:var(--matcha)">Free</span>'}</span></div></div></a>`;
}

async function viewCourses(app, params) {
  const cat = params.get('cat') || '';
  const [cats, courses] = await Promise.all([api('/categories'), api('/courses' + (cat ? `?category=${cat}` : ''))]);
  app.innerHTML = `<div class="page"><div class="wrap">
    <div class="page-head"><div><span class="eyebrow">講座 · COURSES</span><h1 class="title-jp">All courses</h1></div></div>
    <div class="filters"><button class="chip ${!cat ? 'on' : ''}" data-c="">All</button>${cats.map((c) => `<button class="chip ${String(c.id) === cat ? 'on' : ''}" data-c="${c.id}">${esc(c.kanji || '')} ${esc(c.name)}</button>`).join('')}</div>
    ${courses.length ? `<div class="grid g3">${courses.map(courseCard).join('')}</div>` : '<div class="empty"><span class="k">空</span>No courses here yet.</div>'}
  </div></div>`;
  $$('.chip').forEach((b) => (b.onclick = () => (location.hash = '/courses' + (b.dataset.c ? `?cat=${b.dataset.c}` : ''))));
  animateIn(app);
}

function lessonItem(l, c, current) {
  const open = c.access || l.is_free;
  return `<a class="item ${l.done ? 'done' : ''} ${open ? '' : 'locked'} ${current === l.id ? 'current' : ''}" href="${open ? `#/lesson/${l.id}` : 'javascript:void 0'}" ${open ? '' : 'data-locked'}>
    <span class="ic">${l.done ? '✓' : open ? '▶' : '🔒'}</span><span>${esc(l.title)}</span>
    <span class="meta">${l.is_free && !c.access ? '<span class="tag green">Free</span>' : ''}${l.duration_min ? `<span class="muted small">${l.duration_min}m</span>` : ''}</span></a>`;
}
function quizItem(z, c) {
  return `<a class="item ${c.access ? '' : 'locked'}" href="${c.access ? `#/quiz/${z.id}` : 'javascript:void 0'}" ${c.access ? '' : 'data-locked'}>
    <span class="ic" style="border-color:var(--shu);color:var(--shu)">問</span><span>${esc(z.title)}</span>
    <span class="meta">${z.best != null ? `<span class="tag ${z.best >= z.pass_score ? 'green' : 'shu'}">Best ${z.best}%</span>` : ''}<span class="tag ${z.type === 'exam' ? 'shu' : 'ai'}">${z.type === 'exam' ? 'Exam' : 'Quiz'}</span><span class="muted small">${z.qcount} Q</span></span></a>`;
}

async function viewCourse(app, params, id) {
  const c = await api('/courses/' + id);
  app.innerHTML = `<div class="page"><div class="wrap">
    <div class="course-hero">
      <div><a href="#/courses" class="muted small">← All courses</a>
        <div class="row" style="margin:.8rem 0"><span class="tag">${esc(c.category || '')}</span>${c.enrolled ? '<span class="tag green">Enrolled</span>' : ''}</div>
        <h1 style="font-size:clamp(1.8rem,4vw,2.8rem)">${esc(c.title)}</h1><p class="muted">${esc(c.description || '')}</p>
        <div class="row muted small"><span>章 ${c.chapters.length} chapters</span><span>映 ${c.lessonCount} lessons</span><span>問 ${c.chapters.reduce((a, ch) => a + ch.quizzes.length, 0) + c.exams.length} quizzes/exams</span></div>
      </div>
      <div class="card buy-box">
        <div class="cover" style="border-radius:10px;height:150px;margin-bottom:1rem"><span class="sun"></span><span class="ck">${esc(c.kanji || '力')}</span></div>
        ${c.access ? `<div class="row between small"><b>Your progress</b><span>${c.doneCount}/${c.lessonCount} lessons</span></div>
          <div class="progress" style="margin:.5rem 0 1rem"><i data-w="${c.percent}"></i></div>
          <a class="btn shu" style="width:100%" href="#/lesson/${(c.chapters.flatMap((ch) => ch.lessons).find((l) => !l.done) || c.chapters[0]?.lessons[0] || {}).id || ''}">${c.doneCount ? 'Continue' : 'Start'} learning</a>`
        : `<div class="price" style="font-size:2rem">${c.price ? `${c.price} <small>EGP</small>` : 'Free'}</div>
          <p class="muted small">Lifetime access to all lessons, quizzes and exams in this course.</p>
          <button class="btn shu" style="width:100%" id="enroll">${state.me ? (c.price ? 'Buy with wallet' : 'Enroll for free') : 'Login to enroll'}</button>
          ${state.me ? `<p class="small muted" style="text-align:center;margin:.6rem 0 0">Wallet: <b>${egp(state.me.balance)}</b> · <a href="#/wallet">Recharge</a></p>` : ''}`}
      </div>
    </div>
    <h2 class="title-jp" style="margin-bottom:1.4rem">Course content</h2>
    ${c.chapters.map((ch, i) => `<details class="chapter reveal" ${i === 0 ? 'open' : ''}><summary><span class="no">${i + 1}</span>${esc(ch.title)}
      <span class="muted small" style="font-family:var(--f-body);font-weight:400;margin-left:auto">${ch.lessons.length} lessons</span><span class="chev">⌄</span></summary>
      ${ch.lessons.map((l) => lessonItem(l, c)).join('')}${ch.quizzes.map((z) => quizItem(z, c)).join('')}
      ${!ch.lessons.length && !ch.quizzes.length ? '<p class="muted small" style="padding:1rem 1.2rem;margin:0">Lessons coming soon.</p>' : ''}</details>`).join('')}
    ${c.exams.length ? `<details class="chapter" open><summary><span class="no" style="background:var(--shu)">試</span>Final exams<span class="chev">⌄</span></summary>${c.exams.map((z) => quizItem(z, c)).join('')}</details>` : ''}
  </div></div>`;
  $$('[data-locked]').forEach((a) => a.addEventListener('click', () => toast(state.me ? 'Enroll in the course to unlock this.' : 'Log in and enroll to unlock this.')));
  $('#enroll')?.addEventListener('click', async () => {
    if (!state.me) { sessionStorage.setItem('next', location.hash.slice(1)); location.hash = '/login'; return; }
    if (c.price && !(await confirmBox(`Pay ${egp(c.price)} from your wallet to unlock "${c.title}"?`, 'Pay & enroll'))) return;
    try { const r = await api(`/courses/${c.id}/enroll`, { method: 'POST' }); state.me.balance = r.balance; toast('Enrolled! 頑張って!', true); router(); }
    catch (err) { toast(err.message); if (err.status === 402) setTimeout(() => (location.hash = '/wallet'), 1200); }
  });
  animateIn(app);
}

async function viewLesson(app, params, id) {
  let l;
  try { l = await api('/lessons/' + id); }
  catch (err) { if (err.status === 401) { sessionStorage.setItem('next', location.hash.slice(1)); location.hash = '/login'; } throw err; }
  const flat = l.outline.chapters.flatMap((ch) => ch.lessons);
  const idx = flat.findIndex((x) => x.id === l.id);
  const prev = flat[idx - 1], next = flat[idx + 1];
  const player = embedVideo(l.video_url);
  const access = { access: true };
  app.innerHTML = `<div class="page"><div class="wrap">
    <a href="#/course/${l.course.id}" class="muted small">← ${esc(l.course.title)}</a>
    <div class="lesson-layout" style="margin-top:1rem">
      <div>
        <div class="player">${player || `<div class="placeholder"><div><span class="k">映</span>The video for this lesson will be uploaded soon.</div></div>`}
          ${player ? `<span class="wm">${esc(l.watermark)}</span>` : ''}</div>
        <div class="row between" style="margin:1.2rem 0 .4rem"><div><span class="eyebrow">${esc(l.chapter_title)}</span><h2 style="margin:0">${esc(l.title)}</h2></div>
          <div class="row">${l.max_views ? `<span class="tag ai">View ${l.views}/${l.max_views}</span>` : ''}
          <button class="btn ${l.completed ? 'ghost' : 'shu'} sm" id="done">${l.completed ? '✓ Completed' : 'Mark as completed'}</button></div></div>
        <p class="muted">${esc(l.description || '')}</p>
        ${l.attachment_url ? `<a class="btn ghost sm" target="_blank" rel="noopener" href="${esc(l.attachment_url)}">📄 Lesson notes / homework</a>` : ''}
        <div class="row between" style="margin-top:2rem">
          ${prev ? `<a class="btn ghost sm" href="#/lesson/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}
          ${next ? `<a class="btn sm" href="#/lesson/${next.id}">${esc(next.title)} →</a>` : ''}</div>
      </div>
      <aside class="card side-outline">${l.outline.chapters.map((ch) => `<h4>${esc(ch.title)}</h4>${ch.lessons.map((x) => lessonItem(x, access, l.id)).join('')}${ch.quizzes.map((z) => quizItem(z, access)).join('')}`).join('')}</aside>
    </div></div></div>`;
  $('#done').onclick = async () => {
    await api(`/lessons/${l.id}/complete`, { method: 'POST' });
    toast('Lesson completed — よくできました!', true);
    if (next) location.hash = '/lesson/' + next.id; else router();
  };
}

async function viewQuiz(app, params, id) {
  const z = await api('/quizzes/' + id);
  const left = z.max_attempts ? z.max_attempts - z.tries : Infinity;
  const intro = () => {
    app.innerHTML = `<div class="page"><div class="wrap" style="max-width:720px">
      <a href="#/course/${z.course.id}" class="muted small">← ${esc(z.course.title)}</a>
      <div class="card" style="text-align:center;margin-top:1rem;padding:2.5rem 1.5rem">
        <span class="eyebrow">${z.type === 'exam' ? '試験 · EXAM' : '小テスト · QUIZ'}</span><h1>${esc(z.title)}</h1>
        <div class="grid g4" style="margin:1.5rem 0">${[['問', z.questions.length, 'Questions'], ['時', z.duration_min + 'm', 'Time'], ['合', z.pass_score + '%', 'To pass'], ['回', left === Infinity ? '∞' : left, 'Attempts left']]
          .map(([k, v, l]) => `<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div><span class="bk">${k}</span></div>`).join('')}</div>
        ${left > 0 || state.me.role === 'admin' ? `<button class="btn shu" id="start">Begin ${z.type === 'exam' ? 'exam' : 'quiz'} — 始め</button>` : '<p class="tag shu">No attempts left</p>'}
        ${z.attempts.length ? `<h3 style="margin-top:2rem">Previous attempts</h3><table class="tbl"><tr><th>Date</th><th>Score</th></tr>${z.attempts.map((a) => `<tr><td>${fmtDate(a.created_at)}</td><td><b>${a.score}/${a.total}</b> (${Math.round((a.score / a.total) * 100)}%)</td></tr>`).join('')}</table>` : ''}
      </div></div></div>`;
    $('#start')?.addEventListener('click', take);
  };
  const take = () => {
    const answers = {};
    let secs = z.duration_min * 60;
    app.innerHTML = `<div class="page"><div class="wrap" style="max-width:820px">
      <div class="card quiz-top"><div><b>${esc(z.title)}</b><div class="qdots" id="dots" style="margin-top:.4rem">${z.questions.map((q, i) => `<a href="javascript:void 0" data-j="${q.id}">${i + 1}</a>`).join('')}</div></div>
        <div class="timer" id="timer">⏳ --:--</div></div>
      ${z.questions.map((q, i) => `<div class="card question" id="q${q.id}"><span class="qn">問${i + 1}</span> <b>${esc(q.text)}</b> <span class="muted small">(${q.points} pt)</span>
        ${q.options.map((o, oi) => `<label class="option"><input type="radio" name="q${q.id}" value="${oi}"> ${esc(o)}</label>`).join('')}</div>`).join('')}
      <div style="text-align:center"><button class="btn shu" id="submit">Submit answers — 提出</button></div></div></div>`;
    $$('.option input').forEach((inp) => inp.addEventListener('change', () => {
      const qid = inp.name.slice(1); answers[qid] = +inp.value;
      $$(`[name="${inp.name}"]`).forEach((x) => x.parentElement.classList.toggle('sel', x.checked));
      $(`[data-j="${qid}"]`).classList.add('ans');
    }));
    $$('#dots a').forEach((a) => (a.onclick = () => $('#q' + a.dataset.j).scrollIntoView({ behavior: 'smooth', block: 'center' })));
    const tick = () => {
      secs--; const t = $('#timer'); if (!t) return;
      t.textContent = `⏳ ${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
      t.classList.toggle('low', secs < 60);
      if (secs <= 0) { toast('Time is up — submitting.'); submit(); }
    };
    const iv = setInterval(tick, 1000); tick();
    state.cleanups.push(() => clearInterval(iv));
    let sent = false;
    const submit = async () => {
      if (sent) return;
      const unanswered = z.questions.length - Object.keys(answers).length;
      if (secs > 0 && unanswered && !(await confirmBox(`${unanswered} question(s) unanswered. Submit anyway?`, 'Submit'))) return;
      sent = true; clearInterval(iv);
      try { result(await api(`/quizzes/${z.id}/submit`, { body: { answers } })); } catch (err) { sent = false; toast(err.message); }
    };
    $('#submit').onclick = submit;
  };
  const result = (r) => {
    const C = 2 * Math.PI * 70;
    app.innerHTML = `<div class="page"><div class="wrap" style="max-width:820px">
      <div class="card" style="text-align:center;padding:2.5rem 1.5rem;margin-bottom:1.5rem">
        <div class="result-ring"><svg viewBox="0 0 170 170" width="170" height="170"><circle cx="85" cy="85" r="70" stroke="var(--washi-2)"/>
          <circle id="arc" cx="85" cy="85" r="70" stroke="${r.passed ? 'var(--matcha)' : 'var(--shu)'}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="transition:stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)"/></svg>
          <div class="val">${r.pct}%</div></div>
        <h2>${r.passed ? '合格 — Passed!' : '不合格 — Keep practicing'}</h2><p class="muted">You scored <b>${r.score}</b> out of <b>${r.total}</b>.</p>
        <div class="row" style="justify-content:center"><a class="btn ghost sm" href="#/course/${z.course.id}">Back to course</a><a class="btn sm" href="#/dashboard">My progress</a></div></div>
      <h3 class="title-jp" style="margin-bottom:1.2rem">Review</h3>
      ${r.review.map((q, i) => `<div class="card question"><span class="qn">問${i + 1}</span> <b>${esc(q.text)}</b> ${q.ok ? '<span class="tag green">Correct</span>' : '<span class="tag shu">Wrong</span>'}
        ${q.options.map((o, oi) => `<div class="option ${oi === q.correct ? 'right' : +q.chosen === oi && q.chosen !== null ? 'wrong' : ''}">${oi === q.correct ? '✓' : +q.chosen === oi && q.chosen !== null ? '✗' : '·'} ${esc(o)}</div>`).join('')}
        ${q.explanation ? `<p class="small" style="margin:.8rem 0 0"><b>解説 · Explanation:</b> ${esc(q.explanation)}</p>` : ''}</div>`).join('')}
    </div></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => { $('#arc').style.strokeDashoffset = C * (1 - r.pct / 100); }));
    scrollTo(0, 0);
  };
  intro();
}

async function viewDashboard(app) {
  const d = await api('/progress');
  const me = state.me;
  app.innerHTML = `<div class="page"><div class="wrap">
    <div class="welcome reveal"><span class="hanko" style="width:58px;height:58px;font-size:1.3rem">${esc(me.name[0])}</span>
      <div><h2>こんにちは, ${esc(me.name.split(' ')[0])}</h2><p>${esc(me.grade || 'Student')} · Keep walking the path, one lesson at a time.</p></div></div>
    ${d.lastLesson ? `<a class="card row between reveal" href="#/lesson/${d.lastLesson.id}" style="text-decoration:none;margin-bottom:1.5rem"><span><span class="eyebrow">CONTINUE</span><br><b>${esc(d.lastLesson.title)}</b></span><span class="btn shu sm">Resume ▶</span></a>` : ''}
    <div class="grid g4" style="margin-bottom:2rem">
      ${[['講', d.courses.length, 'Enrolled courses'], ['映', d.watched, 'Lessons completed'], ['点', d.avgScore == null ? '—' : d.avgScore + '%', 'Average score'], ['財', egp(d.balance), 'Wallet balance']]
        .map(([k, v, l], i) => `<div class="card kpi reveal" style="--d:${i * .08}s"><div class="v">${v}</div><div class="l">${l}</div><span class="bk">${k}</span></div>`).join('')}
    </div>
    <div class="grid g2" style="align-items:start">
      <div class="card reveal"><h3>My courses</h3>
        ${d.courses.length ? d.courses.map((c) => `<a href="#/course/${c.id}" style="text-decoration:none;display:block;padding:.8rem 0;border-bottom:1px solid #f1e9da">
          <div class="row between"><b>${esc(c.kanji || '')} ${esc(c.title)}</b><span class="small muted">${c.doneCount}/${c.lessonCount}</span></div>
          <div class="progress" style="margin-top:.5rem"><i data-w="${c.percent}"></i></div></a>`).join('')
        : '<div class="empty"><span class="k">空</span>No courses yet. <br><a class="btn shu sm" style="margin-top:1rem" href="#/courses">Browse courses</a></div>'}
      </div>
      <div class="card reveal" style="--d:.1s"><h3>Exam results</h3>
        ${d.attempts.length ? `<div class="table-wrap"><table class="tbl"><tr><th>Exam</th><th>Score</th><th>Date</th></tr>${d.attempts.map((a) => {
          const p = Math.round((a.score / a.total) * 100);
          return `<tr><td><b>${esc(a.quiz)}</b><br><span class="small muted">${esc(a.course)}</span></td><td><span class="tag ${p >= a.pass_score ? 'green' : 'shu'}">${p}%</span></td><td class="small">${fmtDate(a.created_at)}</td></tr>`;
        }).join('')}</table></div>` : '<div class="empty"><span class="k">問</span>No exams taken yet.</div>'}
      </div>
    </div></div></div>`;
  animateIn(app);
}

async function viewWallet(app) {
  const w = await api('/wallet');
  app.innerHTML = `<div class="page"><div class="wrap" style="max-width:900px">
    <div class="page-head"><div><span class="eyebrow">財布 · WALLET</span><h1 class="title-jp">My wallet</h1></div></div>
    <div class="grid g2" style="align-items:start">
      <div class="card dark-card">
        <span style="position:absolute;right:1rem;top:-1rem;font-family:var(--f-brush);font-size:8rem;opacity:.08">財</span>
        <div class="small" style="color:#cbbfae;letter-spacing:.15em">BALANCE</div><div class="stat-n" style="font-size:2.8rem" id="bal">${egp(w.balance)}</div>
        <form id="f" style="margin-top:1.2rem"><div class="field"><label style="color:#cbbfae">Recharge code</label><input name="code" placeholder="AA-XXXX-XXXX" required style="text-transform:uppercase;letter-spacing:.1em"></div>
        <p class="err"></p><button class="btn shu" style="width:100%">Redeem code</button></form>
      </div>
      <div class="card"><h3>How to get a code</h3>
        <ol class="muted" style="padding-left:1.2rem;margin:0"><li>Pay at the center or by Vodafone Cash / InstaPay to Mr. Ahmed's assistant.</li><li>Receive a recharge code (AA-XXXX-XXXX).</li><li>Enter it here — the balance appears instantly.</li><li>Use the balance to unlock any course.</li></ol></div>
    </div>
    <div class="card" style="margin-top:1.5rem"><h3>History</h3>
      ${w.transactions.length ? `<div class="table-wrap"><table class="tbl"><tr><th>Type</th><th>Details</th><th>Amount</th><th>Date</th></tr>${w.transactions.map((t) => `<tr><td><span class="tag ${t.amount > 0 ? 'green' : 'shu'}">${esc(t.type)}</span></td><td>${esc(t.note || '')}</td><td><b style="color:${t.amount > 0 ? 'var(--matcha)' : 'var(--shu)'}">${t.amount > 0 ? '+' : ''}${egp(t.amount)}</b></td><td class="small">${fmtDate(t.created_at)}</td></tr>`).join('')}</table></div>`
      : '<div class="empty"><span class="k">無</span>No transactions yet.</div>'}
    </div></div></div>`;
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const r = await api('/wallet/redeem', { body: { code: e.target.code.value } }); state.me.balance = r.balance; toast(`+${egp(r.amount)} added to your wallet!`, true); router(); }
    catch (err) { $('.err').textContent = err.message; }
  });
}

function viewProfile(app) {
  const me = state.me;
  app.innerHTML = `<div class="page"><div class="wrap" style="max-width:640px">
    <div class="page-head"><div><span class="eyebrow">プロフィール</span><h1 class="title-jp">Profile</h1></div></div>
    <div class="card"><form id="f">
      <div class="field"><label>Full name</label><input name="name" value="${esc(me.name)}"></div>
      <div class="field"><label>Email</label><input value="${esc(me.email)}" disabled></div>
      <div class="field"><label>Phone</label><input value="${esc(me.phone)}" disabled></div>
      <div class="field"><label>Parent's phone</label><input name="parent_phone" value="${esc(me.parent_phone || '')}"></div>
      <div class="field"><label>Grade</label><select name="grade">${GRADES.map((g) => `<option ${g === me.grade ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
      <h3 style="margin-top:1.5rem">Change password</h3>
      <div class="field"><label>Current password</label><input name="current_password" type="password" autocomplete="current-password"></div>
      <div class="field"><label>New password</label><input name="password" type="password" minlength="6" autocomplete="new-password"></div>
      <p class="err"></p><button class="btn shu">Save changes</button></form></div></div></div>`;
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { state.me = await api('/me', { method: 'PUT', body: Object.fromEntries(new FormData(e.target)) }); toast('Saved.', true); renderNav(); }
    catch (err) { $('.err').textContent = err.message; }
  });
}

/* ---------- router ---------- */
const routes = [
  [/^\/$/, viewLanding],
  [/^\/login$/, viewLogin, 'guest'],
  [/^\/register$/, viewRegister, 'guest'],
  [/^\/courses$/, viewCourses],
  [/^\/course\/(\d+)$/, viewCourse],
  [/^\/lesson\/(\d+)$/, viewLesson],
  [/^\/quiz\/(\d+)$/, viewQuiz, 'auth'],
  [/^\/dashboard$/, viewDashboard, 'auth'],
  [/^\/wallet$/, viewWallet, 'auth'],
  [/^\/profile$/, viewProfile, 'auth'],
  [/^\/admin(?:\/(\w+))?(?:\/(\d+))?$/, (...a) => window.viewAdmin(...a), 'admin'],
];

async function router() {
  state.cleanups.splice(0).forEach((f) => f());
  $('#burger').classList.remove('open'); $('#links').classList.remove('open'); document.body.classList.remove('menu-open');
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs || '');
  const app = $('#app');
  renderNav();
  const match = routes.find(([re]) => re.test(path));
  if (!match) { location.hash = '/'; return; }
  const [re, view, guard] = match;
  if (guard === 'auth' && !state.me) { sessionStorage.setItem('next', path); location.hash = '/login'; return; }
  if (guard === 'admin' && state.me?.role !== 'admin') { location.hash = state.me ? '/dashboard' : '/login'; return; }
  if (guard === 'guest' && state.me) { location.hash = '/dashboard'; return; }
  document.body.classList.toggle('is-admin', guard === 'admin'); document.body.classList.toggle('is-landing', path === '/');
  app.innerHTML = '<div class="loader"><span>物</span></div>';
  if (path !== '/' ) scrollTo(0, 0);
  try { await view(app, params, ...path.match(re).slice(1)); }
  catch (err) {
    app.innerHTML = `<div class="page"><div class="wrap"><div class="empty"><span class="k">誤</span><h2>${esc(err.message)}</h2><a class="btn sm" href="#/courses">Back to courses</a></div></div></div>`;
  }
}

window.addEventListener('hashchange', router);
(async () => {
  // preloader: count 0 → 100% while session + fonts load, then lift the curtain
  const pct = $('#pct'), t0 = performance.now(), MIN = 1300;
  let shown = 0;
  const ready = Promise.all([api('/me').catch(() => null), Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 2500))])]).then(([me]) => { state.me = me; });
  let done = false; ready.then(() => (done = true));
  await new Promise((res) => {
    const tick = (t) => {
      const target = Math.min(done ? 100 : 90, ((t - t0) / MIN) * 100);
      shown += (target - shown) * .18;
      pct.textContent = `${Math.round(shown)}%`;
      if (done && t - t0 >= MIN && shown > 99.4) { pct.textContent = '100%'; return res(); }
      setTimeout(() => tick(performance.now()), 16);
    };
    tick(performance.now());
    setTimeout(res, 6000); // hard cap so the site never stays behind the curtain
  });
  await router();
  document.body.classList.add('ready');
  setTimeout(() => $('#preloader').remove(), 1400);
})();

