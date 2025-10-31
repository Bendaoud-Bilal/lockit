import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/shared/Sidebar";
import ProfileModal from "./components/shared/ProfileModal";
import RecoveryKeyModal from "./components/shared/RecoveryKeyModal";
import Welcome from "./pages/auth/Welcome";
import Unlock from "./pages/auth/Unlock";
import SignUp from "./pages/auth/SignUp";
import ResetPassword from "./pages/auth/ResetPassword";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Layout component for authenticated pages with sidebar
function MainLayout({
  activeFilter,
  setActiveFilter,
  vaultItems,
  setShowPasswordGenerator,
  setShowProfileModal,
  setShowRecoveryKeyModal,
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        vaultItems={vaultItems}
        onOpenPasswordGenerator={() => setShowPasswordGenerator(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenRecoveryKey={() => setShowRecoveryKeyModal(true)}
      />

      <div className="flex-1">
        <Routes>
          {/* My Vault - Single page with filter state */}
          <Route
            path="/my-vault"
            element={
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">My Vault</h2>
                <p className="text-gray-600">Active Filter: {activeFilter}</p>
                {/* Vault items component goes here, filtered by activeFilter */}
              </div>
            }
          />

          {/* Other Main Routes */}
          <Route
            path="/security-dashboard"
            element={<div className="p-8">Security Dashboard</div>}
          />
          <Route
            path="/authenticator"
            element={<div className="p-8">Authenticator</div>}
          />
          <Route path="/send" element={<div className="p-8">Send</div>} />
          <Route path="/folders" element={<div className="p-8">Folders</div>} />
          <Route path="/archive" element={<div className="p-8">Archive</div>} />

          {/* Catch all - redirect to my vault */}
          <Route path="*" element={<Navigate to="/my-vault" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [activeFilter, setActiveFilter] = useState("all-items");
  const [vaultItems, setVaultItems] = useState([]);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRecoveryKeyModal, setShowRecoveryKeyModal] = useState(false);

  useEffect(() => {
       const loadCredentials = async () => {
         try {
           const user = JSON.parse(localStorage.getItem("user"));
           if (user?.id) {
             const response = await apiService.getCredentials(user.id);
             setVaultItems(response.credentials || []);
           }
         } catch (error) {
           console.error("Failed to load credentials:", error);
         }
       };

       loadCredentials();
     }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          {/* Authentication Routes - No Sidebar */}
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/unlock" element={<Unlock />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Main App Routes - With Sidebar and Protection */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  vaultItems={vaultItems}
                  setShowPasswordGenerator={setShowPasswordGenerator}
                  setShowProfileModal={setShowProfileModal}
                  setShowRecoveryKeyModal={setShowRecoveryKeyModal}
                />

                {/* Password Generator Modal */}
                {showPasswordGenerator && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                      <h2 className="text-xl font-bold mb-4">
                        Password Generator
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Modal content goes here...
                      </p>
                      <button
                        onClick={() => setShowPasswordGenerator(false)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {/* Profile Modal */}
                <ProfileModal
                  isOpen={showProfileModal}
                  onClose={() => setShowProfileModal(false)}
                />

                {/* Recovery Key Modal */}
                <RecoveryKeyModal
                  isOpen={showRecoveryKeyModal}
                  onClose={() => setShowRecoveryKeyModal(false)}
                />
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
