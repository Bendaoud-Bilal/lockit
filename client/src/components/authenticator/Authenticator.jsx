import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import AuthenticatorItem from "./AuthenticatorItem";
import AddTOTP from "./AddTOPT";

const Authenticator = () => {
  const [showAddTOTP, setShowAddTOTP] = useState(false);
  const [accounts, setAccounts] = useState([
    { id: 1, label: "GitHub", email: "user@github.com", TOTP: "1111" },
    { id: 2, label: "Google", email: "user@gmail.com", TOTP: "24243" },
  ]);

  const handleOnCancel=()=>{
    setShowAddTOTP(false);
  }

  const handleAddNewAccount = ({ label, email, TOTP }) => {
    const newAccount = {
      id: Date.now(),
      label,
      email,
      TOTP,
    };
    setAccounts((prev) => [...prev, newAccount]);
    setShowAddTOTP(false);
  };

  const handleDelete = (id) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center w-full mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="text-gray-500 pb-2 sm:pb-0">
            Manage your TOTP codes for enhanced security.
          </p>
        </div>

        <button
          onClick={() => setShowAddTOTP(true)}
          className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg w-full sm:w-auto hover:bg-gray-900 transition"
        >
          <Plus size={18} />
          Add TOTP
        </button>
      </div>

      {accounts.map((account) => (
        <AuthenticatorItem
          key={account.id}
          label={account.label}
          email={account.email}
          TOTP={account.TOTP}
          onDelete={() => handleDelete(account.id)}
        />
      ))}

      {showAddTOTP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAddTOTP(false)}
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 transition"
            >
              <X size={20} />
            </button>

            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Add Two-Factor Authentication</h2>
              <p className="text-gray-600 mb-4">
                Enter the required details to link your new TOTP account.
              </p>
              <AddTOTP onAddTOTP={handleAddNewAccount} onCancel={handleOnCancel} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Authenticator;
