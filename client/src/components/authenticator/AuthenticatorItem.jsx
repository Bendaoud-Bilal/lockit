import React, { useEffect, useState, useRef } from "react";
import { Shield, Copy, Check, X,ScanQrCode } from "lucide-react";
import { generateTOTP } from "../../utils/TotpGenerator";
import OtpProgress from "./otpProgress";

/**
 * AuthenticatorItem Component
 *
 * @param {string} label - The service or account name (e.g., "GitHub", "Google").
 * @param {string} email - The associated user email or identifier.
 * @param {string} secret - The secret key used to generate TOTP codes.
 * @param {function} onDelete - Callback triggered when delete is clicked.
 */
const AuthenticatorItem = ({ label, email, secret, onDelete}) => {
  const [copied, setCopied] = useState(false);
  const [totp, setTotp] = useState("------");
  const [timeLeft, setTimeLeft] = useState(30);
  const counterRef = useRef(null);

  // Génération du code TOTP
  const generateCode = () => {
    try {
      const newCode = generateTOTP(secret);
      setTotp(newCode);
    } catch (err) {
      console.error("Erreur lors de la génération du TOTP :", err);
      setTotp("------");
    }
  };

  useEffect(() => {
    if (!secret) {
      setTotp("------");
      return;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(nowSec / 30);
    counterRef.current = currentCounter;
    // Génération du premier code
    generateCode();
    // Calcul du temps restant
    setTimeLeft(30 - (nowSec % 30));
    // Interval pour mise à jour chaque seconde
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const counter = Math.floor(now / 30);
      const remaining = 30 - (now % 30);  
      setTimeLeft(remaining);

      // Regénération du code si la période de 30s a changé
      if (counter !== counterRef.current) {
        counterRef.current = counter;
        generateCode();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [secret]);
  

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
    <div className="flex flex-col bg-white p-4 rounded-xl shadow-md mb-4 transition-all hover:shadow-lg sm:p-5">
      {/* Partie haute */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Gauche : label + email */}
        <div className="flex items-center gap-3">
          <Shield size={22} className="text-blue-600 flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-800 text-sm sm:text-base truncate">
              {label}
            </div>
            <div className="text-xs text-gray-500 truncate">{email}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-20">
            <span className="text-xl w-full font-mono text-gray-800">{totp}</span>
            <div className="w-full">
              <OtpProgress duration={30} timeLeft={timeLeft} />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-2">
            {/* Copier */}
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
              onClick={onDelete}
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