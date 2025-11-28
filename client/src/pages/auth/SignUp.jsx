import React, { useState, useMemo } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Download,
  Printer,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SignUp = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    masterPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    master: false,
    confirm: false,
  });
  const [step, setStep] = useState(1); // 1: form, 2: recovery key
  const [recoveryKey, setRecoveryKey] = useState("");
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/my-vault");
    }
  }, [isAuthenticated, navigate]);

  const generateRecoveryKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let key = "";
    const randomBytes = new Uint8Array(16);
    window.crypto.getRandomValues(randomBytes);
    for (let i = 0; i < 16; i++) {
      key += chars[randomBytes[i] % chars.length];
      if (i % 4 === 3 && i < 15) key += "-";
    }
    return key;
  };

  const passwordRequirements = useMemo(() => {
    const password = formData.masterPassword;
    return {
      minLength: password.length >= 16,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [formData.masterPassword]);

  const isPasswordStrong = useMemo(() => {
    return Object.values(passwordRequirements).every((req) => req === true);
  }, [passwordRequirements]);

  const passwordsMatch = useMemo(() => {
    if (!formData.confirmPassword) return true;
    return formData.masterPassword === formData.confirmPassword;
  }, [formData.masterPassword, formData.confirmPassword]);

  const isValidUsername = useMemo(() => {
    if (!formData.username) return true;
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(formData.username);
  }, [formData.username]);

  const isValidEmail = useMemo(() => {
    if (!formData.email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(formData.email);
  }, [formData.email]);

  const isFormValid = useMemo(() => {
    return (
      formData.username.trim() !== "" &&
      isValidUsername &&
      formData.email.trim() !== "" &&
      isValidEmail &&
      isPasswordStrong &&
      passwordsMatch &&
      formData.confirmPassword !== ""
    );
  }, [formData, isPasswordStrong, passwordsMatch, isValidEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      if (!isPasswordStrong) {
        toast.error("Please meet all password requirements");
      } else if (!passwordsMatch) {
        toast.error("Passwords do not match");
      } else {
        toast.error("Please fill in all fields");
      }
      return;
    }

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const key = generateRecoveryKey();
    setRecoveryKey(key);
    setStep(2);
    setLoading(false);
    toast.success("Account created! Please save your recovery key");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const copyRecoveryKey = () => {
    navigator.clipboard.writeText(recoveryKey);
    toast.success("Recovery key copied to clipboard!");
  };

  const downloadRecoveryKey = () => {
    const content = `
LOCKIT PASSWORD MANAGER
ACCOUNT RECOVERY KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Username: ${formData.username}
Email: ${formData.email}
Recovery Key: ${recoveryKey}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT SECURITY INFORMATION:

- Keep this recovery key in a safe place
- This key can be used ONCE to reset your master password
- Never share this key with anyone
- If someone gets this key, they can access your vault

Generated on: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lockit-recovery-key-${formData.username}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setHasDownloaded(true);
    toast.success("Recovery key downloaded!");
  };

  // Replace the printRecoveryKey function in SignUp.jsx with this:

const printRecoveryKey = async () => {
  const content = `
    <h1>LOCKIT PASSWORD MANAGER</h1>
    <h2>Account Recovery Key</h2>
    <div class="info-row"><strong>Username:</strong> ${formData.username}</div>
    <div class="info-row"><strong>Email:</strong> ${formData.email}</div>
    <div class="key">${recoveryKey}</div>
    <div class="warning">
      <h3>IMPORTANT SECURITY INFORMATION</h3>
      <ul>
        <li>Keep this recovery key in a safe place</li>
        <li>This key can be used ONCE to reset your master password</li>
        <li>Never share this key with anyone</li>
        <li>If someone gets this key, they can access your vault</li>
      </ul>
    </div>
    <p><small>Generated on: ${new Date().toLocaleString()}</small></p>
  `;

  // Check if running in Electron (correct property name)
  if (window.electron?.printRecoveryKey) {
    console.log('Using Electron print API');
    try {
      const result = await window.electron.printRecoveryKey(content);
      console.log('Print result:', result);
      
      if (result.success) {
        setHasDownloaded(true);
        toast.success("Print dialog opened successfully!");
      } else {
        console.error('Print failed:', result.error);
        toast.error(`Print failed: ${result.error || 'Unknown error'}. Please try downloading instead.`);
      }
    } catch (error) {
      console.error('Electron print error:', error);
      toast.error("Print failed. Please try downloading instead.");
    }
  } else {
    console.log('Running in browser, using window.print()');
    // Fallback for browser
    const printWindow = window.open("", "", "height=600,width=800");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Lockit Recovery Key</title>
            <style>
              body { font-family: monospace; padding: 40px; }
              h1 { color: #4A5FE5; margin-bottom: 10px; }
              h2 { color: #333; margin-top: 0; margin-bottom: 20px; }
              .info-row { margin: 10px 0; font-size: 14px; }
              .key { 
                font-size: 24px; 
                letter-spacing: 2px; 
                background: #f3f4f6; 
                padding: 20px; 
                margin: 20px 0; 
                border: 2px dashed #9ca3af;
                text-align: center;
              }
              .warning { 
                background: #fef3c7; 
                border-left: 4px solid #f59e0b; 
                padding: 15px; 
                margin: 20px 0; 
              }
              .warning h3 {
                margin-top: 0;
                color: #92400e;
              }
              .warning ul {
                margin: 10px 0;
                padding-left: 20px;
              }
              p { margin: 10px 0; }
              strong { font-weight: bold; }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      setHasDownloaded(true);
      toast.success("Opening print dialog...");
    } else {
      toast.error("Could not open print window. Please try downloading instead.");
    }
  }
};

  const finishSetup = async () => {
    if (!hasDownloaded) {
      toast.error("Please download or print your recovery key first!");
      return;
    }

    try {
      setLoading(true);

      const result = await signup(
        formData.username,
        formData.email,
        formData.masterPassword,
        recoveryKey
      );

      if (result.success) {
        toast.success("Account setup complete! Redirecting...");
        setTimeout(() => {
          navigate("/my-vault");
        }, 1000);
      } else {
        toast.error(result.error || "Failed to create account");
        setStep(1); // Go back to form
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      setStep(1);
    } finally {
      setLoading(false);
    }
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

  // Step 1: Registration Form
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-gray-700" strokeWidth={2} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Sign Up To Lockit
          </h1>
          <button
            onClick={() => navigate("/unlock")}
            className="text-sm text-gray-500 hover:text-gray-700 text-center w-full mb-8 underline"
          >
            Or Unlock Your Vault If You're Already A User
          </button>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent transition-all"
              />
              {formData.username && !isValidUsername && (
                <p className="text-xs text-red-600 mt-2">
                  Username must be 3-20 characters, letters, numbers, underscore
                  or dash only
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent transition-all"
              />
              {formData.email && !isValidEmail && (
                <p className="text-xs text-red-600 mt-2">
                  Please enter a valid email address
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.master ? "text" : "password"}
                  name="masterPassword"
                  autoComplete="off"
                  value={formData.masterPassword}
                  onChange={handleChange}
                  placeholder="Enter your master password"
                  className="w-full h-12 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      master: !showPasswords.master,
                    })
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPasswords.master ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {formData.masterPassword && (
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
                Confirm Master Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="off"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your master password"
                  className="w-full h-12 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      confirm: !showPasswords.confirm,
                    })
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
              type="submit"
              disabled={!isFormValid || loading}
              onClick={handleSubmit}
              className={`w-full h-12 font-medium rounded-lg transition-all duration-200 ${
                isFormValid && !loading
                  ? "bg-gray-500 hover:bg-gray-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading
                ? "Creating Account..."
                : isFormValid
                ? "Create Account"
                : "Complete All Requirements"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Recovery Key Display
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle
              className="w-8 h-8 text-yellow-600"
              strokeWidth={2}
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Save Your Recovery Key
        </h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          This is the ONLY way to recover your account if you forget your master
          password
        </p>

        {/* Recovery Key Display */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
          <p className="text-xs text-gray-600 text-center mb-3">
            Your Recovery Key
          </p>
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-2xl font-mono text-center tracking-wider text-gray-900 select-all">
              {recoveryKey}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={printRecoveryKey}
              className="flex items-center justify-center gap-2 h-10 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print (Recommended)
            </button>
            <button
              onClick={downloadRecoveryKey}
              className="flex items-center justify-center gap-2 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          <button
            onClick={copyRecoveryKey}
            className="w-full flex items-center justify-center gap-2 h-9 text-gray-500 hover:text-gray-700 text-xs font-medium transition-colors mt-2"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy to clipboard (temporary use only)
          </button>
        </div>

        {/* Warning Box */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-2">
                Important Security Information:
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>This recovery key can only be used ONCE</li>
                <li>
                  <strong>Best:</strong> Print and store in a physical safe or
                  lockbox
                </li>
                <li>
                  <strong>Alternative:</strong> Save in a separate encrypted
                  password manager
                </li>
                <li>Never store as unencrypted digital file</li>
                <li>Never share this key with anyone</li>
                <li>If lost, you cannot recover your account</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Checkbox Confirmation */}
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={hasDownloaded}
            onChange={(e) => setHasDownloaded(e.target.checked)}
            className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-2 focus:ring-[#5B6EF5]"
          />
          <span className="text-sm text-gray-700">
            I have saved my recovery key in a secure location
          </span>
        </label>

        {/* Continue Button */}
        <button
          onClick={finishSetup}
          disabled={!hasDownloaded || loading}
          className={`w-full h-12 font-medium rounded-lg transition-all duration-200 ${
            hasDownloaded && !loading
              ? "bg-gray-500 hover:bg-gray-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Setting up...
            </div>
          ) : hasDownloaded ? (
            "Continue to Vault"
          ) : (
            "Please Save Your Recovery Key"
          )}
        </button>
      </div>
    </div>
  );
};

export default SignUp;
