import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma/client.js'; 

// Import routes
import securityRoutes from './routes/security.js';
import passwordCardsRoutes from './routes/passwordCards.js';
import breachRoutes from './routes/breach.js';
import credentialsRoutes from './routes/credentials.js'; 
import usersRoutes from './routes/users.js'; // ✅ ADD THIS

dotenv.config();

const app = express();
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
app.use('/api/users', usersRoutes); // ✅ ADD THIS

// Start server
async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    await prisma.$disconnect().catch(e => console.error('Failed to disconnect Prisma:', e)); 
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔌 Shutting down server...');
  await prisma.$disconnect();
  console.log('🚪 Prisma disconnected.');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  prisma.$disconnect().finally(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  prisma.$disconnect().finally(() => process.exit(1));
});