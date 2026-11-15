/* Admin dashboard (English default, Arabic option): stats, categories, courses → units → lessons → items, quizzes, students, codes */
(() => {
  const T = (table) => ({
    list: (q = '') => api(`/admin/t/${table}${q}`),
    create: (body) => api(`/admin/t/${table}`, { method: 'POST', body }),
    update: (id, body) => api(`/admin/t/${table}/${id}`, { method: 'PUT', body }),
    remove: (id) => api(`/admin/t/${table}/${id}`, { method: 'DELETE' }),
  });
  const TABS = () => [['overview', 'chart', t('Overview')], ['courses', 'book', t('Courses & videos')], ['categories', 'tag', t('Grades & categories')], ['quizzes', 'quiz', t('Quizzes & exams')], ['requests', 'userplus', t('Join requests')], ['students', 'users', t('Students')], ['codes', 'ticket', t('Recharge codes')]];
  const head = (eyebrow, title, actions = '') => `<div class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1 class="title-line">${title}</h1></div><div class="row">${actions}</div></div>`;
  const reload = () => router();
  const typeName = (x) => (x === 'exam' ? t('Exam') : t('Quiz'));

  window.viewAdmin = async (app, params, tab = 'overview', id) => {
    app.innerHTML = `<div class="admin"><aside class="admin-side"><div class="sk">${t('Admin panel')}</div>
      ${TABS().map(([k, i, l]) => `<a href="#/admin/${k}" class="${k === tab ? 'on' : ''}">${ic(i)}${l}${k === 'requests' ? '<span class="badge" id="reqBadge" hidden></span>' : ''}</a>`).join('')}
      <a href="#/dashboard">${ic('home')}${t('Student area')}</a><a href="#/">${ic('eye')}${t('View site')}</a></aside><div class="admin-main page" id="am"></div></div>`;
    const el = $('#am');
    const views = { overview, courses, categories, quizzes, requests, students, codes };
    api('/admin/pending').then((n) => { const b = $('#reqBadge'); if (b && n) { b.hidden = false; b.textContent = n; } }).catch(() => {});
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
          ['play', s.lessons, t('Items in {n} courses', { n: s.courses })], ['quiz', s.attemptsCount, t('Exam attempts · avg {n}%', { n: s.avgScore })], ['ticket', egp(s.recharged), t('Total recharged')], ['tag', s.codesUnused, t('Unused codes')]]
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
    { k: 'description', label: t('Short description'), type: 'textarea' },
    { k: 'about', label: t('About the course (longer text)'), type: 'textarea' },
    { k: 'price', label: t('Price (EGP) — 0 = free'), type: 'number', default: 0 },
    { k: 'teacher', label: t('Teacher'), default: 'Eng. Ahmed Alaa' },
    { k: 'subject', label: t('Subject'), default: 'Physics' },
    { k: 'icon', label: t('Cover icon'), type: 'select', options: ICON_CHOICES(), default: 'atom' },
    { k: 'cover_url', label: t('Cover image link (optional)'), placeholder: 'https://…', hint: t('Leave empty to use the generated cover.') },
    { k: 'sort', label: t('Order'), type: 'number', default: 0 },
    { k: 'published', label: t('Published (visible to students)'), type: 'checkbox', default: 1 },
  ];
  const sectionFields = () => [{ k: 'title', label: t('Unit title'), required: true, placeholder: 'Lecture notes / Homework / Exams…' }, { k: 'sort', label: t('Order'), type: 'number', default: 0 }];
  const lessonFields = () => [{ k: 'title', label: t('Lesson title'), required: true }, { k: 'sort', label: t('Order'), type: 'number', default: 0 }];
  const itemFields = () => [
    { k: 'title', label: t('Title'), required: true, placeholder: 'Part 1 - From 1 to 25' },
    { k: 'kind', label: t('Type'), type: 'select', options: [['video', t('Video')], ['file', t('File')], ['audio', t('Audio')]], default: 'video' },
    { k: 'url', label: t('Link'), placeholder: 'YouTube / Vimeo / Google Drive / .mp4 / .pdf / .mp3', hint: t('Tip: upload to YouTube as Unlisted, or to Vimeo with domain privacy, then paste the link.') },
    { k: 'duration_min', label: t('Duration (minutes)'), type: 'number', default: 0 },
    { k: 'max_views', label: t('Max views per student (0 = unlimited)'), type: 'number', default: 3 },
    { k: 'sort', label: t('Order'), type: 'number', default: 0 },
    { k: 'is_free', label: t('Free preview (no purchase needed)'), type: 'checkbox' },
  ];
  async function courses(el, id) {
    const [list, cats] = await Promise.all([api('/admin/courses'), api('/categories')]);
    if (id) return courseTree(el, id, cats);
    el.innerHTML = `${head(t('Courses'), t('Courses & videos'), `<button class="btn shu sm" id="add">${ic('plus')} ${t('New course')}</button>`)}
      <div class="grid g3">${list.map((c, i) => `<div class="card course-card reveal" style="cursor:default;--d:${(i % 3) * .06}s">${coverArt(c, '', 'style="height:120px"')}
        <div class="course-body"><div class="row"><span class="tag">${esc(c.category || t('No category'))}</span>${c.published ? `<span class="tag green">${t('Published')}</span>` : `<span class="tag">${t('Draft')}</span>`}</div>
        <h3>${esc(c.title)}</h3><div class="row between small"><span>${c.price ? egp(c.price) : t('Free')}</span><span class="muted">${t('{n} students', { n: c.students })}</span></div>
        <div class="row"><a class="btn sm" href="#/admin/courses/${c.id}">${t('Manage content')}</a><button class="icon-btn" data-edit="${c.id}" aria-label="${t('Edit')}">${ic('edit')}</button><button class="icon-btn del" data-del="${c.id}" aria-label="${t('Delete')}">${ic('trash')}</button></div></div></div>`).join('')}</div>
      ${!list.length ? `<div class="empty"><div class="ei">${ic('book')}</div>${t('No courses yet.')}</div>` : ''}`;
    $('#add').onclick = () => formModal(t('New course'), courseFields(cats), {}, async (d) => { const c = await T('courses').create(d); location.hash = `/admin/courses/${c.id}`; });
    $$('[data-edit]', el).forEach((b) => (b.onclick = () => formModal(t('Edit course'), courseFields(cats), list.find((x) => x.id == b.dataset.edit), async (d) => { await T('courses').update(b.dataset.edit, d); reload(); })));
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('This deletes the course with all its chapters, lessons, quizzes and enrolments.'))) { await T('courses').remove(b.dataset.del); reload(); } }));
    animateIn(el);
  }
  async function courseTree(el, id, cats) {
    const { course, sections, quizzes: qz } = await api(`/admin/courses/${id}/tree`);
    const kindIc = (k) => ({ video: 'play', file: 'file', audio: 'audio' }[k] || 'play');
    el.innerHTML = `<a href="#/admin/courses" class="back">${ic('prev')} ${t('All courses')}</a>
      ${head(course.published ? t('Published') : t('Draft'), esc(course.title), `<button class="btn ghost sm" id="editc">${ic('edit')} ${t('Course details')}</button><a class="btn ghost sm" href="#/course/${id}">${ic('eye')} ${t('Preview')}</a><button class="btn shu sm" id="addsec">${ic('plus')} ${t('Unit')}</button>`)}
      <p class="info-pill">${ic('info')} ${t('Structure: Unit → Lesson → Items (videos, files, audio). Quizzes can sit inside a unit; exams sit at the end of the course.')}</p>
      ${sections.map((s, i) => `<div class="tree-ch"><header><span class="tag ai">${t('Unit')} ${pad2(i + 1)}</span>${esc(s.title)}<span class="spacer"></span>
          <button class="btn sm ghost" data-addl="${s.id}">${ic('plus')} ${t('Lesson')}</button><button class="btn sm ghost" data-addq="${s.id}">${ic('plus')} ${t('Quiz')}</button>
          <button class="icon-btn" data-edits="${s.id}" aria-label="${t('Edit')}">${ic('edit')}</button><button class="icon-btn del" data-dels="${s.id}" aria-label="${t('Delete')}">${ic('trash')}</button></header>
        ${s.lessons.map((l, li) => `<div class="tl lesson-row"><span class="tag">${t('Lesson')} ${pad2(li + 1)}</span><b>${esc(l.title)}</b><span class="spacer"></span>
            <button class="btn sm ghost" data-addi="${l.id}">${ic('plus')} ${t('Item')}</button><button class="icon-btn" data-editl="${l.id}" aria-label="${t('Edit')}">${ic('edit')}</button><button class="icon-btn del" data-dell="${l.id}" aria-label="${t('Delete')}">${ic('trash')}</button></div>
          ${l.items.map((it) => `<div class="tl item-row">${it.url ? ic(kindIc(it.kind)) : `<span title="${t('No link yet')}" style="color:var(--shu)">${ic('x')}</span>`}<span>${esc(it.title)}</span>
            <span class="tag">${t({ video: 'Video', file: 'File', audio: 'Audio' }[it.kind] || 'Video')}</span>${it.is_free ? `<span class="tag green">${t('Free')}</span>` : ''}${it.max_views ? `<span class="tag">${t('{n} views', { n: it.max_views })}</span>` : ''}
            <span class="spacer"></span><button class="icon-btn" data-editi="${it.id}">${ic('edit')} ${t('Edit')}</button><button class="icon-btn del" data-deli="${it.id}" aria-label="${t('Delete')}">${ic('trash')}</button></div>`).join('')}`).join('')}
        ${qz.filter((z) => z.section_id === s.id).map((z) => `<div class="tl"><span style="color:var(--shu)">${ic('quiz')}</span><b>${esc(z.title)}</b><span class="tag">${t('{n} Q', { n: z.qcount })}</span>
          <span class="spacer"></span><a class="icon-btn" href="#/admin/quizzes/${z.id}">${ic('edit')} ${t('Questions')}</a></div>`).join('')}
        ${!s.lessons.length ? `<div class="tl muted small">${t('No lessons yet.')}</div>` : ''}</div>`).join('') || `<div class="empty"><div class="ei">${ic('layers')}</div>${t('Add the first unit.')}</div>`}
      <div class="tree-ch"><header><span class="tag shu">${ic('target')}</span>${t('Course exams')}<span class="spacer"></span><button class="btn sm ghost" data-addq="">${ic('plus')} ${t('Exam')}</button></header>
        ${qz.filter((z) => !z.section_id).map((z) => `<div class="tl"><b>${esc(z.title)}</b><span class="tag">${t('{n} Q', { n: z.qcount })}</span><span class="spacer"></span><a class="icon-btn" href="#/admin/quizzes/${z.id}">${ic('edit')} ${t('Questions')}</a></div>`).join('') || `<div class="tl muted small">${t('No exams yet.')}</div>`}</div>`;
    const lessons = sections.flatMap((s) => s.lessons);
    const items = lessons.flatMap((l) => l.items);
    $('#editc').onclick = () => formModal(t('Edit course'), courseFields(cats), course, async (d) => { await T('courses').update(id, d); reload(); });
    $('#addsec').onclick = () => formModal(t('New unit'), sectionFields(), { sort: sections.length }, async (d) => { await T('sections').create({ ...d, course_id: +id }); reload(); });
    $$('[data-edits]', el).forEach((b) => (b.onclick = () => formModal(t('Edit unit'), sectionFields(), sections.find((s) => s.id == b.dataset.edits), async (d) => { await T('sections').update(b.dataset.edits, d); reload(); })));
    $$('[data-dels]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Delete this unit with all its lessons, items and quizzes?'))) { await T('sections').remove(b.dataset.dels); reload(); } }));
    $$('[data-addl]', el).forEach((b) => (b.onclick = () => formModal(t('New lesson'), lessonFields(), { sort: sections.find((s) => s.id == b.dataset.addl).lessons.length }, async (d) => { await T('lessons').create({ ...d, section_id: +b.dataset.addl }); reload(); })));
    $$('[data-editl]', el).forEach((b) => (b.onclick = () => formModal(t('Edit lesson'), lessonFields(), lessons.find((l) => l.id == b.dataset.editl), async (d) => { await T('lessons').update(b.dataset.editl, d); reload(); })));
    $$('[data-dell]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Delete this lesson and its items?'))) { await T('lessons').remove(b.dataset.dell); reload(); } }));
    $$('[data-addi]', el).forEach((b) => (b.onclick = () => formModal(t('New item'), itemFields(), { sort: lessons.find((l) => l.id == b.dataset.addi).items.length }, async (d) => { await T('items').create({ ...d, lesson_id: +b.dataset.addi }); reload(); })));
    $$('[data-editi]', el).forEach((b) => (b.onclick = () => formModal(t('Edit item'), itemFields(), items.find((x) => x.id == b.dataset.editi), async (d) => { await T('items').update(b.dataset.editi, d); reload(); })));
    $$('[data-deli]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Delete this item?'))) { await T('items').remove(b.dataset.deli); reload(); } }));
    $$('[data-addq]', el).forEach((b) => (b.onclick = () => formModal(b.dataset.addq ? t('New unit quiz') : t('New exam'), quizFields(), { type: b.dataset.addq ? 'quiz' : 'exam' }, async (d) => {
      const z = await T('quizzes').create({ ...d, course_id: +id, section_id: b.dataset.addq ? +b.dataset.addq : null }); location.hash = `/admin/quizzes/${z.id}`;
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
    const zs = await T('quizzes').list();
    const all = zs.map((z) => ({ ...z, course: list.find((c) => c.id === z.course_id)?.title || '' }));
    el.innerHTML = `${head(t('Quizzes'), t('Quizzes & exams'), `<button class="btn shu sm" id="add">${ic('plus')} ${t('New quiz')}</button>`)}
      <div class="card table-wrap"><table class="tbl"><tr><th>${t('Title')}</th><th>${t('Course')}</th><th>${t('Type')}</th><th>${t('Time')}</th><th>${t('Pass')}</th><th></th></tr>
      ${all.map((z) => `<tr><td><b>${esc(z.title)}</b></td><td class="small">${esc(z.course)}</td><td><span class="tag ${z.type === 'exam' ? 'shu' : 'ai'}">${typeName(z.type)}</span></td><td>${t('{n} min', { n: z.duration_min })}</td><td>${z.pass_score}%</td>
        <td style="white-space:nowrap"><a class="btn sm" href="#/admin/quizzes/${z.id}">${t('Questions')}</a> <button class="icon-btn del" data-del="${z.id}" aria-label="${t('Delete')}">${ic('trash')}</button></td></tr>`).join('')}</table>
      ${!all.length ? `<div class="empty"><div class="ei">${ic('quiz')}</div>${t('No quizzes yet.')}</div>` : ''}</div>`;
    $('#add').onclick = () => formModal(t('New quiz'), [{ k: 'course_id', label: t('Course'), type: 'select', options: list.map((c) => [c.id, c.title]) }, ...quizFields()], {}, async (d) => { const z = await T('quizzes').create({ ...d, course_id: +d.course_id }); location.hash = `/admin/quizzes/${z.id}`; });
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Delete this quiz, its questions and all student attempts?'))) { await T('quizzes').remove(b.dataset.del); reload(); } }));
  }
  async function quizBuilder(el, id) {
    const [zs, qs] = await Promise.all([T('quizzes').list(`?id=${id}`), api(`/admin/questions/${id}`)]);
    const quiz = zs[0];
    if (!quiz) throw new Error(t('Quiz not found.'));
    const qCard = (q, i) => {
      const opts = q ? [...q.options] : ['', '', '', ''];
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
      const body = { quiz_id: +id, text: f.text.value, options: options.filter(Boolean), correct_index: options.slice(0, ci).filter(Boolean).length, points: +f.points.value || 1, explanation: f.explanation.value, sort: qs.length };
      try {
        if (f.dataset.id) { delete body.sort; await T('questions').update(f.dataset.id, body); toast(t('Saved.'), true); } else { await T('questions').create(body); toast(t('Question added.'), true); reload(); }
      } catch (err) { toast(err.message); }
    }));
    $$('[data-delq]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Delete this question?'))) { await T('questions').remove(b.dataset.delq); reload(); } }));
    $('#editz').onclick = () => formModal(t('Quiz settings'), quizFields(), quiz, async (d) => { await T('quizzes').update(id, d); reload(); });
    $('#delz').onclick = async () => { if (await confirmBox(t('Delete this quiz and all attempts?'))) { await T('quizzes').remove(id); location.hash = `/admin/courses/${quiz.course_id}`; } };
  }

  /* ----- join requests ----- */
  async function requests(el, id, params) {
    const status = params.get('status') || 'pending';
    const list = await api('/admin/requests?status=' + status);
    const tabs = [['pending', t('Pending')], ['approved', t('Approved')], ['rejected', t('Declined')], ['all', t('All')]];
    el.innerHTML = `${head(t('Requests'), t('Join requests'))}
      <p class="muted">${t('Students who paid outside the site (or need access) ask to join a course here. Approving enrols them for free.')}</p>
      <div class="filters">${tabs.map(([k, l]) => `<a class="chip ${k === status ? 'on' : ''}" href="#/admin/requests?status=${k}">${l}</a>`).join('')}</div>
      <div class="card table-wrap"><table class="tbl"><tr><th>${t('Student')}</th><th>${t('Course')}</th><th>${t('Message')}</th><th>${t('Date')}</th><th>${t('Status')}</th><th></th></tr>
      ${list.map((r) => `<tr><td><b>${esc(r.name)}</b><br><span class="small muted ltr">${esc(r.phone || r.email || '')}</span></td>
        <td>${esc(r.course)}<br><span class="small muted">${r.price ? egp(r.price) : t('Free')}</span></td><td class="small">${esc(r.note || '—')}</td><td class="small">${fmtDate(r.created_at)}</td>
        <td><span class="tag ${r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'shu' : 'gold'}">${t({ pending: 'Pending', approved: 'Approved', rejected: 'Declined' }[r.status])}</span></td>
        <td style="white-space:nowrap">${r.status === 'pending' ? `<button class="btn shu sm" data-ok="${r.id}">${ic('check')} ${t('Approve')}</button> <button class="btn danger sm" data-no="${r.id}">${ic('x')} ${t('Decline')}</button>` : ''}</td></tr>`).join('')}</table>
      ${!list.length ? `<div class="empty"><div class="ei">${ic('userplus')}</div>${t('No requests here.')}</div>` : ''}</div>`;
    $$('[data-ok]', el).forEach((b) => (b.onclick = async () => { b.disabled = true; await api(`/admin/requests/${b.dataset.ok}/approve`, { method: 'POST' }); toast(t('Approved — the student can now open the course.'), true); reload(); }));
    $$('[data-no]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox(t('Decline this request?'), t('Decline'))) { await api(`/admin/requests/${b.dataset.no}/reject`, { method: 'POST' }); reload(); } }));
  }

  /* ----- students ----- */
  async function students(el, id, params) {
    if (id) return studentDetail(el, id);
    const q = params.get('q') || '';
    const list = await api('/admin/students?q=' + encodeURIComponent(q));
    el.innerHTML = `${head(t('Students'), t('Students'), `<form id="s" class="row"><input class="input" name="q" value="${esc(q)}" placeholder="${t('Search name, email or mobile')}" style="width:260px"><button class="btn sm">${ic('search')} ${t('Search')}</button></form>`)}
      <div class="card table-wrap"><table class="tbl"><tr><th>${t('Name')}</th><th>${t('Mobile')}</th><th>${t('Grade')}</th><th>${t('Courses')}</th><th>${t('Average')}</th><th>${t('Balance')}</th><th>${t('Joined')}</th></tr>
      ${list.map((u) => `<tr style="cursor:pointer" data-go="${u.id}"><td><b>${esc(u.name)}</b>${u.blocked ? ` <span class="tag shu">${t('Blocked')}</span>` : ''}<br><span class="small muted ltr">${esc(u.email)}</span></td>
        <td><span class="ltr">${esc(u.phone || '')}</span><br><span class="small muted">${t('Parent')}: <span class="ltr">${esc(u.parent_phone || '—')}</span></span></td><td class="small">${esc(u.grade ? t(u.grade) : '')}</td><td>${u.courses}</td>
        <td>${u.avg == null ? '—' : u.avg + '%'}</td><td>${egp(u.balance)}</td><td class="small">${fmtDate(u.created_at)}</td></tr>`).join('')}</table>
      ${!list.length ? `<div class="empty"><div class="ei">${ic('users')}</div>${t('No students found.')}</div>` : ''}</div>`;
    $('#s').onsubmit = (e) => { e.preventDefault(); location.hash = '/admin/students?q=' + encodeURIComponent(e.target.q.value); };
    $$('[data-go]', el).forEach((r) => (r.onclick = () => (location.hash = '/admin/students/' + r.dataset.go)));
  }
  async function studentDetail(el, id) {
    const [u, courses] = await Promise.all([api('/admin/students/' + id), api('/admin/courses')]);
    el.innerHTML = `<a href="#/admin/students" class="back">${ic('prev')} ${t('All students')}</a>
      ${head(esc(u.grade ? t(u.grade) : t('Student')), esc(u.name), `<button class="btn ghost sm" id="bal">${ic('wallet')} ${t('Adjust balance')}</button><button class="btn ghost sm" id="enr">${ic('plus')} ${t('Enrol')}</button><button class="btn ghost sm" id="rv">${ic('repeat')} ${t('Reset views')}</button><button class="btn danger sm" id="blk">${u.blocked ? t('Unblock') : t('Block')}</button>`)}
      <div class="grid g4" style="margin-bottom:1.5rem">${[['wallet', egp(u.balance), t('Balance')], ['book', u.courses.length, t('Courses')], ['quiz', u.attempts.length, t('Exam attempts')], ['user', `<span class="ltr">${esc(u.phone || '')}</span>`, `${t('Parent')}: ${esc(u.parent_phone || '—')}`]]
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
