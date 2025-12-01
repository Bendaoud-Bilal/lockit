import React, { useEffect, useState } from "react";
import { Plus, X, ScanQrCode, StoreIcon } from "lucide-react";
import AuthenticatorItem from "./AuthenticatorItem";
import AddTOTP from "./AddTOTP";
import { useAuth } from "../../context/AuthContext";
import decryptAesGcmBrowser, { encryptAesGcmBrowser } from "../../utils/crypto";
import toast from "react-hot-toast";
import apiService from "../../services/apiService";



const Authenticator = () => {
  const [showAddTOTP, setShowAddTOTP] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLocked, vaultKey } = useAuth(); 

  const fetchCredentials = async () => {
    try {
      const data = await apiService.getTOTPCredentials();
      setCredentials(data.data);
    } catch (err) {
      console.error("Erreur fetchCredentials:", err);
      toast.error(err.message || "Failed to fetch credentials");
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await apiService.getAllTotps();
      const totpsArray = Array.isArray(response.data) ? response.data : [];
      const formatted = [];

      for (const item of totpsArray) {
        try {
          // Decrypt the secret client-side using the in-memory vaultKey
          const decrypted = await decryptAesGcmBrowser(
            vaultKey,
            item.encryptedSecret || item.encrypted_secret || item.secret,
            item.secretIv || item.secret_iv || item.iv,
            item.secretAuthTag || item.secret_auth_tag || item.authTag
          );

          formatted.push({
            id: item.id,
            serviceName: item.serviceName,
            accountName: item.accountName,
            secret: decrypted,
          });
        } catch (err) {
          // If decryption fails, push placeholder and log error
          console.error("Failed to decrypt TOTP secret for item", item.id, err);
          formatted.push({
            id: item.id,
            serviceName: item.serviceName,
            accountName: item.accountName,
            secret: null,
          });
        }
      }

      setAccounts(formatted);
    } catch (err) {
      console.error("Erreur fetchAccounts:", err);
      toast.error(err.message || "Failed to fetch TOTP accounts");
    }
  };

  useEffect(() => {
    // Ensure we have an active session and the in-memory vault key before
    // attempting to fetch TOTP data (prevents premature 401s and decrypt
    // attempts when vaultKey is not present yet).
    if (isAuthenticated && !isLocked && vaultKey) {
      fetchAccounts();
      fetchCredentials();
    }
  }, [isAuthenticated, isLocked]);

  useEffect(() => {
    if (showAddTOTP && isAuthenticated && !isLocked && vaultKey)  {
      fetchCredentials();
    }
  }, [showAddTOTP,isAuthenticated,isLocked]);

  const handleOnCancel = () => setShowAddTOTP(false);

  const handleAddNewAccount = async ({
    serviceName,
    accountName,
    secret,
    credentialId,
  }) => {
    try {
      if (!serviceName || !accountName || !secret) {
        toast.error("Please fill in all required fields.");
        return;
      }

      setLoading(true);

      // Encrypt secret client-side using the vaultKey before sending to server
      const cleaned = secret.trim().replace(/\s/g, "");
      let encryptedPayload = {};
      if (!vaultKey) throw new Error("Vault key not available to encrypt TOTP secret");
      const enc = await encryptAesGcmBrowser(vaultKey, cleaned);
      encryptedPayload = {
        encryptedSecret: enc.ciphertext,
        secretIv: enc.iv,
        secretAuthTag: enc.authTag,
      };

      const savedAccount = await apiService.saveTotp({
        serviceName: serviceName.trim(),
        accountName: accountName.trim(),
        credentialId: credentialId ? parseInt(credentialId) : null,
        ...encryptedPayload,
      });

      // savedAccount.data contains created entry metadata
      setAccounts((prev) => [...prev, { id: savedAccount.data.id, serviceName, accountName, secret: cleaned }]);
      await fetchAccounts();
      setShowAddTOTP(false);
      toast.success(`${serviceName} added successfully`);
    } catch (err) {
      console.error("Erreur complète:", err);
      toast.error(err.message || "Failed to add TOTP account");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiService.deleteTotpEntry(id);
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      toast.success("TOTP deleted successfully");
    } catch (err) {
      console.error("Erreur suppression:", err);
      toast.error(err.message || "Deletion failed");
    }
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-5xl mx-aut bf-white ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full mb-6 gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <h1 className="text-2xl font-bold text-center sm:text-left">
            Two-Factor Authentication
          </h1>
          <p className="text-gray-500 text-sm sm:text-base text-center sm:text-left pb-2 sm:pb-0">
            Manage your TOTP codes for enhanced security.
          </p>
        </div>

        <div className="flex justify-center sm:justify-end w-full sm:w-auto">
          <button
            onClick={() => setShowAddTOTP(true)}
            className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg w-full sm:w-auto hover:bg-gray-900 transition"
          >
            <Plus size={18} />
            Add TOTP
          </button>
        </div>
      </div>

      {/* Accounts list */}
      <div className="grid gap-4 sm:gap-5">
        {accounts.map((account) => (
          <AuthenticatorItem
            key={account.id}
            id={account.id}
            label={account.serviceName}
            email={account.accountName}
            secret={account.secret}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Modal */}
      {showAddTOTP && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAddTOTP(false)}
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 transition"
            >
              <X size={20} />
            </button>

            <div className="bg-white rounded-lg p-6 w-full shadow-lg">
              <h2 className="text-2xl font-bold mb-4">
                Add Two-Factor Authentication
              </h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Enter the required details to link your new TOTP account.
              </p>
              <AddTOTP
                onAddTOTP={handleAddNewAccount}
                onCancel={handleOnCancel}
                credentials={credentials}
              />
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6">
        <div className="flex flex-col bg-white p-4 rounded-xl shadow-md mb-4 transition-all hover:shadow-lg sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <ScanQrCode size={22} className="text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                  How to add 2FA codes
                </div>
                <div className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  When setting up 2FA on a service, look for “Manual Entry” or “Secret Key”
                  instead of scanning the QR code. Copy that secret key and add it here.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Authenticator;
