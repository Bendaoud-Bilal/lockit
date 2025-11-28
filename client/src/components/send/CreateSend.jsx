import { useState, useEffect } from "react";
import { Upload, X, Download, Eye, EyeOff, RefreshCw } from "lucide-react";
import { calculatePasswordStrength as scorePassword } from '../../utils/crypto';
import toast from "react-hot-toast";

const CreateSend = ({ isOpen, onClose, onSave, userId, vaultItems = [] }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "text",
    content: "",
    passwordProtectionEnabled: false,
    accessPassword: "",
    userId: userId,
  });

  const [generatedFile, setGeneratedFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        type: "text",
        content: "",
        passwordProtectionEnabled: false,
        accessPassword: "",
        userId: userId,
      });
      setGeneratedFile(null);
    }
  }, [isOpen, userId]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  // ✅ SECURITY CHECK: Credentials MUST have password protection
  if (formData.type === 'credential' && !formData.passwordProtectionEnabled) {
    toast.error('Password protection is required when sending credentials');
    return;
  }

  if (formData.type === 'credential' && !formData.accessPassword) {
    toast.error('Please set a password to protect this credential');
    return;
  }

  // ✅ PASSWORD STRENGTH CHECK: Require strong password for credential sends
  if (formData.type === 'credential' && formData.accessPassword) {
    const strength = scorePassword(formData.accessPassword);
    if (strength < 60) {
      toast.error('Password too weak for credential sends. Use a stronger password (score: 60+ required)');
      return;
    }
  }

  // ✅ MINIMUM PASSWORD STRENGTH: Warn for weak passwords on all protected sends
  if (formData.passwordProtectionEnabled && formData.accessPassword) {
    const strength = scorePassword(formData.accessPassword);
    if (strength < 40) {
      toast.error('Password too weak. Please use a stronger password.');
      return;
    }
  }

  // Prepare final form data
  let finalFormData = { ...formData };
  
  if (formData.type === 'credential' && formData.credentialId) {
  const credential = vaultItems.find(item => item.id === parseInt(formData.credentialId));
  
  if (credential) {
    // ✅ FIX: Handle all credential categories matching AddItemModal structure
    const credentialToSend = {
      title: credential.title || '',
      category: credential.category || 'login',
    };
    
    // Add category-specific fields
    if (credential.category === 'login' || credential.category === 'Login') {
      credentialToSend.username = credential.username || '';
      credentialToSend.email = credential.email || '';
      credentialToSend.password = credential.password || '';
      credentialToSend.website = credential.website || '';
      credentialToSend.notes = credential.notes || '';
    } else if (credential.category === 'credit_card' || credential.category === 'Credit Card') {
      credentialToSend.cardholderName = credential.cardholderName || '';
      credentialToSend.cardNumber = credential.cardNumber || '';
      credentialToSend.expiryMonth = credential.expiryMonth || '';
      credentialToSend.expiryYear = credential.expiryYear || '';
      credentialToSend.cvv = credential.cvv || '';
      credentialToSend.notes = credential.notes || '';
    } else if (credential.category === 'note' || credential.category === 'Note' || credential.category === 'secure_note') {
      credentialToSend.content = credential.content || '';
      credentialToSend.notes = credential.notes || '';
    }
    
    finalFormData.content = JSON.stringify(credentialToSend);
  } else {
    toast.error('Selected credential not found');
    return;
  }
}
  
  const encryptedPackage = await onSave(finalFormData);
  
  if (encryptedPackage) {
    setGeneratedFile(encryptedPackage);
  }
};

  const handleDownloadFile = () => {
    if (generatedFile) {
      const url = URL.createObjectURL(generatedFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = generatedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, content: file });
    }
  };

  if (!isOpen) return null;

  const getPasswordStrengthMeta = (pwd) => {
      if (!pwd) return { strength: 0, label: "", color: "text-gray-500", score: 0 };
  
      const score = scorePassword(pwd);
      let label = "Weak";
      let color = "text-red-600";
      let strengthBars = 1;
  
      if (score >= 80) {
        label = "Strong";
        color = "text-green-600";
        strengthBars = 4;
      } else if (score >= 60) {
        label = "Good";
        color = "text-emerald-600";
        strengthBars = 3;
      } else if (score >= 40) {
        label = "Medium";
        color = "text-yellow-600";
        strengthBars = 2;
      }
  
      return { strength: strengthBars, label, color, score };
    }

  const passwordStrength = getPasswordStrengthMeta(formData.accessPassword)

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let newPassword = ""
    for (let i = 0; i < 16; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, accessPassword: newPassword })
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {!generatedFile ? (
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="sticky top-0 bg-white p-6 pb-4 border-b border-gray-200 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h5 className="text-xl font-bold m-0">Create New Send</h5>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                {/* Name and Type Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="sendName" className="block mb-2 font-semibold text-sm">
                      Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      id="sendName"
                      type="text"
                      className="w-full p-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
                      placeholder="What is this send for?"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      minLength={1}
                    />
                  </div>
                  <div>
                    <label htmlFor="sendType" className="block mb-2 font-semibold text-sm">
                      Type
                    </label>
                    <select
  id="sendType"
  className="w-full p-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
  value={formData.type}
  onChange={(e) => {
    const newType = e.target.value;
    setFormData({ 
      ...formData, 
      type: newType,
      // ✅ Auto-enable password protection for credentials
      passwordProtectionEnabled: newType === 'credential' ? true : formData.passwordProtectionEnabled
    });
  }}
>
  <option value="text">Text</option>
  <option value="file">File</option>
  <option value="credential">Credential</option>
</select>
                  </div>
                </div>

                {formData.type === "credential" && (
  <div className="mb-4">
    <label htmlFor="credentialSelect" className="block mb-2 font-semibold text-sm">
      Select Credential<span className="text-red-500">*</span>
    </label>
    <select
      id="credentialSelect"
      className="w-full p-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
      value={formData.credentialId || ''}
      onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
      required
    >
      <option value="">-- Select a credential --</option>
      {vaultItems?.map(item => (
        <option key={item.id} value={item.id}>
          {item.title}
        </option>
      ))}
    </select>
  </div>
)}

                {formData.type !== "credential" && (
  <div className="mb-4">
    <label htmlFor="sendContent" className="block mb-2 font-semibold text-sm">
      Content<span className="text-red-500">*</span>
    </label>

    {formData.type === "text" && (
      <textarea
        id="sendContent"
        className="w-full p-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none h-16"
        rows={4}
        placeholder="Enter the sensitive information to share..."
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        required
        minLength={1}
      />
    )}

    {formData.type === "file" && (
      <div>
        <div className="flex">
          <input
            type="file"
            className="flex-1 p-3 bg-gray-100 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
            id="fileUpload"
            onChange={handleFileChange}
            required
          />
          <label className="flex items-center gap-2 px-4 bg-gray-200 rounded-r-lg cursor-pointer hover:bg-gray-300 transition-colors" htmlFor="fileUpload">
            <Upload size={18} />
            <span className="text-sm font-medium">Upload</span>
          </label>
        </div>
        {formData.content && (
          <small className="text-gray-500 block mt-2 text-sm">
            Selected: {formData.content instanceof File ? formData.content.name : ""}
          </small>
        )}
      </div>
    )}
  </div>
)}

                {/* Password Protection Toggle */}
                <div className="mb-4">
  <div className="flex justify-between items-center">
    <div>
      <label className="font-semibold text-sm mb-0">Password Protection</label>
      <small className="text-gray-500 block text-sm">
        {formData.type === 'credential' 
          ? 'Required for credential sends (for security)'
          : 'Require a password to access this send'
        }
      </small>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={formData.passwordProtectionEnabled}
        onChange={(e) =>
          setFormData({
            ...formData,
            passwordProtectionEnabled: e.target.checked,
          })
        }
        disabled={formData.type === 'credential'} // ✅ Disable toggle for credentials
      />
      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black ${formData.type === 'credential' ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
    </label>
  </div>
  {formData.passwordProtectionEnabled && (
    <div className="mt-3">
      <label htmlFor="accessPassword" className="block mb-2 text-sm font-medium">
        Access Password<span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          id="accessPassword"
          type={showPassword ? "text" : "password"}
          className="w-full p-3 pr-12 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
          placeholder="Enter access password"
          value={formData.accessPassword}
          onChange={(e) =>
            setFormData({
              ...formData,
              accessPassword: e.target.value,
            })
          }
          required
        />
        <button 
                      onClick={generatePassword} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                      type="button"
                    >
                      <RefreshCw className="w-4 h-4 text-gray-600" />
                    </button>
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-md transition-colors mr-8"
          type="button"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 text-gray-600" />
          ) : (
            <Eye className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>
      {formData.accessPassword && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-gray-700">
              Strength: <span className={`${passwordStrength.color}`}>{passwordStrength.label}</span>
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  level <= passwordStrength.strength 
                    ? passwordStrength.strength <= 1 
                      ? 'bg-red-600' 
                      : passwordStrength.strength === 2 
                      ? 'bg-yellow-500' 
                      : 'bg-green-600'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors"
                >
                  Generate Encrypted File
                </button>
              </div>
            </form>
          ) : (
            // Success screen with download
            <div>
              <div className="p-6 pb-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h5 className="text-xl font-bold m-0">Send Created!</h5>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Download size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Your encrypted send file is ready!
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Download this file and share it with your recipient via email, messaging, or any file transfer method.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>File:</strong> {generatedFile.name}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Size:</strong> {(generatedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadFile}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium mb-3"
                >
                  <Download size={20} />
                  Download Encrypted File
                </button>

                <button
                  onClick={onClose}
                  className="w-full px-6 py-2.5 bg-white border border-gray-300 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateSend;