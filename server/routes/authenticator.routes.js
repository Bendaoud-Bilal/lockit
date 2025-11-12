import { Router } from "express";
import {
  saveTotp,
  getAllTotps,
  getTotpByCredentialId,
  deleteTotpEntry,
  getCredentials,
  updateState,
  getTotpId
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
 * @desc    Gets the vault's credentials
 * @access  Private
 */
router.get("/credentials", getCredentials);

/**
 * @route   GET /api/totp
 * @desc    Gets all the user's TOTP
 * @access  Private
 */
router.get("/", getAllTotps);

/**
 * @route   GET /api/totp/:id
 * @desc    Gets a totp infos by using the id of the related credential
 * @access  Private
 */
router.get("/:id", getTotpByCredentialId);

/**
 * @route   DELETE /api/totp/:id
 * @desc    Deletes a TOTP
 * @access  Private
 */
router.delete("/:id", deleteTotpEntry);

/**
 * @route   Patch /api/totp/:id/state
 * @desc    set totp state to "active" OR "archived"
 * @access  Private
 */
router.patch("/:id/state",updateState);


/**
 * @route   GET /api/totp/by-credential/:id
 * @desc    get TOTP ID related to the credentials with the given id
 * @access  Private
 */
router.get("/by-credential/:credentialId",getTotpId);


export default router;