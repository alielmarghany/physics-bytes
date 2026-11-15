// Physics Bytes — local preview server.
// The site is fully static: data, logins, payments and exams live in Supabase
// (database functions + row-level security). This only serves public/ for local testing: npm start
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.listen(PORT, () => console.log(`  Physics Bytes → http://localhost:${PORT}`));
