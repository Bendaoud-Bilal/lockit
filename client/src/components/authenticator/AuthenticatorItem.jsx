import React, { useState } from "react";
import { Shield, Copy, Check, X } from "lucide-react";
import { useTotpGenerator } from "../../hooks/useTotpGenerator";
import OtpProgress from "./OtpProgress";

const AuthenticatorItem = ({ id,label, email, secret, onDelete }) => {
  const { totp, timeLeft } = useTotpGenerator(secret);
  const [copied, setCopied] = useState(false);

  // Copie dans le presse-papier
  const copyToClipboard = async () => {
    if (!totp || totp === "------") return;
    try {
      await navigator.clipboard.writeText(totp);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Erreur de copie :", err);
    }
  };

  return (
    <div className="flex flex-col bg-white p-4 rounded-xl shadow-md  transition-all hover:shadow-lg sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between ">
        <div className="flex items-center gap-3">
          <Shield size={22} className="text-blue-600 flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-800 text-sm sm:text-base truncate">
              {label}
            </div>
            <div className="text-xs text-gray-500 truncate">{email}</div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-center justify-center w-20 ">
            <span className="text-xl w-full font-mono text-gray-800 ">{totp}</span>
            <div className="w-full">
              <OtpProgress duration={30} timeLeft={timeLeft} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              disabled={totp === "------"}
              aria-label="Copy TOTP code"
              className="bg-white p-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Copy size={18} className="text-gray-700" />
              )}
            </button>

            <button
              onClick={()=>{onDelete(id);}}
              aria-label="Delete account"
              className="bg-white p-2 rounded-lg hover:bg-red-100 transition"
            >
              <X size={18} className="text-red-500" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthenticatorItem;
