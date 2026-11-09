/* 管理 — admin dashboard: stats, categories, courses/chapters/lessons, quizzes, students, codes */
(() => {
  const T = (table) => ({
    list: (q = '') => api(`/admin/t/${table}${q}`),
    create: (body) => api(`/admin/t/${table}`, { method: 'POST', body }),
    update: (id, body) => api(`/admin/t/${table}/${id}`, { method: 'PUT', body }),
    remove: (id) => api(`/admin/t/${table}/${id}`, { method: 'DELETE' }),
  });
  const TABS = [['overview', '統', 'Overview'], ['courses', '講', 'Courses & videos'], ['categories', '類', 'Categories'], ['quizzes', '問', 'Quizzes & exams'], ['students', '生', 'Students'], ['codes', '財', 'Recharge codes']];
  const head = (k, title, actions = '') => `<div class="page-head"><div><span class="eyebrow">${k}</span><h1 class="title-jp">${title}</h1></div><div class="row">${actions}</div></div>`;
  const reload = () => router();

  window.viewAdmin = async (app, params, tab = 'overview', id) => {
    app.innerHTML = `<div class="admin"><aside class="admin-side"><div class="sk">管理</div>
      ${TABS.map(([t, k, l]) => `<a href="#/admin/${t}" class="${t === tab ? 'on' : ''}"><span class="k">${k}</span>${l}</a>`).join('')}
      <a href="#/courses"><span class="k">見</span>View site</a></aside><div class="admin-main page" id="am"></div></div>`;
    const el = $('#am');
    const views = { overview, courses, categories, quizzes, students, codes };
    await (views[tab] || overview)(el, id, params);
  };

  /* ----- overview ----- */
  function bars(rows, key = 'n', fmt = (v) => v) {
    const days = [...Array(14)].map((_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5); return d.toISOString().slice(0, 10); });
    const map = Object.fromEntries(rows.map((r) => [r.d, r[key]]));
    const max = Math.max(1, ...days.map((d) => map[d] || 0));
    return `<div class="bars">${days.map((d, i) => `<div class="b" title="${d}: ${fmt(map[d] || 0)}"><span class="n">${map[d] ? fmt(map[d]) : ''}</span>
      <i style="height:${((map[d] || 0) / max) * 100}%;animation-delay:${i * .04}s"></i><small>${d.slice(8)}</small></div>`).join('')}</div>`;
  }
  async function overview(el) {
    const s = await api('/admin/stats');
    el.innerHTML = `${head('統計 · OVERVIEW', 'Dashboard', '<a class="btn shu sm" href="#/admin/courses">+ New course</a>')}
      <div class="grid g4" style="margin-bottom:1.5rem">
        ${[['生', s.students, `Students · +${s.newStudents7} this week`], ['財', egp(s.revenue), 'Course sales'], ['講', s.enrollments, 'Enrollments'], ['映', s.views, 'Video views'],
          ['課', s.lessons, `Lessons in ${s.courses} courses`], ['問', s.attemptsCount, `Exam attempts · avg ${s.avgScore}%`], ['入', egp(s.recharged), 'Wallet recharges'], ['券', s.codesUnused, 'Unused codes']]
          .map(([k, v, l], i) => `<div class="card kpi reveal" style="--d:${i * .05}s"><div class="v">${v}</div><div class="l">${l}</div><span class="bk">${k}</span></div>`).join('')}
      </div>
      <div class="grid g2" style="margin-bottom:1.5rem">
        <div class="card"><h3>New students · last 14 days</h3>${bars(s.signups)}</div>
        <div class="card"><h3>Sales (EGP) · last 14 days</h3>${bars(s.sales)}</div>
      </div>
      <div class="grid g2" style="align-items:start">
        <div class="card"><h3>Top courses</h3><table class="tbl"><tr><th>Course</th><th>Students</th></tr>${s.topCourses.map((c) => `<tr><td>${esc(c.title)}</td><td><b>${c.n}</b></td></tr>`).join('')}</table></div>
        <div class="card"><h3>Latest exam attempts</h3>${s.recentAttempts.length ? `<table class="tbl"><tr><th>Student</th><th>Exam</th><th>Score</th></tr>${s.recentAttempts.map((a) => `<tr><td>${esc(a.name)}</td><td class="small">${esc(a.title)}</td><td><b>${a.score}/${a.total}</b></td></tr>`).join('')}</table>` : '<p class="muted">No attempts yet.</p>'}</div>
      </div>`;
    animateIn(el);
  }

  /* ----- categories ----- */
  const catFields = [{ k: 'name', label: 'Name', required: true }, { k: 'grade', label: 'Grade label' }, { k: 'kanji', label: 'Kanji (1 character)', placeholder: '三' }, { k: 'description', label: 'Description', type: 'textarea' }, { k: 'sort', label: 'Order', type: 'number', default: 0 }];
  async function categories(el) {
    const cats = await api('/categories');
    el.innerHTML = `${head('分類 · CATEGORIES', 'Categories', '<button class="btn shu sm" id="add">+ Add category</button>')}
      <div class="card table-wrap"><table class="tbl"><tr><th></th><th>Name</th><th>Grade</th><th>Courses</th><th></th></tr>
      ${cats.map((c) => `<tr><td style="font-family:var(--f-brush);font-size:1.6rem;color:var(--shu)">${esc(c.kanji || '')}</td><td><b>${esc(c.name)}</b><br><span class="small muted">${esc(c.description || '')}</span></td>
        <td>${esc(c.grade || '')}</td><td>${c.course_count}</td><td style="white-space:nowrap"><button class="icon-btn" data-edit="${c.id}">✎ Edit</button><button class="icon-btn del" data-del="${c.id}">✕</button></td></tr>`).join('')}</table></div>`;
    $('#add').onclick = () => formModal('New category', catFields, {}, async (d) => { await T('categories').create(d); reload(); });
    $$('[data-edit]', el).forEach((b) => (b.onclick = () => formModal('Edit category', catFields, cats.find((c) => c.id == b.dataset.edit), async (d) => { await T('categories').update(b.dataset.edit, d); reload(); })));
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('Courses in this category will become uncategorized.')) { await T('categories').remove(b.dataset.del); reload(); } }));
  }

  /* ----- courses ----- */
  const courseFields = (cats) => [
    { k: 'title', label: 'Title', required: true },
    { k: 'category_id', label: 'Category', type: 'select', options: [['', '— none —'], ...cats.map((c) => [c.id, c.name])] },
    { k: 'description', label: 'Description', type: 'textarea' },
    { k: 'price', label: 'Price (EGP) — 0 = free', type: 'number', default: 0 },
    { k: 'kanji', label: 'Cover kanji', placeholder: '電', default: '力' },
    { k: 'sort', label: 'Order', type: 'number', default: 0 },
    { k: 'published', label: 'Published (visible to students)', type: 'checkbox', default: 1 },
  ];
  const lessonFields = [
    { k: 'title', label: 'Lesson title', required: true },
    { k: 'video_url', label: 'Video URL', placeholder: 'YouTube (unlisted), Vimeo, Google Drive or .mp4 link', hint: 'Tip: upload to YouTube as Unlisted or Vimeo with domain privacy, then paste the link.' },
    { k: 'description', label: 'Description', type: 'textarea' },
    { k: 'attachment_url', label: 'Notes / homework PDF link (optional)' },
    { k: 'duration_min', label: 'Duration (minutes)', type: 'number', default: 0 },
    { k: 'max_views', label: 'Max views per student (0 = unlimited)', type: 'number', default: 3 },
    { k: 'sort', label: 'Order', type: 'number', default: 0 },
    { k: 'is_free', label: 'Free preview (no purchase needed)', type: 'checkbox' },
  ];
  async function courses(el, id) {
    const [list, cats] = await Promise.all([api('/admin/courses'), api('/categories')]);
    if (id) return courseTree(el, id, cats);
    el.innerHTML = `${head('講座 · COURSES', 'Courses & videos', '<button class="btn shu sm" id="add">+ New course</button>')}
      <div class="grid g3">${list.map((c) => `<div class="card course-card" style="cursor:default">
        <div class="cover" style="height:110px"><span class="sun"></span><span class="ck" style="font-size:3.6rem">${esc(c.kanji || '力')}</span></div>
        <div class="course-body"><div class="row"><span class="tag">${esc(c.category || 'No category')}</span>${c.published ? '<span class="tag green">Published</span>' : '<span class="tag">Draft</span>'}</div>
        <h3>${esc(c.title)}</h3><div class="row between small"><span>${c.price ? egp(c.price) : 'Free'}</span><span class="muted">${c.students} students</span></div>
        <div class="row"><a class="btn sm" href="#/admin/courses/${c.id}">Manage content</a><button class="icon-btn" data-edit="${c.id}">✎</button><button class="icon-btn del" data-del="${c.id}">✕</button></div></div></div>`).join('')}</div>`;
    $('#add').onclick = () => formModal('New course', courseFields(cats), {}, async (d) => { const c = await T('courses').create(d); location.hash = `/admin/courses/${c.id}`; });
    $$('[data-edit]', el).forEach((b) => (b.onclick = () => formModal('Edit course', courseFields(cats), list.find((c) => c.id == b.dataset.edit), async (d) => { await T('courses').update(b.dataset.edit, d); reload(); })));
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('This deletes the course with all chapters, lessons, quizzes and enrollments.')) { await T('courses').remove(b.dataset.del); reload(); } }));
  }
  async function courseTree(el, id, cats) {
    const { course, chapters, quizzes: qz } = await api(`/admin/courses/${id}/tree`);
    el.innerHTML = `<a href="#/admin/courses" class="muted small">← All courses</a>
      ${head(course.published ? '公開 · PUBLISHED' : '下書き · DRAFT', esc(course.title), `<button class="btn ghost sm" id="editc">✎ Course details</button><a class="btn ghost sm" href="#/course/${id}">Preview</a><button class="btn shu sm" id="addch">+ Chapter</button>`)}
      ${chapters.map((ch, i) => `<div class="tree-ch"><header><span class="tag ai">章 ${i + 1}</span>${esc(ch.title)}<span style="margin-left:auto"></span>
          <button class="btn sm ghost" data-addl="${ch.id}">+ Lesson</button><button class="btn sm ghost" data-addq="${ch.id}">+ Quiz</button>
          <button class="icon-btn" data-editch="${ch.id}">✎</button><button class="icon-btn del" data-delch="${ch.id}">✕</button></header>
        ${ch.lessons.map((l) => `<div class="tl"><span>${l.video_url ? '▶' : '<span title="No video yet" style="color:var(--shu)">○</span>'}</span><b>${esc(l.title)}</b>
          ${l.is_free ? '<span class="tag green">Free</span>' : ''}${l.max_views ? `<span class="tag">${l.max_views} views</span>` : ''}<span class="muted small">${l.duration_min || 0}m</span>
          <span style="margin-left:auto"></span><button class="icon-btn" data-editl="${l.id}">✎ Edit</button><button class="icon-btn del" data-dell="${l.id}">✕</button></div>`).join('')}
        ${qz.filter((z) => z.chapter_id === ch.id).map((z) => `<div class="tl"><span style="color:var(--shu)">問</span><b>${esc(z.title)}</b><span class="tag">${z.qcount} Q</span>
          <span style="margin-left:auto"></span><a class="icon-btn" href="#/admin/quizzes/${z.id}">✎ Questions</a></div>`).join('')}
        ${!ch.lessons.length ? '<div class="tl muted small">No lessons yet.</div>' : ''}</div>`).join('') || '<div class="empty"><span class="k">章</span>Add the first chapter.</div>'}
      <div class="tree-ch"><header><span class="tag shu">試</span>Course-level exams<span style="margin-left:auto"></span><button class="btn sm ghost" data-addq="">+ Exam</button></header>
        ${qz.filter((z) => !z.chapter_id).map((z) => `<div class="tl"><b>${esc(z.title)}</b><span class="tag">${z.qcount} Q</span><span style="margin-left:auto"></span><a class="icon-btn" href="#/admin/quizzes/${z.id}">✎ Questions</a></div>`).join('') || '<div class="tl muted small">No exams yet.</div>'}</div>`;
    const lessons = chapters.flatMap((c) => c.lessons);
    $('#editc').onclick = () => formModal('Edit course', courseFields(cats), course, async (d) => { await T('courses').update(id, d); reload(); });
    $('#addch').onclick = () => formModal('New chapter', [{ k: 'title', label: 'Chapter title', required: true }, { k: 'sort', label: 'Order', type: 'number', default: chapters.length }], {}, async (d) => { await T('chapters').create({ ...d, course_id: id }); reload(); });
    $$('[data-editch]', el).forEach((b) => (b.onclick = () => formModal('Edit chapter', [{ k: 'title', label: 'Chapter title' }, { k: 'sort', label: 'Order', type: 'number' }], chapters.find((c) => c.id == b.dataset.editch), async (d) => { await T('chapters').update(b.dataset.editch, d); reload(); })));
    $$('[data-delch]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('Delete this chapter with all its lessons and quizzes?')) { await T('chapters').remove(b.dataset.delch); reload(); } }));
    $$('[data-addl]', el).forEach((b) => (b.onclick = () => formModal('New lesson', lessonFields, { sort: chapters.find((c) => c.id == b.dataset.addl).lessons.length }, async (d) => { await T('lessons').create({ ...d, chapter_id: b.dataset.addl }); reload(); })));
    $$('[data-editl]', el).forEach((b) => (b.onclick = () => formModal('Edit lesson', lessonFields, lessons.find((l) => l.id == b.dataset.editl), async (d) => { await T('lessons').update(b.dataset.editl, d); reload(); })));
    $$('[data-dell]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('Delete this lesson?')) { await T('lessons').remove(b.dataset.dell); reload(); } }));
    $$('[data-addq]', el).forEach((b) => (b.onclick = () => formModal(b.dataset.addq ? 'New chapter quiz' : 'New exam', quizFields, { type: b.dataset.addq ? 'quiz' : 'exam' }, async (d) => {
      const z = await T('quizzes').create({ ...d, course_id: id, chapter_id: b.dataset.addq || null }); location.hash = `/admin/quizzes/${z.id}`;
    })));
  }

  /* ----- quizzes ----- */
  const quizFields = [
    { k: 'title', label: 'Title', required: true },
    { k: 'type', label: 'Type', type: 'select', options: [['quiz', 'Quiz'], ['exam', 'Exam']] },
    { k: 'duration_min', label: 'Time limit (minutes)', type: 'number', default: 15 },
    { k: 'pass_score', label: 'Pass score (%)', type: 'number', default: 50 },
    { k: 'max_attempts', label: 'Max attempts (0 = unlimited)', type: 'number', default: 0 },
  ];
  async function quizzes(el, id) {
    if (id) return quizBuilder(el, id);
    const list = await api('/admin/courses');
    const all = (await Promise.all(list.map((c) => T('quizzes').list(`?course_id=${c.id}`).then((zs) => zs.map((z) => ({ ...z, course: c.title })))))).flat();
    el.innerHTML = `${head('試験 · QUIZZES', 'Quizzes & exams', '<button class="btn shu sm" id="add">+ New quiz</button>')}
      <div class="card table-wrap"><table class="tbl"><tr><th>Title</th><th>Course</th><th>Type</th><th>Time</th><th>Pass</th><th></th></tr>
      ${all.map((z) => `<tr><td><b>${esc(z.title)}</b></td><td class="small">${esc(z.course)}</td><td><span class="tag ${z.type === 'exam' ? 'shu' : 'ai'}">${z.type}</span></td><td>${z.duration_min}m</td><td>${z.pass_score}%</td>
        <td style="white-space:nowrap"><a class="btn sm" href="#/admin/quizzes/${z.id}">Questions</a> <button class="icon-btn del" data-del="${z.id}">✕</button></td></tr>`).join('')}</table>
      ${!all.length ? '<div class="empty"><span class="k">問</span>No quizzes yet.</div>' : ''}</div>`;
    $('#add').onclick = () => formModal('New quiz', [{ k: 'course_id', label: 'Course', type: 'select', options: list.map((c) => [c.id, c.title]) }, ...quizFields], {}, async (d) => { const z = await T('quizzes').create(d); location.hash = `/admin/quizzes/${z.id}`; });
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('Delete this quiz, its questions and all student attempts?')) { await T('quizzes').remove(b.dataset.del); reload(); } }));
  }
  async function quizBuilder(el, id) {
    const [zs, qs] = await Promise.all([T('quizzes').list(), T('questions').list(`?quiz_id=${id}`)]);
    const quiz = zs.find((x) => x.id == id);
    if (!quiz) throw new Error('Quiz not found');
    const qCard = (q, i) => {
      const opts = q ? JSON.parse(q.options) : ['', '', '', ''];
      return `<form class="q-edit" data-id="${q?.id || ''}"><div class="row between"><b style="font-family:var(--f-brush);color:var(--shu);font-size:1.2rem">問${i + 1}</b>
          <span class="row"><label class="small">Points <input class="input" name="points" type="number" min="1" value="${q?.points || 1}" style="width:70px;padding:.3rem .5rem"></label>
          ${q ? `<button type="button" class="icon-btn del" data-delq="${q.id}">✕ Delete</button>` : ''}</span></div>
        <div class="field" style="margin:.6rem 0"><textarea name="text" placeholder="Question text" required style="min-height:60px">${esc(q?.text || '')}</textarea></div>
        <div class="small muted">Options — select the correct answer:</div>
        ${opts.map((o, oi) => `<div class="opt"><input type="radio" name="correct" value="${oi}" ${(q?.correct_index ?? 0) === oi ? 'checked' : ''}><input class="input" name="opt" value="${esc(o)}" placeholder="Option ${oi + 1}"></div>`).join('')}
        <div class="field" style="margin:.6rem 0 0"><input class="input" name="explanation" value="${esc(q?.explanation || '')}" placeholder="Explanation shown after submit (optional)"></div>
        <div class="row" style="justify-content:flex-end;margin-top:.6rem"><button class="btn sm ${q ? 'ghost' : 'shu'}">${q ? 'Save' : 'Add question'}</button></div></form>`;
    };
    el.innerHTML = `<a href="#/admin/courses/${quiz.course_id}" class="muted small">← Back to course</a>
      ${head(quiz.type === 'exam' ? '試験 · EXAM' : '小テスト · QUIZ', esc(quiz.title), '<button class="btn ghost sm" id="editz">✎ Settings</button><button class="btn danger sm" id="delz">Delete</button>')}
      <p class="muted">${quiz.duration_min} min · pass ${quiz.pass_score}% · ${quiz.max_attempts || '∞'} attempts · ${qs.length} questions</p>
      ${qs.map(qCard).join('')}<h3 style="margin-top:2rem">Add a question</h3>${qCard(null, qs.length)}`;
    $$('form.q-edit', el).forEach((f) => f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const options = $$('[name=opt]', f).map((i) => i.value.trim());
      const ci = +(f.correct.value || 0);
      if (!options[ci]) return toast('The correct option cannot be empty.');
      const body = { quiz_id: id, text: f.text.value, options: JSON.stringify(options.filter(Boolean)), correct_index: options.slice(0, ci).filter(Boolean).length, points: +f.points.value || 1, explanation: f.explanation.value, sort: qs.length };
      if (f.dataset.id) { delete body.sort; await T('questions').update(f.dataset.id, body); toast('Saved', true); } else { await T('questions').create(body); toast('Question added', true); reload(); }
    }));
    $$('[data-delq]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('Delete this question?')) { await T('questions').remove(b.dataset.delq); reload(); } }));
    $('#editz').onclick = () => formModal('Quiz settings', quizFields, quiz, async (d) => { await T('quizzes').update(id, d); reload(); });
    $('#delz').onclick = async () => { if (await confirmBox('Delete this quiz and all attempts?')) { await T('quizzes').remove(id); location.hash = `/admin/courses/${quiz.course_id}`; } };
  }

  /* ----- students ----- */
  async function students(el, id, params) {
    if (id) return studentDetail(el, id);
    const q = params.get('q') || '';
    const list = await api('/admin/students?q=' + encodeURIComponent(q));
    el.innerHTML = `${head('生徒 · STUDENTS', 'Students', `<form id="s" class="row"><input class="input" name="q" value="${esc(q)}" placeholder="Search name, email, phone" style="width:240px"><button class="btn sm">Search</button></form>`)}
      <div class="card table-wrap"><table class="tbl"><tr><th>Name</th><th>Phone</th><th>Grade</th><th>Courses</th><th>Avg</th><th>Balance</th><th>Joined</th></tr>
      ${list.map((u) => `<tr style="cursor:pointer" data-go="${u.id}"><td><b>${esc(u.name)}</b>${u.blocked ? ' <span class="tag shu">Blocked</span>' : ''}<br><span class="small muted">${esc(u.email)}</span></td>
        <td>${esc(u.phone)}<br><span class="small muted">Parent: ${esc(u.parent_phone || '—')}</span></td><td class="small">${esc(u.grade || '')}</td><td>${u.courses}</td>
        <td>${u.avg == null ? '—' : u.avg + '%'}</td><td>${egp(u.balance)}</td><td class="small">${fmtDate(u.created_at)}</td></tr>`).join('')}</table>
      ${!list.length ? '<div class="empty"><span class="k">無</span>No students found.</div>' : ''}</div>`;
    $('#s').onsubmit = (e) => { e.preventDefault(); location.hash = '/admin/students?q=' + encodeURIComponent(e.target.q.value); };
    $$('[data-go]', el).forEach((r) => (r.onclick = () => (location.hash = '/admin/students/' + r.dataset.go)));
  }
  async function studentDetail(el, id) {
    const [u, courses] = await Promise.all([api('/admin/students/' + id), api('/admin/courses')]);
    el.innerHTML = `<a href="#/admin/students" class="muted small">← All students</a>
      ${head(esc(u.grade || 'STUDENT'), esc(u.name), `<button class="btn ghost sm" id="bal">± Balance</button><button class="btn ghost sm" id="enr">+ Enroll</button><button class="btn ghost sm" id="rv">Reset views</button><button class="btn danger sm" id="blk">${u.blocked ? 'Unblock' : 'Block'}</button>`)}
      <div class="grid g4" style="margin-bottom:1.5rem">${[['財', egp(u.balance), 'Balance'], ['講', u.courses.length, 'Courses'], ['問', u.attempts.length, 'Exam attempts'], ['電', esc(u.phone), `Parent: ${esc(u.parent_phone || '—')}`]]
        .map(([k, v, l]) => `<div class="card kpi"><div class="v" style="font-size:1.4rem">${v}</div><div class="l">${l}</div><span class="bk">${k}</span></div>`).join('')}</div>
      <div class="grid g2" style="align-items:start">
        <div class="card"><h3>Courses & progress</h3>${u.courses.map((c) => `<div style="padding:.6rem 0;border-bottom:1px solid #f1e9da"><div class="row between"><b>${esc(c.title)}</b><span class="row small">${c.percent}% <button class="icon-btn del" data-unenroll="${c.id}">✕</button></span></div><div class="progress" style="margin-top:.4rem"><i data-w="${c.percent}"></i></div></div>`).join('') || '<p class="muted">Not enrolled in any course.</p>'}</div>
        <div class="card"><h3>Exam results</h3><table class="tbl">${u.attempts.map((a) => `<tr><td>${esc(a.title)}</td><td><b>${a.score}/${a.total}</b></td><td class="small">${fmtDate(a.created_at)}</td></tr>`).join('') || '<tr><td class="muted">No attempts.</td></tr>'}</table></div>
        <div class="card"><h3>Video views</h3><table class="tbl">${u.views.map((v) => `<tr><td>${esc(v.title)}</td><td>${v.views}${v.max_views ? '/' + v.max_views : ''}</td><td>${v.completed ? '<span class="tag green">Done</span>' : ''}</td></tr>`).join('') || '<tr><td class="muted">No views yet.</td></tr>'}</table></div>
        <div class="card"><h3>Transactions</h3><table class="tbl">${u.transactions.map((t) => `<tr><td><span class="tag">${esc(t.type)}</span></td><td class="small">${esc(t.note || '')}</td><td><b>${t.amount > 0 ? '+' : ''}${t.amount}</b></td></tr>`).join('') || '<tr><td class="muted">None.</td></tr>'}</table></div>
      </div>`;
    $('#bal').onclick = () => formModal('Adjust balance', [{ k: 'amount', label: 'Amount in EGP (negative to deduct)', type: 'number', required: true }, { k: 'note', label: 'Note', placeholder: 'Cash payment at center' }], {}, async (d) => { await api(`/admin/students/${id}/balance`, { body: d }); reload(); });
    $('#enr').onclick = () => formModal('Enroll for free', [{ k: 'course_id', label: 'Course', type: 'select', options: courses.map((c) => [c.id, c.title]) }], {}, async (d) => { await api(`/admin/students/${id}/enroll`, { body: d }); reload(); });
    $('#rv').onclick = async () => { await api(`/admin/students/${id}/reset-views`, { method: 'POST' }); toast('Views reset', true); reload(); };
    $('#blk').onclick = async () => { await api(`/admin/students/${id}/block`, { method: 'POST' }); reload(); };
    $$('[data-unenroll]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('Remove this student from the course?', 'Remove')) { await api(`/admin/students/${id}/enroll/${b.dataset.unenroll}`, { method: 'DELETE' }); reload(); } }));
    animateIn(el);
  }

  /* ----- codes ----- */
  async function codes(el) {
    const list = await api('/admin/codes');
    el.innerHTML = `${head('券 · CODES', 'Recharge codes', '<button class="btn shu sm" id="gen">+ Generate codes</button>')}
      <p class="muted">Sell these codes (cash, Vodafone Cash, InstaPay). Students redeem them in their wallet to buy courses.</p>
      <div class="card table-wrap"><table class="tbl code-list"><tr><th>Code</th><th>Amount</th><th>Status</th><th>Created</th><th></th></tr>
      ${list.map((c) => `<tr><td><b>${esc(c.code)}</b></td><td>${egp(c.amount)}</td><td>${c.used_by ? `<span class="tag">Used by ${esc(c.used_name || '?')}</span>` : '<span class="tag green">Available</span>'}</td>
        <td class="small">${fmtDate(c.created_at)}</td><td>${c.used_by ? '' : `<button class="icon-btn del" data-del="${esc(c.code)}">✕</button>`}</td></tr>`).join('')}</table>
      ${!list.length ? '<div class="empty"><span class="k">券</span>No codes yet.</div>' : ''}</div>`;
    $('#gen').onclick = () => formModal('Generate codes', [{ k: 'count', label: 'How many', type: 'number', default: 10 }, { k: 'amount', label: 'Value each (EGP)', type: 'number', default: 100 }], {}, async (d) => {
      const r = await api('/admin/codes', { body: d });
      setTimeout(() => modal(`<h3>${r.codes.length} codes × ${egp(r.amount)}</h3><textarea class="input code-list" style="min-height:220px" readonly>${r.codes.join('\n')}</textarea>
        <div class="row" style="justify-content:flex-end;margin-top:1rem"><button class="btn ghost sm" id="cp">Copy all</button><button class="btn sm" data-close>Done</button></div>`,
      (m) => { $('#cp', m).onclick = () => { navigator.clipboard?.writeText(r.codes.join('\n')); toast('Copied', true); }; $$('[data-close]', m).forEach((b) => b.addEventListener('click', reload)); }), 50);
    });
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { await api('/admin/codes/' + encodeURIComponent(b.dataset.del), { method: 'DELETE' }); reload(); }));
  }
})();
