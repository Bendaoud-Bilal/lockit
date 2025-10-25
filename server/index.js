import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes (we'll convert them to ES6)
import securityRoutes from './routes/security.js';
import passwordCardsRoutes from './routes/passwordCards.js';
import breachRoutes from './routes/breach.js';
import credentialsRoutes from './routes/credentials.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Lockit Server is running' });
});

// API Routes
app.use('/api', securityRoutes);
app.use('/api', passwordCardsRoutes);
app.use('/api', breachRoutes);
app.use('/api/credentials', credentialsRoutes);

// Start server
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});