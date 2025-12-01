import React, { useState, useEffect } from "react";
import { Shield, Copy, Check } from "lucide-react";
import { useTotpGenerator } from "../../hooks/useTotpGenerator";
import OtpProgress from "../../components/authenticator/OtpProgress";
import apiService from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import decryptAesGcmBrowser from "../../utils/crypto";
import toast from "react-hot-toast";

function Show2FA({ credentialId, onHide }) {
const { vaultKey, isAuthenticated, isLocked } = useAuth();
const [account, setAccount] = useState(null);
const { totp, timeLeft } = useTotpGenerator(account?.secret || ""); 
const [copied, setCopied] = useState(false);

useEffect(() => {
  const fetchTotpAccount = async () => {
    try {
      const response = await apiService.getTotpByCredentialId(credentialId);

      // Ensure we have the in-memory vault key to decrypt locally
      if (!vaultKey) {
        throw new Error("Vault locked: unlock to view 2FA code");
      }

      const data = response.data;
      // Decrypt client-side using the vaultKey
      const decrypted = await decryptAesGcmBrowser(
        vaultKey,
        data.encryptedSecret || data.encrypted_secret,
        data.secretIv || data.secret_iv,
        data.secretAuthTag || data.secret_auth_tag
      );

      setAccount({ ...data, secret: decrypted });
    } catch (err) {
      console.error("Erreur lors du chargement du TOTP :", err);
      toast.error(err.message || "Failed to show 2FA");
    }
  };

  if (credentialId && isAuthenticated && !isLocked) fetchTotpAccount();
}, [credentialId]);

const handleCopy = () => {
  navigator.clipboard.writeText(totp); 
  setCopied(true);
  setTimeout(() => setCopied(false), 1500);
};

if (!account) {
  return (
    <div className="border rounded-lg bg-white shadow-sm mt-3 p-3 w-full sm:flex-auto">
      <p className="text-gray-500 text-center text-xs">Loading...</p>
    </div>
  );
}



 return (
    <div className="border rounded-lg bg-white shadow-sm mt-1 p-3 w-full transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-gray-800 flex items-center gap-1.5 text-xs">
            <Shield className="text-green-600" size={14} />
            Two-Factor Authentication
          </h2>
          <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">
            Active
          </span>
        </div>
        <button
          onClick={onHide}
          className="pt-0.5 text-xs text-gray-500 hover:text-red-600 transition self-start sm:self-auto"
        >
          Hide
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold font-mono tracking-wide text-gray-900">{totp}</p>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-600 transition p-0.5 hover:bg-gray-100 rounded"
            title="Copy code"
          >
            {copied ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>
      </div>
      <div>
        <OtpProgress timeLeft={timeLeft} />
      </div>
      <p className="text-gray-600 text-xs mt-2 truncate">
        <span className="font-medium">{account.serviceName}</span>
        <span className="mx-1">•</span>
        <span>{account.accountName}</span>
      </p>
    </div>
  );
}

export default Show2FA;