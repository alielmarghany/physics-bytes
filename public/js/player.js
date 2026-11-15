/* Physics Bytes video player — our own controls on top of YouTube (IFrame API) or a direct video file.
   YouTube's own UI is hidden (controls=0) and a transparent shield stops clicks reaching YouTube links.
   Usage: const p = PBPlayer.mount(el, { url, watermark, storageKey, next: { href, label }, onWatched }); p.destroy(); */
(() => {
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const I = {
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" stroke="none"/>',
    back: '<path d="M4.5 12a7.5 7.5 0 107.5-7.5H8.5"/><path d="M11 1.5L8 4.5l3 3"/><text x="12" y="15.6" font-size="6.6" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial,sans-serif" font-weight="700">10</text>',
    fwd: '<path d="M19.5 12A7.5 7.5 0 1112 4.5h3.5"/><path d="M13 1.5l3 3-3 3"/><text x="12" y="15.6" font-size="6.6" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial,sans-serif" font-weight="700">10</text>',
    vol: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"/>',
    mute: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none"/><path d="M16 9l5 6M21 9l-5 6"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    exitfull: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
    replay: '<path d="M4 12a8 8 0 108-8H7M7 1L4 4l3 3"/>',
    next: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  };
  const svg = (n, cls = '') => `<svg class="pbp-ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
  const fmt = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  };
  const ytId = (url) => (String(url).match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{11})/) || [])[1];
  const isFile = (url) => /\.(mp4|webm|ogg|m4v|mov)(\?|#|$)/i.test(String(url));
  const supported = (url) => !!(url && (ytId(url) || isFile(url)));

  let ytReady = null;
  function loadYT() {
    if (window.YT?.Player) return Promise.resolve();
    if (ytReady) return ytReady;
    ytReady = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = () => { ytReady = null; reject(new Error('YouTube could not be loaded.')); };
      document.head.appendChild(s);
    });
    return ytReady;
  }

  /* ---- source adapters: same small interface for YouTube and <video> ---- */
  function fileAdapter(host, url, ev) {
    const v = document.createElement('video');
    v.src = url; v.preload = 'metadata'; v.playsInline = true; v.setAttribute('playsinline', '');
    v.controlsList = 'nodownload noplaybackrate'; v.disablePictureInPicture = true;
    host.appendChild(v);
    v.addEventListener('loadedmetadata', () => ev.ready());
    v.addEventListener('play', () => ev.state('playing'));
    v.addEventListener('playing', () => ev.state('playing'));
    v.addEventListener('pause', () => ev.state('paused'));
    v.addEventListener('waiting', () => ev.state('buffering'));
    v.addEventListener('ended', () => ev.state('ended'));
    v.addEventListener('error', () => ev.error());
    return {
      play: () => v.play().catch(() => {}), pause: () => v.pause(),
      seek: (t) => { v.currentTime = t; }, time: () => v.currentTime, duration: () => v.duration || 0,
      buffered: () => (v.buffered.length && v.duration ? v.buffered.end(v.buffered.length - 1) / v.duration : 0),
      setVolume: (x) => { v.volume = x / 100; }, setMuted: (m) => { v.muted = m; },
      setRate: (r) => { v.playbackRate = r; }, destroy: () => { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); },
    };
  }
  function ytAdapter(host, id, ev) {
    host.classList.add('pbp-yt');
    host.insertAdjacentHTML('beforeend', `<img class="pbp-poster" alt="" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg">`);
    const mount = document.createElement('div');
    host.appendChild(mount);
    let p = null, dead = false;
    loadYT().then(() => {
      if (dead) return;
      p = new YT.Player(mount, {
        videoId: id,
        playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, iv_load_policy: 3, playsinline: 1, cc_load_policy: 0, origin: location.origin },
        events: {
          onReady: () => ev.ready(),
          onError: () => ev.error(),
          onStateChange: (e) => ev.state({ 1: 'playing', 2: 'paused', 0: 'ended', 3: 'buffering' }[e.data] || 'idle'),
        },
      });
    }).catch(() => ev.error());
    const ok = () => p && typeof p.getCurrentTime === 'function';
    return {
      play: () => ok() && p.playVideo(), pause: () => ok() && p.pauseVideo(),
      seek: (t) => ok() && p.seekTo(t, true), time: () => (ok() ? p.getCurrentTime() : 0), duration: () => (ok() ? p.getDuration() : 0),
      buffered: () => (ok() ? p.getVideoLoadedFraction() : 0),
      setVolume: (x) => ok() && p.setVolume(x), setMuted: (m) => ok() && (m ? p.mute() : p.unMute()),
      setRate: (r) => ok() && p.setPlaybackRate(r), destroy: () => { dead = true; try { p?.destroy(); } catch (e) { /* already gone */ } mount.remove(); },
    };
  }

  function mount(el, opts) {
    const { url, watermark = '', storageKey, next, onWatched, labels = {} } = opts;
    const L = { play: 'Play', pause: 'Pause', back: 'Back 10 seconds', fwd: 'Forward 10 seconds', mute: 'Mute', unmute: 'Unmute', speed: 'Speed', full: 'Full screen',
      exitfull: 'Exit full screen', finished: 'Lesson finished', replay: 'Replay', next: 'Next', resumed: 'Resumed from', error: 'This video could not be played.', normal: 'Normal', ...labels };
    el.classList.add('pbp');
    el.setAttribute('dir', 'ltr');
    el.tabIndex = 0;
    el.innerHTML = `
      <div class="pbp-media"></div>
      <div class="pbp-shield"></div>
      <div class="pbp-wm" aria-hidden="true">${watermark.replace(/[<>&]/g, '')}</div>
      <div class="pbp-spin" aria-hidden="true"></div>
      <button class="pbp-big" type="button" aria-label="${L.play}">${svg('play')}</button>
      <div class="pbp-flash" aria-hidden="true"></div>
      <div class="pbp-end"><b>${L.finished}</b><div class="pbp-end-row"><button type="button" class="pbp-btn wide" data-replay>${svg('replay')} ${L.replay}</button>
        ${next ? `<a class="pbp-btn wide red" href="${next.href}">${L.next}: ${next.label.replace(/[<>&]/g, '')} ${svg('next')}</a>` : ''}</div></div>
      <div class="pbp-err">${L.error}</div>
      <div class="pbp-bar">
        <div class="pbp-seek" role="slider" aria-label="Seek" tabindex="-1"><div class="pbp-track"><i class="pbp-buf"></i><i class="pbp-prog"></i></div><span class="pbp-knob"></span><span class="pbp-tip">0:00</span></div>
        <div class="pbp-row">
          <button class="pbp-btn" type="button" data-toggle aria-label="${L.play}">${svg('play')}</button>
          <button class="pbp-btn" type="button" data-back aria-label="${L.back}">${svg('back')}</button>
          <button class="pbp-btn" type="button" data-fwd aria-label="${L.fwd}">${svg('fwd')}</button>
          <div class="pbp-vol"><button class="pbp-btn" type="button" data-mute aria-label="${L.mute}">${svg('vol')}</button><input type="range" min="0" max="100" value="100" aria-label="Volume"></div>
          <span class="pbp-time"><b data-cur>0:00</b> / <span data-dur>0:00</span></span>
          <span class="pbp-sp"></span>
          <div class="pbp-speed"><button class="pbp-btn txt" type="button" data-speedbtn aria-label="${L.speed}">1×</button>
            <div class="pbp-menu" role="menu">${SPEEDS.map((s) => `<button type="button" data-rate="${s}" role="menuitemradio">${s === 1 ? L.normal : s + '×'}</button>`).join('')}</div></div>
          <button class="pbp-btn" type="button" data-full aria-label="${L.full}">${svg('full')}</button>
        </div>
      </div>`;
    const q = (s) => el.querySelector(s);
    const media = q('.pbp-media');
    let state = 'idle', ready = false, dur = 0, vol = 100, muted = false, rate = 1, hideT = 0, poll = 0, watchedFired = false, lastSave = 0, wmT = 0;

    const set = (cls, on) => el.classList.toggle(cls, on);
    const flash = (html) => { const f = q('.pbp-flash'); f.innerHTML = html; f.classList.remove('show'); void f.offsetWidth; f.classList.add('show'); };
    const ev = {
      ready: () => {
        ready = true; set('is-ready', true); dur = src.duration();
        q('[data-dur]').textContent = fmt(dur);
        src.setVolume(vol); src.setRate(rate);
        const saved = storageKey ? +(localStorage.getItem(storageKey) || 0) : 0;
        if (saved > 5 && (!dur || saved < dur - 10)) { src.seek(saved); update(saved); flash(`${L.resumed} ${fmt(saved)}`); }
      },
      state: (s) => {
        state = s;
        set('is-playing', s === 'playing'); set('is-paused', s === 'paused' || s === 'idle'); set('is-buffering', s === 'buffering'); set('is-ended', s === 'ended');
        q('[data-toggle]').innerHTML = svg(s === 'playing' || s === 'buffering' ? 'pause' : 'play');
        q('[data-toggle]').setAttribute('aria-label', s === 'playing' ? L.pause : L.play);
        if (!dur) { dur = src.duration(); q('[data-dur]').textContent = fmt(dur); }
        if (s === 'playing') { set('started', true); startPoll(); wake(); } else { stopPoll(); showBar(); }
        if (s === 'ended') { save(0); fireWatched(); }
      },
      error: () => { set('is-error', true); stopPoll(); },
    };
    const src = ytId(url) ? ytAdapter(media, ytId(url), ev) : fileAdapter(media, url, ev);

    function update(t = src.time()) {
      if (!dur) dur = src.duration();
      const p = dur ? Math.min(1, t / dur) : 0;
      q('.pbp-prog').style.transform = `scaleX(${p})`;
      q('.pbp-knob').style.left = `${p * 100}%`;
      q('.pbp-buf').style.transform = `scaleX(${Math.min(1, src.buffered() || 0)})`;
      q('[data-cur]').textContent = fmt(t);
      if (dur) q('[data-dur]').textContent = fmt(dur);
      if (dur && t / dur >= 0.9) fireWatched();
      if (storageKey && Date.now() - lastSave > 4000) save(t);
    }
    const save = (t) => { lastSave = Date.now(); try { localStorage.setItem(storageKey, String(Math.floor(t))); } catch (e) { /* storage blocked */ } };
    const fireWatched = () => { if (!watchedFired) { watchedFired = true; onWatched?.(); } };
    const startPoll = () => { stopPoll(); poll = setInterval(() => update(), 250); };
    const stopPoll = () => { clearInterval(poll); poll = 0; if (ready) update(); };

    const toggle = () => { if (!ready) return; if (state === 'playing' || state === 'buffering') src.pause(); else { set('is-ended', false); src.play(); } };
    const seekBy = (d) => { if (!ready) return; const t = Math.max(0, Math.min((dur || src.duration()) - 0.5, src.time() + d)); src.seek(t); update(t); flash(`${d > 0 ? '+' : '−'}${Math.abs(d)}s`); wake(); };
    const setVol = (v) => { vol = Math.max(0, Math.min(100, v)); muted = vol === 0; src.setVolume(vol); src.setMuted(muted); syncVol(); };
    const toggleMute = () => { muted = !muted; src.setMuted(muted); if (!muted && vol === 0) setVol(50); syncVol(); flash(muted ? svg('mute') : svg('vol')); };
    const syncVol = () => { q('[data-mute]').innerHTML = svg(muted || vol === 0 ? 'mute' : 'vol'); q('[data-mute]').setAttribute('aria-label', muted ? L.unmute : L.mute); q('.pbp-vol input').value = muted ? 0 : vol; };
    const setRate = (r) => { rate = r; src.setRate(r); q('[data-speedbtn]').textContent = `${r}×`; el.querySelectorAll('[data-rate]').forEach((b) => b.classList.toggle('on', +b.dataset.rate === r)); flash(`${r}×`); };

    /* fullscreen on the whole player so our controls and watermark stay visible */
    const isFull = () => document.fullscreenElement === el || document.webkitFullscreenElement === el || el.classList.contains('pseudo-full');
    const toggleFull = () => {
      if (isFull()) {
        if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else { el.classList.remove('pseudo-full'); document.body.style.overflow = ''; syncFull(); }
      } else if (el.requestFullscreen || el.webkitRequestFullscreen) {
        const req = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        if (req && req.catch) req.catch(() => { el.classList.add('pseudo-full'); document.body.style.overflow = 'hidden'; syncFull(); });
      } else { el.classList.add('pseudo-full'); document.body.style.overflow = 'hidden'; syncFull(); }
    };
    const syncFull = () => { const f = isFull(); q('[data-full]').innerHTML = svg(f ? 'exitfull' : 'full'); q('[data-full]').setAttribute('aria-label', f ? L.exitfull : L.full); set('is-full', f); };
    document.addEventListener('fullscreenchange', syncFull);
    document.addEventListener('webkitfullscreenchange', syncFull);

    /* auto-hide controls while playing */
    const showBar = () => { set('show-bar', true); clearTimeout(hideT); };
    const wake = () => { showBar(); if (state === 'playing') hideT = setTimeout(() => { if (!el.querySelector('.pbp-speed.open')) set('show-bar', false); }, 2600); };
    el.addEventListener('pointermove', wake);
    el.addEventListener('pointerleave', () => state === 'playing' && set('show-bar', false));

    /* shield: click = play/pause, double-click = fullscreen, double-tap left/right = ±10s on touch */
    let lastTap = 0, tapT = 0;
    q('.pbp-shield').addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse') { if (e.button === 0) { clearTimeout(tapT); tapT = setTimeout(toggle, 220); } return; }
      const now = Date.now(), r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
      if (now - lastTap < 300) { clearTimeout(tapT); lastTap = 0; if (x < 0.35) seekBy(-10); else if (x > 0.65) seekBy(10); else toggleFull(); return; }
      lastTap = now;
      tapT = setTimeout(() => { if (el.classList.contains('show-bar') || state !== 'playing') toggle(); else wake(); }, 300);
    });
    q('.pbp-shield').addEventListener('dblclick', (e) => { clearTimeout(tapT); toggleFull(); e.preventDefault(); });
    el.addEventListener('contextmenu', (e) => e.preventDefault());

    q('.pbp-big').onclick = toggle;
    q('[data-toggle]').onclick = toggle;
    q('[data-back]').onclick = () => seekBy(-10);
    q('[data-fwd]').onclick = () => seekBy(10);
    q('[data-mute]').onclick = toggleMute;
    q('.pbp-vol input').oninput = (e) => setVol(+e.target.value);
    q('[data-full]').onclick = toggleFull;
    q('[data-replay]').onclick = () => { src.seek(0); set('is-ended', false); src.play(); };
    const speed = q('.pbp-speed');
    q('[data-speedbtn]').onclick = (e) => { e.stopPropagation(); speed.classList.toggle('open'); showBar(); };
    el.querySelectorAll('[data-rate]').forEach((b) => (b.onclick = () => { setRate(+b.dataset.rate); speed.classList.remove('open'); wake(); }));
    const closeMenu = (e) => { if (!speed.contains(e.target)) speed.classList.remove('open'); };
    document.addEventListener('pointerdown', closeMenu);
    rate = 1; q('[data-speedbtn]').textContent = '1×'; el.querySelectorAll('[data-rate]').forEach((b) => b.classList.toggle('on', +b.dataset.rate === 1));

    /* seek bar: drag with mouse or finger, hover shows the time */
    const bar = q('.pbp-seek');
    const frac = (e) => { const r = bar.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    let dragging = false;
    bar.addEventListener('pointerdown', (e) => { if (!ready) return; dragging = true; bar.setPointerCapture(e.pointerId); set('is-seeking', true); move(e); });
    bar.addEventListener('pointermove', (e) => {
      const f = frac(e); const tip = q('.pbp-tip');
      tip.textContent = fmt(f * (dur || src.duration())); tip.style.left = `${f * 100}%`;
      if (dragging) move(e);
    });
    const move = (e) => { const t = frac(e) * (dur || src.duration()); q('.pbp-prog').style.transform = `scaleX(${frac(e)})`; q('.pbp-knob').style.left = `${frac(e) * 100}%`; q('[data-cur]').textContent = fmt(t); bar._t = t; };
    const endDrag = () => { if (!dragging) return; dragging = false; set('is-seeking', false); if (bar._t != null) { src.seek(bar._t); update(bar._t); } wake(); };
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);

    /* keyboard: works when the player (or the page body) has focus */
    const onKey = (e) => {
      if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]') && !e.target.closest('.pbp')) return;
      if (e.target.closest && e.target.closest('.pbp-vol input') && /Arrow/.test(e.key)) return;
      if (!el.contains(document.activeElement) && document.activeElement !== document.body) return;
      const k = e.key.toLowerCase();
      const map = {
        ' ': toggle, k: toggle, j: () => seekBy(-10), l: () => seekBy(10), arrowleft: () => seekBy(-5), arrowright: () => seekBy(5),
        arrowup: () => { setVol(vol + 10); flash(`${vol}%`); }, arrowdown: () => { setVol(vol - 10); flash(`${vol}%`); }, m: toggleMute, f: toggleFull,
        '>': () => setRate(SPEEDS[Math.min(SPEEDS.length - 1, SPEEDS.indexOf(rate) + 1)]), '<': () => setRate(SPEEDS[Math.max(0, SPEEDS.indexOf(rate) - 1)]),
      };
      if (/^[0-9]$/.test(k) && ready) { const t = (+k / 10) * (dur || src.duration()); src.seek(t); update(t); e.preventDefault(); return; }
      if (k === 'escape' && el.classList.contains('pseudo-full')) { toggleFull(); return; }
      if (map[k]) { e.preventDefault(); map[k](); }
    };
    document.addEventListener('keydown', onKey);

    /* red watermark drifts to a new spot every few seconds */
    const wm = q('.pbp-wm');
    const moveWm = () => { wm.style.left = `${6 + Math.random() * 58}%`; wm.style.top = `${8 + Math.random() * 70}%`; };
    moveWm(); wmT = setInterval(moveWm, 7000);

    showBar();
    set('is-paused', true);
    return {
      destroy() {
        if (ready && storageKey && state !== 'ended') save(src.time());
        stopPoll(); clearInterval(wmT); clearTimeout(hideT);
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('pointerdown', closeMenu);
        document.removeEventListener('fullscreenchange', syncFull);
        document.removeEventListener('webkitfullscreenchange', syncFull);
        if (el.classList.contains('pseudo-full')) document.body.style.overflow = '';
        src.destroy();
      },
    };
  }

  window.PBPlayer = { mount, supported };
})();
