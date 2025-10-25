// server/routes/users.js
// Example Express router to return user's encryption salt.
// Adjust DB access according to your project (this is a minimal example).

const express = require('express');
const router = express.Router();

// Example using sqlite3 (async) or better-sqlite3 (sync).
// Replace the db code below with your existing DB access layer.

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/database.sqlite'); // adjust path

// GET /api/users/:id/salt
router.get('/:id/salt', (req, res) => {
  const userId = req.params.id;
  // Basic check: ensure caller is allowed to read this salt
  const requesterId = req.header('x-user-id');
  if (!requesterId || requesterId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sql = `SELECT salt_enc FROM users WHERE id = ? LIMIT 1`;
  db.get(sql, [userId], (err, row) => {
    if (err) {
      console.error('DB error fetching salt:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!row) return res.status(404).json({ error: 'User not found' });
    // salt_enc should already be stored as base64 on registration
    return res.json({ saltEnc: row.salt_enc });
  });
});

module.exports = router;
