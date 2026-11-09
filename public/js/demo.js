/* Static design-preview mode (GitHub Pages has no server).
   Active on *.github.io or with ?demo in the URL. Serves sample catalogue data;
   everything that needs the real server (login, lessons, exams, wallet) shows a notice. */
(() => {
  const on = /\.github\.io$/.test(location.hostname) || new URLSearchParams(location.search).has('demo');
  if (!on) return;
  document.documentElement.classList.add('demo');

  const categories = [
    { id: 1, name: 'First Secondary', grade: '1st Secondary', description: 'Foundations: measurement, motion & vectors.', kanji: '一', course_count: 1 },
    { id: 2, name: 'Second Secondary', grade: '2nd Secondary', description: 'Waves, sound, light, fluids & heat.', kanji: '二', course_count: 1 },
    { id: 3, name: 'Third Secondary', grade: '3rd Secondary', description: 'Electricity, magnetism & modern physics.', kanji: '三', course_count: 1 },
  ];
  const lesson = (id, chapter_id, title, m, free) => ({ id, chapter_id, title, duration_min: m, is_free: free ? 1 : 0, max_views: 3, views: 0, done: false });
  const courses = [
    { id: 1, category_id: 3, category: 'Third Secondary', title: "Electric Current & Ohm's Law", description: "Master current, resistance, Kirchhoff's laws and circuit problems — step by step.", price: 150, kanji: '電',
      chapters: [{ id: 1, title: 'Chapter 1 — Electric Current', lessons: [lesson(1, 1, 'Lesson 1 — Concepts', 45, true), lesson(2, 1, 'Lesson 2 — Solved Problems', 60)],
        quizzes: [{ id: 1, chapter_id: 1, title: 'Quiz — Electric Current', type: 'quiz', duration_min: 10, pass_score: 50, qcount: 3, best: null }] },
      { id: 2, title: "Chapter 2 — Kirchhoff's Laws", lessons: [lesson(3, 2, 'Lesson 1 — Concepts', 45), lesson(4, 2, 'Lesson 2 — Solved Problems', 60)], quizzes: [] }],
      exams: [{ id: 2, chapter_id: null, title: 'Final Exam — Current Electricity', type: 'exam', duration_min: 30, pass_score: 60, qcount: 20, best: null }] },
    { id: 2, category_id: 1, category: 'First Secondary', title: 'Motion in a Straight Line', description: 'Displacement, velocity, acceleration and the equations of motion with solved exams.', price: 120, kanji: '動',
      chapters: [{ id: 3, title: 'Chapter 1 — Describing Motion', lessons: [lesson(5, 3, 'Lesson 1 — Concepts', 45, true), lesson(6, 3, 'Lesson 2 — Solved Problems', 60)], quizzes: [] }], exams: [] },
    { id: 3, category_id: 2, category: 'Second Secondary', title: 'Waves & Sound', description: 'Wave properties, interference, resonance and the physics of sound.', price: 0, kanji: '波', chapters: [], exams: [] },
  ];
  const card = (c) => ({ ...c, enrolled: false, chapter_count: c.chapters.length, lesson_count: c.chapters.reduce((n, ch) => n + ch.lessons.length, 0) });
  const NOTICE = 'This is a design preview. Sign-up, lessons, exams and the wallet run on the full platform.';

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
      if (!c) throw new Error('Course not found.');
      const n = card(c).lesson_count;
      return { ...card(c), access: false, lessonCount: n, doneCount: 0, percent: 0 };
    }
    throw Object.assign(new Error(NOTICE), { status: 503 });
  };
})();
