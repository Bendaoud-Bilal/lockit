import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/shared/Sidebar';
import Vault from './pages/Vault';

function App() {
  const [activeFilter, setActiveFilter] = useState('all-items');
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onOpenPasswordGenerator={() => setShowPasswordGenerator(true)}
          onOpenProfile={() => setShowProfileModal(true)}
        />
        
        <div className="flex-1">
          <Routes>
            {/* Authentication Routes */}
            <Route path="/welcome" element={<div className="p-8">Welcome Screen</div>} />
            <Route path="/signup" element={<div className="p-8">Sign Up</div>} />
            <Route path="/unlock" element={<div className="p-8">Unlock Vault</div>} />
            
            {/* Main App - Redirect root to My Vault */}
            <Route path="/" element={<Navigate to="/my-vault" replace />} />
            
            {/* My Vault - Single page with filter state */}
            <Route 
              path="/my-vault" 
              exact
              element={<Vault />} 
            />
            
            {/* Other Main Routes */}
            <Route path="/security-dashboard" element={<div className="p-8">Security Dashboard</div>} />
            <Route path="/authenticator" element={<div className="p-8">Authenticator</div>} />
            <Route path="/send" element={<div className="p-8">Send</div>} />
            <Route path="/folders" element={<div className="p-8">Folders</div>} />
            <Route path="/archive" element={<div className="p-8">Archive</div>} />
          </Routes>
        </div>

        {/* Password Generator Modal */}
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

        {/* Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">View / Edit Profile</h2>
              <p className="text-gray-600 mb-4">Modal content goes here...</p>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;