import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#5B6EF5] rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Welcome To Lockit
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Your Trustworthy Password Manager
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/unlock')}
            className="w-full h-12 bg-[#5B6EF5] hover:bg-[#4A5FE5] text-white font-medium rounded-lg transition-colors duration-150"
          >
            Unlock Vault
          </button>
          
          <button
            onClick={() => navigate('/signup')}
            className="w-full h-12 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-150"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;