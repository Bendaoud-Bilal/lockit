import { Router } from 'express';
import {
  addCredential,
  getCredentials,
  getCredentialById,
  updateCredential,
  deleteCredential,
  toggleFavorite,
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  getVaultStats,
} from '../controllers/vault.js';
import {
  addAttachment,
  getAttachments,
  getAttachmentById,
  deleteAttachment,
} from '../controllers/attachment.js';

const router = Router();

// ============================================
// CREDENTIAL ROUTES
// ============================================

// Get all credentials for a user
router.get('/credentials/user/:userId', getCredentials);

// Get single credential by ID
router.get('/credentials/:id', getCredentialById);

// Create new credential
router.post('/credentials', addCredential);

// Update credential
router.put('/credentials/:id', updateCredential);

// Delete credential (soft delete by default, ?permanent=true for hard delete)
router.delete('/credentials/:id', deleteCredential);

// Toggle favorite status
router.patch('/credentials/:id/favorite', toggleFavorite);

// ============================================
// FOLDER ROUTES
// ============================================

// Get all folders for a user
router.get('/folders/user/:userId', getFolders);

// Create new folder
router.post('/folders', createFolder);

// Update folder
router.put('/folders/:id', updateFolder);

// Delete folder
router.delete('/folders/:id', deleteFolder);

// ============================================
// STATISTICS ROUTES
// ============================================

// Get vault statistics for a user
router.get('/stats/:userId', getVaultStats);

// ============================================
// ATTACHMENT ROUTES
// ============================================

// Get all attachments for a credential
router.get('/attachments/credential/:credentialId', getAttachments);

// Get single attachment by ID
router.get('/attachments/:id', getAttachmentById);

// Create new attachment
router.post('/attachments', addAttachment);

// Delete attachment
router.delete('/attachments/:id', deleteAttachment);

// ============================================
// TEST ROUTE
// ============================================

// Route de test pour le Vault
router.get('/status', (req, res) => {
  res.json({ status: 'Vault is operational' });
});

export default router;