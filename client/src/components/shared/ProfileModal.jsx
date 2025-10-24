import React, { useState, useMemo } from 'react';
import { X, Eye, EyeOff, RotateCw, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProfileModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    username: 'john.doe', // TODO: Get from auth context
    email: 'john.doe@gmail.com', // TODO: Get from auth context
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!formData.newPassword) return { level: '', color: '', text: '' };
    
    const password = formData.newPassword;
    let strength = 0;
    
    if (password.length >= 16) strength += 2;
    else if (password.length >= 12) strength += 1;
    
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    
    if (strength <= 2) return { level: 'Weak', color: 'text-red-500', bars: 'bg-red-500' };
    if (strength <= 4) return { level: 'Medium', color: 'text-yellow-500', bars: 'bg-yellow-500' };
    if (strength <= 5) return { level: 'Good', color: 'text-green-500', bars: 'bg-green-500' };
    return { level: 'Strong', color: 'text-green-600', bars: 'bg-green-600' };
  }, [formData.newPassword]);

  const passwordsMatch = useMemo(() => {
    if (!formData.confirmPassword) return true;
    return formData.newPassword === formData.confirmPassword;
  }, [formData.newPassword, formData.confirmPassword]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generatePassword = () => {
    const length = 20;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    
    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData({
      ...formData,
      newPassword: password,
      confirmPassword: ''
    });
    
    toast.success('Password generated!');
  };

  const handleSave = async () => {
    // Validation
    if (!formData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (formData.newPassword && !passwordsMatch) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword && passwordStrength.level === 'Weak') {
      toast.error('Please use a stronger password');
      return;
    }

    setLoading(true);
    try {
      // TODO: API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: 'john.doe',
      email: 'john.doe@gmail.com',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">View / Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Account Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full h-12 px-4 bg-gray-50 border-0 rounded-lg text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#5B6EF5]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full h-12 px-4 bg-gray-50 border-0 rounded-lg text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#5B6EF5]"
              />
            </div>
          </div>

          {/* Password Change Section */}
          {isEditing && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Change Master Password
                </h3>

                {/* Current Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter current password"
                      className="w-full h-12 px-4 pr-12 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      className="w-full h-12 px-4 pr-24 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5]"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-gray-400 hover:text-gray-600"
                        title="Generate password"
                      >
                        <RotateCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.newPassword && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Strength:</span>
                        <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                          {passwordStrength.level}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((bar) => (
                          <div
                            key={bar}
                            className={`h-1 flex-1 rounded-full ${
                              bar <= (passwordStrength.level === 'Weak' ? 1 : passwordStrength.level === 'Medium' ? 2 : passwordStrength.level === 'Good' ? 4 : 5)
                                ? passwordStrength.bars
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      className="w-full h-12 px-4 pr-12 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <p className={`text-xs mt-2 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-6 h-11 text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;