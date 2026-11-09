# 物理道 — Mr. Ahmed Alaa Physics Platform

Online physics platform: video lessons by chapter, quizzes & exams, wallet + recharge codes, progress tracking, and an admin dashboard.

## Run

```bash
npm install
npm start          # http://localhost:3000
```

Requires Node 22.13+ (uses the built-in `node:sqlite`). Data lives in `data/platform.db`. Delete the `data/` folder to reset to sample content.

## Admin

First start creates an admin account:

- Email: `admin@ahmedalaa.com`
- Password: `sensei-2026`

Override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars before the first start. Change it after logging in (Profile page).

Admin pages (`#/admin`):

| Tab | What it does |
|---|---|
| Overview | Students, sales, enrollments, views, 14-day charts, top courses, latest exam attempts |
| Courses & videos | Create courses → chapters → lessons (video link, free preview, max views, notes PDF) |
| Categories | Grades/years (1st, 2nd, 3rd Secondary…) |
| Quizzes & exams | Quiz builder: questions, 4 options, correct answer, points, explanation, timer, pass mark, attempt limit |
| Students | Search, see progress/scores/views, adjust balance, free enroll, reset views, block |
| Recharge codes | Generate codes (e.g. 50 × 100 EGP) to sell; students redeem them in their wallet |

## Videos

Paste a link per lesson: YouTube (use **Unlisted**), Vimeo (domain-restricted recommended), Google Drive, or a direct `.mp4`. The player shows a moving watermark with the student's name and phone.

## Payments

Wallet model: the teacher sells recharge codes (cash / Vodafone Cash / InstaPay), students redeem them, then buy courses with their balance. An online gateway (Paymob, Fawry) can be added later to top up the wallet automatically.


## GitHub Pages preview

Every push to `main` publishes `public/` to GitHub Pages as a **design preview** with sample courses (`.github/workflows/pages.yml`). Pages can't run the Node server, so sign-up, lessons, exams and the wallet show a notice there. Preview the same mode locally at `http://localhost:3000/?demo`.
