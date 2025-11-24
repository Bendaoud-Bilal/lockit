import express from 'express';
import requireAuth from '../middleware/auth.js';
import { computeSecurityScore } from '../services/securityScoreService.js';

const router = express.Router();

router.get('/users/:id/security-score', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (userId !== req.userId) return res.status(403).json({ error: 'forbidden' });
    const result = await computeSecurityScore(userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;