// server/app.js (or index.js) — example skeleton
const express = require('express');
const app = express();
const path = require('path');

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes BEFORE static client files or SPA fallback
const credentialsRouter = require('./routes/credentials');
app.use('/api/credentials', credentialsRouter);

// other API routers
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);
// add other routers (password-cards, etc) here

// static client (if you serve react build)
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// SPA fallback (keep after API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

// start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));
