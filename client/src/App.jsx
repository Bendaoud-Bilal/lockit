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
import Vault from './pages/Vault';
import Archive from './pages/Archive';
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import apiService from './services/apiService';
import PasswordGenerator from './components/tools/passwordGenerator';
import Authenticator from "./components/authenticator/Authenticator";
import { X } from "lucide-react";



function MainLayout({
  activeFilter,
  setActiveFilter,
  showPasswordGenerator,
  vaultItems,
  onCredentialsChange,
  setShowPasswordGenerator,
  showProfileModal,
  setShowProfileModal,
  showRecoveryKeyModal,
  setShowRecoveryKeyModal,
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
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
          {/* My Vault */}
          <Route
            path="/my-vault"
            element={
              <Vault 
                activeFilter={activeFilter}
                onCredentialsChange={onCredentialsChange}
              />
            }
          />

          {/* Other Main Routes */}
          <Route
            path="/security-dashboard"
            element={<div className="p-8">Security Dashboard</div>}
          />
          <Route
            path="/authenticator"
            element={<div className="p-8">{<Authenticator />}</div>}
          />
          <Route path="/send" element={<div className="p-8">Send</div>} />
          <Route path="/folders" element={<div className="p-8">Folders</div>} />
          <Route path="/archive" element={<Archive onCredentialsChange={onCredentialsChange}/>} />

          {/* Catch all - redirect to my vault */}
          <Route path="*" element={<Navigate to="/my-vault" replace />} />
        </Routes>
      </div>

      {/* Modals - rendered at layout level, outside Routes */}
       {showPasswordGenerator && (

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className='relative w-full max-w-md'>
            <button 
            onClick={()=> setShowPasswordGenerator(false)}
            className="absolute top-2 right-2">
                <X size={20} />
              </button>
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Password Generator</h2>
              <p className="text-gray-600 mb-4"></p>
              <PasswordGenerator />
            </div>
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

// AppContent
function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [vaultItems, setVaultItems] = useState([]);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRecoveryKeyModal, setShowRecoveryKeyModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState(
    localStorage.getItem('activeFilter') || 'all-items'
  );

  // Persist activeFilter to localStorage
  useEffect(() => {
    localStorage.setItem('activeFilter', activeFilter);
  }, [activeFilter]);

  // Function to load credentials from API
  const loadCredentials = async () => {
    
    // Only load if user is authenticated
    if (!user?.id || !isAuthenticated) {
      setVaultItems([]);
      return;
    }
    
    try {
      const response = await apiService.getUserCredentials(user.id);
      
      const credentials = response.credentials || [];
      setVaultItems(credentials);
    } catch (error) {
      console.error("Failed to load credentials:", error);
      setVaultItems([]);
    }
  };

  // Load credentials when user becomes authenticated
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      loadCredentials();
    } else {
      setVaultItems([]);
    }
  }, [user?.id, isAuthenticated]);

  return (
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
              onCredentialsChange={loadCredentials}
              setActiveFilter={setActiveFilter}
              showPasswordGenerator={showPasswordGenerator}
              vaultItems={vaultItems}
              setShowPasswordGenerator={setShowPasswordGenerator}
              showProfileModal={showProfileModal}
              setShowProfileModal={setShowProfileModal}
              showRecoveryKeyModal={showRecoveryKeyModal}
              setShowRecoveryKeyModal={setShowRecoveryKeyModal}
            />
          </ProtectedRoute>
        }
      />

      {/* Root redirect - to welcome for unauthenticated */}
      <Route path="/" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

// Main App component - wraps everything with providers
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" />
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;