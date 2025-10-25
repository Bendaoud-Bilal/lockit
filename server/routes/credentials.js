
// server/routes/credentials.js
import express from 'express';
import requireAuth from '../middleware/auth.js'; // Make sure this path is correct
import { PrismaClient } from '@prisma/client';     // Make sure this path is correct

const router = express.Router();
const prisma = new PrismaClient();

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const select = {
      id: true,
      userId: true,
      title: true,
      icon: true,
      category: true,
      favorite: true,
      passwordStrength: true,
      passwordReused: true,
      compromised: true,
      has2fa: true,
      passwordLastChanged: true,
      createdAt: true,
      updatedAt: true,
      dataEnc: true,
      dataIv: true,
      dataAuthTag: true,
    };
    const item = await prisma.credential.findUnique({ where: { id }, select });
    if (!item) return res.status(404).json({ error: 'not_found' });
    if (item.userId !== req.userId) return res.status(403).json({ error: 'forbidden' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;