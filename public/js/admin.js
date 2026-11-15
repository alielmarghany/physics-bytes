/* Admin dashboard (Arabic): stats, categories, courses/chapters/lessons, quizzes, students, codes */
(() => {
  const T = (table) => ({
    list: (q = '') => api(`/admin/t/${table}${q}`),
    create: (body) => api(`/admin/t/${table}`, { method: 'POST', body }),
    update: (id, body) => api(`/admin/t/${table}/${id}`, { method: 'PUT', body }),
    remove: (id) => api(`/admin/t/${table}/${id}`, { method: 'DELETE' }),
  });
  const TABS = [['overview', 'chart', 'نظرة عامة'], ['courses', 'book', 'الكورسات والفيديوهات'], ['categories', 'tag', 'الصفوف والتصنيفات'], ['quizzes', 'quiz', 'الاختبارات والامتحانات'], ['students', 'users', 'الطلاب'], ['codes', 'ticket', 'أكواد الشحن']];
  const head = (eyebrow, title, actions = '') => `<div class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1 class="title-line">${title}</h1></div><div class="row">${actions}</div></div>`;
  const reload = () => router();
  const typeName = (t) => (t === 'exam' ? 'امتحان' : 'اختبار');

  window.viewAdmin = async (app, params, tab = 'overview', id) => {
    app.innerHTML = `<div class="admin"><aside class="admin-side"><div class="sk">لوحة التحكم</div>
      ${TABS.map(([t, k, l]) => `<a href="#/admin/${t}" class="${t === tab ? 'on' : ''}">${ic(k)}${l}</a>`).join('')}
      <a href="#/courses">${ic('eye')}عرض الموقع</a></aside><div class="admin-main page" id="am"></div></div>`;
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
    el.innerHTML = `${head('الإحصائيات', 'نظرة عامة', `<a class="btn shu sm" href="#/admin/courses">${ic('plus')} كورس جديد</a>`)}
      <div class="grid g4" style="margin-bottom:1.5rem">
        ${[['users', s.students, `طالب · +${s.newStudents7} هذا الأسبوع`], ['wallet', egp(s.revenue), 'مبيعات الكورسات'], ['book', s.enrollments, 'اشتراكات'], ['eye', s.views, 'مشاهدات الفيديو'],
          ['play', s.lessons, `درس في ${s.courses} كورس`], ['quiz', s.attemptsCount, `محاولة امتحان · المتوسط ${s.avgScore}%`], ['ticket', egp(s.recharged), 'إجمالي الشحن'], ['tag', s.codesUnused, 'أكواد غير مستخدمة']]
          .map(([k, v, l], i) => `<div class="card kpi reveal" style="--d:${i * .04}s"><div class="v mono">${v}</div><div class="l">${l}</div><span class="kic">${ic(k)}</span></div>`).join('')}
      </div>
      <div class="grid g2" style="margin-bottom:1.5rem">
        <div class="card"><h3>طلاب جدد · آخر 14 يوم</h3>${bars(s.signups)}</div>
        <div class="card"><h3>المبيعات (ج.م) · آخر 14 يوم</h3>${bars(s.sales)}</div>
      </div>
      <div class="grid g2" style="align-items:start">
        <div class="card"><h3>أكثر الكورسات اشتراكًا</h3><table class="tbl"><tr><th>الكورس</th><th>الطلاب</th></tr>${s.topCourses.map((c) => `<tr><td>${esc(c.title)}</td><td><b>${c.n}</b></td></tr>`).join('')}</table></div>
        <div class="card"><h3>آخر محاولات الامتحانات</h3>${s.recentAttempts.length ? `<table class="tbl"><tr><th>الطالب</th><th>الامتحان</th><th>الدرجة</th></tr>${s.recentAttempts.map((a) => `<tr><td>${esc(a.name)}</td><td class="small">${esc(a.title)}</td><td><b>${a.score}/${a.total}</b></td></tr>`).join('')}</table>` : '<p class="muted">لا توجد محاولات بعد.</p>'}</div>
      </div>`;
    animateIn(el);
  }

  /* ----- categories ----- */
  const catFields = [{ k: 'name', label: 'الاسم', required: true }, { k: 'grade', label: 'الصف' }, { k: 'description', label: 'الوصف', type: 'textarea' }, { k: 'sort', label: 'الترتيب', type: 'number', default: 0 }];
  async function categories(el) {
    const cats = await api('/categories');
    el.innerHTML = `${head('التصنيفات', 'الصفوف والتصنيفات', `<button class="btn shu sm" id="add">${ic('plus')} إضافة تصنيف</button>`)}
      <div class="card table-wrap"><table class="tbl"><tr><th>#</th><th>الاسم</th><th>الصف</th><th>الكورسات</th><th></th></tr>
      ${cats.map((c, i) => `<tr><td class="mono" style="font-size:1.4rem;color:var(--shu)">${i + 1}</td><td><b>${esc(c.name)}</b><br><span class="small muted">${esc(c.description || '')}</span></td>
        <td>${esc(c.grade || '')}</td><td>${c.course_count}</td><td style="white-space:nowrap"><button class="icon-btn" data-edit="${c.id}">${ic('edit')} تعديل</button><button class="icon-btn del" data-del="${c.id}">${ic('trash')}</button></td></tr>`).join('')}</table></div>`;
    $('#add').onclick = () => formModal('تصنيف جديد', catFields, {}, async (d) => { await T('categories').create(d); reload(); });
    $$('[data-edit]', el).forEach((b) => (b.onclick = () => formModal('تعديل التصنيف', catFields, cats.find((c) => c.id == b.dataset.edit), async (d) => { await T('categories').update(b.dataset.edit, d); reload(); })));
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('الكورسات الموجودة في هذا التصنيف ستصبح بدون تصنيف.')) { await T('categories').remove(b.dataset.del); reload(); } }));
  }

  /* ----- courses ----- */
  const courseFields = (cats) => [
    { k: 'title', label: 'عنوان الكورس', required: true },
    { k: 'category_id', label: 'التصنيف', type: 'select', options: [['', '— بدون —'], ...cats.map((c) => [c.id, c.name])] },
    { k: 'description', label: 'الوصف', type: 'textarea' },
    { k: 'price', label: 'السعر (ج.م) — 0 = مجاني', type: 'number', default: 0 },
    { k: 'kanji', label: 'أيقونة الغلاف', type: 'select', options: ICON_CHOICES, default: 'atom' },
    { k: 'sort', label: 'الترتيب', type: 'number', default: 0 },
    { k: 'published', label: 'منشور (يظهر للطلاب)', type: 'checkbox', default: 1 },
  ];
  const lessonFields = [
    { k: 'title', label: 'عنوان الدرس', required: true },
    { k: 'video_url', label: 'رابط الفيديو', placeholder: 'YouTube / Vimeo / Google Drive / .mp4', hint: 'نصيحة: ارفع الفيديو على يوتيوب "غير مدرج" أو على Vimeo مع تقييد النطاق، ثم الصق الرابط.' },
    { k: 'description', label: 'الوصف', type: 'textarea' },
    { k: 'attachment_url', label: 'رابط الملزمة / الواجب PDF (اختياري)' },
    { k: 'duration_min', label: 'المدة (بالدقائق)', type: 'number', default: 0 },
    { k: 'max_views', label: 'أقصى عدد مشاهدات لكل طالب (0 = غير محدود)', type: 'number', default: 3 },
    { k: 'sort', label: 'الترتيب', type: 'number', default: 0 },
    { k: 'is_free', label: 'درس مجاني (بدون شراء)', type: 'checkbox' },
  ];
  async function courses(el, id) {
    const [list, cats] = await Promise.all([api('/admin/courses'), api('/categories')]);
    if (id) return courseTree(el, id, cats);
    el.innerHTML = `${head('الكورسات', 'الكورسات والفيديوهات', `<button class="btn shu sm" id="add">${ic('plus')} كورس جديد</button>`)}
      <div class="grid g3">${list.map((c) => `<div class="card course-card" style="cursor:default">${coverHtml(c, 'style="height:110px"')}
        <div class="course-body"><div class="row"><span class="tag">${esc(c.category || 'بدون تصنيف')}</span>${c.published ? '<span class="tag green">منشور</span>' : '<span class="tag">مسودة</span>'}</div>
        <h3>${esc(c.title)}</h3><div class="row between small"><span>${c.price ? egp(c.price) : 'مجاني'}</span><span class="muted">${c.students} طالب</span></div>
        <div class="row"><a class="btn sm" href="#/admin/courses/${c.id}">إدارة المحتوى</a><button class="icon-btn" data-edit="${c.id}" aria-label="تعديل">${ic('edit')}</button><button class="icon-btn del" data-del="${c.id}" aria-label="حذف">${ic('trash')}</button></div></div></div>`).join('')}</div>
      ${!list.length ? `<div class="empty"><div class="ei">${ic('book')}</div>لا توجد كورسات بعد.</div>` : ''}`;
    $('#add').onclick = () => formModal('كورس جديد', courseFields(cats), {}, async (d) => { const c = await T('courses').create(d); location.hash = `/admin/courses/${c.id}`; });
    $$('[data-edit]', el).forEach((b) => (b.onclick = () => formModal('تعديل الكورس', courseFields(cats), { ...list.find((c) => c.id == b.dataset.edit), kanji: courseIcon(list.find((c) => c.id == b.dataset.edit)) }, async (d) => { await T('courses').update(b.dataset.edit, d); reload(); })));
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('سيتم حذف الكورس بكل فصوله ودروسه واختباراته واشتراكاته.')) { await T('courses').remove(b.dataset.del); reload(); } }));
  }
  async function courseTree(el, id, cats) {
    const { course, chapters, quizzes: qz } = await api(`/admin/courses/${id}/tree`);
    el.innerHTML = `<a href="#/admin/courses" class="back">${ic('prev')} كل الكورسات</a>
      ${head(course.published ? 'منشور' : 'مسودة', esc(course.title), `<button class="btn ghost sm" id="editc">${ic('edit')} بيانات الكورس</button><a class="btn ghost sm" href="#/course/${id}">${ic('eye')} معاينة</a><button class="btn shu sm" id="addch">${ic('plus')} فصل</button>`)}
      ${chapters.map((ch, i) => `<div class="tree-ch"><header><span class="tag ai">الفصل ${i + 1}</span>${esc(ch.title)}<span class="spacer"></span>
          <button class="btn sm ghost" data-addl="${ch.id}">${ic('plus')} درس</button><button class="btn sm ghost" data-addq="${ch.id}">${ic('plus')} اختبار</button>
          <button class="icon-btn" data-editch="${ch.id}" aria-label="تعديل">${ic('edit')}</button><button class="icon-btn del" data-delch="${ch.id}" aria-label="حذف">${ic('trash')}</button></header>
        ${ch.lessons.map((l) => `<div class="tl">${l.video_url ? ic('play') : `<span title="لا يوجد فيديو بعد" style="color:var(--shu)">${ic('x')}</span>`}<b>${esc(l.title)}</b>
          ${l.is_free ? '<span class="tag green">مجاني</span>' : ''}${l.max_views ? `<span class="tag">${l.max_views} مشاهدات</span>` : ''}<span class="muted small">${l.duration_min || 0} دقيقة</span>
          <span class="spacer"></span><button class="icon-btn" data-editl="${l.id}">${ic('edit')} تعديل</button><button class="icon-btn del" data-dell="${l.id}" aria-label="حذف">${ic('trash')}</button></div>`).join('')}
        ${qz.filter((z) => z.chapter_id === ch.id).map((z) => `<div class="tl"><span style="color:var(--shu)">${ic('quiz')}</span><b>${esc(z.title)}</b><span class="tag">${z.qcount} سؤال</span>
          <span class="spacer"></span><a class="icon-btn" href="#/admin/quizzes/${z.id}">${ic('edit')} الأسئلة</a></div>`).join('')}
        ${!ch.lessons.length ? '<div class="tl muted small">لا توجد دروس بعد.</div>' : ''}</div>`).join('') || `<div class="empty"><div class="ei">${ic('layers')}</div>أضف أول فصل.</div>`}
      <div class="tree-ch"><header><span class="tag shu">${ic('target')}</span>امتحانات الكورس<span class="spacer"></span><button class="btn sm ghost" data-addq="">${ic('plus')} امتحان</button></header>
        ${qz.filter((z) => !z.chapter_id).map((z) => `<div class="tl"><b>${esc(z.title)}</b><span class="tag">${z.qcount} سؤال</span><span class="spacer"></span><a class="icon-btn" href="#/admin/quizzes/${z.id}">${ic('edit')} الأسئلة</a></div>`).join('') || '<div class="tl muted small">لا توجد امتحانات بعد.</div>'}</div>`;
    const lessons = chapters.flatMap((c) => c.lessons);
    const chFields = [{ k: 'title', label: 'عنوان الفصل', required: true }, { k: 'sort', label: 'الترتيب', type: 'number' }];
    $('#editc').onclick = () => formModal('تعديل الكورس', courseFields(cats), { ...course, kanji: courseIcon(course) }, async (d) => { await T('courses').update(id, d); reload(); });
    $('#addch').onclick = () => formModal('فصل جديد', chFields, { sort: chapters.length }, async (d) => { await T('chapters').create({ ...d, course_id: id }); reload(); });
    $$('[data-editch]', el).forEach((b) => (b.onclick = () => formModal('تعديل الفصل', chFields, chapters.find((c) => c.id == b.dataset.editch), async (d) => { await T('chapters').update(b.dataset.editch, d); reload(); })));
    $$('[data-delch]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('حذف هذا الفصل بكل دروسه واختباراته؟')) { await T('chapters').remove(b.dataset.delch); reload(); } }));
    $$('[data-addl]', el).forEach((b) => (b.onclick = () => formModal('درس جديد', lessonFields, { sort: chapters.find((c) => c.id == b.dataset.addl).lessons.length }, async (d) => { await T('lessons').create({ ...d, chapter_id: b.dataset.addl }); reload(); })));
    $$('[data-editl]', el).forEach((b) => (b.onclick = () => formModal('تعديل الدرس', lessonFields, lessons.find((l) => l.id == b.dataset.editl), async (d) => { await T('lessons').update(b.dataset.editl, d); reload(); })));
    $$('[data-dell]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('حذف هذا الدرس؟')) { await T('lessons').remove(b.dataset.dell); reload(); } }));
    $$('[data-addq]', el).forEach((b) => (b.onclick = () => formModal(b.dataset.addq ? 'اختبار فصل جديد' : 'امتحان جديد', quizFields, { type: b.dataset.addq ? 'quiz' : 'exam' }, async (d) => {
      const z = await T('quizzes').create({ ...d, course_id: id, chapter_id: b.dataset.addq || null }); location.hash = `/admin/quizzes/${z.id}`;
    })));
  }

  /* ----- quizzes ----- */
  const quizFields = [
    { k: 'title', label: 'العنوان', required: true },
    { k: 'type', label: 'النوع', type: 'select', options: [['quiz', 'اختبار'], ['exam', 'امتحان']] },
    { k: 'duration_min', label: 'المدة (بالدقائق)', type: 'number', default: 15 },
    { k: 'pass_score', label: 'درجة النجاح (%)', type: 'number', default: 50 },
    { k: 'max_attempts', label: 'أقصى عدد محاولات (0 = غير محدود)', type: 'number', default: 0 },
  ];
  async function quizzes(el, id) {
    if (id) return quizBuilder(el, id);
    const list = await api('/admin/courses');
    const all = (await Promise.all(list.map((c) => T('quizzes').list(`?course_id=${c.id}`).then((zs) => zs.map((z) => ({ ...z, course: c.title })))))).flat();
    el.innerHTML = `${head('الاختبارات', 'الاختبارات والامتحانات', `<button class="btn shu sm" id="add">${ic('plus')} اختبار جديد</button>`)}
      <div class="card table-wrap"><table class="tbl"><tr><th>العنوان</th><th>الكورس</th><th>النوع</th><th>المدة</th><th>النجاح</th><th></th></tr>
      ${all.map((z) => `<tr><td><b>${esc(z.title)}</b></td><td class="small">${esc(z.course)}</td><td><span class="tag ${z.type === 'exam' ? 'shu' : 'ai'}">${typeName(z.type)}</span></td><td>${z.duration_min} د</td><td>${z.pass_score}%</td>
        <td style="white-space:nowrap"><a class="btn sm" href="#/admin/quizzes/${z.id}">الأسئلة</a> <button class="icon-btn del" data-del="${z.id}" aria-label="حذف">${ic('trash')}</button></td></tr>`).join('')}</table>
      ${!all.length ? `<div class="empty"><div class="ei">${ic('quiz')}</div>لا توجد اختبارات بعد.</div>` : ''}</div>`;
    $('#add').onclick = () => formModal('اختبار جديد', [{ k: 'course_id', label: 'الكورس', type: 'select', options: list.map((c) => [c.id, c.title]) }, ...quizFields], {}, async (d) => { const z = await T('quizzes').create(d); location.hash = `/admin/quizzes/${z.id}`; });
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('حذف هذا الاختبار وأسئلته وكل محاولات الطلاب؟')) { await T('quizzes').remove(b.dataset.del); reload(); } }));
  }
  async function quizBuilder(el, id) {
    const [zs, qs] = await Promise.all([T('quizzes').list(), T('questions').list(`?quiz_id=${id}`)]);
    const quiz = zs.find((x) => x.id == id);
    if (!quiz) throw new Error('الاختبار غير موجود.');
    const qCard = (q, i) => {
      const opts = q ? JSON.parse(q.options) : ['', '', '', ''];
      while (opts.length < 4) opts.push('');
      return `<form class="q-edit" data-id="${q?.id || ''}"><div class="row between"><span class="row"><span class="qn" style="display:inline-grid;place-items:center;min-width:32px;height:32px;border-radius:9px;background:var(--shu);color:#fff;font-weight:700">${i + 1}</span><b>السؤال</b></span>
          <span class="row"><label class="small">الدرجة <input class="input" name="points" type="number" min="1" value="${q?.points || 1}" style="width:70px;padding:.3rem .5rem"></label>
          ${q ? `<button type="button" class="icon-btn del" data-delq="${q.id}">${ic('trash')} حذف</button>` : ''}</span></div>
        <div class="field" style="margin:.6rem 0"><textarea name="text" placeholder="نص السؤال" required style="min-height:60px">${esc(q?.text || '')}</textarea></div>
        <div class="small muted">الاختيارات — حدّد الإجابة الصحيحة:</div>
        ${opts.map((o, oi) => `<div class="opt"><input type="radio" name="correct" value="${oi}" ${(q?.correct_index ?? 0) === oi ? 'checked' : ''} aria-label="الإجابة الصحيحة"><input class="input" name="opt" value="${esc(o)}" placeholder="الاختيار ${oi + 1}"></div>`).join('')}
        <div class="field" style="margin:.6rem 0 0"><input class="input" name="explanation" value="${esc(q?.explanation || '')}" placeholder="شرح يظهر بعد التسليم (اختياري)"></div>
        <div class="row end" style="margin-top:.6rem"><button class="btn sm ${q ? 'ghost' : 'shu'}">${q ? 'حفظ' : 'إضافة السؤال'}</button></div></form>`;
    };
    el.innerHTML = `<a href="#/admin/courses/${quiz.course_id}" class="back">${ic('prev')} العودة للكورس</a>
      ${head(typeName(quiz.type), esc(quiz.title), `<button class="btn ghost sm" id="editz">${ic('edit')} الإعدادات</button><button class="btn danger sm" id="delz">${ic('trash')} حذف</button>`)}
      <p class="muted">${quiz.duration_min} دقيقة · النجاح ${quiz.pass_score}% · ${quiz.max_attempts || 'محاولات غير محدودة'}${quiz.max_attempts ? ' محاولات' : ''} · ${qs.length} سؤال</p>
      ${qs.map(qCard).join('')}<h3 style="margin-top:2rem">إضافة سؤال</h3>${qCard(null, qs.length)}`;
    $$('form.q-edit', el).forEach((f) => f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const options = $$('[name=opt]', f).map((i) => i.value.trim());
      const ci = +(f.correct.value || 0);
      if (!options[ci]) return toast('لا يمكن أن تكون الإجابة الصحيحة فارغة.');
      const body = { quiz_id: id, text: f.text.value, options: JSON.stringify(options.filter(Boolean)), correct_index: options.slice(0, ci).filter(Boolean).length, points: +f.points.value || 1, explanation: f.explanation.value, sort: qs.length };
      if (f.dataset.id) { delete body.sort; await T('questions').update(f.dataset.id, body); toast('تم الحفظ', true); } else { await T('questions').create(body); toast('تمت إضافة السؤال', true); reload(); }
    }));
    $$('[data-delq]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('حذف هذا السؤال؟')) { await T('questions').remove(b.dataset.delq); reload(); } }));
    $('#editz').onclick = () => formModal('إعدادات الاختبار', quizFields, quiz, async (d) => { await T('quizzes').update(id, d); reload(); });
    $('#delz').onclick = async () => { if (await confirmBox('حذف هذا الاختبار وكل المحاولات؟')) { await T('quizzes').remove(id); location.hash = `/admin/courses/${quiz.course_id}`; } };
  }

  /* ----- students ----- */
  async function students(el, id, params) {
    if (id) return studentDetail(el, id);
    const q = params.get('q') || '';
    const list = await api('/admin/students?q=' + encodeURIComponent(q));
    el.innerHTML = `${head('الطلاب', 'الطلاب', `<form id="s" class="row"><input class="input" name="q" value="${esc(q)}" placeholder="ابحث بالاسم أو البريد أو الموبايل" style="width:260px"><button class="btn sm">${ic('search')} بحث</button></form>`)}
      <div class="card table-wrap"><table class="tbl"><tr><th>الاسم</th><th>الموبايل</th><th>الصف</th><th>الكورسات</th><th>المتوسط</th><th>الرصيد</th><th>تاريخ التسجيل</th></tr>
      ${list.map((u) => `<tr style="cursor:pointer" data-go="${u.id}"><td><b>${esc(u.name)}</b>${u.blocked ? ' <span class="tag shu">محظور</span>' : ''}<br><span class="small muted ltr">${esc(u.email)}</span></td>
        <td><span class="ltr">${esc(u.phone)}</span><br><span class="small muted">ولي الأمر: <span class="ltr">${esc(u.parent_phone || '—')}</span></span></td><td class="small">${esc(u.grade || '')}</td><td>${u.courses}</td>
        <td>${u.avg == null ? '—' : u.avg + '%'}</td><td>${egp(u.balance)}</td><td class="small">${fmtDate(u.created_at)}</td></tr>`).join('')}</table>
      ${!list.length ? `<div class="empty"><div class="ei">${ic('users')}</div>لا يوجد طلاب.</div>` : ''}</div>`;
    $('#s').onsubmit = (e) => { e.preventDefault(); location.hash = '/admin/students?q=' + encodeURIComponent(e.target.q.value); };
    $$('[data-go]', el).forEach((r) => (r.onclick = () => (location.hash = '/admin/students/' + r.dataset.go)));
  }
  async function studentDetail(el, id) {
    const [u, courses] = await Promise.all([api('/admin/students/' + id), api('/admin/courses')]);
    el.innerHTML = `<a href="#/admin/students" class="back">${ic('prev')} كل الطلاب</a>
      ${head(esc(u.grade || 'طالب'), esc(u.name), `<button class="btn ghost sm" id="bal">${ic('wallet')} تعديل الرصيد</button><button class="btn ghost sm" id="enr">${ic('plus')} اشتراك</button><button class="btn ghost sm" id="rv">${ic('repeat')} تصفير المشاهدات</button><button class="btn danger sm" id="blk">${u.blocked ? 'إلغاء الحظر' : 'حظر'}</button>`)}
      <div class="grid g4" style="margin-bottom:1.5rem">${[['wallet', egp(u.balance), 'الرصيد'], ['book', u.courses.length, 'الكورسات'], ['quiz', u.attempts.length, 'محاولات الامتحانات'], ['user', `<span class="ltr">${esc(u.phone)}</span>`, `ولي الأمر: ${esc(u.parent_phone || '—')}`]]
        .map(([k, v, l]) => `<div class="card kpi"><div class="v" style="font-size:1.35rem">${v}</div><div class="l">${l}</div><span class="kic">${ic(k)}</span></div>`).join('')}</div>
      <div class="grid g2" style="align-items:start">
        <div class="card"><h3>الكورسات والتقدّم</h3>${u.courses.map((c) => `<div style="padding:.6rem 0;border-bottom:1px solid var(--line)"><div class="row between"><b>${esc(c.title)}</b><span class="row small">${c.percent}% <button class="icon-btn del" data-unenroll="${c.id}" aria-label="إلغاء الاشتراك">${ic('x')}</button></span></div><div class="progress" style="margin-top:.4rem"><i data-w="${c.percent}"></i></div></div>`).join('') || '<p class="muted">غير مشترك في أي كورس.</p>'}</div>
        <div class="card"><h3>نتائج الامتحانات</h3><table class="tbl">${u.attempts.map((a) => `<tr><td>${esc(a.title)}</td><td><b>${a.score}/${a.total}</b></td><td class="small">${fmtDate(a.created_at)}</td></tr>`).join('') || '<tr><td class="muted">لا توجد محاولات.</td></tr>'}</table></div>
        <div class="card"><h3>مشاهدات الفيديو</h3><table class="tbl">${u.views.map((v) => `<tr><td>${esc(v.title)}</td><td>${v.views}${v.max_views ? '/' + v.max_views : ''}</td><td>${v.completed ? '<span class="tag green">مكتمل</span>' : ''}</td></tr>`).join('') || '<tr><td class="muted">لا توجد مشاهدات بعد.</td></tr>'}</table></div>
        <div class="card"><h3>العمليات المالية</h3><table class="tbl">${u.transactions.map((t) => `<tr><td><span class="tag">${TX[t.type] || esc(t.type)}</span></td><td class="small">${esc(t.note || '')}</td><td><b class="ltr">${t.amount > 0 ? '+' : ''}${t.amount}</b></td></tr>`).join('') || '<tr><td class="muted">لا توجد عمليات.</td></tr>'}</table></div>
      </div>`;
    $('#bal').onclick = () => formModal('تعديل الرصيد', [{ k: 'amount', label: 'المبلغ بالجنيه (بالسالب للخصم)', type: 'number', required: true }, { k: 'note', label: 'ملاحظة', placeholder: 'دفع نقدي في السنتر' }], {}, async (d) => { await api(`/admin/students/${id}/balance`, { body: d }); reload(); });
    $('#enr').onclick = () => formModal('اشتراك مجاني في كورس', [{ k: 'course_id', label: 'الكورس', type: 'select', options: courses.map((c) => [c.id, c.title]) }], {}, async (d) => { await api(`/admin/students/${id}/enroll`, { body: d }); reload(); });
    $('#rv').onclick = async () => { await api(`/admin/students/${id}/reset-views`, { method: 'POST' }); toast('تم تصفير المشاهدات', true); reload(); };
    $('#blk').onclick = async () => { await api(`/admin/students/${id}/block`, { method: 'POST' }); reload(); };
    $$('[data-unenroll]', el).forEach((b) => (b.onclick = async () => { if (await confirmBox('إلغاء اشتراك الطالب في هذا الكورس؟', 'إلغاء الاشتراك')) { await api(`/admin/students/${id}/enroll/${b.dataset.unenroll}`, { method: 'DELETE' }); reload(); } }));
    animateIn(el);
  }

  /* ----- codes ----- */
  async function codes(el) {
    const list = await api('/admin/codes');
    el.innerHTML = `${head('الأكواد', 'أكواد الشحن', `<button class="btn shu sm" id="gen">${ic('plus')} إنشاء أكواد</button>`)}
      <p class="muted">بِع هذه الأكواد (نقدًا أو فودافون كاش أو إنستاباي). يشحن بها الطالب محفظته ليشتري الكورسات.</p>
      <div class="card table-wrap"><table class="tbl"><tr><th>الكود</th><th>القيمة</th><th>الحالة</th><th>تاريخ الإنشاء</th><th></th></tr>
      ${list.map((c) => `<tr><td><b class="code-list">${esc(c.code)}</b></td><td>${egp(c.amount)}</td><td>${c.used_by ? `<span class="tag">استخدمه ${esc(c.used_name || '؟')}</span>` : '<span class="tag green">متاح</span>'}</td>
        <td class="small">${fmtDate(c.created_at)}</td><td>${c.used_by ? '' : `<button class="icon-btn del" data-del="${esc(c.code)}" aria-label="حذف">${ic('trash')}</button>`}</td></tr>`).join('')}</table>
      ${!list.length ? `<div class="empty"><div class="ei">${ic('ticket')}</div>لا توجد أكواد بعد.</div>` : ''}</div>`;
    $('#gen').onclick = () => formModal('إنشاء أكواد', [{ k: 'count', label: 'العدد', type: 'number', default: 10 }, { k: 'amount', label: 'قيمة الكود (ج.م)', type: 'number', default: 100 }], {}, async (d) => {
      const r = await api('/admin/codes', { body: d });
      setTimeout(() => modal(`<h3>${r.codes.length} كود × ${egp(r.amount)}</h3><textarea class="input code-list" style="min-height:220px" readonly>${r.codes.join('\n')}</textarea>
        <div class="row end" style="margin-top:1rem"><button class="btn ghost sm" id="cp">${ic('copy')} نسخ الكل</button><button class="btn sm" data-close>تم</button></div>`,
      (m) => { $('#cp', m).onclick = () => { navigator.clipboard?.writeText(r.codes.join('\n')); toast('تم النسخ', true); }; $$('[data-close]', m).forEach((b) => b.addEventListener('click', reload)); }), 50);
    });
    $$('[data-del]', el).forEach((b) => (b.onclick = async () => { await api('/admin/codes/' + encodeURIComponent(b.dataset.del), { method: 'DELETE' }); reload(); }));
  }
})();
