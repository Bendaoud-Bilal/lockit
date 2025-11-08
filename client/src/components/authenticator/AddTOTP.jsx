// Description: 
// Form component used to manually add a new TOTP (Time-based One-Time Password)
// configuration. It allows users to enter service details, account name,
// and secret key for 2FA setup, and link it to an existing credential.

import React, { useState } from "react";
import toast from "react-hot-toast";

function FormField({ label, id, placeholder, type = "text", HandleChange, value, helper }) {
  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor={id} className="text-sm font-semibold text-gray-800">
        {label}
      </label>

      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={HandleChange}
        className="w-full px-3 py-2 rounded-md bg-gray-100 placeholder-gray-500 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
      />

      {helper && (
        <p className="text-xs text-gray-500 mt-1 leading-tight">{helper}</p>
      )}
    </div>
  );
}

export default function AddTOTP({ onAddTOTP, onCancel, credentials=[]}) {
  const [service, setService] = useState("");
  const [account, setAccount] = useState("");
  const [secret, setSecret] = useState("");
  const [credentialId, setCredentialId] = useState(""); 

  const handleCancel = () => {
    onCancel();
    resetForm();
  };

  const resetForm = () => {
    setService("");
    setAccount("");
    setSecret("");
    setCredentialId("");
  };

  const handleAdd = () => {
    if (!service.trim() || !account.trim() || !secret.trim()) {
      toast.error('Please fill in all fields before adding a TOTP.');

      return;
    }

    onAddTOTP({
      serviceName: service,
      accountName: account,
      secret: secret,
      credentialId: credentialId || null,
    });

    resetForm();
  };
  return (
    <form className="space-y-4">
      <FormField
        label="Service / Issuer"
        id="service"
        placeholder="e.g., Google, GitHub, Microsoft"
        HandleChange={(e) => setService(e.target.value)}
        value={service}
      />

      <FormField
        label="Account Name"
        id="account"
        placeholder="e.g., your@email.com or username"
        HandleChange={(e) => setAccount(e.target.value)}
        value={account}
      />

      <FormField
        label="Secret Key"
        id="secret"
        placeholder="Enter the secret key from the QR code"
        HandleChange={(e) => setSecret(e.target.value)}
        value={secret}
        helper='Usually found as "Secret" or "Manual Entry Key" when setting up 2FA'
      />

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-semibold text-gray-800">
          Link to Credential (optional)
        </label>


        <select
          value={credentialId}
          onChange={(e) => setCredentialId(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        >
          <option value="">None </option>
          {credentials.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2 mt-5">
        <button
          type="button"
          onClick={handleAdd}
          className="w-full sm:w-full px-5 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition mb-2 sm:mb-0"
        >
          Add TOTP
        </button>

        <button
          type="button"
          className="w-full sm:w-auto px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
