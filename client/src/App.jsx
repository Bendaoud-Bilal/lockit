import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { X } from "lucide-react";
import Sidebar from "./components/shared/Sidebar";
import ProfileModal from "./components/shared/ProfileModal";
import RecoveryKeyModal from "./components/shared/RecoveryKeyModal";
import Welcome from "./pages/auth/Welcome";
import Unlock from "./pages/auth/Unlock";
import SignUp from "./pages/auth/SignUp";
import ResetPassword from "./pages/auth/ResetPassword";
import Vault from "./pages/Vault";
import Archive from "./pages/Archive";
import Dashboard from "./components/dashboard/components/Dashboard";
import Authenticator from "./components/authenticator/Authenticator";
import PasswordGenerator from "./components/tools/passwordGenerator";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import apiService from "./services/apiService";

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
					<Route
						path="/my-vault"
						element={
							<Vault
								activeFilter={activeFilter}
								onCredentialsChange={onCredentialsChange}
							/>
						}
					/>

          <Route path="/security-dashboard" element={<Dashboard />} />
          <Route
            path="/authenticator"
            element={
              <div className="p-8">
                <Authenticator />
              </div>
            }
          />
					<Route path="/send" element={<div className="p-8">Send</div>} />
					<Route path="/folders" element={<div className="p-8">Folders</div>} />
					<Route
						path="/archive"
						element={<Archive onCredentialsChange={onCredentialsChange} />}
					/>

					<Route path="*" element={<Navigate to="/my-vault" replace />} />
				</Routes>
			</div>

      {showPasswordGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowPasswordGenerator(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              <X size={20} />
            </button>
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Password Generator</h2>
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

function AppContent() {
	const { user, isAuthenticated } = useAuth();
	const [vaultItems, setVaultItems] = useState([]);
	const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [showRecoveryKeyModal, setShowRecoveryKeyModal] = useState(false);
	const [activeFilter, setActiveFilter] = useState(
		localStorage.getItem("activeFilter") || "all-items"
	);

	useEffect(() => {
		localStorage.setItem("activeFilter", activeFilter);
	}, [activeFilter]);

	const loadCredentials = async () => {
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

	useEffect(() => {
		if (user?.id && isAuthenticated) {
			loadCredentials();
		} else {
			setVaultItems([]);
		}
	}, [user?.id, isAuthenticated]);

	return (
		<Routes>
			<Route path="/welcome" element={<Welcome />} />
			<Route path="/signup" element={<SignUp />} />
			<Route path="/unlock" element={<Unlock />} />
			<Route path="/reset-password" element={<ResetPassword />} />

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

			<Route path="/" element={<Navigate to="/welcome" replace />} />
		</Routes>
	);
}

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
