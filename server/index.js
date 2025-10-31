import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { deletePass } from './controllers/vault/GestionPass.js';
import vaultRoutes from './routes/Vault.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL ;

// Middleware
app.use(cors({origin: CLIENT_URL, credentials: true}));
// Increase payload size limit for file attachments (encrypted files can be larger)
// 100MB limit to handle multiple large encrypted attachments
// Each 10MB file becomes ~13MB after Base64 encoding
// 5 files × 13MB = ~65MB, so 100MB provides safe headroom
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Routes de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Lockit Server is running' });
});

app.delete('/delete-password/:userId/:id', deletePass)

app.use('/api/vault', vaultRoutes);

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});