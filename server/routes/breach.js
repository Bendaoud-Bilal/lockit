import express from 'express';
import requireAuth from '../middleware/auth.js';
import { listBreachAlertsForUser, getBreachAlert } from '../services/breachService.js';

const router = express.Router();

router.get('/users/:id/breach-alerts', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (userId !== req.userId) return res.status(403).json({ error: 'forbidden' });
    const items = await listBreachAlertsForUser(userId);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/breach-alerts/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await getBreachAlert(id);
    if (!item) return res.status(404).json({ error: 'not_found' });
    if (item.userId !== req.userId) return res.status(403).json({ error: 'forbidden' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;