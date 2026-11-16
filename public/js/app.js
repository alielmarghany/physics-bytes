/* Physics Bytes — single-page app (English default, Arabic option; hash router, no build step).
   Data comes from Supabase through api() in api.js. */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => Number(n || 0).toLocaleString('en');
const egp = (n) => `${num(n)} ${t('EGP')}`;
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString(LANG === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const pad2 = (n) => String(n).padStart(2, '0');
const GRADES = ['1st Secondary', '2nd Secondary', '3rd Secondary'];
const TX = { recharge: 'Recharge', purchase: 'Purchase', admin: 'Manual adjustment' };
const LITE = document.documentElement.classList.contains('lite');
/* first name without a title such as "Eng." or "Mr." */
const firstName = (n) => { const w = String(n || '').trim().split(/\s+/); return w.find((x) => !/^(eng|mr|mrs|ms|dr|م|د|أ)$/i.test(x.replace(/\.$/, ''))) || w[0] || ''; };

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
  audio: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  ticket: '<path d="M3 7h18v3a2 2 0 000 4v3H3v-3a2 2 0 000-4z"/>',
  tag: '<path d="M3 12V3h9l9 9-9 9zM7.5 7.5h.01"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  heart: '<path d="M12 21s-7.2-4.6-9.4-9.1A5.4 5.4 0 0112 6.2a5.4 5.4 0 019.4 5.7C19.2 16.4 12 21 12 21z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  fwd: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  upright: '<path d="M7 17L17 7M8 7h9v9"/>',
  copy: '<path d="M9 9h11v11H9zM5 15H4V4h11v1"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2.5M12 20v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M1.5 12H4M20 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
  moon: '<path d="M20.5 13.5A8.5 8.5 0 1110.5 3.5a6.8 6.8 0 0010 10z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  /* physics topic icons */
  atom: '<circle cx="12" cy="12" r="1.6" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  wave: '<path d="M2 12c2.5-5 5-5 7.5 0s5 5 7.5 0 3.5-3 5-2"/><path d="M2 18c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1" opacity=".5"/>',
  magnet: '<path d="M6 3v8a6 6 0 0012 0V3h-4v8a2 2 0 01-4 0V3zM6 7h4M14 7h4"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V16h8v-1.3A7 7 0 0012 2z"/>',
  flame: '<path d="M12 22a7 7 0 007-7c0-5-7-13-7-13S5 10 5 15a7 7 0 007 7z"/><path d="M12 22a3 3 0 003-3c0-2-3-5-3-5s-3 3-3 5a3 3 0 003 3z"/>',
  pendulum: '<path d="M4 3h16M12 3l5 11"/><circle cx="17.8" cy="16.8" r="3"/>',
};
/* direction-aware arrows: "next" points the reading direction */
const ic = (n, cls = '') => {
  if (n === 'next') n = LANG === 'ar' ? 'back' : 'fwd';
  if (n === 'prev') n = LANG === 'ar' ? 'fwd' : 'back';
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.atom}</svg>`;
};
const ICON_CHOICES = () => [['pendulum', t('Mechanics (pendulum)')], ['wave', t('Waves')], ['bulb', t('Light')], ['flame', t('Heat')], ['bolt', t('Electricity')], ['magnet', t('Magnetism')], ['atom', t('Atom / modern physics')]];
const courseIcon = (c) => (P[c?.icon] ? c.icon : P[c?.kanji] ? c.kanji : 'atom');
const KIND_ICON = { video: 'play', file: 'file', audio: 'audio' };
const KIND_NAME = { video: 'Video', file: 'File', audio: 'Audio' };

function toast(msg, ok = false) {
  const el = $('#toast');
  el.textContent = msg; el.className = 'show' + (ok ? ' ok' : '');
  clearTimeout(toast._t); toast._t = setTimeout(() => (el.className = ''), 3600);
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
    if (x.type === 'checkbox') return `<label class="check"><input type="checkbox" name="${x.k}" ${v === true || +v ? 'checked' : ''}> ${esc(x.label)}</label>`;
    let input;
    if (x.type === 'textarea') input = `<textarea name="${x.k}" placeholder="${esc(x.placeholder || '')}">${esc(v)}</textarea>`;
    else if (x.type === 'select') input = `<select name="${x.k}">${x.options.map(([ov, ol]) => `<option value="${esc(ov)}" ${String(ov) === String(v ?? '') ? 'selected' : ''}>${esc(ol)}</option>`).join('')}</select>`;
    else input = `<input name="${x.k}" type="${x.type || 'text'}" value="${esc(v)}" placeholder="${esc(x.placeholder || '')}" ${x.required ? 'required' : ''}>`;
    return `<div class="field"><label>${esc(x.label)}</label>${input}${x.hint ? `<small class="muted">${esc(x.hint)}</small>` : ''}</div>`;
  };
  modal(`<h3>${esc(title)}</h3><form>${fields.map(f).join('')}<p class="err"></p>
    <div class="row end"><button type="button" class="btn ghost sm" data-close>${t('Cancel')}</button><button class="btn shu sm">${t('Save')}</button></div></form>`,
  (el, close) => {
    $('form', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {};
      fields.forEach((x) => {
        const inp = e.target.elements[x.k];
        data[x.k] = x.type === 'checkbox' ? (inp.checked ? 1 : 0) : x.type === 'number' ? (inp.value === '' ? null : +inp.value) : inp.value;
      });
      const btn = $('button.shu', el); btn.disabled = true;
      try { await onSubmit(data); close(); } catch (err) { $('.err', el).textContent = err.message; btn.disabled = false; }
    });
    $('input,textarea,select', el)?.focus();
  });
}

function confirmBox(msg, yes = t('Delete')) {
  return new Promise((resolve) => {
    modal(`<h3>${t('Are you sure?')}</h3><p>${esc(msg)}</p><div class="row end">
      <button class="btn ghost sm" data-close>${t('Cancel')}</button><button class="btn danger sm" id="yes">${esc(yes)}</button></div>`,
    (el, close) => { $('#yes', el).onclick = () => { close(); resolve(true); }; $$('[data-close]', el).forEach((b) => b.addEventListener('click', () => resolve(false))); });
  });
}

/* ---------- media embeds ---------- */
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

/* course cover: uploaded image, or a generated Japanese-style cover */
const coverArt = (c, cls = '', style = '') => (c?.cover_url
  ? `<div class="cover has-img ${cls}" ${style}><img src="${esc(c.cover_url)}" alt="" loading="lazy"></div>`
  : `<div class="cover ${cls}" ${style}><span class="csun"></span>${ic(courseIcon(c), 'ci')}<span class="cbrand">Physics bytes</span><span class="cwave seigaiha"></span></div>`);

/* ---------- floating nav (public pages): language pill · centre logo · menu pill ---------- */
const menuOpen = () => $('#links').classList.contains('open');
function setMenu(open) {
  $('#links').classList.toggle('open', open);
  $('#burger').classList.toggle('open', open);
  $('#burger').setAttribute('aria-expanded', open);
  $('#menuLabel').textContent = open ? t('CLOSE') : t('MENU');
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) $('#nav').classList.remove('hide');
}
function renderNav() {
  const me = state.me;
  const r = (location.hash.slice(1) || '/').split('?')[0];
  const items = [
    ['/', t('Home')],
    ['/courses', t('Courses')],
    ...(me ? [['/dashboard', t('Student area')], ['/wallet', t('Wallet')]] : [['/login', t('Log in')], ['/register', t('Create account')]]),
    ...(me?.role === 'admin' ? [['/admin', t('Admin')]] : []),
  ];
  const row = (h, l, i) => `<a href="#${h}" class="mlink ${(h === '/' ? r === '/' : r.startsWith(h)) ? 'active' : ''}" style="--i:${i}">
      <span class="mi">0${i + 1}</span><span class="ml">${l}</span><span class="ma">${ic('upright', LANG === 'ar' ? 'flip' : '')}</span></a>`;
  $('#links').innerHTML = `<div class="menu-in">${items.map(([h, l], i) => row(h, l, i)).join('')}
    ${me ? `<button class="mlink" id="logout" style="--i:${items.length}"><span class="mi">0${items.length + 1}</span><span class="ml">${t('Log out')}</span><span class="ma">${ic('logout')}</span></button>` : ''}
      <div class="menu-tools"><button class="pill" data-theme-toggle>${document.documentElement.dataset.theme === 'light' ? t('Dark mode') : t('Light mode')}</button><button class="pill" data-lang-toggle>${LANG === 'ar' ? 'English' : 'العربية'}</button></div></div>
    <aside class="menu-aside">
      <div class="ma-card"><span class="msun"></span><h3>${me ? t('Welcome back, {name}', { name: esc(firstName(me.name)) }) : t('Start your physics journey')}</h3>
        <p>${me ? t('Pick up right where you stopped.') : t('Video lessons, quizzes and exams with Eng. Ahmed Alaa.')}</p>
        <a class="btn shu sm" href="#/${me ? 'dashboard' : 'register'}">${me ? t('Student area') : t('Create free account')} ${ic('next', 'arrow')}</a></div>
      <div class="mwaves seigaiha"></div>
      <span class="small">${t('Eng. Ahmed Alaa · Secondary-school physics')}</span>
    </aside>`;
  $('#navright').innerHTML = me
    ? `<a href="#/dashboard" class="pill wallet">${ic('user')} <b>${esc(firstName(me.name))}</b></a>`
    : `<a href="#/login" class="pill hide-sm">${t('LOG IN')}</a><a href="#/register" class="pill red">${t('JOIN')}</a>`;
  $('#langCode').textContent = LANG === 'ar' ? 'AR' : 'EN';
  $$('#langMenu button').forEach((b) => b.classList.toggle('on', b.dataset.lang === LANG));
  $('#menuLabel').textContent = menuOpen() ? t('CLOSE') : t('MENU');
  $('[data-theme-toggle]')?.addEventListener('click', () => { toggleTheme(); renderNav(); });
  $('[data-lang-toggle]')?.addEventListener('click', () => { setMenu(false); setLang(LANG === 'ar' ? 'en' : 'ar'); router(); });
  $('#logout')?.addEventListener('click', logout);
}
async function logout() {
  await api('/auth/logout', { method: 'POST' });
  state.me = null; setMenu(false); location.hash = '/'; toast(t('Logged out. See you soon!'), true);
}
$('#burger').addEventListener('click', () => setMenu(!menuOpen()));
$('#links').addEventListener('click', (e) => { if (e.target.closest('a.mlink, .menu-aside a')) setMenu(false); });
const langWrap = $('#langWrap');
const setLangMenu = (open) => { langWrap.classList.toggle('open', open); $('#langBtn').setAttribute('aria-expanded', open); };
$('#langBtn').addEventListener('click', (e) => { e.stopPropagation(); setLangMenu(!langWrap.classList.contains('open')); });
$$('#langMenu button').forEach((b) => b.addEventListener('click', () => { setLangMenu(false); if (b.dataset.lang !== LANG) { setLang(b.dataset.lang); router(); } }));
document.addEventListener('click', (e) => { if (!langWrap.contains(e.target)) setLangMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setLangMenu(false); if (menuOpen()) setMenu(false); } });

/* smart nav: hide while scrolling down, come back on scroll up */
let lastY = 0, ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY, nav = $('#nav');
    nav.classList.toggle('scrolled', y > 30);
    if (!menuOpen()) nav.classList.toggle('hide', y > 260 && y > lastY + 4 ? true : y < lastY - 4 ? false : nav.classList.contains('hide'));
    $('#totop').classList.toggle('show', y > innerHeight * .8);
    lastY = y; ticking = false;
  });
}, { passive: true });

/* ---------- light / dark mode ---------- */
function setTheme(th) {
  document.documentElement.dataset.theme = th;
  try { localStorage.setItem('theme', th); } catch (e) { /* storage blocked: theme still applies for this visit */ }
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', th === 'light' ? '#f7f1e7' : '#0c0b0e');
}
const toggleTheme = () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
$('#themeBtn').addEventListener('click', toggleTheme);
$('#totop').addEventListener('click', () => scrollTo({ top: 0, behavior: LITE ? 'auto' : 'smooth' }));

/* ---------- reveal & counters ---------- */
function animateIn(root = document) {
  requestAnimationFrame(() => $$('.progress > i[data-w]', root).forEach((i) => (i.style.width = i.dataset.w + '%')));
  if (LITE || !('IntersectionObserver' in window)) {
    $$('[data-count]', root).forEach((el) => (el.textContent = num(el.dataset.count)));
    return;
  }
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    if (e.target.dataset.count != null) countUp(e.target);
    io.unobserve(e.target);
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, [data-count], .title-line', root).forEach((el) => io.observe(el));
  state.cleanups.push(() => io.disconnect());
}
function countUp(el) {
  const target = +el.dataset.count, t0 = performance.now(), dur = 1200;
  const tick = (now) => { const p = Math.min(1, (now - t0) / dur); el.textContent = num(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
const ring = (pct, size = 120) => {
  const r = 46, C = 2 * Math.PI * r;
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="${r}" class="ring-bg"/>
    <circle cx="55" cy="55" r="${r}" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(100, pct) / 100)}"/></svg><b class="display-num">${pct}<small>%</small></b></div>`;
};

/* ---------- Japanese-inspired artwork (static SVG, no text) ---------- */
const TORII = `<svg class="torii" viewBox="0 0 120 90" aria-hidden="true"><g fill="currentColor"><path d="M2 8 Q60 -2 118 8 L116 16 Q60 8 4 16Z"/><rect x="12" y="22" width="96" height="7"/><rect x="24" y="14" width="9" height="76"/><rect x="87" y="14" width="9" height="76"/><rect x="56" y="16" width="8" height="12"/></g></svg>`;
const ENSO = (cls) => `<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true"><path pathLength="1000" d="M108 16 C155 20 188 58 184 104 C180 152 140 186 94 182 C48 178 14 140 18 94 C22 56 50 26 88 19"/></svg>`;
const CLOUD = `<svg class="hero-cloud float" viewBox="0 0 360 200" aria-hidden="true"><g fill="currentColor" style="stroke:var(--bg)" stroke-width="5" stroke-linecap="round">
  <rect x="40" y="150" width="320" height="50" stroke="none"/><circle cx="270" cy="110" r="60"/><circle cx="95" cy="145" r="54"/><circle cx="185" cy="100" r="70"/>
  <path fill="none" d="M185 100m-46 0a46 46 0 1 1 46 46a32 32 0 1 1-23-44a16 16 0 1 1 13 20"/><path fill="none" d="M270 110m-38 0a38 38 0 1 1 38 38a25 25 0 1 1-17-36a12 12 0 1 1 10 15"/></g></svg>`;
const STARS = Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 89) % 300}" cy="${(i * 53) % 230}" r="${i % 5 ? .7 : 1.3}"/>`).join('');

/* Hero artwork: red sun with orbiting electrons above Mt. Fuji at night, a swinging pendulum, seigaiha waves */
const HERO_ART = `<svg class="art" viewBox="0 0 300 420" role="img" aria-label="Red sun with orbiting electrons above a mountain at night">
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

const PATH = () => [
  ['pendulum', t('Mechanics'), t('Motion, forces and energy'), t('1st Secondary')],
  ['wave', t('Waves & Sound'), t('Oscillations and resonance'), t('2nd Secondary')],
  ['bulb', t('Light'), t('Reflection, lenses and interference'), t('2nd Secondary')],
  ['flame', t('Heat'), t('Gases and thermodynamics'), t('2nd Secondary')],
  ['bolt', t('Electricity'), t("Current, Ohm's and Kirchhoff's laws"), t('3rd Secondary')],
  ['magnet', t('Magnetism'), t('Fields, induction and AC'), t('3rd Secondary')],
  ['atom', t('Modern Physics'), t('Quantum, atom and laser'), t('3rd Secondary')],
];

/* =================================================================== public pages */
async function viewLanding(app) {
  const [stats, cats, courses] = await Promise.all([api('/public-stats').catch(() => null), api('/categories').catch(() => []), api('/courses').catch(() => [])]);
  const go = state.me ? 'dashboard' : 'register';
  const path = PATH();
  const ribbonItems = path.map(([k, n]) => `<span>${ic(k)}${n}</span>`).join('');
  app.innerHTML = `
  <section class="hero" id="hero">
    <div class="hero-waves seigaiha" aria-hidden="true"></div>
    <div class="wrap hero-grid">
      <div class="hero-text">
        <span class="pill-tag rise" style="--d:.05s"><i></i>${t('Secondary-school physics — done differently')}</span>
        <h1><span class="hl"><span style="--d:.15s">${t('Physics,')}</span></span><span class="hl"><span class="red" style="--d:.3s">${t('made simple.')}</span></span></h1>
        <p class="lead rise" style="--d:.45s">${t('With Eng. Ahmed Alaa: a video for every lesson, quizzes and exams marked instantly, and progress tracking step by step.')}</p>
        <div class="cta rise" style="--d:.55s">
          <a class="btn shu" href="#/${go}">${state.me ? t('Continue learning') : t('Start your journey')} ${ic('next', 'arrow')}</a>
          <a class="btn ghost" href="#/courses">${t('Browse courses')}</a>
        </div>
        ${stats ? `<div class="hero-mini rise" style="--d:.65s">${[['students', t('Students')], ['courses', t('Courses')], ['lessons', t('Videos')]]
          .map(([k, l]) => `<div><b class="mono display-num" data-count="${stats[k] || 0}">0</b><span>${l}</span></div>`).join('')}</div>` : ''}
      </div>
      <div class="hero-art rise" style="--d:.1s">
        <div class="hero-sun" aria-hidden="true"></div>
        ${ENSO('hero-enso')}
        <div class="tcard hero-card"><div class="tcard-in">${HERO_ART}</div><span class="hanko stamp">${ic('atom')}</span></div>
        ${CLOUD}
      </div>
    </div>
  </section>

  <div class="ribbon-wrap" aria-hidden="true"><div class="ribbon"><div class="ribbon-track">${ribbonItems}${ribbonItems}</div></div></div>

  <section class="shelf"><div class="wrap">
    <div class="shelf-head reveal">
      <div><span class="eyebrow">${t('Courses')}</span><h2>${t('Start learning today')}</h2></div>
      <div class="row"><div class="topics-nav"><button class="round-btn" data-scroll="-1" data-row="shelf" aria-label="${t('Previous')}">${ic('prev')}</button><button class="round-btn" data-scroll="1" data-row="shelf" aria-label="${t('Next')}">${ic('next')}</button></div>
        <a class="btn ghost" href="#/courses">${t('Browse all')} ${ic('next', 'arrow')}</a></div>
    </div>
    ${courses.length ? `<div class="shelf-row" id="shelf">${courses.slice(0, 8).map((c, i) => courseCard(c, i)).join('')}
      <a class="browse-card reveal zoom" href="#/courses"><span class="bc-icon">${ic('upright', LANG === 'ar' ? 'flip' : '')}</span><b>${t('Browse all courses')}</b><span class="muted">${t('{n} courses for every secondary grade', { n: courses.length })}</span></a></div>`
      : `<div class="empty"><div class="ei">${ic('book')}</div>${t('Courses are coming soon.')}</div>`}
  </div></section>

  <section class="topics lazy"><div class="wrap">
    <div class="topics-head reveal">
      <div><span class="eyebrow">${t('Curriculum')}</span><h2>${t('Your path through physics')}</h2></div>
      <div class="topics-nav"><button class="round-btn" data-scroll="-1" data-row="topics" aria-label="${t('Previous')}">${ic('prev')}</button><button class="round-btn" data-scroll="1" data-row="topics" aria-label="${t('Next')}">${ic('next')}</button></div>
    </div>
    <div class="topics-row" id="topics">
      ${path.map(([k, n, d, g], i) => `<a class="topic reveal" style="--d:${Math.min(i, 4) * .06}s" href="#/courses">
        <div class="tcard"><div class="tcard-in kart"><span class="ksun"></span>${ic(k, 'ki')}<span class="knum mono">0${i + 1}</span><span class="kwave seigaiha"></span></div></div>
        <h3>${n}</h3><p>${d}</p><span class="tag gold" style="margin-top:.5rem">${g}</span></a>`).join('')}
    </div>
  </div></section>

  <section class="quote lazy">
    ${ENSO('q-enso')}
    <div class="washi w1">${ic('bolt')}</div><div class="washi w2">${ic('atom')}</div><div class="washi w3">${ic('magnet')}</div>
    <h2 class="reveal zoom">${t("Physics isn't memorised.")}<br><span class="red">${t("It's understood.")}</span></h2>
    <p class="reveal" style="--d:.1s">${t('More than equations, more than grades — learn to see the laws behind everything that moves around you.')}</p>
  </section>

  <section class="band lazy"><div class="wrap">
    <div class="section-title reveal"><span class="eyebrow">${t('Features')}</span><h2 class="title-line">${t('Everything in one place')}</h2></div>
    <div class="grid g3f">
      ${[['play', 'HD video lessons', 'Lessons organised by chapter, with a protected player and a view limit per lesson.'],
        ['quiz', 'Quizzes & exams', 'A quiz after every chapter plus full exams with a timer, instant marking and explained answers.'],
        ['chart', 'Progress tracking', "See the lessons you've finished, your scores and what to revise next."],
        ['wallet', 'Wallet & recharge codes', 'Top up with a code and unlock any course instantly.'],
        ['layers', 'Organised curriculum', 'Every grade split into courses, chapters and lessons — nothing gets lost.'],
        ['user', 'Straight from the teacher', 'Content written and kept up to date by Eng. Ahmed Alaa himself.']]
        .map(([k, h, d], i) => `<div class="card feature reveal ${i % 3 === 0 ? 'left' : i % 3 === 2 ? 'right' : ''}" style="--d:${(i % 3) * .08}s"><span class="hanko">${ic(k)}</span><h3>${t(h)}</h3><p>${t(d)}</p><span class="fwave seigaiha" aria-hidden="true"></span></div>`).join('')}
    </div>
  </div></section>

  ${cats.length ? `<section class="band lazy" style="padding-top:1rem"><div class="wrap">
    <div class="section-title reveal"><span class="eyebrow">${t('Grades')}</span><h2 class="title-line">${t('Choose your year')}</h2></div>
    <div class="grid g3f">
      ${cats.map((c, i) => `<a class="card grade-card reveal zoom" style="--d:${i * .08}s" href="#/courses?cat=${c.id}"><span class="gnum display-num">${i + 1}</span>
        <span class="tag">${t('{n} courses', { n: c.course_count })}</span><h3>${esc(t(c.name))}</h3><p class="muted">${esc(c.description || '')}</p><span class="arrow">${ic('next')}</span><span class="gwave seigaiha" aria-hidden="true"></span></a>`).join('')}
    </div>
  </div></section>` : ''}

  <section class="cta-band lazy">
    <div class="cta-sun" aria-hidden="true"></div>
    ${TORII}
    <span class="eyebrow">${t('Your first step')}</span>
    <h2 class="reveal">${t('Step through the gate,')}<br><span class="red">${t('start today.')}</span></h2>
    <a class="btn shu" href="#/${go}">${state.me ? t('Go to my courses') : t('Create free account')} ${ic('next', 'arrow')}</a>
  </section>
  ${footer()}`;

  $$('[data-scroll]', app).forEach((b) => (b.onclick = () => {
    const row = $('#' + b.dataset.row); if (!row) return;
    const step = (row.firstElementChild?.offsetWidth || 260) + 20;
    row.scrollBy({ left: +b.dataset.scroll * step * (LANG === 'ar' ? -1 : 1), behavior: LITE ? 'auto' : 'smooth' });
  }));
  const syncArrows = () => $$('.topics-nav', app).forEach((nav) => { const row = $('#' + nav.querySelector('[data-row]')?.dataset.row); if (row) nav.classList.toggle('off', row.scrollWidth <= row.clientWidth + 4); });
  syncArrows(); addEventListener('resize', syncArrows); state.cleanups.push(() => removeEventListener('resize', syncArrows));

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
    <a href="#/" class="row foot-logo"><img class="pb-mark" src="img/logo-mark.png" alt="" width="26" height="34"><span class="pb-word"><b>Physics bytes</b><small>By Eng/Ahmed Alaa</small></span></a>
    <span class="row"><a href="#/courses">${t('Courses')}</a><a href="#/${state.me ? 'dashboard' : 'register'}">${state.me ? t('Student area') : t('Join now')}</a></span>
    <span>© ${new Date().getFullYear()} Physics Bytes</span></div></div></footer>`;

function authShell(title, text, formHtml) {
  return `<div class="auth"><div class="auth-art"><div class="a-sun"></div><h2>${title}</h2><p>${text}</p><div class="a-waves seigaiha"></div></div>
    <div class="auth-form"><div class="card">${formHtml}</div></div></div>`;
}

function viewLogin(app) {
  app.innerHTML = authShell(t('Welcome back'), t('Log in and carry on where you left off.'), `
    <h2>${t('Log in')}</h2>
    <form id="f"><div class="field"><label>${t('Email')}</label><input name="login" type="email" required autocomplete="username" dir="ltr"></div>
    <div class="field"><label>${t('Password')}</label><input name="password" type="password" required autocomplete="current-password"></div>
    <p class="err"></p><button class="btn shu block">${t('Log in')}</button></form>
    <p class="muted small center" style="margin-top:1rem">${t('New here?')} <a href="#/register">${t('Create an account')}</a></p>`);
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('button', e.target); btn.disabled = true;
    try {
      state.me = await api('/auth/login', { body: Object.fromEntries(new FormData(e.target)) });
      toast(t('Welcome, {name}!', { name: firstName(state.me.name) }), true);
      location.hash = state.me.role === 'admin' ? '/admin' : (sessionStorage.getItem('next') || '/dashboard');
      sessionStorage.removeItem('next');
    } catch (err) { $('.err').textContent = err.message; btn.disabled = false; }
  });
}

function viewRegister(app) {
  app.innerHTML = authShell(t('Begin your journey'), t('One account for lessons, exams, your wallet and your progress.'), `
    <h2>${t('Create account')}</h2>
    <form id="f"><div class="field"><label>${t('Full name')}</label><input name="name" required></div>
    <div class="two"><div class="field"><label>${t('Mobile number')}</label><input name="phone" required inputmode="tel" placeholder="01xxxxxxxxx"></div>
    <div class="field"><label>${t("Parent's mobile")}</label><input name="parent_phone" inputmode="tel"></div></div>
    <div class="field"><label>${t('Email')}</label><input name="email" type="email" required autocomplete="email"></div>
    <div class="two"><div class="field"><label>${t('Grade')}</label><select name="grade">${GRADES.map((g) => `<option value="${g}">${t(g)}</option>`).join('')}</select></div>
    <div class="field"><label>${t('Password')}</label><input name="password" type="password" minlength="6" required autocomplete="new-password"></div></div>
    <p class="err"></p><button class="btn shu block">${t('Create account')}</button></form>
    <p class="muted small center" style="margin-top:1rem">${t('Already have an account?')} <a href="#/login">${t('Log in')}</a></p>`);
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('button', e.target); btn.disabled = true;
    try {
      const r = await api('/auth/register', { body: Object.fromEntries(new FormData(e.target)) });
      if (r?.needsConfirm) {
        $('.auth-form .card').innerHTML = `<div class="center"><span class="hanko" style="margin:0 auto 1rem">${ic('check')}</span><h2>${t('Check your email')}</h2>
          <p class="muted">${t('We sent a confirmation link to your email. Open it, then log in.')}</p><a class="btn shu" href="#/login">${t('Log in')}</a></div>`;
        return;
      }
      state.me = r; toast(t('Account created — welcome!'), true); location.hash = '/dashboard';
    } catch (err) { $('.err').textContent = err.message; btn.disabled = false; }
  });
}

const priceHtml = (p) => (p ? `${num(p)} <small>${t('EGP')}</small>` : `<span class="free">${t('Free')}</span>`);

function courseCard(c, i = 0) {
  return `<a class="card course-card reveal" style="--d:${(i % 4) * .07}s" href="#/course/${c.id}">${coverArt(c)}
    <div class="course-body"><div class="row"><span class="tag">${esc(c.category ? t(c.category) : t('General'))}</span>${c.enrolled ? `<span class="tag green">${t('Enrolled')}</span>` : ''}</div>
    <h3>${esc(c.title)}</h3><p>${esc(c.description || '')}</p>
    <div class="row between"><span class="muted small">${t('{c} units · {v} videos', { c: c.chapter_count, v: c.video_count })}</span><span class="price">${priceHtml(c.price)}</span></div></div></a>`;
}

async function viewCourses(app, params) {
  const cat = params.get('cat') || '';
  const [cats, courses] = await Promise.all([api('/categories'), api('/courses' + (cat ? `?category=${cat}` : ''))]);
  const shell = inShellNow();
  if (shell) shellHead(t('Courses'), t('Every course available for your grade.'));
  app.innerHTML = `<div class="page"><div class="${shell ? '' : 'wrap'}">
    ${shell ? '' : `<div class="page-head"><div><span class="eyebrow">${t('Courses')}</span><h1 class="title-line">${t('All courses')}</h1></div></div>`}
    <div class="filters"><button class="chip ${!cat ? 'on' : ''}" data-c="">${t('All')}</button>${cats.map((c) => `<button class="chip ${String(c.id) === cat ? 'on' : ''}" data-c="${c.id}">${esc(t(c.name))}</button>`).join('')}</div>
    ${courses.length ? `<div class="grid g3">${courses.map(courseCard).join('')}</div>` : `<div class="empty"><div class="ei">${ic('book')}</div>${t('No courses here yet.')}</div>`}
  </div></div>`;
  $$('.chip', app).forEach((b) => (b.onclick = () => (location.hash = '/courses' + (b.dataset.c ? `?cat=${b.dataset.c}` : ''))));
  animateIn(app);
}

/* =================================================================== student area (sidebar shell) */
/* scroll the page and, in Arabic on wide screens, the content pane that scrolls on its own */
const toTop = () => { scrollTo(0, 0); $('.shell-main')?.scrollTo(0, 0); $('.admin-main')?.scrollTo(0, 0); };
const SHELL_ROUTES = ['/dashboard', '/my-courses', '/my-exams', '/favorites', '/wallet', '/profile', '/courses', '/course/', '/item/', '/quiz/'];
const isShellPath = (path) => !!state.me && SHELL_ROUTES.some((r) => (r.endsWith('/') ? path.startsWith(r) : path === r));
const inShellNow = () => document.body.classList.contains('in-shell');

function renderShell(app, path) {
  const me = state.me;
  const links = [
    ['/dashboard', 'home', t('Home')], ['/my-courses', 'book', t('My purchases')], ['/my-exams', 'quiz', t('My exams')],
    ['/courses', 'layers', t('Courses')], ['/favorites', 'heart', t('Favourites')], ['/wallet', 'wallet', t('Wallet')], ['/profile', 'user', t('Study info')],
    ...(me.role === 'admin' ? [['/admin', 'shield', t('Admin')]] : []),
  ];
  const active = (h) => path === h || (h === '/my-courses' && path.startsWith('/course/')) || (h === '/my-exams' && path.startsWith('/quiz/'));
  app.innerHTML = `<div class="shell">
    <aside class="sidebar" id="sidebar">
      <div class="sb-top">
        <a href="#/" class="sb-logo" aria-label="Physics bytes"><img src="img/logo-mark.png" alt="" width="26" height="34"></a>
        <div class="sb-hello"><b>${t('Welcome, {name}', { name: esc(firstName(me.name)) })}</b><small>${t('Student area')}</small></div>
        <button class="round-btn sb-toggle" id="sbToggle" aria-label="${t('MENU')}">${ic('list')}</button>
      </div>
      <div class="sb-profile">
        <div class="sb-avatar"><span>${esc(firstName(me.name)[0] || '?')}</span></div>
        <b>${esc(me.name)}</b>
        <span class="muted small">${esc(me.grade ? t(me.grade) : t('Student'))}</span>
        <span class="tag green">${t('Active account')}</span>
        <a class="sb-balance" href="#/wallet">${ic('wallet')} ${egp(me.balance)}</a>
      </div>
      <nav class="sb-nav">${links.map(([h, i, l]) => `<a href="#${h}" class="${active(h) ? 'on' : ''}"><span class="sb-ic">${ic(i)}</span>${l}</a>`).join('')}</nav>
      <div class="sb-bottom">
        <button class="pill" id="sbTheme">${ic(document.documentElement.dataset.theme === 'light' ? 'moon' : 'sun')} ${document.documentElement.dataset.theme === 'light' ? t('Dark mode') : t('Light mode')}</button>
        <button class="pill" id="sbLang">${ic('globe')} ${LANG === 'ar' ? 'English' : 'العربية'}</button>
        <a class="pill" href="#/">${ic('home')} ${t('Website')}</a>
        <button class="pill" id="sbLogout">${ic('logout')} ${t('Log out')}</button>
      </div>
    </aside>
    <section class="shell-main">
      <header class="shell-head" id="shellHead"></header>
      <div class="shell-body" id="shellBody"></div>
    </section>
  </div>`;
  $('#sbTheme').onclick = () => { toggleTheme(); router(); };
  $('#sbLang').onclick = () => { setLang(LANG === 'ar' ? 'en' : 'ar'); router(); };
  $('#sbLogout').onclick = logout;
  $('#sbToggle').onclick = () => $('#sidebar').classList.toggle('open');
  return $('#shellBody');
}
function shellHead(title, sub, extra = '') {
  const el = $('#shellHead'); if (!el) return;
  el.innerHTML = `<div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><div class="row">${extra}${state.me?.grade ? `<span class="pill-tag"><i></i>${esc(t(state.me.grade))}</span>` : ''}</div>`;
}

function progressCard(c, i = 0) {
  return `<a class="card pcard reveal" style="--d:${(i % 3) * .06}s" href="#/course/${c.id}">${coverArt(c, 'pc-cover')}
    <div class="pc-body"><span class="tag">${esc(c.category ? t(c.category) : t('General'))}</span><h3>${esc(c.title)}</h3>
    <div class="row between small"><span class="muted">${t('Completion')}</span><b>${c.percent}%</b></div>
    <div class="progress"><i data-w="${c.percent}"></i></div>
    <span class="btn sm ghost">${c.percent ? t('Continue learning') : t('Start learning')} ${ic('next', 'arrow')}</span></div></a>`;
}

async function viewDashboard(app) {
  const d = await api('/progress');
  const me = state.me;
  state.me.balance = d.balance;
  shellHead(t('Student area'), t('All your study content and progress in one place.'));
  const top = d.courses[0];
  const date = new Date().toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const resume = top ? (d.last && d.last.course_id === top.id ? `#/item/${d.last.item_id}` : `#/course/${top.id}`) : '#/courses';
  app.innerHTML = `<div class="page dash">
    <div class="dash-hi reveal"><span class="dash-date"><i></i>${date}</span>
      <h1>${t('Hello, {name}', { name: esc(me.name) })}</h1>
      <p class="muted">${t('Here you will find the content for {grade}.', { grade: esc(me.grade ? t(me.grade) : t('your grade')) })}</p></div>
    <div class="dash-top">
      ${top ? `<div class="card cont-card reveal left">
        <div class="cc-text">
          <span class="dash-date"><i></i>${t('Pick up where you left off')}</span>
          <h2>${esc(top.title)}</h2>
          <div class="cc-meta"><span>${ic('play')} ${t('{n} videos', { n: top.videos })}</span><span>${ic('file')} ${t('{n} files', { n: top.files })}</span><span>${ic('audio')} ${t('{n} audio', { n: top.audios })}</span><span>${ic('user')} ${esc(top.teacher)}</span></div>
          <div class="row between small"><span>${t('Completion')}</span><b>${top.percent}%</b></div>
          <div class="progress"><i data-w="${top.percent}"></i></div>
          <a class="btn shu" href="${resume}">${t('Continue learning')} ${ic('next', 'arrow')}</a>
        </div>
        ${coverArt(top, 'cc-thumb')}
      </div>` : `<div class="card cont-card empty-cont reveal left"><div class="cc-text"><span class="dash-date"><i></i>${t('Your first step')}</span>
          <h2>${t("You haven't enrolled in a course yet.")}</h2><p class="muted">${t('Pick a course to start learning.')}</p>
          <a class="btn shu" href="#/courses">${t('Browse courses')} ${ic('next', 'arrow')}</a></div>${coverArt({ icon: 'atom' }, 'cc-thumb')}</div>`}
      <div class="card sum-card reveal right">
        <div class="row between"><h3>${t('Learning summary')}</h3><a class="round-btn" href="#/my-courses" aria-label="${t('My purchases')}">${ic('upright', LANG === 'ar' ? 'flip' : '')}</a></div>
        <div class="row" style="gap:1.2rem;margin:1rem 0">${ring(top ? top.percent : 0, 108)}<div><b>${t('Keep going')}</b><br><span class="muted small">${t('Latest course progress')}</span></div></div>
        <div class="sum-row"><span class="kic">${ic('book')}</span><div><b class="display-num">${d.courses.length}</b><span class="muted small">${t('Enrolled courses')}</span></div></div>
        <div class="sum-row"><span class="kic">${ic('check')}</span><div><b class="display-num">${d.completed_courses}</b><span class="muted small">${t('Completed courses')}</span></div></div>
        <div class="sum-row"><span class="kic">${ic('target')}</span><div><b class="display-num">${d.avg_score == null ? '—' : d.avg_score + '%'}</b><span class="muted small">${t('Average score')}</span></div></div>
      </div>
    </div>
    <div class="dash-section">
      <div class="row between" style="align-items:end;margin-bottom:1.2rem"><div><span class="eyebrow">${t('Learning content')}</span><h2 class="title-line">${t('My courses')}</h2><p class="muted small">${t('Follow every course linked to your account.')}</p></div>
        <a class="btn ghost sm" href="#/my-courses">${t('View all courses')} ${ic('next', 'arrow')}</a></div>
      ${d.courses.length ? `<div class="grid g3">${d.courses.slice(0, 6).map(progressCard).join('')}</div>` : `<div class="empty card"><div class="ei">${ic('book')}</div>${t("You haven't enrolled in a course yet.")}</div>`}
    </div>
    ${d.attempts.length ? `<div class="dash-section"><div class="row between" style="margin-bottom:1rem"><h2 class="title-line">${t('Latest results')}</h2><a class="btn ghost sm" href="#/my-exams">${t('All results')} ${ic('next', 'arrow')}</a></div>
      <div class="card table-wrap">${attemptsTable(d.attempts.slice(0, 5))}</div></div>` : ''}
  </div>`;
  animateIn(app);
}
function attemptsTable(rows) {
  return `<table class="tbl"><tr><th>${t('Exam')}</th><th>${t('Score')}</th><th>${t('Date')}</th></tr>${rows.map((a) => {
    const p = Math.round((a.score / a.total) * 100);
    return `<tr><td><b>${esc(a.quiz)}</b><br><span class="small muted">${esc(a.course)}</span></td><td><span class="tag ${p >= a.pass_score ? 'green' : 'shu'}">${a.score}/${a.total} · ${p}%</span></td><td class="small">${fmtDate(a.created_at)}</td></tr>`;
  }).join('')}</table>`;
}

async function viewMyCourses(app) {
  const list = await api('/my-courses');
  shellHead(t('My purchases'), t('Courses you have unlocked.'));
  const withPct = list.map((c) => ({ ...c, percent: c.item_count ? Math.round((c.done_count / c.item_count) * 100) : 0 }));
  app.innerHTML = `<div class="page">${withPct.length ? `<div class="grid g3">${withPct.map(progressCard).join('')}</div>`
    : `<div class="empty card"><div class="ei">${ic('book')}</div>${t("You haven't enrolled in a course yet.")}<br><a class="btn shu sm" style="margin-top:1rem" href="#/courses">${t('Browse courses')}</a></div>`}</div>`;
  animateIn(app);
}
async function viewFavorites(app) {
  const list = await api('/favorites');
  shellHead(t('Favourites'), t('Courses you saved for later.'));
  app.innerHTML = `<div class="page">${list.length ? `<div class="grid g3">${list.map(courseCard).join('')}</div>`
    : `<div class="empty card"><div class="ei">${ic('heart')}</div>${t('No favourites yet. Tap "Add to favourites" on any course.')}</div>`}</div>`;
  animateIn(app);
}
async function viewMyExams(app) {
  const d = await api('/progress');
  shellHead(t('My exams'), t('Every quiz and exam you have taken.'));
  app.innerHTML = `<div class="page">${d.attempts.length ? `<div class="card table-wrap">${attemptsTable(d.attempts)}</div>`
    : `<div class="empty card"><div class="ei">${ic('quiz')}</div>${t('No exams taken yet.')}</div>`}</div>`;
}

/* =================================================================== course page */
function itemRow(i, c) {
  const open = c.access || i.is_free;
  const href = open ? `#/item/${i.id}` : 'javascript:void 0';
  return `<a class="irow ${i.done ? 'done' : ''} ${open ? '' : 'locked'}" href="${href}" ${open ? '' : 'data-locked'}>
    <span class="ir-ic">${ic(i.done ? 'check' : KIND_ICON[i.kind] || 'play')}</span>
    <span class="ir-text"><b>${esc(i.title)}</b><small>${t(KIND_NAME[i.kind] || 'Video')}${i.duration_min ? ' · ' + t('{n} min', { n: i.duration_min }) : ''}${i.is_free && !c.access ? ' · ' + t('Free preview') : ''}</small></span>
    <span class="ir-go">${ic(open ? 'next' : 'lock')}</span></a>`;
}
function quizRow(z, c) {
  return `<a class="irow quiz ${c.access ? '' : 'locked'}" href="${c.access ? `#/quiz/${z.id}` : 'javascript:void 0'}" ${c.access ? '' : 'data-locked'}>
    <span class="ir-ic">${ic('quiz')}</span>
    <span class="ir-text"><b>${esc(z.title)}</b><small>${z.type === 'exam' ? t('Exam') : t('Quiz')} · ${t('{n} Q', { n: z.qcount })}${z.best != null ? ' · ' + t('Best {n}%', { n: z.best }) : ''}</small></span>
    <span class="ir-go">${ic(c.access ? 'next' : 'lock')}</span></a>`;
}
async function viewCourse(app, params, id) {
  const c = await api('/courses/' + id);
  const shell = inShellNow();
  const pct = c.counts.items ? Math.round((c.counts.done / c.counts.items) * 100) : 0;
  if (shell) shellHead(t('Course'), esc(c.category ? t(c.category) : ''));
  const units = c.sections.map((s, si) => `
    <div class="unit ${si === 0 ? 'open' : ''}" data-unit>
      <div class="unit-head" data-toggle>
        <span class="u-badge"><small>${t('Unit')}</small><b>${pad2(si + 1)}</b></span>
        <div class="u-title"><h3>${esc(s.title)}</h3><span class="u-pill">${ic('list')} ${t('{n} lessons', { n: s.lessons.length })}${s.quizzes.length ? ' · ' + t('{n} quizzes', { n: s.quizzes.length }) : ''}</span></div>
        <button class="btn ghost sm u-btn" type="button"><span class="when-closed">${t('Show unit')} ${ic('plus')}</span><span class="when-open">${t('Hide unit')} ${ic('minus')}</span></button>
      </div>
      <div class="unit-body">
        ${s.lessons.map((l, li) => `<div class="lesson ${si === 0 && li === 0 ? 'open' : ''}" data-unit>
          <div class="lesson-head" data-toggle>
            <span class="u-badge sm"><small>${t('Lesson')}</small><b>${pad2(li + 1)}</b></span>
            <div class="u-title"><h4>${esc(l.title)}</h4><span class="u-pill">${ic('list')} ${t('{n} items', { n: l.items.length })}</span></div>
            <span class="l-btn"><span class="when-closed">${ic('plus')}</span><span class="when-open">${ic('minus')}</span></span>
          </div>
          <div class="lesson-body">${l.items.map((i) => itemRow(i, c)).join('') || `<p class="muted small" style="margin:.4rem 0">${t('Content coming soon.')}</p>`}</div>
        </div>`).join('')}
        ${s.quizzes.map((z) => quizRow(z, c)).join('')}
        ${!s.lessons.length && !s.quizzes.length ? `<p class="muted small" style="padding:.6rem">${t('Content coming soon.')}</p>` : ''}
      </div>
    </div>`).join('');
  const exams = c.exams.length ? `<div class="unit open" data-unit><div class="unit-head" data-toggle><span class="u-badge red"><small>${t('Exams')}</small><b>${ic('target')}</b></span>
      <div class="u-title"><h3>${t('Final exams')}</h3><span class="u-pill">${t('{n} exams', { n: c.exams.length })}</span></div>
      <button class="btn ghost sm u-btn" type="button"><span class="when-closed">${t('Show unit')} ${ic('plus')}</span><span class="when-open">${t('Hide unit')} ${ic('minus')}</span></button></div>
      <div class="unit-body">${c.exams.map((z) => quizRow(z, c)).join('')}</div></div>` : '';

  app.innerHTML = `<div class="page course-page"><div class="${shell ? '' : 'wrap'}">
    <div class="ch-hero reveal">
      <div class="ch-text">
        <nav class="crumbs"><a href="#/${state.me ? 'dashboard' : ''}">${t('Home')}</a><span>/</span><a href="#/${state.me ? 'my-courses' : 'courses'}">${state.me ? t('My purchases') : t('Courses')}</a><span>/</span><b>${esc(c.title)}</b></nav>
        <span class="ch-badge">${ic('play')} ${t('{n} videos', { n: c.counts.video })} · ${c.price ? t('Paid course') : t('Free course')}</span>
        <h1>${esc(c.title)}</h1>
        <p class="muted">${esc(c.description || '')}</p>
        <div class="ch-meta">
          <span class="t-avatar">${esc((c.teacher || 'P')[0])}</span>
          <div><small>${t('Teacher')}</small><b>${esc(c.teacher)}</b></div>
          <i></i>
          <div><small>${t('Subject & grade')}</small><b>${esc(t(c.subject || 'Physics'))}${c.category ? ' · ' + esc(t(c.category)) : ''}</b></div>
        </div>
      </div>
      ${coverArt(c, 'ch-cover')}
    </div>
    <div class="ch-tabs" role="tablist">
      <button class="on" data-tab="content">${ic('list')} ${t('Course content')}</button>
      <button data-tab="about">${ic('info')} ${t('About the course')}</button>
      <button data-tab="teacher">${ic('user')} ${t('Teacher')}</button>
    </div>
    <div class="ch-grid">
      <div class="ch-main">
        <div class="tab-pane on" data-pane="content">
          <h2 class="ch-h">${t('Course content, step by step')}</h2>
          <p class="info-pill">${ic('info')} ${t('Open each unit to browse its lessons and files.')}</p>
          ${units || `<div class="empty card"><div class="ei">${ic('layers')}</div>${t('Content coming soon.')}</div>`}
          ${exams}
        </div>
        <div class="tab-pane" data-pane="about">
          <div class="card"><h3>${t('About the course')}</h3><p>${esc(c.about || c.description || '')}</p>
            <div class="grid g4" style="margin-top:1rem">${[['layers', c.sections.length, t('Units')], ['play', c.counts.video, t('Videos')], ['file', c.counts.file, t('Files')], ['quiz', c.sections.reduce((a, s) => a + s.quizzes.length, 0) + c.exams.length, t('Quizzes & exams')]]
              .map(([k, v, l]) => `<div class="kpi card"><div class="v">${v}</div><div class="l">${l}</div><span class="kic">${ic(k)}</span></div>`).join('')}</div></div>
        </div>
        <div class="tab-pane" data-pane="teacher">
          <div class="card teacher-card"><img src="img/logo-mark.png" alt="" width="54" height="72"><div><h3>${esc(c.teacher)}</h3>
            <p class="muted">${t('Physics teacher for secondary school. Clear explanations, plenty of solved problems and exams that prepare you for the real thing.')}</p></div></div>
        </div>
      </div>
      <aside class="ch-side">
        <div class="card side-card">
          ${c.access ? `<div class="ok-box"><span class="ok-ic">${ic('check')}</span><div><b>${c.enrolled ? t("You're enrolled in this course") : t('This course is open to you')}</b><small>${t('You can watch the course content now.')}</small></div></div>
            <div class="row between small" style="margin-top:1rem"><span>${t('Your progress')}</span><b>${pct}%</b></div><div class="progress" style="margin:.4rem 0 .2rem"><i data-w="${pct}"></i></div>`
          : `<div class="price" style="font-size:2rem">${priceHtml(c.price)}</div>
            <p class="muted small">${t('Lifetime access to every lesson, quiz and exam in this course.')}</p>
            <button class="btn shu block" id="enroll">${state.me ? (c.price ? t('Buy with wallet') : t('Enrol for free')) : t('Log in to enrol')}</button>
            ${state.me ? `<p class="small muted center" style="margin:.6rem 0 0">${t('Balance')}: <b>${egp(state.me.balance)}</b> · <a href="#/wallet">${t('Top up')}</a></p>` : ''}
            <div class="or-line"><span>${t('or')}</span></div>
            <div id="reqBox"></div>`}
          ${state.me ? `<button class="btn ghost block fav-btn ${c.favorite ? 'on' : ''}" id="fav">${ic('heart')} <span>${c.favorite ? t('Remove from favourites') : t('Add to favourites')}</span></button>` : ''}
          <ul class="checks">
            <li>${ic('check')} ${t('{n} videos', { n: c.counts.video })}</li>
            <li>${ic('check')} ${t('{n} files', { n: c.counts.file })}</li>
            ${c.counts.audio ? `<li>${ic('check')} ${t('{n} audio', { n: c.counts.audio })}</li>` : ''}
            <li>${ic('check')} ${esc(t(c.subject || 'Physics'))}</li>
          </ul>
        </div>
      </aside>
    </div>
  </div></div>`;

  $$('[data-toggle]', app).forEach((h) => (h.onclick = (e) => { if (e.target.closest('a')) return; h.closest('[data-unit]').classList.toggle('open'); }));
  $$('.ch-tabs button', app).forEach((b) => (b.onclick = () => {
    $$('.ch-tabs button', app).forEach((x) => x.classList.toggle('on', x === b));
    $$('.tab-pane', app).forEach((p) => p.classList.toggle('on', p.dataset.pane === b.dataset.tab));
  }));
  $$('[data-locked]', app).forEach((a) => a.addEventListener('click', () => toast(state.me ? t('Enrol in the course to unlock this.') : t('Log in and enrol to unlock this.'))));
  const reqBox = $('#reqBox');
  const drawReq = async () => {
    if (!reqBox) return;
    if (!state.me) { reqBox.innerHTML = `<a class="btn ghost block" href="#/login">${ic('userplus')} ${t('Request to join')}</a><p class="small muted center" style="margin:.5rem 0 0">${t('Paid at the centre? Ask the teacher to add you.')}</p>`; return; }
    const st = await api(`/courses/${c.id}/request`).catch(() => null);
    if (st === 'pending') {
      reqBox.innerHTML = `<div class="req-box"><span class="req-ic">${ic('clock')}</span><div><b>${t('Request sent')}</b><small>${t('The teacher will review it and add you to the course.')}</small></div></div>
        <button class="btn ghost block sm" id="reqCancel" style="margin-top:.6rem">${t('Cancel request')}</button>`;
      $('#reqCancel').onclick = async () => { await api(`/courses/${c.id}/request`, { method: 'DELETE' }); toast(t('Request cancelled.'), true); drawReq(); };
      return;
    }
    reqBox.innerHTML = `${st === 'rejected' ? `<p class="small muted center" style="margin:0 0 .5rem">${t('Your last request was declined. You can send a new one.')}</p>` : ''}
      <button class="btn ghost block" id="reqBtn">${ic('userplus')} ${t('Request to join')}</button>
      <p class="small muted center" style="margin:.5rem 0 0">${t('Paid at the centre? Ask the teacher to add you.')}</p>`;
    $('#reqBtn').onclick = () => formModal(t('Request to join'), [{ k: 'note', label: t('Message to the teacher (optional)'), type: 'textarea', placeholder: t('e.g. I paid at the centre on Saturday.') }], {}, async (d) => {
      await api(`/courses/${c.id}/request`, { body: d }); toast(t('Request sent — the teacher will review it.'), true); drawReq();
    });
  };
  drawReq();
  $('#fav')?.addEventListener('click', async () => {
    const on = await api(`/courses/${c.id}/favorite`, { method: 'POST' });
    $('#fav').classList.toggle('on', on); $('#fav span').textContent = on ? t('Remove from favourites') : t('Add to favourites');
    toast(on ? t('Added to favourites.') : t('Removed from favourites.'), true);
  });
  $('#enroll')?.addEventListener('click', async () => {
    if (!state.me) { sessionStorage.setItem('next', location.hash.slice(1)); location.hash = '/login'; return; }
    if (c.price && !(await confirmBox(t('Pay {p} from your wallet to unlock "{c}"?', { p: egp(c.price), c: c.title }), t('Pay & enrol')))) return;
    try { const r = await api(`/courses/${c.id}/enroll`, { method: 'POST' }); state.me.balance = r.balance; toast(t('Enrolled — good luck!'), true); router(); }
    catch (err) { toast(err.message); if (/balance|رصيد/.test(err.message)) setTimeout(() => (location.hash = '/wallet'), 1400); }
  });
  animateIn(app);
}

/* =================================================================== item player (video / file / audio) */
async function viewItem(app, params, id) {
  let it;
  try { it = await api('/items/' + id); }
  catch (err) { if (err.status === 401 || /log in/i.test(err.message)) { sessionStorage.setItem('next', location.hash.slice(1)); location.hash = '/login'; } throw err; }
  const c = await api('/courses/' + it.course_id);
  const flat = c.sections.flatMap((s) => s.lessons.flatMap((l) => l.items));
  const idx = flat.findIndex((x) => x.id === it.id);
  const prev = flat[idx - 1], next = flat[idx + 1];
  shellHead(esc(c.title), `${esc(it.section_title)} · ${esc(it.lesson_title)}`);
  let media;
  if (it.kind === 'audio') media = it.url ? `<div class="audio-box"><span class="hanko">${ic('audio')}</span><audio controls controlsList="nodownload" preload="metadata" src="${esc(it.url)}"></audio></div>` : null;
  else if (it.kind === 'file') media = it.url ? `<div class="player file">${/\.pdf(\?|$)/i.test(it.url) || /drive\.google/.test(it.url) ? embedVideo(it.url) : ''}</div><a class="btn ghost sm" target="_blank" rel="noopener" href="${esc(it.url)}" style="margin-top:.8rem">${ic('file')} ${t('Open file')}</a>` : null;
  else if (PBPlayer.supported(it.url)) media = '<div id="pbp"></div>';
  else { const v = embedVideo(it.url); media = v ? `<div class="player">${v}<span class="wm red-wm">${esc(it.watermark)}</span></div>` : null; }
  app.innerHTML = `<div class="page"><a href="#/course/${c.id}" class="back">${ic('prev')} ${esc(c.title)}</a>
    <div class="lesson-layout" style="margin-top:1rem">
      <div>
        ${media || `<div class="player"><div class="placeholder"><div>${ic(KIND_ICON[it.kind] || 'play')}${t('This content will be uploaded soon.')}</div></div></div>`}
        <div class="row between" style="margin:1.2rem 0 .4rem"><div><span class="eyebrow">${esc(it.lesson_title)}</span><h2 style="margin:0;font-size:2rem">${esc(it.title)}</h2></div>
          <div class="row">${it.max_views ? `<span class="tag ai">${ic('eye')} ${t('View {v}/{m}', { v: it.views, m: it.max_views })}</span>` : ''}
          <button class="btn ${it.completed ? 'ghost' : 'shu'} sm" id="done">${it.completed ? `${ic('check')} ${t('Completed')}` : t('Mark as completed')}</button></div></div>
        <div class="row between" style="margin-top:2rem">
          ${prev ? `<a class="btn ghost sm" href="#/item/${prev.id}">${ic('prev')} ${esc(prev.title)}</a>` : '<span></span>'}
          ${next ? `<a class="btn sm" href="#/item/${next.id}">${esc(next.title)} ${ic('next', 'arrow')}</a>` : ''}</div>
      </div>
      <aside class="card side-outline">${c.sections.map((s, si) => `<h4>${t('Unit')} ${pad2(si + 1)} · ${esc(s.title)}</h4>${s.lessons.map((l) => `<div class="so-lesson">${esc(l.title)}</div>${l.items.map((x) => {
        const open = c.access || x.is_free;
        return `<a class="item ${x.done ? 'done' : ''} ${x.id === it.id ? 'current' : ''} ${open ? '' : 'locked'}" href="${open ? `#/item/${x.id}` : 'javascript:void 0'}"><span class="ii">${ic(x.done ? 'check' : open ? KIND_ICON[x.kind] || 'play' : 'lock')}</span><span>${esc(x.title)}</span></a>`;
      }).join('')}`).join('')}${s.quizzes.map((z) => `<a class="item" href="#/quiz/${z.id}"><span class="ii q">${ic('quiz')}</span><span>${esc(z.title)}</span></a>`).join('')}`).join('')}</aside>
    </div></div>`;
  const nextOpen = next && (c.access || next.is_free) ? next : null;
  if ($('#pbp')) {
    const player = PBPlayer.mount($('#pbp'), {
      url: it.url, watermark: it.watermark, storageKey: 'pb-pos-' + it.id,
      next: nextOpen ? { href: '#/item/' + nextOpen.id, label: nextOpen.title } : null,
      labels: { play: t('Play'), pause: t('Pause'), back: t('Back 10 seconds'), fwd: t('Forward 10 seconds'), mute: t('Mute'), unmute: t('Unmute'), speed: t('Speed'),
        full: t('Full screen'), exitfull: t('Exit full screen'), finished: t('Lesson finished'), replay: t('Replay'), next: t('Next'), resumed: t('Resumed from'),
        error: t('This video could not be played.'), normal: t('Normal'), tapunmute: t('Tap to unmute') },
      onWatched: async () => {
        if (it.completed) return;
        it.completed = true;
        await api(`/items/${it.id}/complete`, { method: 'POST' }).catch(() => {});
        const b = $('#done'); if (b) { b.className = 'btn ghost sm'; b.innerHTML = `${ic('check')} ${t('Completed')}`; }
      },
    });
    state.cleanups.push(() => player.destroy());
  }
  $('.side-outline .current', app)?.scrollIntoView({ block: 'center' });
  toTop();
  $('#done').onclick = async () => {
    await api(`/items/${it.id}/complete`, { method: 'POST' });
    toast(t('Nice work — lesson completed!'), true);
    if (next && (c.access || next.is_free)) location.hash = '/item/' + next.id; else router();
  };
}

/* =================================================================== quizzes */
async function viewQuiz(app, params, id) {
  const z = await api('/quizzes/' + id);
  const left = z.max_attempts ? z.max_attempts - z.tries : Infinity;
  const kind = z.type === 'exam' ? t('Exam') : t('Quiz');
  shellHead(kind, esc(z.course.title));
  const intro = () => {
    app.innerHTML = `<div class="page"><div style="max-width:760px;margin-inline:auto">
      <a href="#/course/${z.course.id}" class="back">${ic('prev')} ${esc(z.course.title)}</a>
      <div class="card center reveal zoom" style="margin-top:1rem;padding:2.5rem 1.5rem">
        <span class="eyebrow">${kind}</span><h1 style="font-size:clamp(2rem,5vw,3rem)">${esc(z.title)}</h1>
        <div class="grid g4" style="margin:1.5rem 0;text-align:start">${[['quiz', z.questions.length, t('Questions')], ['clock', t('{n} min', { n: z.duration_min }), t('Time limit')], ['target', z.pass_score + '%', t('To pass')], ['repeat', left === Infinity ? '∞' : left, t('Attempts left')]]
          .map(([k, v, l]) => `<div class="card kpi"><div class="v">${v}</div><div class="l">${l}</div><span class="kic">${ic(k)}</span></div>`).join('')}</div>
        ${!z.questions.length ? `<p class="muted">${t('Questions will be added soon.')}</p>` : left > 0 || state.me.role === 'admin' ? `<button class="btn shu" id="start">${z.type === 'exam' ? t('Start exam') : t('Start quiz')} ${ic('next', 'arrow')}</button>` : `<p class="tag shu">${t('No attempts left')}</p>`}
        ${z.attempts.length ? `<h3 style="margin-top:2rem">${t('Previous attempts')}</h3><table class="tbl"><tr><th>${t('Date')}</th><th>${t('Score')}</th></tr>${z.attempts.map((a) => `<tr><td>${fmtDate(a.created_at)}</td><td><b>${a.score}/${a.total}</b> (${Math.round((a.score / a.total) * 100)}%)</td></tr>`).join('')}</table>` : ''}
      </div></div></div>`;
    $('#start')?.addEventListener('click', take);
    animateIn(app);
  };
  const take = () => {
    const answers = {};
    let secs = z.duration_min * 60;
    app.innerHTML = `<div class="page"><div style="max-width:840px;margin-inline:auto">
      <div class="card quiz-top"><div><b>${esc(z.title)}</b><div class="qdots" id="dots" style="margin-top:.4rem">${z.questions.map((q, i) => `<a href="javascript:void 0" data-j="${q.id}">${i + 1}</a>`).join('')}</div></div>
        <div class="timer" id="timer">${ic('clock')} --:--</div></div>
      ${z.questions.map((q, i) => `<div class="card question" id="q${q.id}"><span class="qn">${i + 1}</span><b>${esc(q.text)}</b> <span class="muted small">(${t('{n} pt', { n: q.points })})</span>
        ${q.options.map((o, oi) => `<label class="option"><input type="radio" name="q${q.id}" value="${oi}"> ${esc(o)}</label>`).join('')}</div>`).join('')}
      <div class="center"><button class="btn shu" id="submit">${t('Submit answers')}</button></div></div></div>`;
    $$('.option input', app).forEach((inp) => inp.addEventListener('change', () => {
      const qid = inp.name.slice(1); answers[qid] = +inp.value;
      $$(`[name="${inp.name}"]`, app).forEach((x) => x.parentElement.classList.toggle('sel', x.checked));
      $(`[data-j="${qid}"]`, app).classList.add('ans');
    }));
    $$('#dots a', app).forEach((a) => (a.onclick = () => $('#q' + a.dataset.j).scrollIntoView({ behavior: LITE ? 'auto' : 'smooth', block: 'center' })));
    const tick = () => {
      secs--; const el = $('#timer'); if (!el) return;
      el.innerHTML = `${ic('clock')} ${pad2(Math.floor(secs / 60))}:${pad2(secs % 60)}`;
      el.classList.toggle('low', secs < 60);
      if (secs <= 0) { toast(t("Time's up — submitting.")); submit(); }
    };
    const iv = setInterval(tick, 1000); tick();
    state.cleanups.push(() => clearInterval(iv));
    let sent = false;
    const submit = async () => {
      if (sent) return;
      const unanswered = z.questions.length - Object.keys(answers).length;
      if (secs > 0 && unanswered && !(await confirmBox(t('{n} question(s) unanswered. Submit anyway?', { n: unanswered }), t('Submit')))) return;
      sent = true; clearInterval(iv);
      try { result(await api(`/quizzes/${z.id}/submit`, { body: { answers } })); } catch (err) { sent = false; toast(err.message); }
    };
    $('#submit').onclick = submit;
  };
  const result = (r) => {
    app.innerHTML = `<div class="page"><div style="max-width:840px;margin-inline:auto">
      <div class="card center" style="padding:2.5rem 1.5rem;margin-bottom:1.5rem">
        <div style="display:grid;place-items:center;margin-bottom:1rem" class="${r.passed ? 'pass' : 'fail'}">${ring(r.pct, 160)}</div>
        <h2>${r.passed ? t('Passed — well done!') : t('Keep practising')}</h2><p class="muted">${t('You scored {s} out of {t}.', { s: `<b>${r.score}</b>`, t: `<b>${r.total}</b>` })}</p>
        <div class="row" style="justify-content:center"><a class="btn ghost sm" href="#/course/${z.course.id}">${t('Back to course')}</a><a class="btn sm" href="#/my-exams">${t('My exams')}</a></div></div>
      <h3 class="title-line" style="margin-bottom:1.2rem">${t('Review')}</h3>
      ${r.review.map((q, i) => `<div class="card question"><span class="qn">${i + 1}</span><b>${esc(q.text)}</b> ${q.ok ? `<span class="tag green">${t('Correct')}</span>` : `<span class="tag shu">${t('Wrong')}</span>`}
        ${q.options.map((o, oi) => { const mine = q.chosen !== null && +q.chosen === oi; return `<div class="option ${oi === q.correct ? 'right' : mine ? 'wrong' : ''}">${oi === q.correct ? ic('check') : mine ? ic('x') : '<span style="width:18px"></span>'} ${esc(o)}</div>`; }).join('')}
        ${q.explanation ? `<p class="small" style="margin:.8rem 0 0"><b>${t('Explanation')}:</b> ${esc(q.explanation)}</p>` : ''}</div>`).join('')}
    </div></div>`;
    toTop();
  };
  intro();
}

/* =================================================================== wallet & profile */
async function viewWallet(app) {
  const w = await api('/wallet');
  state.me.balance = w.balance;
  shellHead(t('My wallet'), t('Top up with a recharge code and buy courses.'));
  app.innerHTML = `<div class="page"><div style="max-width:960px">
    <div class="grid g2" style="align-items:start">
      <div class="card dark-card reveal left">
        <div class="small muted">${t('Current balance')}</div><div class="stat-n mono" style="font-size:2.6rem" id="bal">${egp(w.balance)}</div>
        <form id="f" style="margin-top:1.2rem"><div class="field"><label>${t('Recharge code')}</label><input name="code" placeholder="PB-XXXX-XXXX-XXXX" required style="text-transform:uppercase;letter-spacing:.08em"></div>
        <p class="err"></p><button class="btn shu block">${ic('ticket')} ${t('Redeem code')}</button></form>
      </div>
      <div class="card reveal right"><h3>${t('How to get a code')}</h3>
        <ol class="muted" style="padding-inline-start:1.2rem;margin:0"><li>${t("Pay at the centre or by Vodafone Cash / InstaPay to Eng. Ahmed's assistant.")}</li><li>${t('Receive a recharge code (PB-XXXX-XXXX-XXXX).')}</li><li>${t('Enter it here — the balance appears instantly.')}</li><li>${t('Use your balance to unlock any course.')}</li></ol></div>
    </div>
    <div class="card" style="margin-top:1.5rem"><h3>${t('History')}</h3>
      ${w.transactions.length ? `<div class="table-wrap"><table class="tbl"><tr><th>${t('Type')}</th><th>${t('Details')}</th><th>${t('Amount')}</th><th>${t('Date')}</th></tr>${w.transactions.map((x) => `<tr><td><span class="tag ${x.amount > 0 ? 'green' : 'shu'}">${t(TX[x.type] || x.type)}</span></td><td>${esc(tNote(x.note))}</td><td><b class="mono ltr" style="color:${x.amount > 0 ? 'var(--matcha)' : 'var(--shu)'}">${x.amount > 0 ? '+' : ''}${x.amount}</b> <span class="small muted">${t('EGP')}</span></td><td class="small">${fmtDate(x.created_at)}</td></tr>`).join('')}</table></div>`
      : `<div class="empty"><div class="ei">${ic('wallet')}</div>${t('No transactions yet.')}</div>`}
    </div></div></div>`;
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const r = await api('/wallet/redeem', { body: { code: e.target.code.value } }); state.me.balance = r.balance; toast(t('{a} added to your wallet!', { a: egp(r.amount) }), true); router(); }
    catch (err) { $('.err').textContent = err.message; }
  });
  animateIn(app);
}

function viewProfile(app) {
  const me = state.me;
  shellHead(t('Study info'), t('Your account details.'));
  const grades = GRADES.includes(me.grade) || !me.grade ? GRADES : [me.grade, ...GRADES];
  app.innerHTML = `<div class="page"><div style="max-width:680px">
    <div class="card"><form id="f">
      <div class="field"><label>${t('Full name')}</label><input name="name" value="${esc(me.name)}"></div>
      <div class="field"><label>${t('Email')}</label><input type="email" value="${esc(me.email)}" disabled></div>
      <div class="field"><label>${t('Mobile number')}</label><input name="phone" value="${esc(me.phone || '')}" disabled></div>
      <div class="field"><label>${t("Parent's mobile")}</label><input name="parent_phone" value="${esc(me.parent_phone || '')}"></div>
      <div class="field"><label>${t('Grade')}</label><select name="grade">${grades.map((g) => `<option value="${esc(g)}" ${g === me.grade ? 'selected' : ''}>${esc(t(g))}</option>`).join('')}</select></div>
      <h3 style="margin-top:1.5rem">${t('Change password')}</h3>
      <div class="field"><label>${t('Current password')}</label><input name="current_password" type="password" autocomplete="current-password"></div>
      <div class="field"><label>${t('New password')}</label><input name="password" type="password" minlength="6" autocomplete="new-password"></div>
      <p class="err"></p><button class="btn shu">${t('Save changes')}</button></form></div></div></div>`;
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { state.me = await api('/me', { method: 'PUT', body: Object.fromEntries(new FormData(e.target)) }); toast(t('Saved.'), true); router(); }
    catch (err) { $('.err').textContent = err.message; }
  });
}

/* =================================================================== router */
const routes = [
  [/^\/$/, viewLanding],
  [/^\/login$/, viewLogin, 'guest'],
  [/^\/register$/, viewRegister, 'guest'],
  [/^\/courses$/, viewCourses],
  [/^\/course\/(\d+)$/, viewCourse],
  [/^\/item\/(\d+)$/, viewItem, 'auth'],
  [/^\/quiz\/(\d+)$/, viewQuiz, 'auth'],
  [/^\/dashboard$/, viewDashboard, 'auth'],
  [/^\/my-courses$/, viewMyCourses, 'auth'],
  [/^\/my-exams$/, viewMyExams, 'auth'],
  [/^\/favorites$/, viewFavorites, 'auth'],
  [/^\/wallet$/, viewWallet, 'auth'],
  [/^\/profile$/, viewProfile, 'auth'],
  [/^\/admin(?:\/(\w+))?(?:\/([\w-]+))?$/, (...a) => window.viewAdmin(...a), 'admin'],
];

async function router() {
  state.cleanups.splice(0).forEach((f) => f());
  if (menuOpen()) setMenu(false);
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs || '');
  let app = $('#app');
  renderNav();
  $('#nav').classList.remove('hide');
  const match = routes.find(([re]) => re.test(path));
  if (!match) { location.hash = '/'; return; }
  const [re, view, guard] = match;
  if (guard === 'auth' && !state.me) { sessionStorage.setItem('next', path); location.hash = '/login'; return; }
  if (guard === 'admin' && state.me?.role !== 'admin') { location.hash = state.me ? '/dashboard' : '/login'; return; }
  if (guard === 'guest' && state.me) { location.hash = '/dashboard'; return; }
  const shell = isShellPath(path);
  document.body.classList.toggle('in-shell', shell);
  if (shell) app = renderShell(app, path);
  app.innerHTML = '<div class="loader"><span></span></div>';
  toTop();
  try { await view(app, params, ...path.match(re).slice(1)); }
  catch (err) {
    app.innerHTML = `<div class="page"><div class="${shell ? '' : 'wrap'}"><div class="empty"><div class="ei">${ic('x')}</div><h2 style="font-size:2rem">${esc(err.message)}</h2><a class="btn sm" href="#/courses">${t('Back to courses')}</a></div></div></div>`;
  }
}

window.addEventListener('hashchange', router);
(async () => {
  await SB.auth.getSession(); // finishes email-confirmation sign-in if the link was just opened
  if (new URLSearchParams(location.search).has('code')) history.replaceState(null, '', location.pathname + location.hash);
  state.me = await api('/me').catch(() => null);
  // never await Supabase calls inside this callback (it can deadlock the auth client) — defer them
  SB.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') state.me = null;
    if (event === 'SIGNED_IN' && !state.me) setTimeout(async () => { state.me = await api('/me').catch(() => null); router(); }, 0);
  });
  router();
})();
