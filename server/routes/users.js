// server/routes/users.js - ES6 VERSION
import express from 'express';
import requireAuth from '../middleware/auth.js';
import prisma from '../prisma/client.js'; // Use centralized client

const router = express.Router();

// GET /api/users/:id/salt
router.get('/:id/salt', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    
    // Security check: ensure user can only access their own salt
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        salt: true,
        vaultSalt: true, // If you use separate vault salt
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the salt (already base64 encoded in DB)
    res.json({ 
      saltEnc: user.salt || user.vaultSalt // Adjust based on schema
    });

  } catch (err) {
    console.error('Error fetching user salt:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id/profile
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        lastLogin: true,
        // Don't select sensitive fields like masterPasswordHash, salt, etc.
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;