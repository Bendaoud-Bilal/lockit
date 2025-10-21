// Description:
// Displays an authentication item containing a service label, user email,
// TOTP code with progress bar, and control buttons to copy or delete the entry.

import React, { useState } from "react";
import { Shield, Copy, Check, X } from "lucide-react";
import OtpProgress from "./OtpProgress";

/**
 * AuthenticatorItem Component
 *
 * @param {string} label - The service or account name (e.g., "GitHub", "Google").
 * @param {string} email - The associated user email or identifier.
 * @param {string} TOTP - The current One-Time Password value.
 * @param {function} onDelete - Callback function triggered when delete is clicked.
 */
const AuthenticatorItem = ({ label, email, TOTP, onDelete }) => {
  const [copied, setCopied] = useState(false);

  /** Copies the TOTP code to clipboard */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(TOTP);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col bg-white p-4 rounded-xl shadow-md mb-4 transition-all hover:shadow-lg sm:p-5">
      {/* Top section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Label + Email */}
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
            <span className="text-xl w-full font-mono text-gray-800">{TOTP}</span>
            <div className="w-full">
              <OtpProgress duration={30} color="" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Copy */}
            <button
              onClick={copyToClipboard}
              aria-label="Copy TOTP code"
              className="bg-white p-2 rounded-lg hover:bg-gray-200 transition"
            >
              {copied ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Copy size={18} className="text-gray-700" />
              )}
            </button>

            {/* Delete */}
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
