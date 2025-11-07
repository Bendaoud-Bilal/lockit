import express from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.patch("/:userId", authenticate, userController.updateProfile);
router.post(
  "/:userId/change-password",
  authenticate,
  userController.changeMasterPassword
);
router.patch("/:userId/last-login", userController.updateLastLogin);
router.post(
  "/:userId/recovery-key",
  authenticate,
  userController.generateRecoveryKey
);
router.get(
  "/:userId/recovery-keys",
  authenticate,
  userController.getRecoveryKeys
);

export default router;
