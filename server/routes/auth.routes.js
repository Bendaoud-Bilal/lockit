import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import {
  validateSignup,
  validateLogin,
  validateResetPassword,
} from "../middleware/validation.js";

const router = express.Router();

router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);
router.post("/verify-recovery-key", authController.verifyRecoveryKey);
router.post(
  "/reset-password",
  validateResetPassword,
  authController.resetPassword
);
router.post("/logout", authenticate, authController.logout);

export default router;
