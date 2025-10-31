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
import Vault from "./pages/Vault";
import Archive from "./pages/Archive";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Layout component for authenticated pages with sidebar
function MainLayout({
  activeFilter,
  setActiveFilter,
  showPasswordGenerator,
  setShowPasswordGenerator,
  showProfileModal,
  setShowProfileModal,
  showRecoveryKeyModal,
  setShowRecoveryKeyModal,
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar stays outside Routes - won't remount on navigation */}
      <Sidebar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onOpenPasswordGenerator={() => setShowPasswordGenerator(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenRecoveryKey={() => setShowRecoveryKeyModal(true)}
      />

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        <Routes>
          {/* My Vault - passes activeFilter to Vault component */}
          <Route
            path="/my-vault"
            element={<Vault activeFilter={activeFilter} />}
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
          <Route path="/archive" element={<Archive />} />

          {/* Catch all - redirect to my vault */}
          <Route path="*" element={<Navigate to="/my-vault" replace />} />
        </Routes>
      </div>

      {/* Modals - rendered at layout level, outside Routes */}
      {showPasswordGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Password Generator</h2>
            <p className="text-gray-600 mb-4">Modal content goes here...</p>
            <button
              onClick={() => setShowPasswordGenerator(false)}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <RecoveryKeyModal
        isOpen={showRecoveryKeyModal}
        onClose={() => setShowRecoveryKeyModal(false)}
      />
    </div>
  );
}

function App() {
  // Initialize from localStorage with fallback
  const [activeFilter, setActiveFilter] = useState(() => {
    return localStorage.getItem("activeFilter") || "all-items";
  });
  
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRecoveryKeyModal, setShowRecoveryKeyModal] = useState(false);

  // Persist activeFilter to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeFilter", activeFilter);
  }, [activeFilter]);

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
                  showPasswordGenerator={showPasswordGenerator}
                  setShowPasswordGenerator={setShowPasswordGenerator}
                  showProfileModal={showProfileModal}
                  setShowProfileModal={setShowProfileModal}
                  showRecoveryKeyModal={showRecoveryKeyModal}
                  setShowRecoveryKeyModal={setShowRecoveryKeyModal}
                />
              </ProtectedRoute>
            }
          />

          {/* Root redirect - to welcome for unauthenticated, ProtectedRoute will handle redirect for authenticated */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;