/* Admin dashboard (English default, Arabic option): stats, categories, courses/chapters/lessons, quizzes, students, codes */
(() => {
  const T = (table) => ({
    list: (q = '') => api(`/admin/t/${table}${q}`),
    create: (body) => api(`/admin/t/${table}`, { method: 'POST', body }),
    update: (id, body) => api(`/admin/t/${table}/${id}`, { method: 'PUT', body }),
    remove: (id) => api(`/admin/t/${table}/${id}`, { method: 'DELETE' }),
  });
  const TABS = () => [['overview', 'chart', t('Overview')], ['courses', 'book', t('Courses & videos')], ['categories', 'tag', t('Grades & categories')], ['quizzes', 'quiz', t('Quizzes & exams')], ['students', 'users', t('Students')], ['codes', 'ticket', t('Recharge codes')]];
  const head = (eyebrow, title, actions = '') => `<div class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1 class="title-line">${title}</h1></div><div class="row">${actions}</div></div>`;
  const reload = () => router();
  const typeName = (x) => (x === 'exam' ? t('Exam') : t('Quiz'));

  window.viewAdmin = async (app, params, tab = 'overview', id) => {
    app.innerHTML = `<div class="admin"><aside class="admin-side"><div class="sk">${t('Admin panel')}</div>
      ${TABS().map(([k, i, l]) => `<a href="#/admin/${k}" class="${k === tab ? 'on' : ''}">${ic(i)}${l}</a>`).join('')}
      <a href="#/courses">${ic('eye')}${t('View site')}</a></aside><div class="admin-main page" id="am"></div></div>`;
    const el = $('#am');
    const views = { overview, courses, categories, quizzes, students, codes };
    await (views[tab] || overview)(el, id, params);
  };

  /* ----- overview ----- */
  function bars(rows, key = 'n') {
    const days = [...Array(14)].map((_, i) => new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10));
    const map = Object.fromEntries(rows.map((r) => [r.d, r[key]]));
    const max = Math.max(1, ...days.map((d) => map[d] || 0));
    return `<div class="bars">${days.map((d, i) => `<div class="b" title="${d}: ${map[d] || 0}"><span class="n">${map[d] || ''}</span>
      <i style="height:${((map[d] || 0) / max) * 100}%;animation-delay:${i * .03}s"></i><small>${d.slice(8)}</small></div>`).join('')}</div>`;
  }
  async function overview(el) {
    const s = await api('/admin/stats');
    el.innerHTML = `${head(t('Statistics'), t('Overview'), `<a class="btn shu sm" href="#/admin/courses">${ic('plus')} ${t('New course')}</a>`)}
      <div class="grid g4" style="margin-bottom:1.5rem">
        ${[['users', s.students, t('Students · +{n} this week', { n: s.newStudents7 })], ['wallet', egp(s.revenue), t('Course sales')], ['book', s.enrollments, t('Enrolments')], ['eye', s.views, t('Video views')],
          ['play', s.lessons, t('Lessons in {n} courses', { n: s.courses })], ['quiz', s.attemptsCount, t('Exam attempts · avg {n}%', { n: s.avgScore })], ['ticket', egp(s.recharged), t('Total recharged')], ['tag', s.codesUnused, t('Unused codes')]]
          .map(([k, v, l], i) => `<div class="card kpi reveal zoom" style="--d:${i * .04}s"><div class="v mono">${v}</div><div class="l">${l}</div><span class="kic">${ic(k)}</span></div>`).join('')}
      </div>
      <div class="grid g2" style="margin-bottom:1.5rem">
        <div class="card"><h3>${t('New students · last 14 days')}</h3>${bars(s.signups)}</div>
        <div class="card"><h3>${t('Sales (EGP) · last 14 days')}</h3>${bars(s.sales)}</div>
      </div>
      <div class="grid g2" style="align-items:start">
        <div class="card"><h3>${t('Top courses')}</h3><table class="tbl"><tr><th>${t('Course')}</th><th>${t('Students')}</th></tr>${s.topCourses.map((c) => `<tr><td>${esc(c.title)}</td><td><b>${c.n}</b></td></tr>`).join('')}</table></div>
        <div class="card"><h3>${t('Latest exam attempts')}</h3>${s.recentAttempts.length ? `<table class="tbl"><tr><th>${t('Student')}</th><th>${t('Exam')}</th><th>${t('Score')}</th></tr>${s.recentAttempts.map((a) => `<tr><td>${esc(a.name)}</td><td class="small">${esc(a.title)}</td><td><b>${a.score}/${a.total}</b></td></tr>`).join('')}</table>` : `<p class="muted">${t('No attempts yet.')}</p>`}</div>
      </div>`;
    animateIn(el);
  }

  /* ----- categories ----- */
  const catFields = () => [{ k: 'name', label: t('Name'), required: true }, { k: 'grade', label: t('Grade') }, { k: 'description', label: t('Description'), type: 'textarea' }, { k: 'sort', label: t('Order'), type: 'number', default: 0 }];
  async function categories(el) {
    const cats = await api('/categories');
    el.innerHTML = `${head(t('Categories'), t('Grades & categories'), `<button class="btn shu sm" id="add">${ic('plus')} ${t('Add category')}</button>`)}
      <div class="card table-wrap"><table class="tbl"><tr><th>#</th><th>${t('Name')}</th><th>${t('Grade')}</th><th>${t('Courses')}</th><th></th></tr>
      ${cats.map((c, i) => `<tr><td class="display-num" style="font-size:1.4rem;color:var(--shu)">${i + 1}</td><td><b>${esc(c.name)}</b><br><span class="small muted">${esc(c.description || '')}</span></td>
        <td>${esc(c.grade || '')}</td><td>${c.course_count}</td><td style="white-space:nowrap"><button class="icon-btn" data-edit="${c.id}">${ic('edit')} ${t('Edit')}</button><button class="icon-btn del" data-del="${c.id}" aria-label="${t('Delete')}">${ic('trash')}</button></td></tr>`).join('')}</table></div>`;
    $('#add').onclick = () => formModal(t('New category'), catFields(), {}, async (d) => { await T('categories').create(d); reload(); });
    $$('[data-edit]', el).forEach((b) => (b.onclick = () => formModal(t('Edit category'), catFields(), cats.find((c) => c.id == b.dataset.edit), async (d) => { await T('categories').update(b.dataset.edit, d); reload(); })));
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Courses in this category will become uncategorised.'))) { await T('categories').remove(b.dataset.del); reload(); } }));
  }

  /* ----- courses ----- */
  const courseFields = (cats) => [
    { k: 'title', label: t('Course title'), required: true },
    { k: 'category_id', label: t('Category'), type: 'select', options: [['', t('— none —')], ...cats.map((c) => [c.id, c.name])] },
    { k: 'description', label: t('Description'), type: 'textarea' },
    { k: 'price', label: t('Price (EGP) — 0 = free'), type: 'number', default: 0 },
    { k: 'kanji', label: t('Cover icon'), type: 'select', options: ICON_CHOICES(), default: 'atom' },
    { k: 'sort', label: t('Order'), type: 'number', default: 0 },
    { k: 'published', label: t('Published (visible to students)'), type: 'checkbox', default: 1 },
  ];
  const lessonFields = () => [
    { k: 'title', label: t('Lesson title'), required: true },
    { k: 'video_url', label: t('Video link'), placeholder: 'YouTube / Vimeo / Google Drive / .mp4', hint: t('Tip: upload to YouTube as Unlisted, or to Vimeo with domain privacy, then paste the link.') },
    { k: 'description', label: t('Description'), type: 'textarea' },
    { k: 'attachment_url', label: t('Notes / homework PDF link (optional)') },
    { k: 'duration_min', label: t('Duration (minutes)'), type: 'number', default: 0 },
    { k: 'max_views', label: t('Max views per student (0 = unlimited)'), type: 'number', default: 3 },
    { k: 'sort', label: t('Order'), type: 'number', default: 0 },
    { k: 'is_free', label: t('Free preview (no purchase needed)'), type: 'checkbox' },
  ];
  async function courses(el, id) {
    const [list, cats] = await Promise.all([api('/admin/courses'), api('/categories')]);
    if (id) return courseTree(el, id, cats);
    el.innerHTML = `${head(t('Courses'), t('Courses & videos'), `<button class="btn shu sm" id="add">${ic('plus')} ${t('New course')}</button>`)}
      <div class="grid g3">${list.map((c, i) => `<div class="card course-card reveal" style="cursor:default;--d:${(i % 3) * .06}s">${coverHtml(c, 'style="height:110px"')}
        <div class="course-body"><div class="row"><span class="tag">${esc(c.category || t('No category'))}</span>${c.published ? `<span class="tag green">${t('Published')}</span>` : `<span class="tag">${t('Draft')}</span>`}</div>
        <h3>${esc(c.title)}</h3><div class="row between small"><span>${c.price ? egp(c.price) : t('Free')}</span><span class="muted">${t('{n} students', { n: c.students })}</span></div>
        <div class="row"><a class="btn sm" href="#/admin/courses/${c.id}">${t('Manage content')}</a><button class="icon-btn" data-edit="${c.id}" aria-label="${t('Edit')}">${ic('edit')}</button><button class="icon-btn del" data-del="${c.id}" aria-label="${t('Delete')}">${ic('trash')}</button></div></div></div>`).join('')}</div>
      ${!list.length ? `<div class="empty"><div class="ei">${ic('book')}</div>${t('No courses yet.')}</div>` : ''}`;
    $('#add').onclick = () => formModal(t('New course'), courseFields(cats), {}, async (d) => { const c = await T('courses').create(d); location.hash = `/admin/courses/${c.id}`; });
    $$('[data-edit]', el).forEach((b) => (b.onclick = () => { const c = list.find((x) => x.id == b.dataset.edit); formModal(t('Edit course'), courseFields(cats), { ...c, kanji: courseIcon(c) }, async (d) => { await T('courses').update(b.dataset.edit, d); reload(); }); }));
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('This deletes the course with all its chapters, lessons, quizzes and enrolments.'))) { await T('courses').remove(b.dataset.del); reload(); } }));
    animateIn(el);
  }
  async function courseTree(el, id, cats) {
    const { course, chapters, quizzes: qz } = await api(`/admin/courses/${id}/tree`);
    el.innerHTML = `<a href="#/admin/courses" class="back">${ic('prev')} ${t('All courses')}</a>
      ${head(course.published ? t('Published') : t('Draft'), esc(course.title), `<button class="btn ghost sm" id="editc">${ic('edit')} ${t('Course details')}</button><a class="btn ghost sm" href="#/course/${id}">${ic('eye')} ${t('Preview')}</a><button class="btn shu sm" id="addch">${ic('plus')} ${t('Chapter')}</button>`)}
      ${chapters.map((ch, i) => `<div class="tree-ch"><header><span class="tag ai">${t('Chapter {n}', { n: i + 1 })}</span>${esc(ch.title)}<span class="spacer"></span>
          <button class="btn sm ghost" data-addl="${ch.id}">${ic('plus')} ${t('Lesson')}</button><button class="btn sm ghost" data-addq="${ch.id}">${ic('plus')} ${t('Quiz')}</button>
          <button class="icon-btn" data-editch="${ch.id}" aria-label="${t('Edit')}">${ic('edit')}</button><button class="icon-btn del" data-delch="${ch.id}" aria-label="${t('Delete')}">${ic('trash')}</button></header>
        ${ch.lessons.map((l) => `<div class="tl">${l.video_url ? ic('play') : `<span title="${t('No video yet')}" style="color:var(--shu)">${ic('x')}</span>`}<b>${esc(l.title)}</b>
          ${l.is_free ? `<span class="tag green">${t('Free')}</span>` : ''}${l.max_views ? `<span class="tag">${t('{n} views', { n: l.max_views })}</span>` : ''}<span class="muted small">${t('{n} min', { n: l.duration_min || 0 })}</span>
          <span class="spacer"></span><button class="icon-btn" data-editl="${l.id}">${ic('edit')} ${t('Edit')}</button><button class="icon-btn del" data-dell="${l.id}" aria-label="${t('Delete')}">${ic('trash')}</button></div>`).join('')}
        ${qz.filter((z) => z.chapter_id === ch.id).map((z) => `<div class="tl"><span style="color:var(--shu)">${ic('quiz')}</span><b>${esc(z.title)}</b><span class="tag">${t('{n} Q', { n: z.qcount })}</span>
          <span class="spacer"></span><a class="icon-btn" href="#/admin/quizzes/${z.id}">${ic('edit')} ${t('Questions')}</a></div>`).join('')}
        ${!ch.lessons.length ? `<div class="tl muted small">${t('No lessons yet.')}</div>` : ''}</div>`).join('') || `<div class="empty"><div class="ei">${ic('layers')}</div>${t('Add the first chapter.')}</div>`}
      <div class="tree-ch"><header><span class="tag shu">${ic('target')}</span>${t('Course exams')}<span class="spacer"></span><button class="btn sm ghost" data-addq="">${ic('plus')} ${t('Exam')}</button></header>
        ${qz.filter((z) => !z.chapter_id).map((z) => `<div class="tl"><b>${esc(z.title)}</b><span class="tag">${t('{n} Q', { n: z.qcount })}</span><span class="spacer"></span><a class="icon-btn" href="#/admin/quizzes/${z.id}">${ic('edit')} ${t('Questions')}</a></div>`).join('') || `<div class="tl muted small">${t('No exams yet.')}</div>`}</div>`;
    const lessons = chapters.flatMap((c) => c.lessons);
    const chFields = [{ k: 'title', label: t('Chapter title'), required: true }, { k: 'sort', label: t('Order'), type: 'number' }];
    $('#editc').onclick = () => formModal(t('Edit course'), courseFields(cats), { ...course, kanji: courseIcon(course) }, async (d) => { await T('courses').update(id, d); reload(); });
    $('#addch').onclick = () => formModal(t('New chapter'), chFields, { sort: chapters.length }, async (d) => { await T('chapters').create({ ...d, course_id: id }); reload(); });
    $$('[data-editch]', el).forEach((b) => (b.onclick = () => formModal(t('Edit chapter'), chFields, chapters.find((c) => c.id == b.dataset.editch), async (d) => { await T('chapters').update(b.dataset.editch, d); reload(); })));
    $$('[data-delch]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Delete this chapter with all its lessons and quizzes?'))) { await T('chapters').remove(b.dataset.delch); reload(); } }));
    $$('[data-addl]', el).forEach((b) => (b.onclick = () => formModal(t('New lesson'), lessonFields(), { sort: chapters.find((c) => c.id == b.dataset.addl).lessons.length }, async (d) => { await T('lessons').create({ ...d, chapter_id: b.dataset.addl }); reload(); })));
    $$('[data-editl]', el).forEach((b) => (b.onclick = () => formModal(t('Edit lesson'), lessonFields(), lessons.find((l) => l.id == b.dataset.editl), async (d) => { await T('lessons').update(b.dataset.editl, d); reload(); })));
    $$('[data-dell]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Delete this lesson?'))) { await T('lessons').remove(b.dataset.dell); reload(); } }));
    $$('[data-addq]', el).forEach((b) => (b.onclick = () => formModal(b.dataset.addq ? t('New chapter quiz') : t('New exam'), quizFields(), { type: b.dataset.addq ? 'quiz' : 'exam' }, async (d) => {
      const z = await T('quizzes').create({ ...d, course_id: id, chapter_id: b.dataset.addq || null }); location.hash = `/admin/quizzes/${z.id}`;
    })));
  }

  /* ----- quizzes ----- */
  const quizFields = () => [
    { k: 'title', label: t('Title'), required: true },
    { k: 'type', label: t('Type'), type: 'select', options: [['quiz', t('Quiz')], ['exam', t('Exam')]] },
    { k: 'duration_min', label: t('Time limit (minutes)'), type: 'number', default: 15 },
    { k: 'pass_score', label: t('Pass mark (%)'), type: 'number', default: 50 },
    { k: 'max_attempts', label: t('Max attempts (0 = unlimited)'), type: 'number', default: 0 },
  ];
  async function quizzes(el, id) {
    if (id) return quizBuilder(el, id);
    const list = await api('/admin/courses');
    const all = (await Promise.all(list.map((c) => T('quizzes').list(`?course_id=${c.id}`).then((zs) => zs.map((z) => ({ ...z, course: c.title })))))).flat();
    el.innerHTML = `${head(t('Quizzes'), t('Quizzes & exams'), `<button class="btn shu sm" id="add">${ic('plus')} ${t('New quiz')}</button>`)}
      <div class="card table-wrap"><table class="tbl"><tr><th>${t('Title')}</th><th>${t('Course')}</th><th>${t('Type')}</th><th>${t('Time')}</th><th>${t('Pass')}</th><th></th></tr>
      ${all.map((z) => `<tr><td><b>${esc(z.title)}</b></td><td class="small">${esc(z.course)}</td><td><span class="tag ${z.type === 'exam' ? 'shu' : 'ai'}">${typeName(z.type)}</span></td><td>${t('{n} min', { n: z.duration_min })}</td><td>${z.pass_score}%</td>
        <td style="white-space:nowrap"><a class="btn sm" href="#/admin/quizzes/${z.id}">${t('Questions')}</a> <button class="icon-btn del" data-del="${z.id}" aria-label="${t('Delete')}">${ic('trash')}</button></td></tr>`).join('')}</table>
      ${!all.length ? `<div class="empty"><div class="ei">${ic('quiz')}</div>${t('No quizzes yet.')}</div>` : ''}</div>`;
    $('#add').onclick = () => formModal(t('New quiz'), [{ k: 'course_id', label: t('Course'), type: 'select', options: list.map((c) => [c.id, c.title]) }, ...quizFields()], {}, async (d) => { const z = await T('quizzes').create(d); location.hash = `/admin/quizzes/${z.id}`; });
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Delete this quiz, its questions and all student attempts?'))) { await T('quizzes').remove(b.dataset.del); reload(); } }));
  }
  async function quizBuilder(el, id) {
    const [zs, qs] = await Promise.all([T('quizzes').list(), T('questions').list(`?quiz_id=${id}`)]);
    const quiz = zs.find((x) => x.id == id);
    if (!quiz) throw new Error(t('Quiz not found.'));
    const qCard = (q, i) => {
      const opts = q ? JSON.parse(q.options) : ['', '', '', ''];
      while (opts.length < 4) opts.push('');
      return `<form class="q-edit" data-id="${q?.id || ''}"><div class="row between"><span class="row"><span class="qn" style="display:inline-grid;place-items:center;min-width:32px;height:32px;border-radius:9px;background:var(--shu);color:#fff;font-weight:700">${i + 1}</span><b>${t('Question')}</b></span>
          <span class="row"><label class="small">${t('Points')} <input class="input" name="points" type="number" min="1" value="${q?.points || 1}" style="width:70px;padding:.3rem .5rem"></label>
          ${q ? `<button type="button" class="icon-btn del" data-delq="${q.id}">${ic('trash')} ${t('Delete')}</button>` : ''}</span></div>
        <div class="field" style="margin:.6rem 0"><textarea name="text" placeholder="${t('Question text')}" required style="min-height:60px">${esc(q?.text || '')}</textarea></div>
        <div class="small muted">${t('Options — select the correct answer:')}</div>
        ${opts.map((o, oi) => `<div class="opt"><input type="radio" name="correct" value="${oi}" ${(q?.correct_index ?? 0) === oi ? 'checked' : ''} aria-label="${t('Correct answer')}"><input class="input" name="opt" value="${esc(o)}" placeholder="${t('Option {n}', { n: oi + 1 })}"></div>`).join('')}
        <div class="field" style="margin:.6rem 0 0"><input class="input" name="explanation" value="${esc(q?.explanation || '')}" placeholder="${t('Explanation shown after submitting (optional)')}"></div>
        <div class="row end" style="margin-top:.6rem"><button class="btn sm ${q ? 'ghost' : 'shu'}">${q ? t('Save') : t('Add question')}</button></div></form>`;
    };
    el.innerHTML = `<a href="#/admin/courses/${quiz.course_id}" class="back">${ic('prev')} ${t('Back to course')}</a>
      ${head(typeName(quiz.type), esc(quiz.title), `<button class="btn ghost sm" id="editz">${ic('edit')} ${t('Settings')}</button><button class="btn danger sm" id="delz">${ic('trash')} ${t('Delete')}</button>`)}
      <p class="muted">${t('{m} min · pass {p}% · {a} · {q} questions', { m: quiz.duration_min, p: quiz.pass_score, a: quiz.max_attempts ? t('{n} attempts', { n: quiz.max_attempts }) : t('unlimited attempts'), q: qs.length })}</p>
      ${qs.map(qCard).join('')}<h3 style="margin-top:2rem">${t('Add a question')}</h3>${qCard(null, qs.length)}`;
    $$('form.q-edit', el).forEach((f) => f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const options = $$('[name=opt]', f).map((i) => i.value.trim());
      const ci = +(f.correct.value || 0);
      if (!options[ci]) return toast(t('The correct option cannot be empty.'));
      const body = { quiz_id: id, text: f.text.value, options: JSON.stringify(options.filter(Boolean)), correct_index: options.slice(0, ci).filter(Boolean).length, points: +f.points.value || 1, explanation: f.explanation.value, sort: qs.length };
      if (f.dataset.id) { delete body.sort; await T('questions').update(f.dataset.id, body); toast(t('Saved.'), true); } else { await T('questions').create(body); toast(t('Question added.'), true); reload(); }
    }));
    $$('[data-delq]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Delete this question?'))) { await T('questions').remove(b.dataset.delq); reload(); } }));
    $('#editz').onclick = () => formModal(t('Quiz settings'), quizFields(), quiz, async (d) => { await T('quizzes').update(id, d); reload(); });
    $('#delz').onclick = async () => { if (await confirmBox(t('Delete this quiz and all attempts?'))) { await T('quizzes').remove(id); location.hash = `/admin/courses/${quiz.course_id}`; } };
  }

  /* ----- students ----- */
  async function students(el, id, params) {
    if (id) return studentDetail(el, id);
    const q = params.get('q') || '';
    const list = await api('/admin/students?q=' + encodeURIComponent(q));
    el.innerHTML = `${head(t('Students'), t('Students'), `<form id="s" class="row"><input class="input" name="q" value="${esc(q)}" placeholder="${t('Search name, email or mobile')}" style="width:260px"><button class="btn sm">${ic('search')} ${t('Search')}</button></form>`)}
      <div class="card table-wrap"><table class="tbl"><tr><th>${t('Name')}</th><th>${t('Mobile')}</th><th>${t('Grade')}</th><th>${t('Courses')}</th><th>${t('Average')}</th><th>${t('Balance')}</th><th>${t('Joined')}</th></tr>
      ${list.map((u) => `<tr style="cursor:pointer" data-go="${u.id}"><td><b>${esc(u.name)}</b>${u.blocked ? ` <span class="tag shu">${t('Blocked')}</span>` : ''}<br><span class="small muted ltr">${esc(u.email)}</span></td>
        <td><span class="ltr">${esc(u.phone)}</span><br><span class="small muted">${t('Parent')}: <span class="ltr">${esc(u.parent_phone || '—')}</span></span></td><td class="small">${esc(u.grade ? t(u.grade) : '')}</td><td>${u.courses}</td>
        <td>${u.avg == null ? '—' : u.avg + '%'}</td><td>${egp(u.balance)}</td><td class="small">${fmtDate(u.created_at)}</td></tr>`).join('')}</table>
      ${!list.length ? `<div class="empty"><div class="ei">${ic('users')}</div>${t('No students found.')}</div>` : ''}</div>`;
    $('#s').onsubmit = (e) => { e.preventDefault(); location.hash = '/admin/students?q=' + encodeURIComponent(e.target.q.value); };
    $$('[data-go]', el).forEach((r) => (r.onclick = () => (location.hash = '/admin/students/' + r.dataset.go)));
  }
  async function studentDetail(el, id) {
    const [u, courses] = await Promise.all([api('/admin/students/' + id), api('/admin/courses')]);
    el.innerHTML = `<a href="#/admin/students" class="back">${ic('prev')} ${t('All students')}</a>
      ${head(esc(u.grade ? t(u.grade) : t('Student')), esc(u.name), `<button class="btn ghost sm" id="bal">${ic('wallet')} ${t('Adjust balance')}</button><button class="btn ghost sm" id="enr">${ic('plus')} ${t('Enrol')}</button><button class="btn ghost sm" id="rv">${ic('repeat')} ${t('Reset views')}</button><button class="btn danger sm" id="blk">${u.blocked ? t('Unblock') : t('Block')}</button>`)}
      <div class="grid g4" style="margin-bottom:1.5rem">${[['wallet', egp(u.balance), t('Balance')], ['book', u.courses.length, t('Courses')], ['quiz', u.attempts.length, t('Exam attempts')], ['user', `<span class="ltr">${esc(u.phone)}</span>`, `${t('Parent')}: ${esc(u.parent_phone || '—')}`]]
        .map(([k, v, l]) => `<div class="card kpi"><div class="v" style="font-size:1.35rem">${v}</div><div class="l">${l}</div><span class="kic">${ic(k)}</span></div>`).join('')}</div>
      <div class="grid g2" style="align-items:start">
        <div class="card"><h3>${t('Courses & progress')}</h3>${u.courses.map((c) => `<div style="padding:.6rem 0;border-bottom:1px solid var(--line)"><div class="row between"><b>${esc(c.title)}</b><span class="row small">${c.percent}% <button class="icon-btn del" data-unenroll="${c.id}" aria-label="${t('Remove from course')}">${ic('x')}</button></span></div><div class="progress" style="margin-top:.4rem"><i data-w="${c.percent}"></i></div></div>`).join('') || `<p class="muted">${t('Not enrolled in any course.')}</p>`}</div>
        <div class="card"><h3>${t('Exam results')}</h3><table class="tbl">${u.attempts.map((a) => `<tr><td>${esc(a.title)}</td><td><b>${a.score}/${a.total}</b></td><td class="small">${fmtDate(a.created_at)}</td></tr>`).join('') || `<tr><td class="muted">${t('No attempts.')}</td></tr>`}</table></div>
        <div class="card"><h3>${t('Video views')}</h3><table class="tbl">${u.views.map((v) => `<tr><td>${esc(v.title)}</td><td>${v.views}${v.max_views ? '/' + v.max_views : ''}</td><td>${v.completed ? `<span class="tag green">${t('Completed')}</span>` : ''}</td></tr>`).join('') || `<tr><td class="muted">${t('No views yet.')}</td></tr>`}</table></div>
        <div class="card"><h3>${t('Transactions')}</h3><table class="tbl">${u.transactions.map((x) => `<tr><td><span class="tag">${t(TX[x.type] || x.type)}</span></td><td class="small">${esc(tNote(x.note))}</td><td><b class="ltr">${x.amount > 0 ? '+' : ''}${x.amount}</b></td></tr>`).join('') || `<tr><td class="muted">${t('None.')}</td></tr>`}</table></div>
      </div>`;
    $('#bal').onclick = () => formModal(t('Adjust balance'), [{ k: 'amount', label: t('Amount in EGP (negative to deduct)'), type: 'number', required: true }, { k: 'note', label: t('Note'), placeholder: t('Cash payment at the centre') }], {}, async (d) => { await api(`/admin/students/${id}/balance`, { body: d }); reload(); });
    $('#enr').onclick = () => formModal(t('Enrol for free'), [{ k: 'course_id', label: t('Course'), type: 'select', options: courses.map((c) => [c.id, c.title]) }], {}, async (d) => { await api(`/admin/students/${id}/enroll`, { body: d }); reload(); });
    $('#rv').onclick = async () => { await api(`/admin/students/${id}/reset-views`, { method: 'POST' }); toast(t('Views reset.'), true); reload(); };
    $('#blk').onclick = async () => { await api(`/admin/students/${id}/block`, { method: 'POST' }); reload(); };
    $$('[data-unenroll]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Remove this student from the course?'), t('Remove'))) { await api(`/admin/students/${id}/enroll/${b.dataset.unenroll}`, { method: 'DELETE' }); reload(); } }));
    animateIn(el);
  }

  /* ----- codes ----- */
  async function codes(el) {
    const list = await api('/admin/codes');
    el.innerHTML = `${head(t('Codes'), t('Recharge codes'), `<button class="btn shu sm" id="gen">${ic('plus')} ${t('Generate codes')}</button>`)}
      <p class="muted">${t('Sell these codes (cash, Vodafone Cash or InstaPay). Students redeem them in their wallet to buy courses.')}</p>
      <div class="card table-wrap"><table class="tbl"><tr><th>${t('Code')}</th><th>${t('Value')}</th><th>${t('Status')}</th><th>${t('Created')}</th><th></th></tr>
      ${list.map((c) => `<tr><td><b class="code-list">${esc(c.code)}</b></td><td>${egp(c.amount)}</td><td>${c.used_by ? `<span class="tag">${t('Used by {n}', { n: esc(c.used_name || '?') })}</span>` : `<span class="tag green">${t('Available')}</span>`}</td>
        <td class="small">${fmtDate(c.created_at)}</td><td>${c.used_by ? '' : `<button class="icon-btn del" data-del="${esc(c.code)}" aria-label="${t('Delete')}">${ic('trash')}</button>`}</td></tr>`).join('')}</table>
      ${!list.length ? `<div class="empty"><div class="ei">${ic('ticket')}</div>${t('No codes yet.')}</div>` : ''}</div>`;
    $('#gen').onclick = () => formModal(t('Generate codes'), [{ k: 'count', label: t('How many'), type: 'number', default: 10 }, { k: 'amount', label: t('Value of each code (EGP)'), type: 'number', default: 100 }], {}, async (d) => {
      const r = await api('/admin/codes', { body: d });
      setTimeout(() => modal(`<h3>${t('{n} codes × {v}', { n: r.codes.length, v: egp(r.amount) })}</h3><textarea class="input code-list" style="min-height:220px" readonly>${r.codes.join('\n')}</textarea>
        <div class="row end" style="margin-top:1rem"><button class="btn ghost sm" id="cp">${ic('copy')} ${t('Copy all')}</button><button class="btn sm" data-close>${t('Done')}</button></div>`,
      (m) => { $('#cp', m).onclick = () => { navigator.clipboard?.writeText(r.codes.join('\n')); toast(t('Copied.'), true); }; $$('[data-close]', m).forEach((b) => b.addEventListener('click', reload)); }), 50);
    });
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { await api('/admin/codes/' + encodeURIComponent(b.dataset.del), { method: 'DELETE' }); reload(); }));
  }
})();
