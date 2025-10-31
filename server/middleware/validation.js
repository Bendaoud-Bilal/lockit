import { ApiError } from "../utils/ApiError.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
const RECOVERY_KEY_REGEX = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function validateSignup(req, res, next) {
  try {
    const { username, email, masterPassword, recoveryKey } = req.body;

    // Validate username
    if (!username || !USERNAME_REGEX.test(username)) {
      throw new ApiError(
        400,
        "Invalid username. Must be 3-20 characters, alphanumeric, underscore or dash only."
      );
    }

    // Validate email
    if (email && !EMAIL_REGEX.test(email)) {
      throw new ApiError(400, "Invalid email address");
    }

    // Validate master password
    if (!masterPassword || masterPassword.length < 16) {
      throw new ApiError(400, "Master password must be at least 16 characters");
    }

    if (!/[A-Z]/.test(masterPassword)) {
      throw new ApiError(
        400,
        "Master password must contain at least one uppercase letter"
      );
    }

    if (!/[a-z]/.test(masterPassword)) {
      throw new ApiError(
        400,
        "Master password must contain at least one lowercase letter"
      );
    }

    if (!/[0-9]/.test(masterPassword)) {
      throw new ApiError(
        400,
        "Master password must contain at least one number"
      );
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(masterPassword)) {
      throw new ApiError(
        400,
        "Master password must contain at least one special character"
      );
    }

    // Validate recovery key format
    if (!recoveryKey || !RECOVERY_KEY_REGEX.test(recoveryKey)) {
      throw new ApiError(
        400,
        "Invalid recovery key format. Must be XXXX-XXXX-XXXX-XXXX"
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function validateLogin(req, res, next) {
  try {
    const { usernameOrEmail, masterPassword } = req.body;

    if (!usernameOrEmail || !masterPassword) {
      throw new ApiError(400, "Username/email and password are required");
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function validateResetPassword(req, res, next) {
  try {
    const { usernameOrEmail, recoveryKey, newPassword } = req.body;

    if (!usernameOrEmail) {
      throw new ApiError(400, "Username or email is required");
    }

    if (!recoveryKey || !RECOVERY_KEY_REGEX.test(recoveryKey)) {
      throw new ApiError(400, "Invalid recovery key format");
    }

    if (!newPassword || newPassword.length < 16) {
      throw new ApiError(400, "New password must be at least 16 characters");
    }

    // Validate new password strength
    if (
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    ) {
      throw new ApiError(
        400,
        "Password must contain uppercase, lowercase, number, and special character"
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}
