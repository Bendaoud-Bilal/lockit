import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vaultRoutes from './routes/Vault.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL ;

// Middleware
app.use(cors({origin: CLIENT_URL, credentials: true}));
app.use(express.json());

// Routes de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Lockit Server is running' });
});

app.use('/api/vault', vaultRoutes);

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});