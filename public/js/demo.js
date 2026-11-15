/* Static preview mode (GitHub Pages has no server).
   Active on *.github.io or with ?demo in the URL. Serves sample catalogue data;
   everything that needs the real server (login, lessons, exams, wallet) shows a notice. */
(() => {
  const on = /\.github\.io$/.test(location.hostname) || new URLSearchParams(location.search).has('demo');
  if (!on) return;
  document.documentElement.classList.add('demo');

  const categories = [
    { id: 1, name: 'الصف الأول الثانوي', grade: 'الصف الأول الثانوي', description: 'الأساسيات: القياس والحركة والمتجهات.', course_count: 1 },
    { id: 2, name: 'الصف الثاني الثانوي', grade: 'الصف الثاني الثانوي', description: 'الموجات والصوت والضوء والموائع والحرارة.', course_count: 1 },
    { id: 3, name: 'الصف الثالث الثانوي', grade: 'الصف الثالث الثانوي', description: 'الكهربية والمغناطيسية والفيزياء الحديثة.', course_count: 1 },
  ];
  const lesson = (id, chapter_id, title, m, free) => ({ id, chapter_id, title, duration_min: m, is_free: free ? 1 : 0, max_views: 3, views: 0, done: false });
  const courses = [
    { id: 1, category_id: 3, category: 'الصف الثالث الثانوي', title: 'التيار الكهربي وقانون أوم', description: 'افهم التيار والمقاومة وقانوني كيرشوف ومسائل الدوائر — خطوة بخطوة.', price: 150, kanji: 'bolt',
      chapters: [{ id: 1, title: 'الفصل الأول — التيار الكهربي', lessons: [lesson(1, 1, 'الدرس الأول — المفاهيم', 45, true), lesson(2, 1, 'الدرس الثاني — مسائل محلولة', 60)],
        quizzes: [{ id: 1, chapter_id: 1, title: 'اختبار — التيار الكهربي', type: 'quiz', duration_min: 10, pass_score: 50, qcount: 3, best: null }] },
      { id: 2, title: 'الفصل الثاني — قانونا كيرشوف', lessons: [lesson(3, 2, 'الدرس الأول — المفاهيم', 45), lesson(4, 2, 'الدرس الثاني — مسائل محلولة', 60)], quizzes: [] }],
      exams: [{ id: 2, chapter_id: null, title: 'الامتحان النهائي — الكهربية التيارية', type: 'exam', duration_min: 30, pass_score: 60, qcount: 20, best: null }] },
    { id: 2, category_id: 1, category: 'الصف الأول الثانوي', title: 'الحركة في خط مستقيم', description: 'الإزاحة والسرعة والعجلة ومعادلات الحركة مع امتحانات محلولة.', price: 120, kanji: 'pendulum',
      chapters: [{ id: 3, title: 'الفصل الأول — وصف الحركة', lessons: [lesson(5, 3, 'الدرس الأول — المفاهيم', 45, true), lesson(6, 3, 'الدرس الثاني — مسائل محلولة', 60)], quizzes: [] }], exams: [] },
    { id: 3, category_id: 2, category: 'الصف الثاني الثانوي', title: 'الموجات والصوت', description: 'خصائص الموجات والتداخل والرنين وفيزياء الصوت.', price: 0, kanji: 'wave', chapters: [], exams: [] },
  ];
  const card = (c) => ({ ...c, enrolled: false, chapter_count: c.chapters.length, lesson_count: c.chapters.reduce((n, ch) => n + ch.lessons.length, 0) });
  const NOTICE = 'هذه نسخة عرض للتصميم. التسجيل والدروس والامتحانات والمحفظة تعمل على المنصة الكاملة.';

  window.DEMO_API = async (path) => {
    const [p, qs] = path.split('?');
    const q = new URLSearchParams(qs || '');
    if (p === '/me') return null;
    if (p === '/public-stats') return null;
    if (p === '/categories') return categories;
    if (p === '/courses') return courses.filter((c) => !q.get('category') || String(c.category_id) === q.get('category')).map(card);
    const m = p.match(/^\/courses\/(\d+)$/);
    if (m) {
      const c = courses.find((x) => x.id === +m[1]);
      if (!c) throw new Error('الكورس غير موجود.');
      const n = card(c).lesson_count;
      return { ...card(c), access: false, lessonCount: n, doneCount: 0, percent: 0 };
    }
    throw Object.assign(new Error(NOTICE), { status: 503 });
  };
})();
