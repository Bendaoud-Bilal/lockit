import express from 'express';
import requireAuth from '../middleware/auth.js';
import { getPasswordCards, getCardDetails } from '../services/passwordCardsService.js';

const router = express.Router();

/**
 * Delivers the password card aggregates for the authenticated user.
 * - Validates that the requester matches the path parameter via middleware.
 * - Invokes the card service to compute categorized counts.
 */
router.get('/users/:id/password-cards', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (userId !== req.userId) return res.status(403).json({ error: 'forbidden' });
    const data = await getPasswordCards(userId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * Returns the credential list that backs a specific password risk card.
 * - Ensures the caller is authenticated and owns the requested data.
 * - Delegates to the service layer for the filtered credential query.
 */
router.get('/password-cards/:cardId/details', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { cardId } = req.params;
    const items = await getCardDetails(userId, cardId);
    res.json({ cardId, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;