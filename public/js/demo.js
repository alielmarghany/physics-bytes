/* Static preview mode (GitHub Pages has no server).
   Active on *.github.io or with ?demo in the URL. Serves sample catalogue data in the current language;
   everything that needs the real server (login, lessons, exams, wallet) shows a notice. */
(() => {
  const on = /\.github\.io$/.test(location.hostname) || new URLSearchParams(location.search).has('demo');
  if (!on) return;
  document.documentElement.classList.add('demo');
  const L = (en, ar) => (LANG === 'ar' ? ar : en);

  const categories = () => [
    { id: 1, name: L('First Secondary', 'الصف الأول الثانوي'), description: L('Foundations: measurement, motion & vectors.', 'الأساسيات: القياس والحركة والمتجهات.'), course_count: 1 },
    { id: 2, name: L('Second Secondary', 'الصف الثاني الثانوي'), description: L('Waves, sound, light, fluids & heat.', 'الموجات والصوت والضوء والموائع والحرارة.'), course_count: 1 },
    { id: 3, name: L('Third Secondary', 'الصف الثالث الثانوي'), description: L('Electricity, magnetism & modern physics.', 'الكهربية والمغناطيسية والفيزياء الحديثة.'), course_count: 1 },
  ];
  const lesson = (id, chapter_id, n, m, free) => ({ id, chapter_id, title: n === 1 ? L('Lesson 1 — Concepts', 'الدرس الأول — المفاهيم') : L('Lesson 2 — Solved Problems', 'الدرس الثاني — مسائل محلولة'), duration_min: m, is_free: free ? 1 : 0, max_views: 3, views: 0, done: false });
  const courses = () => [
    { id: 1, category_id: 3, category: L('Third Secondary', 'الصف الثالث الثانوي'), title: L("Electric Current & Ohm's Law", 'التيار الكهربي وقانون أوم'),
      description: L("Master current, resistance, Kirchhoff's laws and circuit problems — step by step.", 'افهم التيار والمقاومة وقانوني كيرشوف ومسائل الدوائر — خطوة بخطوة.'), price: 150, kanji: 'bolt',
      chapters: [{ id: 1, title: L('Chapter 1 — Electric Current', 'الفصل الأول — التيار الكهربي'), lessons: [lesson(1, 1, 1, 45, true), lesson(2, 1, 2, 60)],
        quizzes: [{ id: 1, chapter_id: 1, title: L('Quiz — Electric Current', 'اختبار — التيار الكهربي'), type: 'quiz', duration_min: 10, pass_score: 50, qcount: 3, best: null }] },
      { id: 2, title: L("Chapter 2 — Kirchhoff's Laws", 'الفصل الثاني — قانونا كيرشوف'), lessons: [lesson(3, 2, 1, 45), lesson(4, 2, 2, 60)], quizzes: [] }],
      exams: [{ id: 2, chapter_id: null, title: L('Final Exam — Current Electricity', 'الامتحان النهائي — الكهربية التيارية'), type: 'exam', duration_min: 30, pass_score: 60, qcount: 20, best: null }] },
    { id: 2, category_id: 1, category: L('First Secondary', 'الصف الأول الثانوي'), title: L('Motion in a Straight Line', 'الحركة في خط مستقيم'),
      description: L('Displacement, velocity, acceleration and the equations of motion with solved exams.', 'الإزاحة والسرعة والعجلة ومعادلات الحركة مع امتحانات محلولة.'), price: 120, kanji: 'pendulum',
      chapters: [{ id: 3, title: L('Chapter 1 — Describing Motion', 'الفصل الأول — وصف الحركة'), lessons: [lesson(5, 3, 1, 45, true), lesson(6, 3, 2, 60)], quizzes: [] }], exams: [] },
    { id: 3, category_id: 2, category: L('Second Secondary', 'الصف الثاني الثانوي'), title: L('Waves & Sound', 'الموجات والصوت'),
      description: L('Wave properties, interference, resonance and the physics of sound.', 'خصائص الموجات والتداخل والرنين وفيزياء الصوت.'), price: 0, kanji: 'wave', chapters: [], exams: [] },
  ];
  const card = (c) => ({ ...c, enrolled: false, chapter_count: c.chapters.length, lesson_count: c.chapters.reduce((n, ch) => n + ch.lessons.length, 0) });
  const NOTICE = 'This is a design preview. Sign-up, lessons, exams and the wallet run on the full platform.';

  window.DEMO_API = async (path) => {
    const [p, qs] = path.split('?');
    const q = new URLSearchParams(qs || '');
    if (p === '/me') return null;
    if (p === '/public-stats') return null;
    if (p === '/categories') return categories();
    if (p === '/courses') return courses().filter((c) => !q.get('category') || String(c.category_id) === q.get('category')).map(card);
    const m = p.match(/^\/courses\/(\d+)$/);
    if (m) {
      const c = courses().find((x) => x.id === +m[1]);
      if (!c) throw new Error(tErr('Course not found.'));
      const n = card(c).lesson_count;
      return { ...card(c), access: false, lessonCount: n, doneCount: 0, percent: 0 };
    }
    throw Object.assign(new Error(tErr(NOTICE)), { status: 503 });
  };
})();
