# Physics Bytes — Eng. Ahmed Alaa

Online physics platform: courses organised as **units → lessons → items** (videos, files, audio), quizzes & exams, wallet + recharge codes, a student area with progress tracking, and an admin dashboard. English by default with an Arabic (RTL) option.

## How it works

- `public/` is a static site (no build step). It is published to GitHub Pages on every push to `main` (`.github/workflows/pages.yml`).
- All data, logins, payments and exam marking live in **Supabase** (project "Physics Bytes"). The browser talks to it with the public anon key in `public/js/api.js`; row-level security and database functions decide what each user may see or do:
  - video/file links are only returned by `open_item()` to enrolled students (or for free previews), which also enforces the view limit;
  - exam answers are never sent to the browser — `submit_quiz()` marks them;
  - buying (`enroll()`), redeeming codes (`redeem_code()`) and every admin action run inside the database.

## Run locally

```bash
npm install
npm start          # http://localhost:3000
```

## Supabase settings to check (Dashboard → Authentication)

- **URL Configuration → Site URL**: `https://alielmarghany.github.io/physics-bytes/` and add `http://localhost:3000` under Redirect URLs, so email-confirmation links open the site.
- **Sign In / Providers → Email → Confirm email**: on (students confirm their email) or off (they can log in straight away).

## Making the teacher an admin

Sign up on the site with the teacher's email, then run in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'teacher@example.com';
```

Admin pages (`#/admin`): overview stats, courses (units, lessons, items), categories, quiz builder, students (balance, free enrolment, reset views, block) and recharge codes.

## Videos and files

Each item takes a link: YouTube (use **Unlisted**), Vimeo (domain-restricted recommended), Google Drive, a direct `.mp4`/`.pdf`/`.mp3`. The video player shows a moving watermark with the student's name and phone.

## Payments

Wallet model: the teacher sells recharge codes (cash / Vodafone Cash / InstaPay), students redeem them, then buy courses with their balance.
