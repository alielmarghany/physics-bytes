/* Data layer: every page talks to Supabase through api(path, opts).
   Reads of public catalogue data use database functions; anything involving money, access,
   video links or exam answers runs inside the database (Supabase functions with row-level security). */
const SUPABASE_URL = 'https://wybzfkltiodglsstrkur.supabase.co';
// Public "anon" key: safe to ship in the browser — row-level security decides what each user can do.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5Ynpma2x0aW9kZ2xzc3Rya3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3Njk5NTksImV4cCI6MjExMDM0NTk1OX0.fv7wGf1_kMXU-jKIghw67-dh46hrdtejonfcXWqVtuM';

const SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const apiError = (e, status) => Object.assign(new Error(tErr(String(e?.message || e || 'Something went wrong. Please try again.'))), { status: status || e?.status });
async function rpc(fn, args) {
  const { data, error } = await SB.rpc(fn, args);
  if (error) throw apiError(error);
  return data;
}
async function q(promise) {
  const { data, error } = await promise;
  if (error) throw apiError(error);
  return data;
}
const BOOL_FIELDS = ['published', 'is_free'];
function cleanRow(body) {
  const out = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (v === undefined) continue;
    if (BOOL_FIELDS.includes(k)) out[k] = !!+v;
    else if (k === 'options' && typeof v === 'string') out[k] = JSON.parse(v);
    else out[k] = v === '' ? null : v;
  }
  return out;
}

async function currentUserId() {
  const { data } = await SB.auth.getSession();
  return data.session?.user?.id || null;
}
async function loadMe() {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await SB.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error || !data) return null;
  if (data.blocked) { await SB.auth.signOut(); throw apiError('This account is suspended. Contact support.', 403); }
  return data;
}

async function api(path, opts = {}) {
  const method = (opts.method || (opts.body ? 'POST' : 'GET')).toUpperCase();
  const body = opts.body || {};
  const [p, qs] = path.split('?');
  const query = new URLSearchParams(qs || '');
  let m;

  /* ----- auth & profile ----- */
  if (p === '/me' && method === 'GET') return loadMe();
  if (p === '/me' && method === 'PUT') {
    const uid = await currentUserId();
    if (body.password) {
      if (body.password.length < 6) throw apiError('Password must be at least 6 characters.');
      const me = await loadMe();
      const check = await SB.auth.signInWithPassword({ email: me.email, password: body.current_password || '' });
      if (check.error) throw apiError('Current password is wrong.');
      const { error } = await SB.auth.updateUser({ password: body.password });
      if (error) throw apiError(error);
    }
    const patch = cleanRow({ name: body.name, parent_phone: body.parent_phone, grade: body.grade });
    await q(SB.from('profiles').update(patch).eq('id', uid));
    return loadMe();
  }
  if (p === '/auth/register') {
    const { name, email, phone, parent_phone, grade, password } = body;
    if (!name || !email || !phone || !password) throw apiError('Name, email, phone and password are required.');
    if (password.length < 6) throw apiError('Password must be at least 6 characters.');
    const { data, error } = await SB.auth.signUp({
      email: email.trim().toLowerCase(), password,
      options: { data: { name: name.trim(), phone: phone.trim(), parent_phone: parent_phone || null, grade: grade || null }, emailRedirectTo: location.origin + location.pathname },
    });
    if (error) throw apiError(/registered|exists/i.test(error.message) ? 'Email or phone already registered.' : error);
    if (!data.session) return { needsConfirm: true };
    return loadMe();
  }
  if (p === '/auth/login') {
    const { error } = await SB.auth.signInWithPassword({ email: String(body.login || '').trim().toLowerCase(), password: body.password || '' });
    if (error) throw apiError(/confirm/i.test(error.message) ? 'Please confirm your email first — check your inbox.' : 'Wrong email/phone or password.', 401);
    return loadMe();
  }
  if (p === '/auth/logout') { await SB.auth.signOut(); return { ok: true }; }

  /* ----- catalogue ----- */
  if (p === '/public-stats') return rpc('public_stats');
  if (p === '/categories') return rpc('list_categories');
  if (p === '/courses') return rpc('list_courses', { p_cat: query.get('category') ? +query.get('category') : null });
  if (p === '/my-courses') return rpc('list_courses', { p_mine: true });
  if (p === '/favorites') return rpc('list_courses', { p_fav: true });
  if ((m = p.match(/^\/courses\/(\d+)$/))) return rpc('course_detail', { cid: +m[1] });
  if ((m = p.match(/^\/courses\/(\d+)\/enroll$/))) return rpc('enroll', { cid: +m[1] });
  if ((m = p.match(/^\/courses\/(\d+)\/favorite$/))) return rpc('toggle_favorite', { cid: +m[1] });
  if ((m = p.match(/^\/courses\/(\d+)\/request$/))) {
    if (method === 'DELETE') return rpc('cancel_enrollment_request', { cid: +m[1] });
    if (method === 'GET') return rpc('my_request_status', { cid: +m[1] });
    return rpc('request_enrollment', { cid: +m[1], p_note: body.note || null });
  }

  /* ----- learning ----- */
  if ((m = p.match(/^\/items\/(\d+)$/))) return rpc('open_item', { iid: +m[1] });
  if ((m = p.match(/^\/items\/(\d+)\/complete$/))) return rpc('complete_item', { iid: +m[1] });
  if ((m = p.match(/^\/quizzes\/(\d+)$/))) return rpc('quiz_detail', { qid: +m[1] });
  if ((m = p.match(/^\/quizzes\/(\d+)\/submit$/))) return rpc('submit_quiz', { qid: +m[1], answers: body.answers || {} });
  if (p === '/progress') return rpc('student_dashboard');
  if (p === '/wallet') {
    const me = await loadMe();
    const transactions = await q(SB.from('transactions').select('*').eq('user_id', me.id).order('id', { ascending: false }).limit(50));
    return { balance: me.balance, transactions };
  }
  if (p === '/wallet/redeem') return rpc('redeem_code', { p_code: body.code });

  /* ----- admin ----- */
  if (p === '/admin/stats') return rpc('admin_stats');
  if (p === '/admin/pending') return rpc('admin_pending_requests');
  if (p === '/admin/requests') return rpc('admin_requests', { p_status: query.get('status') === 'all' ? null : (query.get('status') || 'pending') });
  if ((m = p.match(/^\/admin\/requests\/(\d+)\/(approve|reject)$/))) return rpc('admin_decide_request', { rid: +m[1], approve: m[2] === 'approve' });
  if (p === '/admin/courses') return rpc('admin_courses');
  if ((m = p.match(/^\/admin\/courses\/(\d+)\/tree$/))) return rpc('admin_course_tree', { cid: +m[1] });
  if ((m = p.match(/^\/admin\/questions\/(\d+)$/))) return rpc('admin_questions', { qid: +m[1] });
  if ((m = p.match(/^\/admin\/t\/(\w+)(?:\/(\d+))?$/))) {
    const [, table, id] = m;
    if (method === 'GET') {
      let sel = SB.from(table).select('*');
      for (const [k, v] of query.entries()) sel = sel.eq(k, v);
      return q(sel.order('id'));
    }
    if (method === 'POST') { const rows = await q(SB.from(table).insert(cleanRow(body)).select('id')); return rows[0]; }
    if (method === 'PUT') { await q(SB.from(table).update(cleanRow(body)).eq('id', id)); return { id: +id }; }
    if (method === 'DELETE') { await q(SB.from(table).delete().eq('id', id)); return { ok: true }; }
  }
  if (p === '/admin/students') return rpc('admin_students', { q: query.get('q') || '' });
  if ((m = p.match(/^\/admin\/students\/([\w-]+)$/))) return rpc('admin_student', { uid: m[1] });
  if ((m = p.match(/^\/admin\/students\/([\w-]+)\/balance$/))) return rpc('admin_adjust_balance', { uid: m[1], amt: parseInt(body.amount, 10) || 0, note: body.note || null });
  if ((m = p.match(/^\/admin\/students\/([\w-]+)\/enroll$/))) return rpc('admin_enroll', { uid: m[1], cid: +body.course_id });
  if ((m = p.match(/^\/admin\/students\/([\w-]+)\/enroll\/(\d+)$/))) return rpc('admin_unenroll', { uid: m[1], cid: +m[2] });
  if ((m = p.match(/^\/admin\/students\/([\w-]+)\/block$/))) return rpc('admin_toggle_block', { uid: m[1] });
  if ((m = p.match(/^\/admin\/students\/([\w-]+)\/reset-views$/))) return rpc('admin_reset_views', { uid: m[1] });
  if (p === '/admin/codes' && method === 'GET') {
    const rows = await q(SB.from('codes').select('*, profiles(name)').order('created_at', { ascending: false }).limit(500));
    return rows.map((r) => ({ ...r, used_name: r.profiles?.name }));
  }
  if (p === '/admin/codes' && method === 'POST') return rpc('generate_codes', { n: parseInt(body.count, 10) || 1, amt: parseInt(body.amount, 10) || 0 });
  if ((m = p.match(/^\/admin\/codes\/(.+)$/)) && method === 'DELETE') { await q(SB.from('codes').delete().eq('code', decodeURIComponent(m[1]))); return { ok: true }; }

  throw apiError('Not found', 404);
}
