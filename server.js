// Mr. Ahmed Alaa — Physics Learning Platform (物理道)
// Express + built-in node:sqlite. Run: npm start
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- secret for signing session tokens ----------
const SECRET_FILE = path.join(DATA_DIR, 'secret.key');
if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(48).toString('hex'));
const SECRET = process.env.SESSION_SECRET || fs.readFileSync(SECRET_FILE, 'utf8');

// ---------- database ----------
const db = new DatabaseSync(path.join(DATA_DIR, 'platform.db'));
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT UNIQUE NOT NULL,
  parent_phone TEXT, grade TEXT, password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student', balance INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, grade TEXT,
  description TEXT, kanji TEXT, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL, description TEXT, price INTEGER NOT NULL DEFAULT 0,
  kanji TEXT DEFAULT '力', published INTEGER NOT NULL DEFAULT 1, sort INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, video_url TEXT, attachment_url TEXT,
  duration_min INTEGER DEFAULT 0, is_free INTEGER NOT NULL DEFAULT 0,
  max_views INTEGER NOT NULL DEFAULT 0, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'quiz',
  duration_min INTEGER DEFAULT 15, pass_score INTEGER DEFAULT 50, max_attempts INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL, options TEXT NOT NULL, correct_index INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 1, explanation TEXT, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS enrollments (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  price_paid INTEGER DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, course_id)
);
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0, completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL, total INTEGER NOT NULL, answers TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS codes (
  code TEXT PRIMARY KEY, amount INTEGER NOT NULL,
  used_by INTEGER REFERENCES users(id) ON DELETE SET NULL, used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, type TEXT NOT NULL, note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const all = (sql, ...p) => db.prepare(sql).all(...p);
const one = (sql, ...p) => db.prepare(sql).get(...p);
const run = (sql, ...p) => db.prepare(sql).run(...p);
const tx = (fn) => { db.exec('BEGIN'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };

// ---------- passwords & tokens ----------
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}
function checkPassword(pw, stored) {
  const [salt, hash] = stored.split(':');
  const a = Buffer.from(hash, 'hex');
  const b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
function makeToken(id) { const v = `${id}.${Date.now() + 30 * 864e5}`; return `${v}.${sign(v)}`; }
function readToken(t) {
  if (!t) return null;
  const i = t.lastIndexOf('.');
  const v = t.slice(0, i), s = Buffer.from(t.slice(i + 1));
  const good = Buffer.from(sign(v));
  if (s.length !== good.length || !crypto.timingSafeEqual(s, good)) return null;
  const [id, exp] = v.split('.');
  return +exp > Date.now() ? +id : null;
}

// ---------- seed ----------
if (!one('SELECT id FROM users WHERE role = ?', 'admin')) {
  const email = process.env.ADMIN_EMAIL || 'admin@ahmedalaa.com';
  const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url'); // random unless set
  run('INSERT INTO users (name,email,phone,password_hash,role) VALUES (?,?,?,?,?)',
    'Mr. Ahmed Alaa', email, '01000000000', hashPassword(pw), 'admin');
  console.log(`\n  Admin created → ${email} / ${pw}  (change it after first login)\n`);
}
if (!one('SELECT id FROM categories')) {
  const cats = [
    ['First Secondary', '1st Secondary', 'Foundations: measurement, motion & vectors.', '一'],
    ['Second Secondary', '2nd Secondary', 'Waves, sound, light, fluids & heat.', '二'],
    ['Third Secondary', '3rd Secondary', 'Electricity, magnetism & modern physics.', '三'],
  ];
  cats.forEach((c, i) => run('INSERT INTO categories (name,grade,description,kanji,sort) VALUES (?,?,?,?,?)', ...c, i));
  const c1 = run('INSERT INTO courses (category_id,title,description,price,kanji) VALUES (?,?,?,?,?)',
    3, 'Electric Current & Ohm\'s Law', 'Master current, resistance, Kirchhoff\'s laws and circuit problems — step by step.', 150, '電').lastInsertRowid;
  const c2 = run('INSERT INTO courses (category_id,title,description,price,kanji) VALUES (?,?,?,?,?)',
    1, 'Motion in a Straight Line', 'Displacement, velocity, acceleration and the equations of motion with solved exams.', 120, '動').lastInsertRowid;
  run('INSERT INTO courses (category_id,title,description,price,kanji) VALUES (?,?,?,?,?)',
    2, 'Waves & Sound', 'Wave properties, interference, resonance and the physics of sound.', 0, '波');
  const chs = [[c1, 'Chapter 1 — Electric Current'], [c1, 'Chapter 2 — Kirchhoff\'s Laws'], [c2, 'Chapter 1 — Describing Motion']];
  chs.forEach(([cid, t], i) => {
    const ch = run('INSERT INTO chapters (course_id,title,sort) VALUES (?,?,?)', cid, t, i).lastInsertRowid;
    run('INSERT INTO lessons (chapter_id,title,description,duration_min,is_free,max_views,sort) VALUES (?,?,?,?,?,?,?)', ch, 'Lesson 1 — Concepts', 'Core ideas and definitions.', 45, i === 0 ? 1 : 0, 3, 0);
    run('INSERT INTO lessons (chapter_id,title,description,duration_min,is_free,max_views,sort) VALUES (?,?,?,?,?,?,?)', ch, 'Lesson 2 — Solved Problems', 'Exam-style problems solved on the board.', 60, 0, 3, 1);
  });
  const qz = run('INSERT INTO quizzes (course_id,chapter_id,title,type,duration_min,pass_score) VALUES (?,?,?,?,?,?)', c1, 1, 'Quiz — Electric Current', 'quiz', 10, 50).lastInsertRowid;
  [
    ['The SI unit of electric current is:', ['Volt', 'Ampere', 'Ohm', 'Coulomb'], 1, 'Current is measured in amperes (A) = C/s.'],
    ['A 12 V battery drives 3 A through a resistor. Its resistance is:', ['36 Ω', '4 Ω', '0.25 Ω', '15 Ω'], 1, 'R = V / I = 12 / 3 = 4 Ω.'],
    ['Doubling the length of a wire (same material & area) makes its resistance:', ['Half', 'Same', 'Double', 'Four times'], 2, 'R = ρL/A, so R ∝ L.'],
  ].forEach(([t, o, c, e], i) => run('INSERT INTO questions (quiz_id,text,options,correct_index,explanation,sort) VALUES (?,?,?,?,?,?)', qz, t, JSON.stringify(o), c, e, i));
  run('INSERT INTO quizzes (course_id,chapter_id,title,type,duration_min,pass_score,max_attempts) VALUES (?,?,?,?,?,?,?)', c1, null, 'Final Exam — Current Electricity', 'exam', 30, 60, 1);
}

// ---------- app ----------
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const USER_COLS = 'id,name,email,phone,parent_phone,grade,role,balance,blocked,created_at';
app.use((req, res, next) => {
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map((s) => s.trim().split('=')).filter((a) => a[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
  const id = readToken(cookies.token);
  req.user = id ? one(`SELECT ${USER_COLS} FROM users WHERE id = ?`, id) : null;
  if (req.user?.blocked) req.user = null;
  next();
});
const auth = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'Please log in first.' }));
const admin = (req, res, next) => (req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Admins only.' }));
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
function setSession(res, id) {
  res.setHeader('Set-Cookie', `token=${makeToken(id)}; HttpOnly; Path=/; Max-Age=${30 * 86400}; SameSite=Lax`);
}
const isEnrolled = (uid, cid) => !!one('SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?', uid, cid);
function hasAccess(user, course) {
  if (!user) return false;
  return user.role === 'admin' || course.price === 0 || isEnrolled(user.id, course.id);
}

// ---------- auth ----------
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, parent_phone, grade, password } = req.body || {};
  if (!name || !email || !phone || !password) return bad(res, 'Name, email, phone and password are required.');
  if (password.length < 6) return bad(res, 'Password must be at least 6 characters.');
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad(res, 'Enter a valid email.');
  if (one('SELECT id FROM users WHERE email=? OR phone=?', email.toLowerCase(), phone)) return bad(res, 'Email or phone already registered.');
  const id = run('INSERT INTO users (name,email,phone,parent_phone,grade,password_hash) VALUES (?,?,?,?,?,?)',
    name.trim(), email.toLowerCase().trim(), phone.trim(), parent_phone || null, grade || null, hashPassword(password)).lastInsertRowid;
  setSession(res, id);
  res.json(one(`SELECT ${USER_COLS} FROM users WHERE id=?`, id));
});
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body || {};
  const u = one('SELECT * FROM users WHERE email=? OR phone=?', String(login || '').toLowerCase().trim(), String(login || '').trim());
  if (!u || !checkPassword(password || '', u.password_hash)) return bad(res, 'Wrong email/phone or password.', 401);
  if (u.blocked) return bad(res, 'This account is suspended. Contact support.', 403);
  setSession(res, u.id);
  res.json(one(`SELECT ${USER_COLS} FROM users WHERE id=?`, u.id));
});
app.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  res.json({ ok: true });
});
app.get('/api/me', (req, res) => res.json(req.user));
app.put('/api/me', auth, (req, res) => {
  const { name, parent_phone, grade, password, current_password } = req.body || {};
  if (password) {
    const u = one('SELECT password_hash FROM users WHERE id=?', req.user.id);
    if (!checkPassword(current_password || '', u.password_hash)) return bad(res, 'Current password is wrong.');
    if (password.length < 6) return bad(res, 'Password must be at least 6 characters.');
    run('UPDATE users SET password_hash=? WHERE id=?', hashPassword(password), req.user.id);
  }
  run('UPDATE users SET name=COALESCE(?,name), parent_phone=COALESCE(?,parent_phone), grade=COALESCE(?,grade) WHERE id=?',
    name || null, parent_phone || null, grade || null, req.user.id);
  res.json(one(`SELECT ${USER_COLS} FROM users WHERE id=?`, req.user.id));
});

// ---------- catalog ----------
app.get('/api/public-stats', (req, res) => res.json({
  students: one("SELECT COUNT(*) n FROM users WHERE role='student'").n,
  courses: one('SELECT COUNT(*) n FROM courses WHERE published=1').n,
  lessons: one('SELECT COUNT(*) n FROM lessons').n,
  exams: one('SELECT COUNT(*) n FROM quizzes').n,
}));
app.get('/api/categories', (req, res) => res.json(all(
  'SELECT c.*, (SELECT COUNT(*) FROM courses WHERE category_id=c.id AND published=1) course_count FROM categories c ORDER BY sort,id')));
app.get('/api/courses', (req, res) => {
  const rows = all(`SELECT c.*, cat.name category,
      (SELECT COUNT(*) FROM lessons l JOIN chapters ch ON ch.id=l.chapter_id WHERE ch.course_id=c.id) lesson_count,
      (SELECT COUNT(*) FROM chapters WHERE course_id=c.id) chapter_count
    FROM courses c LEFT JOIN categories cat ON cat.id=c.category_id
    WHERE c.published=1 ${req.query.category ? 'AND c.category_id=?' : ''} ORDER BY c.sort, c.id DESC`,
    ...(req.query.category ? [req.query.category] : []));
  rows.forEach((r) => { r.enrolled = req.user ? isEnrolled(req.user.id, r.id) : false; });
  res.json(rows);
});

function courseOutline(course, user) {
  const chapters = all('SELECT * FROM chapters WHERE course_id=? ORDER BY sort,id', course.id);
  const lessons = all(`SELECT l.id,l.chapter_id,l.title,l.duration_min,l.is_free,l.max_views FROM lessons l
    JOIN chapters ch ON ch.id=l.chapter_id WHERE ch.course_id=? ORDER BY l.sort,l.id`, course.id);
  const quizzes = all(`SELECT id,chapter_id,title,type,duration_min,pass_score,max_attempts,
    (SELECT COUNT(*) FROM questions WHERE quiz_id=quizzes.id) qcount FROM quizzes WHERE course_id=? ORDER BY id`, course.id);
  const prog = new Map(), best = new Map();
  if (user) {
    all('SELECT lesson_id,views,completed FROM lesson_progress WHERE user_id=?', user.id).forEach((p) => prog.set(p.lesson_id, p));
    all('SELECT quiz_id, MAX(score*100/total) pct, COUNT(*) tries FROM attempts WHERE user_id=? GROUP BY quiz_id', user.id).forEach((a) => best.set(a.quiz_id, a));
  }
  const decorateQ = (z) => ({ ...z, best: best.get(z.id)?.pct ?? null, tries: best.get(z.id)?.tries ?? 0 });
  chapters.forEach((ch) => {
    ch.lessons = lessons.filter((l) => l.chapter_id === ch.id).map((l) => ({ ...l, views: prog.get(l.id)?.views || 0, done: !!prog.get(l.id)?.completed }));
    ch.quizzes = quizzes.filter((z) => z.chapter_id === ch.id).map(decorateQ);
  });
  const exams = quizzes.filter((z) => !z.chapter_id).map(decorateQ);
  const done = lessons.filter((l) => prog.get(l.id)?.completed).length;
  return { chapters, exams, lessonCount: lessons.length, doneCount: done, percent: lessons.length ? Math.round((done / lessons.length) * 100) : 0 };
}
app.get('/api/courses/:id', (req, res) => {
  const c = one('SELECT c.*, cat.name category FROM courses c LEFT JOIN categories cat ON cat.id=c.category_id WHERE c.id=?', req.params.id);
  if (!c || (!c.published && req.user?.role !== 'admin')) return bad(res, 'Course not found.', 404);
  res.json({ ...c, access: hasAccess(req.user, c), enrolled: req.user ? isEnrolled(req.user.id, c.id) : false, ...courseOutline(c, req.user) });
});
app.post('/api/courses/:id/enroll', auth, (req, res) => {
  const c = one('SELECT * FROM courses WHERE id=? AND published=1', req.params.id);
  if (!c) return bad(res, 'Course not found.', 404);
  if (isEnrolled(req.user.id, c.id)) return res.json({ ok: true, balance: req.user.balance });
  if (req.user.balance < c.price) return bad(res, `Not enough balance. You need ${c.price - req.user.balance} EGP more — recharge your wallet.`, 402);
  tx(() => {
    run('UPDATE users SET balance=balance-? WHERE id=?', c.price, req.user.id);
    run('INSERT INTO enrollments (user_id,course_id,price_paid) VALUES (?,?,?)', req.user.id, c.id, c.price);
    if (c.price) run('INSERT INTO transactions (user_id,amount,type,note) VALUES (?,?,?,?)', req.user.id, -c.price, 'purchase', c.title);
  });
  res.json({ ok: true, balance: one('SELECT balance FROM users WHERE id=?', req.user.id).balance });
});

// ---------- lessons ----------
app.get('/api/lessons/:id', (req, res) => {
  const l = one('SELECT l.*, ch.course_id, ch.title chapter_title FROM lessons l JOIN chapters ch ON ch.id=l.chapter_id WHERE l.id=?', req.params.id);
  if (!l) return bad(res, 'Lesson not found.', 404);
  const course = one('SELECT * FROM courses WHERE id=?', l.course_id);
  if (!req.user) return bad(res, 'Please log in to watch lessons.', 401);
  if (!l.is_free && !hasAccess(req.user, course)) return bad(res, 'Enroll in this course to unlock the lesson.', 403);
  let p = one('SELECT * FROM lesson_progress WHERE user_id=? AND lesson_id=?', req.user.id, l.id);
  if (req.user.role !== 'admin') {
    if (l.max_views && p && p.views >= l.max_views) return bad(res, `You used all ${l.max_views} views for this lesson. Ask Mr. Ahmed to reset them.`, 403);
    run(`INSERT INTO lesson_progress (user_id,lesson_id,views) VALUES (?,?,1)
      ON CONFLICT(user_id,lesson_id) DO UPDATE SET views=views+1, updated_at=datetime('now')`, req.user.id, l.id);
    p = one('SELECT * FROM lesson_progress WHERE user_id=? AND lesson_id=?', req.user.id, l.id);
  }
  res.json({ ...l, course: { id: course.id, title: course.title }, views: p?.views || 0, completed: !!p?.completed,
    watermark: `${req.user.name} · ${req.user.phone}`, outline: courseOutline(course, req.user) });
});
app.post('/api/lessons/:id/complete', auth, (req, res) => {
  run(`INSERT INTO lesson_progress (user_id,lesson_id,completed) VALUES (?,?,1)
    ON CONFLICT(user_id,lesson_id) DO UPDATE SET completed=1, updated_at=datetime('now')`, req.user.id, req.params.id);
  res.json({ ok: true });
});

// ---------- quizzes ----------
function loadQuiz(req, res) {
  const z = one('SELECT * FROM quizzes WHERE id=?', req.params.id);
  if (!z) { bad(res, 'Exam not found.', 404); return null; }
  const course = one('SELECT * FROM courses WHERE id=?', z.course_id);
  if (!hasAccess(req.user, course)) { bad(res, 'Enroll in the course to take this exam.', 403); return null; }
  z.course = { id: course.id, title: course.title };
  z.tries = one('SELECT COUNT(*) n FROM attempts WHERE user_id=? AND quiz_id=?', req.user.id, z.id).n;
  return z;
}
app.get('/api/quizzes/:id', auth, (req, res) => {
  const z = loadQuiz(req, res); if (!z) return;
  z.questions = all('SELECT id,text,options,points FROM questions WHERE quiz_id=? ORDER BY sort,id', z.id).map((q) => ({ ...q, options: JSON.parse(q.options) }));
  z.attempts = all('SELECT id,score,total,created_at FROM attempts WHERE user_id=? AND quiz_id=? ORDER BY id DESC', req.user.id, z.id);
  res.json(z);
});
app.post('/api/quizzes/:id/submit', auth, (req, res) => {
  const z = loadQuiz(req, res); if (!z) return;
  if (req.user.role !== 'admin' && z.max_attempts && z.tries >= z.max_attempts) return bad(res, 'No attempts left for this exam.', 403);
  const answers = req.body?.answers || {};
  const qs = all('SELECT * FROM questions WHERE quiz_id=? ORDER BY sort,id', z.id);
  let score = 0, total = 0;
  const review = qs.map((q) => {
    total += q.points;
    const chosen = answers[q.id] ?? null;
    const ok = chosen !== null && +chosen === q.correct_index;
    if (ok) score += q.points;
    return { id: q.id, text: q.text, options: JSON.parse(q.options), chosen, correct: q.correct_index, ok, explanation: q.explanation };
  });
  run('INSERT INTO attempts (user_id,quiz_id,score,total,answers) VALUES (?,?,?,?,?)', req.user.id, z.id, score, total || 1, JSON.stringify(answers));
  const pct = total ? Math.round((score / total) * 100) : 0;
  res.json({ score, total, pct, passed: pct >= z.pass_score, review });
});

// ---------- wallet & progress ----------
app.get('/api/wallet', auth, (req, res) => res.json({
  balance: req.user.balance,
  transactions: all('SELECT * FROM transactions WHERE user_id=? ORDER BY id DESC LIMIT 50', req.user.id),
}));
app.post('/api/wallet/redeem', auth, (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const c = one('SELECT * FROM codes WHERE code=?', code);
  if (!c) return bad(res, 'Invalid code.');
  if (c.used_by) return bad(res, 'This code was already used.');
  tx(() => {
    run("UPDATE codes SET used_by=?, used_at=datetime('now') WHERE code=?", req.user.id, code);
    run('UPDATE users SET balance=balance+? WHERE id=?', c.amount, req.user.id);
    run('INSERT INTO transactions (user_id,amount,type,note) VALUES (?,?,?,?)', req.user.id, c.amount, 'recharge', `Code ${code}`);
  });
  res.json({ ok: true, amount: c.amount, balance: one('SELECT balance FROM users WHERE id=?', req.user.id).balance });
});
app.get('/api/progress', auth, (req, res) => {
  const courses = all(`SELECT c.id,c.title,c.kanji,cat.name category FROM enrollments e JOIN courses c ON c.id=e.course_id
    LEFT JOIN categories cat ON cat.id=c.category_id WHERE e.user_id=? ORDER BY e.created_at DESC`, req.user.id)
    .map((c) => { const o = courseOutline(c, req.user); return { ...c, percent: o.percent, lessonCount: o.lessonCount, doneCount: o.doneCount }; });
  const attempts = all(`SELECT a.*, z.title quiz, z.pass_score, c.title course FROM attempts a JOIN quizzes z ON z.id=a.quiz_id
    JOIN courses c ON c.id=z.course_id WHERE a.user_id=? ORDER BY a.id DESC LIMIT 20`, req.user.id);
  const watched = one('SELECT COUNT(*) n FROM lesson_progress WHERE user_id=? AND completed=1', req.user.id).n;
  const avg = one('SELECT AVG(score*100.0/total) a FROM attempts WHERE user_id=?', req.user.id).a;
  const last = one(`SELECT l.id,l.title FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=? ORDER BY p.updated_at DESC LIMIT 1`, req.user.id);
  res.json({ courses, attempts, watched, avgScore: avg == null ? null : Math.round(avg), lastLesson: last || null, balance: req.user.balance });
});

// ---------- admin: generic CRUD ----------
const TABLES = {
  categories: ['name', 'grade', 'description', 'kanji', 'sort'],
  courses: ['category_id', 'title', 'description', 'price', 'kanji', 'published', 'sort'],
  chapters: ['course_id', 'title', 'sort'],
  lessons: ['chapter_id', 'title', 'description', 'video_url', 'attachment_url', 'duration_min', 'is_free', 'max_views', 'sort'],
  quizzes: ['course_id', 'chapter_id', 'title', 'type', 'duration_min', 'pass_score', 'max_attempts'],
  questions: ['quiz_id', 'text', 'options', 'correct_index', 'points', 'explanation', 'sort'],
};
const clean = (v) => (v === '' || v === undefined ? null : typeof v === 'boolean' ? +v : Array.isArray(v) ? JSON.stringify(v) : v);
app.get('/api/admin/t/:table', admin, (req, res) => {
  const f = TABLES[req.params.table]; if (!f) return bad(res, 'Unknown table', 404);
  const keys = Object.keys(req.query).filter((k) => f.includes(k));
  res.json(all(`SELECT * FROM ${req.params.table} ${keys.length ? 'WHERE ' + keys.map((k) => `${k}=?`).join(' AND ') : ''} ORDER BY ${f.includes('sort') ? 'sort,' : ''}id`, ...keys.map((k) => req.query[k])));
});
app.post('/api/admin/t/:table', admin, (req, res) => {
  const f = TABLES[req.params.table]; if (!f) return bad(res, 'Unknown table', 404);
  const keys = f.filter((k) => k in req.body);
  const id = run(`INSERT INTO ${req.params.table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, ...keys.map((k) => clean(req.body[k]))).lastInsertRowid;
  res.json(one(`SELECT * FROM ${req.params.table} WHERE id=?`, id));
});
app.put('/api/admin/t/:table/:id', admin, (req, res) => {
  const f = TABLES[req.params.table]; if (!f) return bad(res, 'Unknown table', 404);
  const keys = f.filter((k) => k in req.body);
  if (keys.length) run(`UPDATE ${req.params.table} SET ${keys.map((k) => `${k}=?`).join(',')} WHERE id=?`, ...keys.map((k) => clean(req.body[k])), req.params.id);
  res.json(one(`SELECT * FROM ${req.params.table} WHERE id=?`, req.params.id));
});
app.delete('/api/admin/t/:table/:id', admin, (req, res) => {
  if (!TABLES[req.params.table]) return bad(res, 'Unknown table', 404);
  run(`DELETE FROM ${req.params.table} WHERE id=?`, req.params.id);
  res.json({ ok: true });
});
app.get('/api/admin/courses', admin, (req, res) => res.json(all(`SELECT c.*, cat.name category,
  (SELECT COUNT(*) FROM enrollments WHERE course_id=c.id) students FROM courses c LEFT JOIN categories cat ON cat.id=c.category_id ORDER BY c.sort, c.id DESC`)));
app.get('/api/admin/courses/:id/tree', admin, (req, res) => {
  const chapters = all('SELECT * FROM chapters WHERE course_id=? ORDER BY sort,id', req.params.id);
  chapters.forEach((ch) => { ch.lessons = all('SELECT * FROM lessons WHERE chapter_id=? ORDER BY sort,id', ch.id); });
  const quizzes = all('SELECT z.*, (SELECT COUNT(*) FROM questions WHERE quiz_id=z.id) qcount FROM quizzes z WHERE course_id=? ORDER BY id', req.params.id);
  res.json({ course: one('SELECT * FROM courses WHERE id=?', req.params.id), chapters, quizzes });
});

// ---------- admin: stats ----------
app.get('/api/admin/stats', admin, (req, res) => {
  const n = (sql, ...p) => one(sql, ...p).n;
  res.json({
    students: n("SELECT COUNT(*) n FROM users WHERE role='student'"),
    newStudents7: n("SELECT COUNT(*) n FROM users WHERE role='student' AND created_at >= datetime('now','-7 days')"),
    courses: n('SELECT COUNT(*) n FROM courses'),
    lessons: n('SELECT COUNT(*) n FROM lessons'),
    quizzes: n('SELECT COUNT(*) n FROM quizzes'),
    enrollments: n('SELECT COUNT(*) n FROM enrollments'),
    revenue: n("SELECT COALESCE(SUM(-amount),0) n FROM transactions WHERE type='purchase'"),
    recharged: n("SELECT COALESCE(SUM(amount),0) n FROM transactions WHERE type='recharge'"),
    codesUnused: n('SELECT COUNT(*) n FROM codes WHERE used_by IS NULL'),
    avgScore: Math.round(one('SELECT AVG(score*100.0/total) a FROM attempts').a || 0),
    attemptsCount: n('SELECT COUNT(*) n FROM attempts'),
    views: n('SELECT COALESCE(SUM(views),0) n FROM lesson_progress'),
    signups: all(`SELECT date(created_at) d, COUNT(*) n FROM users WHERE role='student' AND created_at >= date('now','-13 days') GROUP BY d`),
    sales: all(`SELECT date(created_at) d, SUM(-amount) n FROM transactions WHERE type='purchase' AND created_at >= date('now','-13 days') GROUP BY d`),
    topCourses: all(`SELECT c.title, COUNT(e.user_id) n FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id GROUP BY c.id ORDER BY n DESC LIMIT 5`),
    recentAttempts: all(`SELECT a.score,a.total,a.created_at,u.name,z.title FROM attempts a JOIN users u ON u.id=a.user_id JOIN quizzes z ON z.id=a.quiz_id ORDER BY a.id DESC LIMIT 8`),
  });
});

// ---------- admin: students ----------
app.get('/api/admin/students', admin, (req, res) => {
  const s = `%${req.query.q || ''}%`;
  res.json(all(`SELECT ${USER_COLS},
    (SELECT COUNT(*) FROM enrollments WHERE user_id=u.id) courses,
    (SELECT ROUND(AVG(score*100.0/total)) FROM attempts WHERE user_id=u.id) avg
    FROM users u WHERE role='student' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?) ORDER BY id DESC LIMIT 300`, s, s, s));
});
app.get('/api/admin/students/:id', admin, (req, res) => {
  const u = one(`SELECT ${USER_COLS} FROM users WHERE id=?`, req.params.id);
  if (!u) return bad(res, 'Not found', 404);
  const courses = all('SELECT c.* FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=?', u.id)
    .map((c) => ({ id: c.id, title: c.title, percent: courseOutline(c, u).percent }));
  res.json({ ...u, courses,
    attempts: all('SELECT a.*, z.title FROM attempts a JOIN quizzes z ON z.id=a.quiz_id WHERE a.user_id=? ORDER BY a.id DESC', u.id),
    transactions: all('SELECT * FROM transactions WHERE user_id=? ORDER BY id DESC', u.id),
    views: all('SELECT p.*, l.title, l.max_views FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=? ORDER BY p.updated_at DESC', u.id) });
});
app.post('/api/admin/students/:id/balance', admin, (req, res) => {
  const amount = parseInt(req.body?.amount, 10);
  if (!amount) return bad(res, 'Enter an amount.');
  tx(() => {
    run('UPDATE users SET balance=MAX(0,balance+?) WHERE id=?', amount, req.params.id);
    run('INSERT INTO transactions (user_id,amount,type,note) VALUES (?,?,?,?)', req.params.id, amount, 'admin', req.body.note || 'Manual adjustment');
  });
  res.json({ ok: true });
});
app.post('/api/admin/students/:id/enroll', admin, (req, res) => {
  run('INSERT OR IGNORE INTO enrollments (user_id,course_id,price_paid) VALUES (?,?,0)', req.params.id, req.body.course_id);
  res.json({ ok: true });
});
app.delete('/api/admin/students/:id/enroll/:cid', admin, (req, res) => {
  run('DELETE FROM enrollments WHERE user_id=? AND course_id=?', req.params.id, req.params.cid);
  res.json({ ok: true });
});
app.post('/api/admin/students/:id/block', admin, (req, res) => {
  run("UPDATE users SET blocked=1-blocked WHERE id=? AND role='student'", req.params.id);
  res.json({ ok: true });
});
app.post('/api/admin/students/:id/reset-views', admin, (req, res) => {
  run('UPDATE lesson_progress SET views=0 WHERE user_id=?', req.params.id);
  res.json({ ok: true });
});

// ---------- admin: recharge codes ----------
app.get('/api/admin/codes', admin, (req, res) => res.json(all(
  'SELECT c.*, u.name used_name FROM codes c LEFT JOIN users u ON u.id=c.used_by ORDER BY c.created_at DESC, c.code LIMIT 500')));
app.post('/api/admin/codes', admin, (req, res) => {
  const count = Math.min(500, Math.max(1, parseInt(req.body?.count, 10) || 1));
  const amount = parseInt(req.body?.amount, 10);
  if (!amount || amount < 1) return bad(res, 'Enter a valid amount.');
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const gen = () => 'AA-' + [4, 4].map((len) => Array.from(crypto.randomBytes(len), (b) => A[b % A.length]).join('')).join('-');
  const made = [];
  tx(() => { while (made.length < count) { const c = gen(); if (!one('SELECT 1 FROM codes WHERE code=?', c)) { run('INSERT INTO codes (code,amount) VALUES (?,?)', c, amount); made.push(c); } } });
  res.json({ codes: made, amount });
});
app.delete('/api/admin/codes/:code', admin, (req, res) => {
  run('DELETE FROM codes WHERE code=? AND used_by IS NULL', req.params.code);
  res.json({ ok: true });
});

app.use('/api', (req, res) => bad(res, 'Not found', 404));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message?.includes('UNIQUE') ? 'That value already exists.' : 'Server error.' });
});

app.listen(PORT, () => console.log(`  物理道 Physics platform → http://localhost:${PORT}`));
