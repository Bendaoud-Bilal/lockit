import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../prisma/client.js';

const router = express.Router();

// Create a new send
router.post('/', authenticate, async (req, res) => {
  try {
    const { id, name, type, passwordProtected, encryptedPackage } = req.body;
    const userId = req.user.id;

    if (!id || !name || !type || !encryptedPackage) {
      return res.status(400).json({ 
        error: 'Missing required fields: id, name, type, encryptedPackage' 
      });
    }

    // Check for duplicate send name for this user
    const existingSend = await prisma.send.findFirst({
      where: {
        userId,
        name
      }
    });

    if (existingSend) {
      return res.status(409).json({ 
        error: 'A send with this name already exists. Please use a different name.' 
      });
    }

    const send = await prisma.send.create({
      data: {
        id,
        userId,
        name,
        type,
        passwordProtected: passwordProtected || false,
        encryptedPackage: JSON.stringify(encryptedPackage),
        createdAt: new Date()
      }
    });

    res.status(201).json({ 
      success: true,
      send: {
        ...send,
        encryptedPackage: JSON.parse(send.encryptedPackage)
      }
    });
  } catch (error) {
    console.error('Create send error:', error);
    
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'A send with this name already exists. Please use a different name.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create send' });
  }
});

// Get all sends for a user
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const sends = await prisma.send.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ 
      sends: sends.map(send => ({
        ...send,
        encryptedPackage: JSON.parse(send.encryptedPackage)
      }))
    });
  } catch (error) {
    console.error('Get sends error:', error);
    res.status(500).json({ error: 'Failed to fetch sends' });
  }
});

// Get a specific send by ID (no auth required for sharing)
router.get('/:sendId', async (req, res) => {
  try {
    const { sendId } = req.params;

    const send = await prisma.send.findUnique({
      where: { id: sendId }
    });

    if (!send) {
      return res.status(404).json({ error: 'Send not found' });
    }

    res.json({ 
      send: {
        ...send,
        encryptedPackage: JSON.parse(send.encryptedPackage)
      }
    });
  } catch (error) {
    console.error('Get send by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch send' });
  }
});

// Delete a send
router.delete('/:sendId', authenticate, async (req, res) => {
  try {
    const { sendId } = req.params;
    const userId = req.user.id;

    const send = await prisma.send.findUnique({
      where: { id: sendId }
    });

    if (!send) {
      return res.status(404).json({ error: 'Send not found' });
    }

    if (send.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.send.delete({
      where: { id: sendId }
    });

    res.json({ success: true, message: 'Send deleted successfully' });
  } catch (error) {
    console.error('Delete send error:', error);
    res.status(500).json({ error: 'Failed to delete send' });
  }
});

export default router;