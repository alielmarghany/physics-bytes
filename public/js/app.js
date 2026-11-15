/* Physics Bytes — student-facing SPA (Arabic, RTL, hash router, no build step) */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const egp = (n) => `${Number(n || 0).toLocaleString('en')} ج.م`;
const fmtDate = (s) => (s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const GRADES = ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'];
const TX = { recharge: 'شحن', purchase: 'شراء', admin: 'تعديل يدوي' };
const LITE = document.documentElement.classList.contains('lite');

const state = { me: null, cleanups: [] };
window.state = state;

/* ---------- icons (inline SVG, inherit text colour) ---------- */
const P = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19a2 2 0 012-2h13"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  quiz: '<path d="M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  wallet: '<path d="M3 7a2 2 0 012-2h13v4M3 7v10a2 2 0 002 2h15V9H5a2 2 0 01-2-2zM16 14h.01"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5"/>',
  user: '<path d="M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z"/>',
  users: '<path d="M17 21a6 6 0 00-12 0M11 11a4 4 0 100-8 4 4 0 000 8zM23 21a5 5 0 00-5-5M17 3.5a4 4 0 010 7"/>',
  logout: '<path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l-5-5 5-5M5 12h12"/>',
  login: '<path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4M14 17l5-5-5-5M19 12H7"/>',
  userplus: '<path d="M15 21a7 7 0 00-14 0M8 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  lock: '<path d="M5 11h14v10H5zM8 11V7a4 4 0 018 0v4"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  repeat: '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3"/>',
  file: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6"/>',
  ticket: '<path d="M3 7h18v3a2 2 0 000 4v3H3v-3a2 2 0 000-4z"/>',
  tag: '<path d="M3 12V3h9l9 9-9 9zM7.5 7.5h.01"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  next: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  prev: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  copy: '<path d="M9 9h11v11H9zM5 15H4V4h11v1"/>',
  /* physics topic icons */
  atom: '<circle cx="12" cy="12" r="1.6" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  wave: '<path d="M2 12c2.5-5 5-5 7.5 0s5 5 7.5 0 3.5-3 5-2"/><path d="M2 18c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1" opacity=".5"/>',
  magnet: '<path d="M6 3v8a6 6 0 0012 0V3h-4v8a2 2 0 01-4 0V3zM6 7h4M14 7h4"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V16h8v-1.3A7 7 0 0012 2z"/>',
  flame: '<path d="M12 22a7 7 0 007-7c0-5-7-13-7-13S5 10 5 15a7 7 0 007 7z"/><path d="M12 22a3 3 0 003-3c0-2-3-5-3-5s-3 3-3 5a3 3 0 003 3z"/>',
  pendulum: '<path d="M4 3h16M12 3l5 11"/><circle cx="17.8" cy="16.8" r="3"/>',
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.atom}</svg>`;
const ICON_CHOICES = [['pendulum', 'ميكانيكا (بندول)'], ['wave', 'موجات'], ['bulb', 'ضوء'], ['flame', 'حرارة'], ['bolt', 'كهربية'], ['magnet', 'مغناطيسية'], ['atom', 'ذرة / فيزياء حديثة']];
const OLD_KANJI = { '電': 'bolt', '動': 'pendulum', '力': 'pendulum', '波': 'wave', '光': 'bulb', '熱': 'flame', '磁': 'magnet', '原': 'atom' };
const courseIcon = (c) => (P[c?.kanji] ? c.kanji : OLD_KANJI[c?.kanji] || 'atom');

async function api(path, opts = {}) {
  if (window.DEMO_API) return window.DEMO_API(path, opts); // static preview (GitHub Pages)
  const r = await fetch('/api' + path, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'حدث خطأ، حاول مرة أخرى.'), { status: r.status });
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
    <div class="row end"><button type="button" class="btn ghost sm" data-close>إلغاء</button><button class="btn shu sm">حفظ</button></div></form>`,
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

function confirmBox(msg, yes = 'حذف') {
  return new Promise((resolve) => {
    modal(`<h3>هل أنت متأكد؟</h3><p>${esc(msg)}</p><div class="row end">
      <button class="btn ghost sm" data-close>إلغاء</button><button class="btn danger sm" id="yes">${esc(yes)}</button></div>`,
    (el, close) => { $('#yes', el).onclick = () => { close(); resolve(true); }; $$('[data-close]', el).forEach((b) => b.addEventListener('click', () => resolve(false))); });
  });
}

/* ---------- video embed ---------- */
function embedVideo(url) {
  if (!url) return null;
  let m = url.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  if (m) return `<iframe src="https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`;
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `<iframe src="https://player.vimeo.com/video/${m[1]}" allow="fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m) return `<iframe src="https://drive.google.com/file/d/${m[1]}/preview" allow="fullscreen" allowfullscreen loading="lazy"></iframe>`;
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return `<video controls preload="metadata" controlsList="nodownload" disablePictureInPicture oncontextmenu="return false" src="${esc(url)}"></video>`;
  return `<iframe src="${esc(url)}" allow="fullscreen" allowfullscreen loading="lazy"></iframe>`;
}

/* ---------- nav ---------- */
function renderNav() {
  const me = state.me;
  const r = (location.hash.slice(1) || '/').split('?')[0];
  const items = [
    ['/', 'الرئيسية', 'home'],
    ['/courses', 'الكورسات', 'book'],
    ...(me ? [['/dashboard', 'مستواي', 'chart'], ['/wallet', 'المحفظة', 'wallet'], ['/profile', 'حسابي', 'user']] : [['/login', 'تسجيل الدخول', 'login'], ['/register', 'إنشاء حساب', 'userplus']]),
    ...(me?.role === 'admin' ? [['/admin', 'لوحة التحكم', 'shield']] : []),
  ];
  $('#links').innerHTML = `<div class="menu-in">${items.map(([h, l, k]) => `<a href="#${h}" class="mlink ${(h === '/' ? r === '/' : r.startsWith(h)) ? 'active' : ''}">
      <span class="mi">${ic(k)}</span><span class="ml">${l}</span></a>`).join('')}
    ${me ? `<button class="mlink" id="logout"><span class="mi">${ic('logout')}</span><span class="ml">تسجيل الخروج</span></button>` : ''}</div>
    <div class="menu-foot"><span>${me ? `مسجّل باسم ${esc(me.name)}` : 'م. أحمد علاء · فيزياء الثانوية العامة'}</span><span class="ltr">Physics Bytes</span></div>`;
  $('#navright').innerHTML = me
    ? `<a href="#/wallet" class="wallet-chip">${ic('wallet')} <b>${egp(me.balance)}</b></a>`
    : `<a href="#/login" class="nav-login">دخول</a><a href="#/register" class="btn shu sm">اشترك</a>`;
  $('#logout')?.addEventListener('click', async () => { await api('/auth/logout', { method: 'POST' }); state.me = null; location.hash = '/'; toast('تم تسجيل الخروج. نراك قريبًا!', true); });
}
$('#burger').addEventListener('click', () => {
  const open = !$('#links').classList.contains('open');
  $('#burger').classList.toggle('open', open); $('#links').classList.toggle('open', open);
});
let scrollTick = false;
addEventListener('scroll', () => {
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(() => { $('#totop').classList.toggle('show', scrollY > innerHeight * .8); scrollTick = false; });
}, { passive: true });

/* ---------- light / dark mode ---------- */
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('theme', t); } catch (e) { /* storage blocked: theme still applies for this visit */ }
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'light' ? '#f7f1e7' : '#0c0b0e');
}
setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
$('#themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'));
$('#totop').addEventListener('click', () => scrollTo({ top: 0, behavior: LITE ? 'auto' : 'smooth' }));

/* ---------- reveal & counters ---------- */
function animateIn(root = document) {
  requestAnimationFrame(() => $$('.progress > i[data-w]', root).forEach((i) => (i.style.width = i.dataset.w + '%')));
  if (LITE || !('IntersectionObserver' in window)) {
    $$('[data-count]', root).forEach((el) => (el.textContent = Number(el.dataset.count).toLocaleString('en')));
    return;
  }
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    if (e.target.dataset.count != null) countUp(e.target);
    io.unobserve(e.target);
  }), { threshold: .12 });
  $$('.reveal, [data-count]', root).forEach((el) => io.observe(el));
  state.cleanups.push(() => io.disconnect());
}
function countUp(el) {
  const target = +el.dataset.count, t0 = performance.now(), dur = 1200;
  const tick = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en'); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

/* ---------- Japanese-inspired artwork (static SVG, no text) ---------- */
const TORII = `<svg class="torii" viewBox="0 0 120 90" aria-hidden="true"><g fill="currentColor"><path d="M2 8 Q60 -2 118 8 L116 16 Q60 8 4 16Z"/><rect x="12" y="22" width="96" height="7"/><rect x="24" y="14" width="9" height="76"/><rect x="87" y="14" width="9" height="76"/><rect x="56" y="16" width="8" height="12"/></g></svg>`;
const ENSO = (cls) => `<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1000" d="M108 16 C155 20 188 58 184 104 C180 152 140 186 94 182 C48 178 14 140 18 94 C22 56 50 26 88 19"/></svg>`;
const CLOUD = `<svg class="hero-cloud float" viewBox="0 0 360 200" aria-hidden="true"><g fill="currentColor" style="stroke:var(--bg)" stroke-width="5" stroke-linecap="round">
  <rect x="40" y="150" width="320" height="50" stroke="none"/><circle cx="270" cy="110" r="60"/><circle cx="95" cy="145" r="54"/><circle cx="185" cy="100" r="70"/>
  <path fill="none" d="M185 100m-46 0a46 46 0 1 1 46 46a32 32 0 1 1-23-44a16 16 0 1 1 13 20"/><path fill="none" d="M270 110m-38 0a38 38 0 1 1 38 38a25 25 0 1 1-17-36a12 12 0 1 1 10 15"/></g></svg>`;
const STARS = Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 89) % 300}" cy="${(i * 53) % 230}" r="${i % 5 ? .7 : 1.3}"/>`).join('');

/* Hero artwork: red sun with orbiting electrons above Mt. Fuji at night, a swinging pendulum, seigaiha waves */
const HERO_ART = `<svg class="art" viewBox="0 0 300 420" role="img" aria-label="شمس حمراء وإلكترونات تدور فوق جبل عند الليل">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0a14"/><stop offset=".55" stop-color="#2a1022"/><stop offset="1" stop-color="#4a1418"/></linearGradient>
    <radialGradient id="sunG" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ff5a5f"/><stop offset="1" stop-color="#c1001b"/></radialGradient>
    <pattern id="seigaiha" width="28" height="14" patternUnits="userSpaceOnUse">
      <g fill="none" stroke="#d6a24a" stroke-width="1.2"><circle cx="14" cy="14" r="13"/><circle cx="14" cy="14" r="9"/><circle cx="14" cy="14" r="5"/>
      <circle cx="0" cy="7" r="13"/><circle cx="0" cy="7" r="9"/><circle cx="0" cy="7" r="5"/><circle cx="28" cy="7" r="13"/><circle cx="28" cy="7" r="9"/><circle cx="28" cy="7" r="5"/></g>
    </pattern>
    <path id="orb1" d="M150 168 m-112 0 a112 38 0 1 0 224 0 a112 38 0 1 0 -224 0"/>
  </defs>
  <rect width="300" height="420" fill="url(#sky)"/>
  <g fill="#f0e9de" opacity=".7">${STARS}</g>
  <g font-family="monospace" fill="#f0e9de" opacity=".2" font-size="12"><text x="18" y="40">F = ma</text><text x="200" y="60">E = mc²</text><text x="24" y="300">v = λf</text><text x="214" y="282">V = IR</text></g>
  <circle cx="150" cy="168" r="66" fill="url(#sunG)"/>
  <g fill="none" stroke="#f0e9de" stroke-width="1.1" stroke-dasharray="3 5" opacity=".45">
    <ellipse cx="150" cy="168" rx="112" ry="38" transform="rotate(-24 150 168)"/><ellipse cx="150" cy="168" rx="112" ry="38" transform="rotate(24 150 168)"/>
  </g>
  <g transform="rotate(-24 150 168)"><circle r="5" fill="#f0e9de"><animateMotion dur="5s" repeatCount="indefinite"><mpath href="#orb1"/></animateMotion></circle></g>
  <g transform="rotate(24 150 168)"><circle r="5" fill="#f2cf7c"><animateMotion dur="7s" begin="-2s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#orb1"/></animateMotion></circle></g>
  <g class="art-pendulum"><line x1="150" y1="0" x2="150" y2="196" stroke="#f0e9de" stroke-width="1.3" opacity=".8"/><circle cx="150" cy="204" r="11" fill="#0d0a14" stroke="#f2cf7c" stroke-width="2"/></g>
  <path d="M-10 330 L96 238 Q112 222 128 230 L150 218 L172 230 Q188 222 204 238 L310 330 Z" fill="#08070a"/>
  <path d="M96 238 Q112 222 128 230 L150 218 L172 230 Q188 222 204 238 L190 252 L176 242 L163 256 L150 244 L137 258 L124 242 L110 254 Z" fill="#f0e9de"/>
  <path d="M-10 330 L60 290 L110 318 L170 286 L240 316 L310 292 L310 340 L-10 340 Z" fill="#1a1520"/>
  <rect x="-28" y="330" width="356" height="100" fill="#0d0a10"/><rect x="-28" y="330" width="356" height="100" fill="url(#seigaiha)" opacity=".55"/>
</svg>`;

const PATH = [
  ['pendulum', 'الميكانيكا', 'الحركة والقوى والطاقة', 'الصف الأول'],
  ['wave', 'الموجات والصوت', 'الاهتزازات والرنين', 'الصف الثاني'],
  ['bulb', 'الضوء', 'الانعكاس والعدسات والتداخل', 'الصف الثاني'],
  ['flame', 'الحرارة', 'الغازات والديناميكا الحرارية', 'الصف الثاني'],
  ['bolt', 'الكهربية', 'التيار وقانون أوم وكيرشوف', 'الصف الثالث'],
  ['magnet', 'المغناطيسية', 'المجالات والحث والتيار المتردد', 'الصف الثالث'],
  ['atom', 'الفيزياء الحديثة', 'الكم والذرة والليزر', 'الصف الثالث'],
];

async function viewLanding(app) {
  const [stats, cats] = await Promise.all([api('/public-stats').catch(() => null), api('/categories').catch(() => [])]);
  const go = state.me ? 'courses' : 'register';
  app.innerHTML = `
  <section class="hero" id="hero">
    <div class="hero-waves seigaiha" aria-hidden="true"></div>
    <div class="wrap hero-grid">
      <div class="hero-text">
        <span class="pill rise" style="--d:.05s"><i></i>فيزياء الثانوية العامة — بأسلوب مختلف</span>
        <h1 class="rise" style="--d:.12s">الفيزياء<br><span class="red">ببساطة.</span></h1>
        <p class="lead rise" style="--d:.2s">مع م. أحمد علاء: شرح بالفيديو لكل درس، تدريبات وامتحانات بتصحيح فوري، ومتابعة لمستواك خطوة بخطوة.</p>
        <div class="cta rise" style="--d:.28s">
          <a class="btn shu" href="#/${go}">${state.me ? 'كمّل مذاكرتك' : 'ابدأ رحلتك'} ${ic('next')}</a>
          <a class="btn ghost" href="#/courses">تصفّح الكورسات</a>
        </div>
        ${stats ? `<div class="hero-mini rise" style="--d:.36s">${[['students', 'طالب'], ['courses', 'كورس'], ['lessons', 'درس']]
          .map(([k, l]) => `<div><b class="mono" data-count="${stats[k] || 0}">0</b><span>${l}</span></div>`).join('')}</div>` : ''}
      </div>
      <div class="hero-art rise" style="--d:.1s">
        <div class="hero-sun" aria-hidden="true"></div>
        ${ENSO('hero-enso')}
        <div class="tcard hero-card"><div class="tcard-in">${HERO_ART}</div><span class="hanko stamp">${ic('atom')}</span></div>
        ${CLOUD}
      </div>
    </div>
  </section>

  <section class="topics lazy"><div class="wrap">
    <div class="topics-head reveal">
      <div><span class="eyebrow">المنهج</span><h2>رحلتك في الفيزياء</h2></div>
      <div class="topics-nav"><button class="round-btn" id="tPrev" aria-label="السابق">${ic('prev')}</button><button class="round-btn" id="tNext" aria-label="التالي">${ic('next')}</button></div>
    </div>
    <div class="topics-row" id="topics">
      ${PATH.map(([k, t, d, g], i) => `<a class="topic" href="#/courses">
        <div class="tcard"><div class="tcard-in kart"><span class="ksun"></span>${ic(k, 'ki')}<span class="knum mono">0${i + 1}</span><span class="kwave seigaiha"></span></div></div>
        <h3>${t}</h3><p>${d}</p><span class="tag gold" style="margin-top:.5rem">${g}</span></a>`).join('')}
    </div>
  </div></section>

  <section class="quote lazy">
    ${ENSO('q-enso')}
    <div class="washi w1">${ic('bolt')}</div><div class="washi w2">${ic('atom')}</div><div class="washi w3">${ic('magnet')}</div>
    <h2 class="reveal">الفيزياء لا تُحفظ…<br>الفيزياء <span class="red">تُفهم.</span></h2>
    <p class="reveal" style="--d:.1s">أكثر من معادلات وأكثر من درجات — تعلّم أن ترى القوانين وراء كل شيء يتحرك حولك.</p>
  </section>

  <section class="band lazy"><div class="wrap">
    <div class="section-title reveal"><span class="eyebrow">المميزات</span><h2>كل ما تحتاجه في مكان واحد</h2></div>
    <div class="grid g3">
      ${[['play', 'شرح فيديو بجودة عالية', 'دروس مرتبة بالفصول، مع مشغّل محمي وعدد مشاهدات محدد لكل درس.'],
        ['quiz', 'اختبارات وامتحانات', 'اختبار بعد كل فصل وامتحانات شاملة بمؤقت وتصحيح فوري وشرح للإجابات.'],
        ['chart', 'متابعة مستواك', 'اعرف الدروس التي أنهيتها ودرجاتك وما تحتاج إلى مراجعته.'],
        ['wallet', 'محفظة وأكواد شحن', 'اشحن رصيدك بكود وافتح أي كورس فورًا.'],
        ['layers', 'منهج منظّم', 'كل صف مقسّم إلى كورسات وفصول ودروس — لا شيء يضيع.'],
        ['user', 'من المدرّس مباشرة', 'محتوى يعدّه ويحدّثه م. أحمد علاء بنفسه.']]
        .map(([k, t, d], i) => `<div class="card feature reveal" style="--d:${(i % 3) * .08}s"><span class="hanko">${ic(k)}</span><h3>${t}</h3><p>${d}</p><span class="fwave seigaiha" aria-hidden="true"></span></div>`).join('')}
    </div>
  </div></section>

  ${cats.length ? `<section class="band lazy" style="padding-top:1rem"><div class="wrap">
    <div class="section-title reveal"><span class="eyebrow">الصفوف</span><h2>اختر صفّك</h2></div>
    <div class="grid g3">
      ${cats.map((c, i) => `<a class="card grade-card reveal" style="--d:${i * .08}s" href="#/courses?cat=${c.id}"><span class="gnum mono">${i + 1}</span>
        <span class="tag">${c.course_count} كورس</span><h3>${esc(c.name)}</h3><p class="muted">${esc(c.description || '')}</p><span class="arrow">${ic('next')}</span><span class="gwave seigaiha" aria-hidden="true"></span></a>`).join('')}
    </div>
  </div></section>` : ''}

  <section class="cta-band lazy">
    <div class="cta-sun" aria-hidden="true"></div>
    ${TORII}
    <span class="eyebrow">خطوتك الأولى</span>
    <h2>ادخل من البوابة،<br><span class="red">وابدأ الآن.</span></h2>
    <a class="btn shu" href="#/${go}">${state.me ? 'اذهب إلى الكورسات' : 'أنشئ حسابًا مجانيًا'}</a>
  </section>
  ${footer()}`;

  // topics row arrows (RTL: "next" scrolls towards the left)
  const row = $('#topics');
  const step = () => (row.firstElementChild?.offsetWidth || 240) + 20;
  $('#tNext').onclick = () => row.scrollBy({ left: -step(), behavior: LITE ? 'auto' : 'smooth' });
  $('#tPrev').onclick = () => row.scrollBy({ left: step(), behavior: LITE ? 'auto' : 'smooth' });

  // pause the hero's small loops whenever it is off-screen (and always in lite mode)
  const hero = $('#hero'), art = $('.art', hero);
  const pause = (p) => { hero.classList.toggle('paused', p); try { p ? art.pauseAnimations() : art.unpauseAnimations(); } catch (e) { /* SMIL not supported */ } };
  if (LITE) pause(true);
  else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => pause(!e.isIntersecting));
    io.observe(hero);
    state.cleanups.push(() => io.disconnect());
  }
  animateIn(app);
}

const footer = () => `<footer class="foot"><div class="fwaves seigaiha" aria-hidden="true"></div><div class="wrap">
  <div class="row between small">
    <a href="#/" class="row foot-logo brand"><img class="pb-mark" src="img/logo-mark.png" alt="" width="26" height="34"><span class="pb-word"><b>Physics bytes</b><small>By Eng/Ahmed Alaa</small></span></a>
    <span class="row"><a href="#/courses">الكورسات</a><a href="#/${state.me ? 'dashboard' : 'register'}">${state.me ? 'مستواي' : 'اشترك الآن'}</a></span>
    <span>© ${new Date().getFullYear()} Physics Bytes</span></div></div></footer>`;

function authShell(title, text, formHtml) {
  return `<div class="auth"><div class="auth-art"><div class="a-sun"></div><h2>${title}</h2><p>${text}</p><div class="a-waves seigaiha"></div></div>
    <div class="auth-form"><div class="card">${formHtml}</div></div></div>`;
}

function viewLogin(app) {
  app.innerHTML = authShell('أهلًا بعودتك', 'سجّل دخولك وكمّل من حيث توقفت.', `
    <span class="eyebrow">تسجيل الدخول</span><h2>دخول</h2>
    <form id="f"><div class="field"><label>البريد الإلكتروني أو رقم الموبايل</label><input name="login" required autocomplete="username" dir="ltr" style="text-align:right"></div>
    <div class="field"><label>كلمة المرور</label><input name="password" type="password" required autocomplete="current-password"></div>
    <p class="err"></p><button class="btn shu block">دخول</button></form>
    <p class="muted small center" style="margin-top:1rem">جديد هنا؟ <a href="#/register">أنشئ حسابًا</a></p>`);
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      state.me = await api('/auth/login', { body: Object.fromEntries(new FormData(e.target)) });
      toast(`أهلًا ${state.me.name.split(' ')[0]}!`, true);
      location.hash = state.me.role === 'admin' ? '/admin' : (sessionStorage.getItem('next') || '/dashboard');
      sessionStorage.removeItem('next');
    } catch (err) { $('.err').textContent = err.message; }
  });
}

function viewRegister(app) {
  app.innerHTML = authShell('ابدأ رحلتك', 'حساب واحد للدروس والامتحانات والمحفظة ومتابعة مستواك.', `
    <span class="eyebrow">حساب جديد</span><h2>إنشاء حساب</h2>
    <form id="f"><div class="field"><label>الاسم بالكامل</label><input name="name" required></div>
    <div class="two"><div class="field"><label>رقم الموبايل</label><input name="phone" required inputmode="tel" placeholder="01xxxxxxxxx"></div>
    <div class="field"><label>رقم ولي الأمر</label><input name="parent_phone" inputmode="tel"></div></div>
    <div class="field"><label>البريد الإلكتروني</label><input name="email" type="email" required autocomplete="email"></div>
    <div class="two"><div class="field"><label>الصف</label><select name="grade">${GRADES.map((g) => `<option>${g}</option>`).join('')}</select></div>
    <div class="field"><label>كلمة المرور</label><input name="password" type="password" minlength="6" required autocomplete="new-password"></div></div>
    <p class="err"></p><button class="btn shu block">إنشاء الحساب</button></form>
    <p class="muted small center" style="margin-top:1rem">لديك حساب؟ <a href="#/login">سجّل الدخول</a></p>`);
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { state.me = await api('/auth/register', { body: Object.fromEntries(new FormData(e.target)) }); toast('تم إنشاء حسابك، أهلًا بك!', true); location.hash = '/courses'; }
    catch (err) { $('.err').textContent = err.message; }
  });
}

const coverHtml = (c, h = '') => `<div class="cover" ${h}><span class="csun"></span>${ic(courseIcon(c), 'ci')}<span class="cwave seigaiha"></span></div>`;
const priceHtml = (p) => (p ? `${Number(p).toLocaleString('en')} <small>ج.م</small>` : '<span class="free">مجاني</span>');

function courseCard(c, i = 0) {
  return `<a class="card course-card reveal" style="--d:${(i % 3) * .08}s" href="#/course/${c.id}">${coverHtml(c)}
    <div class="course-body"><div class="row"><span class="tag">${esc(c.category || 'عام')}</span>${c.enrolled ? '<span class="tag green">مشترك</span>' : ''}</div>
    <h3>${esc(c.title)}</h3><p>${esc(c.description || '')}</p>
    <div class="row between"><span class="muted small">${c.chapter_count} فصول · ${c.lesson_count} دروس</span><span class="price">${priceHtml(c.price)}</span></div></div></a>`;
}

async function viewCourses(app, params) {
  const cat = params.get('cat') || '';
  const [cats, courses] = await Promise.all([api('/categories'), api('/courses' + (cat ? `?category=${cat}` : ''))]);
  app.innerHTML = `<div class="page"><div class="wrap">
    <div class="page-head"><div><span class="eyebrow">الكورسات</span><h1 class="title-line">كل الكورسات</h1></div></div>
    <div class="filters"><button class="chip ${!cat ? 'on' : ''}" data-c="">الكل</button>${cats.map((c) => `<button class="chip ${String(c.id) === cat ? 'on' : ''}" data-c="${c.id}">${esc(c.name)}</button>`).join('')}</div>
    ${courses.length ? `<div class="grid g3">${courses.map(courseCard).join('')}</div>` : `<div class="empty"><div class="ei">${ic('book')}</div>لا توجد كورسات هنا بعد.</div>`}
  </div></div>`;
  $$('.chip').forEach((b) => (b.onclick = () => (location.hash = '/courses' + (b.dataset.c ? `?cat=${b.dataset.c}` : ''))));
  animateIn(app);
}

function lessonItem(l, c, current) {
  const open = c.access || l.is_free;
  return `<a class="item ${l.done ? 'done' : ''} ${open ? '' : 'locked'} ${current === l.id ? 'current' : ''}" href="${open ? `#/lesson/${l.id}` : 'javascript:void 0'}" ${open ? '' : 'data-locked'}>
    <span class="ii">${ic(l.done ? 'check' : open ? 'play' : 'lock')}</span><span>${esc(l.title)}</span>
    <span class="meta">${l.is_free && !c.access ? '<span class="tag green">مجاني</span>' : ''}${l.duration_min ? `<span class="muted small">${l.duration_min} دقيقة</span>` : ''}</span></a>`;
}
function quizItem(z, c) {
  return `<a class="item ${c.access ? '' : 'locked'}" href="${c.access ? `#/quiz/${z.id}` : 'javascript:void 0'}" ${c.access ? '' : 'data-locked'}>
    <span class="ii q">${ic('quiz')}</span><span>${esc(z.title)}</span>
    <span class="meta">${z.best != null ? `<span class="tag ${z.best >= z.pass_score ? 'green' : 'shu'}">أفضل نتيجة ${z.best}%</span>` : ''}<span class="tag ${z.type === 'exam' ? 'shu' : 'ai'}">${z.type === 'exam' ? 'امتحان' : 'اختبار'}</span><span class="muted small">${z.qcount} سؤال</span></span></a>`;
}

async function viewCourse(app, params, id) {
  const c = await api('/courses/' + id);
  const qn = c.chapters.reduce((a, ch) => a + ch.quizzes.length, 0) + c.exams.length;
  app.innerHTML = `<div class="page"><div class="wrap">
    <div class="course-hero">
      <div><a href="#/courses" class="back">${ic('prev')} كل الكورسات</a>
        <div class="row" style="margin:.8rem 0"><span class="tag">${esc(c.category || '')}</span>${c.enrolled ? '<span class="tag green">مشترك</span>' : ''}</div>
        <h1 style="font-size:clamp(1.8rem,4vw,2.6rem)">${esc(c.title)}</h1><p class="muted">${esc(c.description || '')}</p>
        <div class="row muted small"><span>${ic('layers')} ${c.chapters.length} فصول</span><span>${ic('play')} ${c.lessonCount} دروس</span><span>${ic('quiz')} ${qn} اختبارات وامتحانات</span></div>
      </div>
      <div class="card buy-box">
        ${coverHtml(c, 'style="border-radius:12px;height:150px;margin-bottom:1rem"')}
        ${c.access ? `<div class="row between small"><b>تقدّمك</b><span>${c.doneCount}/${c.lessonCount} دروس</span></div>
          <div class="progress" style="margin:.5rem 0 1rem"><i data-w="${c.percent}"></i></div>
          <a class="btn shu block" href="#/lesson/${(c.chapters.flatMap((ch) => ch.lessons).find((l) => !l.done) || c.chapters[0]?.lessons[0] || {}).id || ''}">${c.doneCount ? 'كمّل التعلّم' : 'ابدأ التعلّم'}</a>`
        : `<div class="price" style="font-size:2rem">${priceHtml(c.price)}</div>
          <p class="muted small">وصول دائم لكل الدروس والاختبارات والامتحانات في هذا الكورس.</p>
          <button class="btn shu block" id="enroll">${state.me ? (c.price ? 'اشترِ من المحفظة' : 'اشترك مجانًا') : 'سجّل الدخول للاشتراك'}</button>
          ${state.me ? `<p class="small muted center" style="margin:.6rem 0 0">رصيدك: <b>${egp(state.me.balance)}</b> · <a href="#/wallet">اشحن</a></p>` : ''}`}
      </div>
    </div>
    <h2 class="title-line" style="margin-bottom:1.4rem">محتوى الكورس</h2>
    ${c.chapters.map((ch, i) => `<details class="chapter" ${i === 0 ? 'open' : ''}><summary><span class="no mono">${i + 1}</span>${esc(ch.title)}
      <span class="cnt">${ch.lessons.length} دروس</span>${ic('chev', 'chev')}</summary>
      ${ch.lessons.map((l) => lessonItem(l, c)).join('')}${ch.quizzes.map((z) => quizItem(z, c)).join('')}
      ${!ch.lessons.length && !ch.quizzes.length ? '<p class="muted small" style="padding:1rem 1.2rem;margin:0">الدروس قريبًا.</p>' : ''}</details>`).join('')}
    ${c.exams.length ? `<details class="chapter" open><summary><span class="no red">${ic('target')}</span>الامتحانات النهائية${ic('chev', 'chev')}</summary>${c.exams.map((z) => quizItem(z, c)).join('')}</details>` : ''}
  </div></div>`;
  $$('[data-locked]').forEach((a) => a.addEventListener('click', () => toast(state.me ? 'اشترك في الكورس لفتح هذا المحتوى.' : 'سجّل الدخول واشترك لفتح هذا المحتوى.')));
  $('#enroll')?.addEventListener('click', async () => {
    if (!state.me) { sessionStorage.setItem('next', location.hash.slice(1)); location.hash = '/login'; return; }
    if (c.price && !(await confirmBox(`سيتم خصم ${egp(c.price)} من محفظتك لفتح "${c.title}". متابعة؟`, 'ادفع واشترك'))) return;
    try { const r = await api(`/courses/${c.id}/enroll`, { method: 'POST' }); state.me.balance = r.balance; toast('تم الاشتراك! بالتوفيق.', true); router(); }
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
    <a href="#/course/${l.course.id}" class="back">${ic('prev')} ${esc(l.course.title)}</a>
    <div class="lesson-layout" style="margin-top:1rem">
      <div>
        <div class="player">${player || `<div class="placeholder"><div>${ic('play')}سيتم رفع فيديو هذا الدرس قريبًا.</div></div>`}
          ${player ? `<span class="wm">${esc(l.watermark)}</span>` : ''}</div>
        <div class="row between" style="margin:1.2rem 0 .4rem"><div><span class="eyebrow">${esc(l.chapter_title)}</span><h2 style="margin:0">${esc(l.title)}</h2></div>
          <div class="row">${l.max_views ? `<span class="tag ai">${ic('eye')} مشاهدة ${l.views}/${l.max_views}</span>` : ''}
          <button class="btn ${l.completed ? 'ghost' : 'shu'} sm" id="done">${l.completed ? `${ic('check')} مكتمل` : 'تحديد كمكتمل'}</button></div></div>
        <p class="muted">${esc(l.description || '')}</p>
        ${l.attachment_url ? `<a class="btn ghost sm" target="_blank" rel="noopener" href="${esc(l.attachment_url)}">${ic('file')} ملزمة الدرس / الواجب</a>` : ''}
        <div class="row between" style="margin-top:2rem">
          ${prev ? `<a class="btn ghost sm" href="#/lesson/${prev.id}">${ic('prev')} ${esc(prev.title)}</a>` : '<span></span>'}
          ${next ? `<a class="btn sm" href="#/lesson/${next.id}">${esc(next.title)} ${ic('next')}</a>` : ''}</div>
      </div>
      <aside class="card side-outline">${l.outline.chapters.map((ch) => `<h4>${esc(ch.title)}</h4>${ch.lessons.map((x) => lessonItem(x, access, l.id)).join('')}${ch.quizzes.map((z) => quizItem(z, access)).join('')}`).join('')}</aside>
    </div></div></div>`;
  $('#done').onclick = async () => {
    await api(`/lessons/${l.id}/complete`, { method: 'POST' });
    toast('أحسنت! تم إكمال الدرس.', true);
    if (next) location.hash = '/lesson/' + next.id; else router();
  };
}

async function viewQuiz(app, params, id) {
  const z = await api('/quizzes/' + id);
  const left = z.max_attempts ? z.max_attempts - z.tries : Infinity;
  const kind = z.type === 'exam' ? 'الامتحان' : 'الاختبار';
  const intro = () => {
    app.innerHTML = `<div class="page"><div class="wrap" style="max-width:740px">
      <a href="#/course/${z.course.id}" class="back">${ic('prev')} ${esc(z.course.title)}</a>
      <div class="card center" style="margin-top:1rem;padding:2.5rem 1.5rem">
        <span class="eyebrow">${z.type === 'exam' ? 'امتحان' : 'اختبار'}</span><h1>${esc(z.title)}</h1>
        <div class="grid g4" style="margin:1.5rem 0;text-align:start">${[['quiz', z.questions.length, 'عدد الأسئلة'], ['clock', `${z.duration_min} دقيقة`, 'المدة'], ['target', z.pass_score + '%', 'درجة النجاح'], ['repeat', left === Infinity ? 'غير محدود' : left, 'محاولات متبقية']]
          .map(([k, v, l]) => `<div class="card kpi"><div class="v">${v}</div><div class="l">${l}</div><span class="kic">${ic(k)}</span></div>`).join('')}</div>
        ${left > 0 || state.me.role === 'admin' ? `<button class="btn shu" id="start">ابدأ ${kind}</button>` : '<p class="tag shu">لا توجد محاولات متبقية</p>'}
        ${z.attempts.length ? `<h3 style="margin-top:2rem">محاولات سابقة</h3><table class="tbl"><tr><th>التاريخ</th><th>الدرجة</th></tr>${z.attempts.map((a) => `<tr><td>${fmtDate(a.created_at)}</td><td><b>${a.score}/${a.total}</b> (${Math.round((a.score / a.total) * 100)}%)</td></tr>`).join('')}</table>` : ''}
      </div></div></div>`;
    $('#start')?.addEventListener('click', take);
  };
  const take = () => {
    const answers = {};
    let secs = z.duration_min * 60;
    app.innerHTML = `<div class="page"><div class="wrap" style="max-width:820px">
      <div class="card quiz-top"><div><b>${esc(z.title)}</b><div class="qdots" id="dots" style="margin-top:.4rem">${z.questions.map((q, i) => `<a href="javascript:void 0" data-j="${q.id}">${i + 1}</a>`).join('')}</div></div>
        <div class="timer" id="timer">${ic('clock')} --:--</div></div>
      ${z.questions.map((q, i) => `<div class="card question" id="q${q.id}"><span class="qn">${i + 1}</span><b>${esc(q.text)}</b> <span class="muted small">(${q.points} درجة)</span>
        ${q.options.map((o, oi) => `<label class="option"><input type="radio" name="q${q.id}" value="${oi}"> ${esc(o)}</label>`).join('')}</div>`).join('')}
      <div class="center"><button class="btn shu" id="submit">تسليم الإجابات</button></div></div></div>`;
    $$('.option input').forEach((inp) => inp.addEventListener('change', () => {
      const qid = inp.name.slice(1); answers[qid] = +inp.value;
      $$(`[name="${inp.name}"]`).forEach((x) => x.parentElement.classList.toggle('sel', x.checked));
      $(`[data-j="${qid}"]`).classList.add('ans');
    }));
    $$('#dots a').forEach((a) => (a.onclick = () => $('#q' + a.dataset.j).scrollIntoView({ behavior: LITE ? 'auto' : 'smooth', block: 'center' })));
    const tick = () => {
      secs--; const t = $('#timer'); if (!t) return;
      t.innerHTML = `${ic('clock')} ${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
      t.classList.toggle('low', secs < 60);
      if (secs <= 0) { toast('انتهى الوقت — جارٍ التسليم.'); submit(); }
    };
    const iv = setInterval(tick, 1000); tick();
    state.cleanups.push(() => clearInterval(iv));
    let sent = false;
    const submit = async () => {
      if (sent) return;
      const unanswered = z.questions.length - Object.keys(answers).length;
      if (secs > 0 && unanswered && !(await confirmBox(`يوجد ${unanswered} سؤال بدون إجابة. هل تريد التسليم؟`, 'تسليم'))) return;
      sent = true; clearInterval(iv);
      try { result(await api(`/quizzes/${z.id}/submit`, { body: { answers } })); } catch (err) { sent = false; toast(err.message); }
    };
    $('#submit').onclick = submit;
  };
  const result = (r) => {
    const C = 2 * Math.PI * 70;
    app.innerHTML = `<div class="page"><div class="wrap" style="max-width:820px">
      <div class="card center" style="padding:2.5rem 1.5rem;margin-bottom:1.5rem">
        <div class="result-ring"><svg viewBox="0 0 170 170" width="170" height="170"><circle cx="85" cy="85" r="70" stroke="var(--line-2)"/>
          <circle id="arc" cx="85" cy="85" r="70" stroke="${r.passed ? 'var(--matcha)' : 'var(--shu)'}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="transition:stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)"/></svg>
          <div class="val mono">${r.pct}%</div></div>
        <h2>${r.passed ? 'ناجح! أحسنت' : 'تحتاج إلى مزيد من التدريب'}</h2><p class="muted">حصلت على <b>${r.score}</b> من <b>${r.total}</b>.</p>
        <div class="row" style="justify-content:center"><a class="btn ghost sm" href="#/course/${z.course.id}">العودة للكورس</a><a class="btn sm" href="#/dashboard">مستواي</a></div></div>
      <h3 class="title-line" style="margin-bottom:1.2rem">مراجعة الإجابات</h3>
      ${r.review.map((q, i) => `<div class="card question"><span class="qn">${i + 1}</span><b>${esc(q.text)}</b> ${q.ok ? '<span class="tag green">صحيح</span>' : '<span class="tag shu">خطأ</span>'}
        ${q.options.map((o, oi) => { const mine = q.chosen !== null && +q.chosen === oi; return `<div class="option ${oi === q.correct ? 'right' : mine ? 'wrong' : ''}">${oi === q.correct ? ic('check') : mine ? ic('x') : '<span style="width:18px"></span>'} ${esc(o)}</div>`; }).join('')}
        ${q.explanation ? `<p class="small" style="margin:.8rem 0 0"><b>الشرح:</b> ${esc(q.explanation)}</p>` : ''}</div>`).join('')}
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
    <div class="welcome reveal"><span class="wsun"></span><span class="wwave seigaiha"></span><span class="avatar">${esc(me.name[0])}</span>
      <div><h2>أهلًا، ${esc(me.name.split(' ')[0])}</h2><p>${esc(me.grade || 'طالب')} · خطوة بخطوة، درس بعد درس.</p></div></div>
    ${d.lastLesson ? `<a class="card row between reveal" href="#/lesson/${d.lastLesson.id}" style="text-decoration:none;margin-bottom:1.5rem"><span><span class="eyebrow">كمّل من حيث توقفت</span><br><b>${esc(d.lastLesson.title)}</b></span><span class="btn shu sm">${ic('play')} استكمال</span></a>` : ''}
    <div class="grid g4" style="margin-bottom:2rem">
      ${[['book', d.courses.length, 'كورسات مشترك بها'], ['check', d.watched, 'دروس مكتملة'], ['target', d.avgScore == null ? '—' : d.avgScore + '%', 'متوسط الدرجات'], ['wallet', egp(d.balance), 'رصيد المحفظة']]
        .map(([k, v, l], i) => `<div class="card kpi reveal" style="--d:${i * .06}s"><div class="v mono">${v}</div><div class="l">${l}</div><span class="kic">${ic(k)}</span></div>`).join('')}
    </div>
    <div class="grid g2" style="align-items:start">
      <div class="card reveal"><h3>كورساتي</h3>
        ${d.courses.length ? d.courses.map((c) => `<a href="#/course/${c.id}" style="text-decoration:none;display:block;padding:.8rem 0;border-bottom:1px solid var(--line)">
          <div class="row between"><b>${esc(c.title)}</b><span class="small muted">${c.doneCount}/${c.lessonCount}</span></div>
          <div class="progress" style="margin-top:.5rem"><i data-w="${c.percent}"></i></div></a>`).join('')
        : `<div class="empty"><div class="ei">${ic('book')}</div>لم تشترك في أي كورس بعد.<br><a class="btn shu sm" style="margin-top:1rem" href="#/courses">تصفّح الكورسات</a></div>`}
      </div>
      <div class="card reveal" style="--d:.08s"><h3>نتائج الامتحانات</h3>
        ${d.attempts.length ? `<div class="table-wrap"><table class="tbl"><tr><th>الامتحان</th><th>الدرجة</th><th>التاريخ</th></tr>${d.attempts.map((a) => {
          const p = Math.round((a.score / a.total) * 100);
          return `<tr><td><b>${esc(a.quiz)}</b><br><span class="small muted">${esc(a.course)}</span></td><td><span class="tag ${p >= a.pass_score ? 'green' : 'shu'}">${p}%</span></td><td class="small">${fmtDate(a.created_at)}</td></tr>`;
        }).join('')}</table></div>` : `<div class="empty"><div class="ei">${ic('quiz')}</div>لم تؤدِّ أي امتحان بعد.</div>`}
      </div>
    </div></div></div>`;
  animateIn(app);
}

async function viewWallet(app) {
  const w = await api('/wallet');
  app.innerHTML = `<div class="page"><div class="wrap" style="max-width:900px">
    <div class="page-head"><div><span class="eyebrow">المحفظة</span><h1 class="title-line">محفظتي</h1></div></div>
    <div class="grid g2" style="align-items:start">
      <div class="card dark-card">
        <div class="small muted">الرصيد الحالي</div><div class="stat-n mono" style="font-size:2.6rem" id="bal">${egp(w.balance)}</div>
        <form id="f" style="margin-top:1.2rem"><div class="field"><label>كود الشحن</label><input name="code" placeholder="AA-XXXX-XXXX" required style="text-transform:uppercase;letter-spacing:.1em"></div>
        <p class="err"></p><button class="btn shu block">${ic('ticket')} شحن الرصيد</button></form>
      </div>
      <div class="card"><h3>كيف تحصل على كود؟</h3>
        <ol class="muted" style="padding-inline-start:1.2rem;margin:0"><li>ادفع في السنتر أو عبر فودافون كاش / إنستاباي لمساعد م. أحمد.</li><li>استلم كود الشحن (AA-XXXX-XXXX).</li><li>أدخله هنا — يظهر الرصيد فورًا.</li><li>استخدم الرصيد لفتح أي كورس.</li></ol></div>
    </div>
    <div class="card" style="margin-top:1.5rem"><h3>سجل العمليات</h3>
      ${w.transactions.length ? `<div class="table-wrap"><table class="tbl"><tr><th>النوع</th><th>التفاصيل</th><th>المبلغ</th><th>التاريخ</th></tr>${w.transactions.map((t) => `<tr><td><span class="tag ${t.amount > 0 ? 'green' : 'shu'}">${TX[t.type] || esc(t.type)}</span></td><td>${esc(t.note || '')}</td><td><b class="mono ltr" style="color:${t.amount > 0 ? 'var(--matcha)' : 'var(--shu)'}">${t.amount > 0 ? '+' : ''}${t.amount}</b> <span class="small muted">ج.م</span></td><td class="small">${fmtDate(t.created_at)}</td></tr>`).join('')}</table></div>`
      : `<div class="empty"><div class="ei">${ic('wallet')}</div>لا توجد عمليات بعد.</div>`}
    </div></div></div>`;
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const r = await api('/wallet/redeem', { body: { code: e.target.code.value } }); state.me.balance = r.balance; toast(`تمت إضافة ${egp(r.amount)} إلى محفظتك!`, true); router(); }
    catch (err) { $('.err').textContent = err.message; }
  });
}

function viewProfile(app) {
  const me = state.me;
  const grades = GRADES.includes(me.grade) || !me.grade ? GRADES : [me.grade, ...GRADES];
  app.innerHTML = `<div class="page"><div class="wrap" style="max-width:640px">
    <div class="page-head"><div><span class="eyebrow">الملف الشخصي</span><h1 class="title-line">حسابي</h1></div></div>
    <div class="card"><form id="f">
      <div class="field"><label>الاسم بالكامل</label><input name="name" value="${esc(me.name)}"></div>
      <div class="field"><label>البريد الإلكتروني</label><input type="email" value="${esc(me.email)}" disabled></div>
      <div class="field"><label>رقم الموبايل</label><input name="phone" value="${esc(me.phone)}" disabled></div>
      <div class="field"><label>رقم ولي الأمر</label><input name="parent_phone" value="${esc(me.parent_phone || '')}"></div>
      <div class="field"><label>الصف</label><select name="grade">${grades.map((g) => `<option ${g === me.grade ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></div>
      <h3 style="margin-top:1.5rem">تغيير كلمة المرور</h3>
      <div class="field"><label>كلمة المرور الحالية</label><input name="current_password" type="password" autocomplete="current-password"></div>
      <div class="field"><label>كلمة المرور الجديدة</label><input name="password" type="password" minlength="6" autocomplete="new-password"></div>
      <p class="err"></p><button class="btn shu">حفظ التغييرات</button></form></div></div></div>`;
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { state.me = await api('/me', { method: 'PUT', body: Object.fromEntries(new FormData(e.target)) }); toast('تم الحفظ.', true); renderNav(); }
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
  $('#burger').classList.remove('open'); $('#links').classList.remove('open');
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
  app.innerHTML = '<div class="loader"><span></span></div>';
  scrollTo(0, 0);
  try { await view(app, params, ...path.match(re).slice(1)); }
  catch (err) {
    app.innerHTML = `<div class="page"><div class="wrap"><div class="empty"><div class="ei">${ic('x')}</div><h2>${esc(err.message)}</h2><a class="btn sm" href="#/courses">العودة للكورسات</a></div></div></div>`;
  }
}

window.addEventListener('hashchange', router);
(async () => {
  state.me = await api('/me').catch(() => null);
  router();
})();
