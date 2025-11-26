import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";

const CreateSend = ({ isOpen, onClose, onSave, userId }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "text",
    content: "",
    expirationEnabled: false,
    deleteAfterDays: null,
    maxAccessEnabled: false,
    maxAccessCount: null,
    passwordProtectionEnabled: false,
    accessPassword: "",
    direction: "sent",
    userId: userId,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        type: "text",
        content: "",
        expirationEnabled: false,
        deleteAfterDays: null,
        maxAccessEnabled: false,
        maxAccessCount: null,
        passwordProtectionEnabled: false,
        accessPassword: "",
        direction: "sent",
        userId: userId,
      });
    }
  }, [isOpen, userId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, content: file });
    }
  };

  if (!isOpen) return null;

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
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="text">Text</option>
                    <option value="file">File</option>
                    <option value="credential">Credential</option>
                  </select>
                </div>
              </div>

              {/* Content Field */}
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

                {formData.type === "credential" && (
                  <input
                    type="text"
                    className="w-full p-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
                    placeholder="Enter vault ID"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                )}
              </div>

              {/* Expiration Date Toggle */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="font-semibold text-sm mb-0">Expiration Date</label>
                    <small className="text-gray-500 block text-sm">
                      Automatically deleted after specified time
                    </small>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.expirationEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expirationEnabled: e.target.checked,
                          deleteAfterDays: e.target.checked ? 7 : null,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                {formData.expirationEnabled && (
                  <div className="mt-3">
                    <label htmlFor="deleteAfterDays" className="block mb-2 text-sm font-medium">
                      Delete after (days)
                    </label>
                    <select
                      id="deleteAfterDays"
                      className="w-full p-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
                      value={formData.deleteAfterDays ?? 7}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deleteAfterDays: Number(e.target.value),
                        })
                      }
                    >
                      <option value={1}>1 day</option>
                      <option value={3}>3 days</option>
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Maximum Access Count Toggle */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="font-semibold text-sm mb-0">Maximum Access Count</label>
                    <small className="text-gray-500 block text-sm">
                      Limit how many times this can be accessed
                    </small>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.maxAccessEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxAccessEnabled: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                {formData.maxAccessEnabled && (
                  <div className="mt-3">
                    <label htmlFor="maxAccessCount" className="block mb-2 text-sm font-medium">
                      Maximum access count
                    </label>
                    <input
                      id="maxAccessCount"
                      type="number"
                      className="w-full p-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
                      placeholder="e.g., 5"
                      min="1"
                      value={formData.maxAccessCount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxAccessCount: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Password Protection Toggle */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="font-semibold text-sm mb-0">Password Protection</label>
                    <small className="text-gray-500 block text-sm">
                      Require a password to access this send
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
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                {formData.passwordProtectionEnabled && (
                  <div className="mt-3">
                    <label htmlFor="accessPassword" className="block mb-2 text-sm font-medium">
                      Access Password<span className="text-red-500">*</span>
                    </label>
                    <input
                      id="accessPassword"
                      type="password"
                      className="w-full p-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black border-none"
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
                Create Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateSend;