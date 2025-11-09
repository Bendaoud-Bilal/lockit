import React, { useEffect, useState } from "react";
import { Plus, X, ScanQrCode } from "lucide-react";
import AuthenticatorItem from "./AuthenticatorItem";
import AddTOTP from "./AddTOTP";
import {STORAGE_KEYS} from "../../context/AuthContext";
import toast,{Toaster} from 'react-hot-toast';

const Authenticator = () => {
  const [showAddTOTP, setShowAddTOTP] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [credentials,setCredentials]=useState([]);

 const fetchCredentials = async () => {
    try {
      
      const sessionId=sessionStorage.getItem(STORAGE_KEYS.TOKEN);
      const res = await fetch("http://localhost:3000/api/totp/credentials", {
        method :"GET",
        headers: { 
          Authorization: `Bearer ${sessionId}` },
      });

      if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
      const json = await res.json();
      setCredentials(json.data || []);
    } catch (err) {
      console.error("Erreur fetch credentials:", err);
    }
  };


  // Fethc all TOTP accounts from backend
const fetchAccounts = async () => {
  try {
    const sessionId = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    const res = await fetch("http://localhost:3000/api/totp", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    });

    if (!res.ok) throw new Error(`Erreur API: ${res.status}`);

    const json = await res.json();

    const filtered = json.data.map(item => ({
      id: item.id,
      serviceName: item.serviceName,
      accountName: item.accountName,
      secret: item.secret,
    }));
    setAccounts(filtered);
  } catch (err) {
    console.error("Erreur fetch:", err);
  }
};


useEffect(()=>{
  fetchAccounts();
  fetchCredentials();
},[]);

useEffect(() => {
  if (showAddTOTP) {
    fetchCredentials(); 
  }
}, [showAddTOTP]);



  const handleOnCancel = () => setShowAddTOTP(false);
const handleAddNewAccount = async ({ serviceName, accountName, secret, credentialId }) => {
  try {
    const sessionId = sessionStorage.getItem(STORAGE_KEYS.TOKEN);

    const response = await fetch("http://localhost:3000/api/totp", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sessionId}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceName,
        accountName,
        secret,
        credentialId: credentialId ? parseInt(credentialId) : null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    const savedAccount = await response.json();

    setAccounts((prev) => [...prev, savedAccount]);
    await fetchAccounts();
    setShowAddTOTP(false);
  } catch (err) {
    console.error("Erreur complète:", err);
  }
};


 const handleDelete = async (id) => {
    const sessionId = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    try {
      const response = await fetch(`http://localhost:3000/api/totp/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression"); 
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    } catch (err) {
      console.error("Erreur suppression:", err);
      toast.error(" Deletion failed")
    }
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
              <AddTOTP onAddTOTP={handleAddNewAccount} onCancel={handleOnCancel} credentials={credentials} />
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
                  When setting up 2FA on a service,look for “Manual Entry” or “Secret Key”
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
