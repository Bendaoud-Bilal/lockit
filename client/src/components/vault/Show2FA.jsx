import React, { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { useTotpGenerator } from "../../hooks/useTotpGenerator";
import OtpProgress from "../../components/authenticator/OtpProgress";
import { STORAGE_KEYS } from "../../context/AuthContext";

function Show2FA({ credentialId, onHide }) {
  const [account, setAccount] = useState(null);
  const { otp, timeLeft } = useTotpGenerator(account?.secret || "");

  useEffect(() => {
    const fetchTotpAccount = async () => {
      try {
        const sessionId = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
        const response = await fetch(`http://localhost:3000/api/totp/${credentialId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${sessionId}`,
          },
        });

        if (!response.ok) throw new Error("Erreur lors du chargement du TOTP");

        const data = await response.json();
        setAccount(data);
      } catch (err) {
        console.error("Erreur lors du chargement du TOTP :", err);
      }
    };

    if (credentialId) fetchTotpAccount();
  }, [credentialId]);

  if (!account) return null;

  return (
    <div className="border rounded-xl bg-white shadow-sm mt-3 p-4 sm:p-5 w-full transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-base sm:text-lg">
            <Shield className="text-green-600" size={18} />
            Two-Factor Authentication
          </h2>
          <span className="text-xs sm:text-sm bg-gray-200 px-2 py-0.5 rounded-md">
            active
          </span>
        </div>
        <button
          onClick={onHide}
          className="pt-0.5 text-xs sm:text-base text-gray-500 hover:text-red-600 transition self-start sm:self-auto"
        >
          Hide
        </button>
      </div>

      {/* OTP Display */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-2xl sm:text-3xl font-mono tracking-widest">{otp}</p>
        <OtpProgress timeLeft={timeLeft} />
      </div>

      <p className="text-gray-500 text-xs sm:text-sm mt-2 truncate">
        {account.serviceName} {account.accountName}
      </p>
    </div>
  );
}

export default Show2FA;
