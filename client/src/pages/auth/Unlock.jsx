import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Unlock = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    masterPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.usernameOrEmail || !formData.masterPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Handle authentication with backend
      
      
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Vault unlocked successfully!');
      setTimeout(() => {
        navigate('/my-vault');
      }, 500);
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-700" strokeWidth={2} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Unlock Your Vault
        </h1>
        <button
          onClick={() => navigate('/signup')}
          className="text-sm text-gray-500 hover:text-gray-700 text-center w-full mb-8 underline"
        >
          Or Sign Up If You're A New User
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username Or Email
            </label>
            <input
              type="text"
              name="usernameOrEmail"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              placeholder="Enter your username or email"
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="masterPassword"
                value={formData.masterPassword}
                onChange={handleChange}
                placeholder="Enter your master password"
                className="w-full h-12 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                className="text-xs text-gray-500 hover:text-gray-700 underline disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Forgot your master password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 font-medium rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-[#5B6EF5] hover:bg-[#4A5FE5] text-white'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Unlocking...
              </>
            ) : (
              'Unlock Vault'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Unlock;