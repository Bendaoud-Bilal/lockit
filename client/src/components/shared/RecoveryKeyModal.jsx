import React, { useState } from "react";
import { X, Copy, Download, Printer, Key, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

const RecoveryKeyModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: confirm, 2: show key
  const [masterPassword, setMasterPassword] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateRecoveryKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let key = "";
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) key += "-";
    }
    return key;
  };

  const handleVerifyPassword = async () => {
    if (!masterPassword) {
      toast.error("Please enter your master password");
      return;
    }

    setLoading(true);
    try {
      // TODO: Verify password with backend
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newKey = generateRecoveryKey();
      setRecoveryKey(newKey);
      setStep(2);
      toast.success("Password verified!");
    } catch (error) {
      toast.error("Invalid master password");
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryKey = () => {
    navigator.clipboard.writeText(recoveryKey);
    toast.success("Recovery key copied to clipboard!");
  };

  const downloadRecoveryKey = () => {
    const content = `
LOCKIT PASSWORD MANAGER
RECOVERY KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recovery Key: ${recoveryKey}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT SECURITY INFORMATION:

- Keep this recovery key in a safe place
- This key can be used ONCE to reset your master password
- Your old recovery key is now invalid
- Never share this key with anyone

Generated on: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lockit-recovery-key-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setHasDownloaded(true);
    toast.success("Recovery key downloaded!");
  };

  const printRecoveryKey = () => {
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write(`
      <html>
        <head>
          <title>Lockit Recovery Key</title>
          <style>
            body { font-family: monospace; padding: 40px; }
            h1 { color: #4A5FE5; }
            .key { font-size: 24px; letter-spacing: 2px; background: #f3f4f6; padding: 20px; margin: 20px 0; border: 2px dashed #9ca3af; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>LOCKIT PASSWORD MANAGER</h1>
          <h2>Recovery Key</h2>
          <div class="key">${recoveryKey}</div>
          <div class="warning">
            <h3>IMPORTANT SECURITY INFORMATION</h3>
            <ul>
              <li>Keep this recovery key in a safe place</li>
              <li>This key can be used ONCE to reset your master password</li>
              <li>Your old recovery key is now invalid</li>
              <li>Never share this key with anyone</li>
            </ul>
          </div>
          <p><small>Generated on: ${new Date().toLocaleString()}</small></p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();

    setHasDownloaded(true);
    toast.success("Opening print dialog...");
  };

  const handleComplete = () => {
    if (!hasDownloaded) {
      toast.error("Please download or print your recovery key first!");
      return;
    }

    // Reset and close
    setStep(1);
    setMasterPassword("");
    setRecoveryKey("");
    setHasDownloaded(false);
    onClose();
    toast.success("Recovery key generated successfully!");
  };

  const handleClose = () => {
    if (step === 2 && !hasDownloaded) {
      if (
        !confirm(
          "You haven't saved your recovery key yet. Are you sure you want to close?"
        )
      ) {
        return;
      }
    }

    setStep(1);
    setMasterPassword("");
    setRecoveryKey("");
    setHasDownloaded(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Generate Recovery Key
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            // Step 1: Verify Master Password
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Key className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Verify Your Identity
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Enter your master password to generate a new recovery key
              </p>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    Generating a new recovery key will invalidate your old one.
                    Make sure to save the new key securely.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Master Password
                </label>
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Enter your master password"
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent"
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                />
              </div>

              <button
                onClick={handleVerifyPassword}
                disabled={!masterPassword || loading}
                className={`w-full h-12 font-medium rounded-lg transition-colors ${
                  masterPassword && !loading
                    ? "bg-gray-900 hover:bg-gray-800 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? "Verifying..." : "Generate New Recovery Key"}
              </button>
            </>
          ) : (
            // Step 2: Display Recovery Key
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Save Your New Recovery Key
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Your old recovery key is now invalid
              </p>

              {/* Recovery Key Display */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                <p className="text-xs text-gray-600 text-center mb-3">
                  Your New Recovery Key
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

              {/* Checkbox */}
              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDownloaded}
                  onChange={(e) => setHasDownloaded(e.target.checked)}
                  className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-2 focus:ring-[#5B6EF5]"
                />
                <span className="text-sm text-gray-700">
                  I have saved my recovery key securely (printed or written
                  down)
                </span>
              </label>

              <button
                onClick={handleComplete}
                disabled={!hasDownloaded}
                className={`w-full h-12 font-medium rounded-lg transition-colors ${
                  hasDownloaded
                    ? "bg-gray-900 hover:bg-gray-800 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {hasDownloaded ? "Complete" : "Please Save Your Recovery Key"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoveryKeyModal;
