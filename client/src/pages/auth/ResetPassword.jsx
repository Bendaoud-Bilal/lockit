import React, { useState, useMemo } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/apiService";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [step, setStep] = useState(1); // 1: verify recovery key, 2: set new password
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    recoveryKey: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const passwordRequirements = useMemo(() => {
    const password = formData.newPassword;
    return {
      minLength: password.length >= 16,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [formData.newPassword]);

  const isPasswordStrong = useMemo(() => {
    return Object.values(passwordRequirements).every((req) => req === true);
  }, [passwordRequirements]);

  const passwordsMatch = useMemo(() => {
    if (!formData.confirmPassword) return true;
    return formData.newPassword === formData.confirmPassword;
  }, [formData.newPassword, formData.confirmPassword]);

  const isStep1Valid = useMemo(() => {
    return (
      formData.usernameOrEmail.trim() !== "" &&
      formData.recoveryKey.trim() !== ""
    );
  }, [formData.usernameOrEmail, formData.recoveryKey]);

  const isStep2Valid = useMemo(() => {
    return (
      isPasswordStrong && passwordsMatch && formData.confirmPassword !== ""
    );
  }, [isPasswordStrong, passwordsMatch, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-format recovery key
    if (name === "recoveryKey") {
      const formatted =
        value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .substring(0, 16)
          .match(/.{1,4}/g)
          ?.join("-") || value.toUpperCase().replace(/[^A-Z0-9]/g, "");

      setFormData({
        ...formData,
        [name]: formatted,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const verifyRecoveryKey = async () => {
    if (!isStep1Valid) {
      toast.error("Please fill in all fields");
      return;
    }

    const keyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

    if (!keyPattern.test(formData.recoveryKey)) {
      toast.error("Invalid recovery key format");
      return;
    }

    setLoading(true);

    try {
      // Verify recovery key with backend (not full reset yet)
      await apiService.verifyRecoveryKey(
        formData.usernameOrEmail,
        formData.recoveryKey
      );

      toast.success("Recovery key verified!");
      setStep(2);
    } catch (error) {
      toast.error(error.message || "Invalid recovery key");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isStep2Valid) {
      if (!isPasswordStrong) {
        toast.error("Please meet all password requirements");
      } else if (!passwordsMatch) {
        toast.error("Passwords do not match");
      }
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(
        formData.usernameOrEmail,
        formData.recoveryKey,
        formData.newPassword
      );

      if (result.success) {
        toast.success("Password reset successfully!");

        setTimeout(() => {
          navigate("/unlock");
        }, 1500);
      } else {
        toast.error(result.error || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/unlock");
  };

  const RequirementItem = ({ met, text }) => (
    <div className="flex items-center gap-2">
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center ${
          met ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        {met ? (
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        ) : (
          <X className="w-3 h-3 text-gray-500" strokeWidth={3} />
        )}
      </div>
      <span className={`text-xs ${met ? "text-green-700" : "text-gray-600"}`}>
        {text}
      </span>
    </div>
  );

  // Step 1: Verify Recovery Key
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-gray-700" strokeWidth={2} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Reset Master Password
          </h1>
          <p className="text-sm text-gray-600 text-center mb-8">
            Enter your recovery key to reset your password
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <p className="font-semibold mb-1">Important:</p>
                <p>
                  Your recovery key can only be used once. After resetting your
                  password, you'll need to generate a new recovery key.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username Or Email
              </label>
              <input
                type="text"
                name="usernameOrEmail"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                placeholder="Enter your username or email"
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recovery Key
              </label>
              <input
                type="text"
                name="recoveryKey"
                value={formData.recoveryKey}
                onChange={handleChange}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxLength={19}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent font-mono text-center tracking-wider"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the 16-character recovery key you saved during sign up
              </p>
            </div>

            <button
              onClick={verifyRecoveryKey}
              disabled={!isStep1Valid || loading}
              className={`w-full h-12 font-medium rounded-lg transition-colors duration-150 ${
                isStep1Valid && !loading
                  ? "bg-gray-500 hover:bg-gray-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? "Verifying..." : "Verify Recovery Key"}
            </button>

            <button
              onClick={handleBackToLogin}
              className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Set New Password
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" strokeWidth={2} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Set New Password
        </h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          Choose a strong master password for your vault
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Master Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new master password"
                className="w-full h-12 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    new: !showPasswords.new,
                  })
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {formData.newPassword && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Password must contain:
                </p>
                <RequirementItem
                  met={passwordRequirements.minLength}
                  text="At least 16 characters"
                />
                <RequirementItem
                  met={passwordRequirements.hasUppercase}
                  text="One uppercase letter (A-Z)"
                />
                <RequirementItem
                  met={passwordRequirements.hasLowercase}
                  text="One lowercase letter (a-z)"
                />
                <RequirementItem
                  met={passwordRequirements.hasNumber}
                  text="One number (0-9)"
                />
                <RequirementItem
                  met={passwordRequirements.hasSpecial}
                  text="One special character (!@#$%...)"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new master password"
                className="w-full h-12 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {formData.confirmPassword && (
              <div className="mt-2 flex items-center gap-2">
                {passwordsMatch ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <p className="text-xs text-green-600">Passwords match</p>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-600">
                      Passwords don't match
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleResetPassword}
            disabled={!isStep2Valid || loading}
            className={`w-full h-12 font-medium rounded-lg transition-colors duration-150 ${
              isStep2Valid && !loading
                ? "bg-gray-500 hover:bg-gray-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading
              ? "Resetting..."
              : isStep2Valid
              ? "Reset Password"
              : "Complete All Requirements"}
          </button>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            Remember to generate a new recovery key after logging in
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
