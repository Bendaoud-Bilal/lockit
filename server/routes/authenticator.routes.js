import { Router } from "express";
import {
  saveTotp,
  getAllTotps,
   getTotpByCredentialId,
  deleteTotpEntry,
  getCredentials,
} from "../controllers/authenticatorController.js";

import { authenticate } from "../middleware/auth.js";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @route   POST /api/totp
 * @desc    Sauvegarde un nouveau secret TOTP
 * @access  Private
 * @body    {credentialId, secret, serviceName, accountName, issuer?}
 */
router.post("/", saveTotp);

/**
 * @route   GET /api/totp/credentials
 * @desc    Récupère les credentials du vault
 * @access  Private
 */
router.get("/credentials", getCredentials);

/**
 * @route   GET /api/totp
 * @desc    Récupère tous les TOTP de l'utilisateur
 * @access  Private
 */
router.get("/", getAllTotps);

/**
 * @route   GET /api/totp/:id
 * @desc    Récupère un TOTP avec le secret déchiffré
 * @access  Private
 */
router.get("/:id", getTotpByCredentialId);

/**
 * @route   DELETE /api/totp/:id
 * @desc    Supprime un TOTP
 * @access  Private
 */
router.delete("/:id", deleteTotpEntry);

export default router;