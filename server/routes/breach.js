import express from 'express';
import requireAuth from '../middleware/auth.js';
import { listBreachAlertsForUser, getBreachAlert } from '../services/breachService.js';
import {
  checkUserBreaches,
  toggleBreachResolved,
  toggleBreachDismissed,
} from '../services/breachDetectionService.js';

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

router.post('/users/:id/check-breaches', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (userId !== req.userId) return res.status(403).json({ error: 'forbidden' });

    const result = await checkUserBreaches(userId);
    res.json({
      newBreaches: result.newBreaches,
      totalBreaches: result.totalBreaches,
      userId: result.userId,
    });
  } catch (err) {
    console.error('Error checking breaches for user:', err);
    if (typeof err?.message === 'string' && err.message.toLowerCase().includes('rate limit')) {
      return res.status(429).json({ error: 'rate_limit' });
    }
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

router.patch('/breach-alerts/:id/toggle-resolved', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await toggleBreachResolved(id, req.userId);
    res.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error('Error toggling breach resolved:', err);
    if (err.message === 'Breach alert not found') {
      return res.status(404).json({ error: 'not_found' });
    }
    if (err.message === 'Unauthorized') {
      return res.status(403).json({ error: 'forbidden' });
    }
    res.status(500).json({ error: 'internal_error' });
  }
});

router.patch('/breach-alerts/:id/toggle-dismissed', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await toggleBreachDismissed(id, req.userId);
    res.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error('Error toggling breach dismissed:', err);
    if (err.message === 'Breach alert not found') {
      return res.status(404).json({ error: 'not_found' });
    }
    if (err.message === 'Unauthorized') {
      return res.status(403).json({ error: 'forbidden' });
    }
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;