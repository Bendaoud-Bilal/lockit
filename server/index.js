import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { deletePass } from './controllers/vault/GestionPass.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Lockit Server is running' });
});

app.delete('/delete-password/:userId/:id', deletePass)


// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});