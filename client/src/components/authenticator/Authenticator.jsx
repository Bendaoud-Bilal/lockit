import React, { useState } from "react";
import { Plus, X, ScanQrCode } from "lucide-react";
import AuthenticatorItem from "./AuthenticatorItem";
import AddTOTP from "./AddTOTP";
import { mockAccounts } from "../../Data/mockAccounts";

const Authenticator = () => {
  const [showAddTOTP, setShowAddTOTP] = useState(false);
  const [accounts, setAccounts] = useState(mockAccounts);

  const handleOnCancel = () => setShowAddTOTP(false);

  const handleAddNewAccount = ({ label, email, secret }) => {
    const newAccount = {
      id: Date.now(),
      label,
      email,
      secret,
    };
    setAccounts((prev) => [...prev, newAccount]);
    setShowAddTOTP(false);
  };

  const handleDelete = (id) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-5xl mx-auto">
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
      <div className="grid gap-2 sm:gap-2">
        {accounts.map((account) => (
          <AuthenticatorItem
            key={account.id}
            label={account.label}
            email={account.email}
            secret={account.secret}
            onDelete={() => handleDelete(account.id)}
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
              <AddTOTP onAddTOTP={handleAddNewAccount} onCancel={handleOnCancel} />
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
