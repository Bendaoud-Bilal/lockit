import { useState } from "react"
import { X, Globe, Eye, EyeOff, RefreshCw, ChevronDown, Plus } from "lucide-react"
import icon from "../../assets/icons/Icon.svg"
import Security from "./Security"
import Attachments from "./Attachments"

const AddItemModal= ({show, setShow}) => {
  const [activeTab, setActiveTab] = useState("general")
  const [showPassword, setShowPassword] = useState(false)
  const [showCVV, setShowCVV] = useState(false)
  const [password, setPassword] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    category: "Login",
    folder: "Work",
    // Login fields
    username: "",
    email: "",
    website: "",
    // Credit Card fields
    cardholderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    // Secure Note fields
    content: "",
    // Common field
    notes: "",
  })

  const category = [
    {id : 1, name: "Login"},
    {id : 2, name: "Credit Card"},
    {id : 3, name: "Note"},
  ]

  
  const calculatePasswordStrength = (pwd) => {
    if (pwd.length === 0) return { strength: 0, label: "" }
    if (pwd.length < 6) return { strength: 1, label: "Weak" }
    if (pwd.length < 10) return { strength: 3, label: "Medium" }
    return { strength: 5, label: "Strong" }
  }

  const passwordStrength = calculatePasswordStrength(password)

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let newPassword = ""
    for (let i = 0; i < 16; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(newPassword)
  }

  const closeModal = () => {
    setShow(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 ">
          <h2 className="text-2xl font-bold text-gray-900">Add New Item</h2>
          <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all" onClick={closeModal}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 ">
          <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "general" 
                  ? "bg-black text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "security" 
                  ? "bg-black text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab("attachments")}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === "attachments" 
                  ? "bg-black text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Attachments
            </button>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        {activeTab === "general" &&
        
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-240px)]">
          {/* Title, Category, Icon Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Category</label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none cursor-pointer"
                >
                  {category.map((cat) => (
                  <option key={cat.id}>{cat.name}</option>
                ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Icon</label>
              <button className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 font-medium text-gray-700">
                <Globe className="w-4 h-4" />
                Change Icon
              </button>
            </div>
          </div>

          {/* Folder */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Folder</label>
            <div className="relative">
              <select
                value={formData.folder}
                onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none cursor-pointer"
              >
                <option>Work</option>
                <option>Personal</option>
                <option>Finance</option>
                
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Login Category Fields */}
          {formData.category === "Login" && (
            <>
              {/* Username and Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2.5 pr-20 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button 
                      onClick={generatePassword} 
                      className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                      type="button"
                    >
                      <RefreshCw className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-gray-700">
                        Strength: <span className={`${
                          passwordStrength.strength <= 1 ? 'text-red-600' : 
                          passwordStrength.strength <= 3 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>{passwordStrength.label}</span>
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            level <= passwordStrength.strength 
                              ? passwordStrength.strength <= 1 
                                ? 'bg-red-600' 
                                : passwordStrength.strength <= 3 
                                ? 'bg-yellow-600' 
                                : 'bg-green-600'
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none placeholder:text-gray-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all resize-none outline-none placeholder:text-gray-400"
                />
              </div>
            </>
          )}

          {/* Credit Card Category Fields */}
          {formData.category === "Credit Card" && (
            <>
              {/* Cardholder Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Cardholder Name</label>
                <input
                  type="text"
                  value={formData.cardholderName}
                  onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
                  placeholder="Enter cardholder name"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Card Number</label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Expiry and CVV Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Expiry Month</label>
                  <input
                    type="text"
                    value={formData.expiryMonth}
                    onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
                    placeholder="MM"
                    maxLength="2"
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Expiry Year</label>
                  <input
                    type="text"
                    value={formData.expiryYear}
                    onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
                    placeholder="YYYY"
                    maxLength="4"
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">CVV</label>
                  <div className="relative">
                    <input
                      type={showCVV ? "text" : "password"}
                      value={formData.cvv}
                      onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                      placeholder="123"
                      maxLength="4"
                      className="w-full px-3 py-2.5 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all outline-none"
                    />
                    <button
                      onClick={() => setShowCVV(!showCVV)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                      type="button"
                    >
                      {showCVV ? (
                        <EyeOff className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all resize-none outline-none placeholder:text-gray-400"
                />
              </div>
            </>
          )}

          {/* Secure Note Category Fields */}
          {formData.category === "Note" && (
            <>
              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter your secure note content..."
                  rows={6}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all resize-none outline-none placeholder:text-gray-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all resize-none outline-none placeholder:text-gray-400"
                />
              </div>
            </>
          )}
        </div>
        }

        {activeTab === "security" && 
        // <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-240px)]">
        //   <p className="text-lg text-black">Two-Factor Authentification</p>
        //   <div className="flex flex-col items-center justify-center gap-3 border rounded-lg p-4 ">
        //     <img src={icon} alt="" className="w-12 h-12" />
            
              
        //     <p className="text-md text-gray-600">No Two-Factor authentification configured </p>
            
        //     <button className="px-4 py-2 bg-black flex text-white rounded-lg hover:bg-gray-800 transition-all">
        //       <Plus className="w-4 fill-white mr-2" strokeWidth={3}/>
        //       Add TOTP
        //     </button>

        //   </div>
        // </div>

        <Security />

        }

        {activeTab === "attachments" && 
        // <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-240px)]">
        //   <p className="text-gray-700">Attachment management will be available here.</p>
        // </div>
        <Attachments />
        }

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button className="px-5 py-2.5 text-sm text-gray-700 font-semibold hover:bg-gray-200 rounded-lg transition-all" onClick={closeModal}>
            Cancel
          </button>
          <button className="px-5 py-2.5 text-sm bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 shadow-md hover:shadow-lg" onClick={() => {console.log(formData)}}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            Save Item
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddItemModal
