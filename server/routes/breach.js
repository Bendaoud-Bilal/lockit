import express from 'express';
import requireAuth from '../middleware/auth.js';
import { listBreachAlertsForUser, getBreachAlert } from '../services/breachService.js';
import {
  checkUserBreaches,
  toggleBreachResolved,
  toggleBreachDismissed,
} from '../services/breachDetectionService.js';

const router = express.Router();

/**
 * Lists breach alerts tied to the authenticated user.
 * - Verifies path ownership before retrieving items from the service layer.
 * - Returns a trimmed payload used in the dashboard breach panel.
 */
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

/**
 * Triggers a Have I Been Pwned sync for the requesting user.
 * - Rejects unauthorized calls and handles upstream rate limit responses.
 * - Returns summary counts so the dashboard can provide feedback.
 */
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

/**
 * Fetches detail for a specific breach alert when needed.
 * - Confirms the alert exists and belongs to the authenticated user.
 * - Supplies the alert payload for follow-up UI flows if required.
 */
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

/**
 * Toggles an alert between pending and resolved states.
 * - Delegates to the detection service which enforces ownership checks.
 * - Returns the new status so the client can sync without refetching.
 */
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

/**
 * Switches an alert between dismissed and active states.
 * - Calls the detection service helper and handles common error responses.
 * - Responds with the updated status for optimistic UI updates.
 */
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